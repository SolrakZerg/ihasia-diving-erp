-- Migration script to automate sync between 'bizums' and 'invoice_items'
-- Project: Diving ERP
-- Version: 3.1 (Supports Retained, Partial Refunds, and Partner Settlements - Fully Tested)

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Agregar columnas necesarias a public.bizums si no existen
ALTER TABLE public.bizums ADD COLUMN IF NOT EXISTS is_retained boolean DEFAULT false;
ALTER TABLE public.bizums ADD COLUMN IF NOT EXISTS returned_people integer;
ALTER TABLE public.bizums ADD COLUMN IF NOT EXISTS is_settled boolean DEFAULT false;
ALTER TABLE public.bizums ADD COLUMN IF NOT EXISTS has_retention boolean DEFAULT false;

-- Función de normalización de nombres
CREATE OR REPLACE FUNCTION public.fn_normalize_name(p_name text)
RETURNS text AS $$
BEGIN
  RETURN lower(extensions.unaccent(regexp_replace(COALESCE(p_name, ''), '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función de limpieza de teléfonos
CREATE OR REPLACE FUNCTION public.fn_clean_phone(p_phone text)
RETURNS text AS $$
BEGIN
  RETURN regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para buscar depósitos de Bizum activos (ignora retenidos y calcula pax devuelto)
CREATE OR REPLACE FUNCTION public.fn_match_bizum_deposit(
  p_customer_id uuid
)
RETURNS TABLE (
  bizum_id uuid,
  deposit_eur numeric,
  customer_name text
) AS $$
DECLARE
  v_cust_first text;
  v_cust_last text;
  v_cust_phone text;
  v_cust_date date;
  v_normalized_full text;
  v_clean_phone text;
BEGIN
  SELECT first_name, last_name, phone, booking_date
  INTO v_cust_first, v_cust_last, v_cust_phone, v_cust_date
  FROM public.customers
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_normalized_full := public.fn_normalize_name(v_cust_first || ' ' || COALESCE(v_cust_last, ''));
  v_clean_phone := public.fn_clean_phone(v_cust_phone);

  IF v_cust_date IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    b.id, 
    (COALESCE(b.returned_people, b.num_people) * 25.0)::numeric, -- Considerar pax devuelto parcial
    b.customer_name
  FROM public.bizums b
  WHERE b.is_paid = true 
    AND b.is_returned = false
    AND b.is_retained = false -- Excluir retenidos
    AND b.booking_date = v_cust_date
    AND (
      -- Coincidencia de teléfono
      (v_clean_phone <> '' AND (
        public.fn_clean_phone(b.bizum_phone) = v_clean_phone
        OR public.fn_clean_phone(b.whatsapp_phone) = v_clean_phone
      ))
      OR
      -- Coincidencia difusa de nombre completo (similitud > 0.5)
      (
        v_normalized_full <> '' AND (
          extensions.similarity(v_normalized_full, public.fn_normalize_name(b.customer_name)) > 0.5
        )
      )
    )
  ORDER BY 
    (v_clean_phone <> '' AND (public.fn_clean_phone(b.bizum_phone) = v_clean_phone OR public.fn_clean_phone(b.whatsapp_phone) = v_clean_phone)) DESC,
    extensions.similarity(v_normalized_full, public.fn_normalize_name(b.customer_name)) DESC,
    b.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger logic for invoice_items
CREATE OR REPLACE FUNCTION public.fn_trg_sync_invoice_item_bizum()
RETURNS trigger AS $$
DECLARE
  v_match_bizum_id uuid;
  v_bizum_date date;
  v_deposit_eur numeric;
  v_bizum_name text;
  v_already_claimed boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS NOT DISTINCT FROM NEW.customer_id 
       AND OLD.date IS NOT DISTINCT FROM NEW.date THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.customer_id IS NULL THEN
    NEW.bizum_deposit_eur := NULL;
    RETURN NEW;
  END IF;

  SELECT bizum_id, deposit_eur, customer_name
  INTO v_match_bizum_id, v_deposit_eur, v_bizum_name
  FROM public.fn_match_bizum_deposit(NEW.customer_id);

  IF v_match_bizum_id IS NOT NULL THEN
    SELECT booking_date INTO v_bizum_date FROM public.bizums WHERE id = v_match_bizum_id;

    -- Evitar duplicidad: comprobar si este Bizum ya fue reclamado por cualquier cliente coincidente
    SELECT EXISTS (
      SELECT 1 
      FROM public.invoice_items ii
      JOIN public.customers c ON ii.customer_id = c.id
      WHERE ii.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND ii.bizum_deposit_eur > 0
        AND COALESCE(ii.date, c.booking_date) >= v_bizum_date - INTERVAL '3 days'
        AND COALESCE(ii.date, c.booking_date) <= v_bizum_date + INTERVAL '7 days'
        AND (
          -- Mismo cliente
          ii.customer_id = NEW.customer_id
          -- O misma factura
          OR ii.invoice_id = NEW.invoice_id
          -- O el otro cliente coincide con los teléfonos de este Bizum
          OR (
            public.fn_clean_phone(c.phone) <> '' 
            AND (
              public.fn_clean_phone(c.phone) = (SELECT public.fn_clean_phone(bizum_phone) FROM public.bizums WHERE id = v_match_bizum_id)
              OR public.fn_clean_phone(c.phone) = (SELECT public.fn_clean_phone(whatsapp_phone) FROM public.bizums WHERE id = v_match_bizum_id)
            )
          )
          -- O el otro cliente coincide con el nombre completo de este Bizum (similitud > 0.5)
          OR (
            public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' 
            AND (
              extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), public.fn_normalize_name(v_bizum_name)) > 0.5
            )
          )
        )
    ) INTO v_already_claimed;

    IF NOT v_already_claimed THEN
      NEW.bizum_deposit_eur := v_deposit_eur;
    ELSE
      NEW.bizum_deposit_eur := NULL;
    END IF;
  ELSE
    NEW.bizum_deposit_eur := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger logic for bizums (incorporates is_retained and returned_people, supporting UPDATE updates)
CREATE OR REPLACE FUNCTION public.fn_trg_sync_bizum_to_invoice_item()
RETURNS trigger AS $$
DECLARE
  v_match_item_id uuid;
  v_clean_bizum_phone text;
  v_clean_wa_phone text;
  v_normalized_bizum_name text;
  v_match_date date;
BEGIN
  v_clean_bizum_phone := public.fn_clean_phone(NEW.bizum_phone);
  v_clean_wa_phone := public.fn_clean_phone(NEW.whatsapp_phone);
  v_normalized_bizum_name := public.fn_normalize_name(NEW.customer_name);
  v_match_date := NEW.booking_date;

  -- 1. Si pasa a pagado, no devuelto y no retenido -> Buscar factura y asignar/actualizar depósito
  IF NEW.is_paid = true AND NEW.is_returned = false AND NEW.is_retained = false THEN
    SELECT ii.id INTO v_match_item_id
    FROM public.invoice_items ii
    JOIN public.customers c ON ii.customer_id = c.id
    WHERE (
        ii.bizum_deposit_eur IS NULL 
        OR (TG_OP = 'UPDATE' AND ii.bizum_deposit_eur = (COALESCE(OLD.returned_people, OLD.num_people) * 25.0)::numeric)
      )
      AND COALESCE(ii.date, c.booking_date) >= v_match_date - INTERVAL '3 days'
      AND COALESCE(ii.date, c.booking_date) <= v_match_date + INTERVAL '7 days'
      AND (
        (v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone)
        OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)
        OR
        (
          public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' AND (
            extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) > 0.5
          )
        )
      )
    ORDER BY 
      ((v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone) OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)) DESC,
      extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) DESC,
      ii.created_at DESC
    LIMIT 1;

    IF v_match_item_id IS NOT NULL THEN
      UPDATE public.invoice_items
      SET bizum_deposit_eur = (COALESCE(NEW.returned_people, NEW.num_people) * 25.0)::numeric
      WHERE id = v_match_item_id;
    END IF;

  -- 2. Si pasa a devuelto, retenido o impagado -> Quitar depósito de las facturas
  ELSIF NEW.is_returned = true OR NEW.is_retained = true OR NEW.is_paid = false THEN
    -- Buscamos y limpiamos las facturas vinculadas que tengan el depósito anterior asignado
    UPDATE public.invoice_items ii
    SET bizum_deposit_eur = NULL
    FROM public.customers c
    WHERE ii.customer_id = c.id
      AND (
        ii.bizum_deposit_eur = (COALESCE(OLD.returned_people, OLD.num_people) * 25.0)::numeric
        OR ii.bizum_deposit_eur = (COALESCE(NEW.returned_people, NEW.num_people) * 25.0)::numeric
      )
      AND COALESCE(ii.date, c.booking_date) >= v_match_date - INTERVAL '3 days'
      AND COALESCE(ii.date, c.booking_date) <= v_match_date + INTERVAL '7 days'
      AND (
        (v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone)
        OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)
        OR
        (
          public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' AND (
            extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) > 0.5
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate has_retention BEFORE save on bizums
CREATE OR REPLACE FUNCTION public.fn_trg_bizums_before_save()
RETURNS trigger AS $$
BEGIN
  NEW.has_retention := (NEW.is_retained = true) OR (NEW.is_returned = true AND NEW.returned_people IS NOT NULL AND NEW.returned_people < NEW.num_people);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
DROP TRIGGER IF EXISTS trg_sync_invoice_item_bizum ON public.invoice_items;
CREATE TRIGGER trg_sync_invoice_item_bizum
BEFORE INSERT OR UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_sync_invoice_item_bizum();

DROP TRIGGER IF EXISTS trg_sync_bizum_to_invoice_item ON public.bizums;
CREATE TRIGGER trg_sync_bizum_to_invoice_item
AFTER INSERT OR UPDATE ON public.bizums
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_sync_bizum_to_invoice_item();

DROP TRIGGER IF EXISTS trg_bizums_before_save ON public.bizums;
CREATE TRIGGER trg_bizums_before_save
BEFORE INSERT OR UPDATE ON public.bizums
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_bizums_before_save();
