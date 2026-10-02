-- ==============================================================================
-- MIGRACIÓN: RECONCILIACIÓN AUTOMÁTICA DE TRANSFERENCIAS WISE Y FORMULARIOS WEB
-- Diving ERP - Supabase Trigger
-- ==============================================================================

-- 1. Añadir columnas necesarias a wise_payments si no existen
ALTER TABLE public.wise_payments 
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS titular_wise text,
  ADD COLUMN IF NOT EXISTS web_created_at timestamp with time zone,
  ALTER COLUMN amount_raw DROP NOT NULL,
  ALTER COLUMN currency DROP NOT NULL,
  ALTER COLUMN amount_eur DROP NOT NULL;

ALTER TABLE public.wise_payments
  ALTER COLUMN amount_raw SET DEFAULT 0,
  ALTER COLUMN currency SET DEFAULT 'THB',
  ALTER COLUMN amount_eur SET DEFAULT 0;

-- 2. Función auxiliar para borrado temporal
CREATE OR REPLACE FUNCTION public.delete_wise_temp_web(p_id text)
RETURNS void
LANGUAGE sql
AS $$ DELETE FROM public.wise_payments WHERE id = p_id; $$;

-- 3. Función Trigger de Reconciliación
CREATE OR REPLACE FUNCTION public.reconcile_wise_payment()
RETURNS TRIGGER AS $$
DECLARE
    matched_row RECORD;
    clean_bank_sender text;
    clean_web_sender text;
    clean_web_customer text;
    clean_web_titular text;
BEGIN
    -- =========================================================================
    -- CASO 1: Llega una transferencia bancaria de Wise / Gmail (id no empieza por 'WEB_')
    -- =========================================================================
    IF NEW.id NOT LIKE 'WEB_%' THEN
        NEW.is_paid := true;
        clean_bank_sender := LOWER(TRIM(NEW.sender_name));

        -- Buscar si hay un formulario web previo pendiente
        SELECT * INTO matched_row
        FROM public.wise_payments
        WHERE id LIKE 'WEB_%'
          AND is_processed = false
          AND (
              -- 1. Coincidencia directa con sender_name del formulario
              (sender_name IS NOT NULL AND (
                  clean_bank_sender LIKE '%' || LOWER(TRIM(sender_name)) || '%'
                  OR LOWER(TRIM(sender_name)) LIKE '%' || clean_bank_sender || '%'
              ))
              -- 2. Coincidencia directa con customer_name (nombre completo del alumno)
              OR (customer_name IS NOT NULL AND customer_name <> '' AND (
                  clean_bank_sender LIKE '%' || LOWER(TRIM(customer_name)) || '%'
                  OR LOWER(TRIM(customer_name)) LIKE '%' || clean_bank_sender || '%'
              ))
              -- 3. Coincidencia directa con titular_wise (titular de la cuenta indicado)
              OR (titular_wise IS NOT NULL AND titular_wise <> '' AND (
                  clean_bank_sender LIKE '%' || LOWER(TRIM(titular_wise)) || '%'
                  OR LOWER(TRIM(titular_wise)) LIKE '%' || clean_bank_sender || '%'
              ))
              -- 4. Coincidencia por la primera palabra (ej. primer nombre común si >= 4 letras)
              OR (customer_name IS NOT NULL AND LENGTH(SPLIT_PART(LOWER(TRIM(customer_name)), ' ', 1)) >= 4 
                  AND SPLIT_PART(clean_bank_sender, ' ', 1) = SPLIT_PART(LOWER(TRIM(customer_name)), ' ', 1))
          )
        ORDER BY created_at DESC
        LIMIT 1;

        -- Si encontramos el formulario web previo, heredamos sus datos
        IF matched_row.id IS NOT NULL THEN
            IF matched_row.booking_date IS NOT NULL THEN
                NEW.booking_date := matched_row.booking_date;
            END IF;
            IF matched_row.phone IS NOT NULL THEN
                NEW.phone := matched_row.phone;
            END IF;
            IF matched_row.activity IS NOT NULL THEN
                NEW.activity := matched_row.activity;
            END IF;
            IF matched_row.activity_lines IS NOT NULL THEN
                NEW.activity_lines := matched_row.activity_lines;
            END IF;
            IF matched_row.customer_name IS NOT NULL THEN
                NEW.customer_name := matched_row.customer_name;
            END IF;
            IF matched_row.titular_wise IS NOT NULL THEN
                NEW.titular_wise := matched_row.titular_wise;
            END IF;
            IF matched_row.is_english IS NOT NULL THEN
                NEW.is_english := matched_row.is_english;
            END IF;
            IF matched_row.num_people IS NOT NULL AND matched_row.num_people > 0 THEN
                NEW.num_people := matched_row.num_people;
            END IF;
            IF matched_row.created_at IS NOT NULL THEN
                NEW.web_created_at := matched_row.created_at;
            END IF;

            -- Eliminar la fila web temporal
            PERFORM public.delete_wise_temp_web(matched_row.id);
        END IF;

        RETURN NEW;

    -- =========================================================================
    -- CASO 2: Llega un formulario web (id empieza por 'WEB_')
    -- =========================================================================
    ELSE
        clean_web_sender   := LOWER(TRIM(COALESCE(NEW.sender_name, '')));
        clean_web_customer := LOWER(TRIM(COALESCE(NEW.customer_name, '')));
        clean_web_titular  := LOWER(TRIM(COALESCE(NEW.titular_wise, '')));

        -- Buscar si ya existe una transferencia de Wise en el banco
        SELECT * INTO matched_row
        FROM public.wise_payments
        WHERE id NOT LIKE 'WEB_%'
          AND is_processed = false
          AND (
              -- 1. Coincidencia con sender_name de la web
              (clean_web_sender <> '' AND (
                  LOWER(TRIM(sender_name)) LIKE '%' || clean_web_sender || '%'
                  OR clean_web_sender LIKE '%' || LOWER(TRIM(sender_name)) || '%'
              ))
              -- 2. Coincidencia con customer_name (nombre completo del alumno)
              OR (clean_web_customer <> '' AND (
                  LOWER(TRIM(sender_name)) LIKE '%' || clean_web_customer || '%'
                  OR clean_web_customer LIKE '%' || LOWER(TRIM(sender_name)) || '%'
              ))
              -- 3. Coincidencia con titular_wise
              OR (clean_web_titular <> '' AND (
                  LOWER(TRIM(sender_name)) LIKE '%' || clean_web_titular || '%'
                  OR clean_web_titular LIKE '%' || LOWER(TRIM(sender_name)) || '%'
              ))
              -- 4. Coincidencia por la primera palabra (ej. primer nombre común si >= 4 letras)
              OR (clean_web_customer <> '' AND LENGTH(SPLIT_PART(clean_web_customer, ' ', 1)) >= 4 
                  AND SPLIT_PART(LOWER(TRIM(sender_name)), ' ', 1) = SPLIT_PART(clean_web_customer, ' ', 1))
          )
        ORDER BY created_at DESC
        LIMIT 1;

        -- Si ya existe la transferencia del banco, la actualizamos con los datos del formulario:
        IF matched_row.id IS NOT NULL THEN
            UPDATE public.wise_payments
            SET 
                booking_date   = COALESCE(NEW.booking_date, matched_row.booking_date),
                phone          = COALESCE(NEW.phone, matched_row.phone),
                activity       = COALESCE(NEW.activity, matched_row.activity),
                activity_lines = COALESCE(NEW.activity_lines, matched_row.activity_lines),
                customer_name  = COALESCE(NEW.customer_name, matched_row.customer_name),
                titular_wise   = COALESCE(NEW.titular_wise, matched_row.titular_wise),
                is_english     = COALESCE(NEW.is_english, matched_row.is_english),
                num_people     = CASE WHEN NEW.num_people > 0 THEN NEW.num_people ELSE matched_row.num_people END,
                web_created_at = COALESCE(NEW.created_at, NOW()),
                is_paid        = true
            WHERE id = matched_row.id;

            -- Cancelar la inserción de la fila WEB_ para que no haya duplicados
            RETURN NULL;
        END IF;

        -- Si no existe ninguna transferencia previa en el banco, se inserta la fila web pendiente
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear Trigger
DROP TRIGGER IF EXISTS trg_reconcile_wise_payment ON public.wise_payments;

CREATE TRIGGER trg_reconcile_wise_payment
BEFORE INSERT ON public.wise_payments
FOR EACH ROW
EXECUTE FUNCTION public.reconcile_wise_payment();
