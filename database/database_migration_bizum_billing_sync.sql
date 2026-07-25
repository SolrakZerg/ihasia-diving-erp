-- Migration script to automate sync between 'bizums' and 'invoice_items',
-- and auto-import Wise deposits from Google Calendar.
-- Project: Diving ERP
-- Version: 4.2 (Supports Retained, Partial Refunds, Partner Settlements, and Google Calendar Wise Sync with Timezone-proof phone matching)

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

-- Función para buscar depósitos de Bizum activos (ventana flexible de ±3 días)
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
    AND b.booking_date >= v_cust_date - 3 -- Margen de 3 días antes
    AND b.booking_date <= v_cust_date + 3 -- Margen de 3 días después
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
    abs(b.booking_date - v_cust_date) ASC, -- Priorizar fecha más cercana
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

-- Función RPC para buscar depósitos Wise en Google Calendar (desfase de zona horaria mitigado ±1 día)
CREATE OR REPLACE FUNCTION public.fn_match_google_calendar_deposit(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_booking_date date
)
RETURNS jsonb AS $$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_calendar_list_res http_response;
  v_calendar_list_json jsonb;
  v_item jsonb;
  v_calendar_id text := 'primary';
  
  v_start_str text;
  v_end_str text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_event jsonb;
  v_summary text;
  v_description text;
  
  -- Regex extraction variables
  v_matches text[];
  v_pax int;
  v_amount numeric;
  v_method text;
  
  v_clean_phone text;
  v_search_query text;
BEGIN
  -- 1. Obtener los 3 secretos desencrypted desde Supabase Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se encontraron las credenciales de Google OAuth en Vault');
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error al obtener Access Token de Google (status ' || v_token_res.status::text || '): ' || v_token_res.content);
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo obtener access_token de la respuesta de Google');
  END IF;

  -- 3. Buscar el Calendar ID para "IHASIA llegadas New"
  BEGIN
    v_calendar_list_res := http((
      'GET',
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      ARRAY[http_header('Authorization', 'Bearer ' || v_access_token)],
      NULL,
      NULL
    )::http_request);

    IF v_calendar_list_res.status = 200 THEN
      v_calendar_list_json := v_calendar_list_res.content::jsonb;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_calendar_list_json->'items') LOOP
        IF lower(v_item->>'summary') = 'ihasia llegadas new' THEN
          v_calendar_id := v_item->>'id';
          EXIT;
        END IF;
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_calendar_id := 'primary';
  END;

  -- 4. Rango de búsqueda ±1 día para compensar desfases de zonas horarias en eventos de todo el día
  v_start_str := to_char(p_booking_date - 1, 'YYYY-MM-DD') || 'T00:00:00Z';
  v_end_str := to_char(p_booking_date + 1, 'YYYY-MM-DD') || 'T23:59:59Z';
  
  v_clean_phone := public.fn_clean_phone(p_phone);
  v_search_query := trim(p_first_name);

  v_cal_res := http((
    'GET',
    'https://www.googleapis.com/calendar/v3/calendars/' || urlencode(v_calendar_id) || '/events?' ||
      'timeMin=' || urlencode(v_start_str) || '&timeMax=' || urlencode(v_end_str),
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token)
    ],
    NULL,
    NULL
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error consultando eventos en Google Calendar (status ' || v_cal_res.status::text || '): ' || v_cal_res.content);
  END IF;

  v_cal_json := v_cal_res.content::jsonb;

  -- 5. Analizar los eventos encontrados
  FOR v_event IN SELECT * FROM jsonb_array_elements(v_cal_json->'items') LOOP
    -- Filtrar en SQL que la fecha del evento sea exactamente el día de reserva (p_booking_date)
    IF COALESCE(v_event->'start'->>'date', v_event->'start'->>'dateTime') LIKE to_char(p_booking_date, 'YYYY-MM-DD') || '%' THEN
      v_summary := v_event->>'summary';
      v_description := v_event->>'description';

      -- Limpiar formato HTML y decodificar entidades comunes
      v_description := regexp_replace(COALESCE(v_description, ''), '<[^>]*>', '', 'g');
      v_description := replace(v_description, '&gt;', '>');
      v_description := replace(v_description, '&lt;', '<');
      v_description := replace(v_description, '&nbsp;', ' ');

      -- Comprobar coincidencia: por teléfono (prioritario) o por primer nombre en el título
      IF (v_clean_phone <> '' AND (v_description LIKE '%' || v_clean_phone || '%' OR v_summary LIKE '%' || v_clean_phone || '%'))
         OR (v_search_query <> '' AND v_summary ILIKE '%' || v_search_query || '%') THEN
         
        -- Buscar el patrón en la descripción:
        -- Ej: "Reserva: 2 personas -> 2000 thb a WISE BT"
        v_matches := regexp_matches(
          v_description, 
          'Reserva:\s*(\d+)\s*personas?\s*->\s*(\d+)\s*(?:thb)?\s*a\s*([A-Za-z0-9\s]+)', 
          'i'
        );
        
        IF v_matches IS NOT NULL AND array_length(v_matches, 1) >= 3 THEN
          v_pax := v_matches[1]::int;
          v_amount := v_matches[2]::numeric;
          v_method := trim(v_matches[3]);

          RETURN jsonb_build_object(
            'success', true,
            'matched', true,
            'event_summary', v_summary,
            'num_people', v_pax,
            'deposit_thb', v_amount,
            'payment_method', v_method
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'matched', false);
END;
$$ LANGUAGE plpgsql;

-- Trigger para importar reservas de Google Calendar en facturas automáticamente
CREATE OR REPLACE FUNCTION public.fn_trg_billing_auto_import_calendar_deposit()
RETURNS trigger AS $$
DECLARE
  v_cust record;
  v_cal_res jsonb;
  v_reserva_exists boolean;
  v_bizum_exists boolean;
  v_reserva_activity_id uuid := '06ee3b83-af61-462e-9e98-b8dc90107ef9';
BEGIN
  -- 1. Evitar recursividad
  IF NEW.activity_id = v_reserva_activity_id THEN
    RETURN NEW;
  END IF;

  -- 2. Ejecutar solo si tiene cliente asignado y es una nueva asignación
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS NOT DISTINCT FROM NEW.customer_id THEN
      RETURN NEW;
    END IF;
  END IF;

  -- 3. OPTIMIZACIÓN CRÍTICA: Si ya tiene un depósito de Bizum asignado o existe uno coincidente
  -- en la base de datos local (ventana ±3 días), omitir por completo la llamada a Google Calendar.
  IF NEW.bizum_deposit_eur IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.fn_match_bizum_deposit(NEW.customer_id)
  ) INTO v_bizum_exists;

  IF v_bizum_exists THEN
    RETURN NEW;
  END IF;

  -- 4. Comprobar si ya existe una línea de Reserva para esta factura
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoice_items 
    WHERE invoice_id = NEW.invoice_id 
      AND activity_id = v_reserva_activity_id
  ) INTO v_reserva_exists;

  IF v_reserva_exists THEN
    RETURN NEW;
  END IF;

  -- 5. Obtener datos del cliente (incluyendo el teléfono)
  SELECT first_name, last_name, phone, booking_date
  INTO v_cust
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF NOT FOUND OR v_cust.booking_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- 6. Consultar Google Calendar pasando nombre, apellido, teléfono y fecha de reserva
  BEGIN
    v_cal_res := public.fn_match_google_calendar_deposit(v_cust.first_name, v_cust.last_name, v_cust.phone, v_cust.booking_date);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al consultar Google Calendar en trigger: %', SQLERRM;
    RETURN NEW;
  END;

  -- 7. Si hay coincidencia de Wise, insertar la línea de Reserva en la misma factura
  IF v_cal_res->>'matched' = 'true' THEN
    INSERT INTO public.invoice_items (
      invoice_id,
      customer_id,
      activity_id,
      date,
      quantity,
      unit_price_thb,
      total_thb,
      status,
      payment_method,
      notes
    ) VALUES (
      NEW.invoice_id,
      NEW.customer_id,
      v_reserva_activity_id,
      v_cust.booking_date,
      (v_cal_res->>'num_people')::integer,
      CASE 
        WHEN (v_cal_res->>'num_people')::integer > 0 THEN ((v_cal_res->>'deposit_thb')::numeric / (v_cal_res->>'num_people')::integer)::numeric
        ELSE 1000
      END,
      (v_cal_res->>'deposit_thb')::numeric,
      'Paid',
      COALESCE(v_cal_res->>'payment_method', 'WISE BT'),
      'Auto-importado de Google Calendar: ' || (v_cal_res->>'event_summary')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Registrar disparadores

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

DROP TRIGGER IF EXISTS trg_billing_auto_import_calendar_deposit ON public.invoice_items;
CREATE TRIGGER trg_billing_auto_import_calendar_deposit
AFTER INSERT OR UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_billing_auto_import_calendar_deposit();
