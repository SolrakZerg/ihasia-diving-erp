-- ==============================================================================
-- MIGRACIÓN: RECONCILIACIÓN AUTOMÁTICA DE TRANSFERENCIAS WISE Y FORMULARIOS WEB
-- Diving ERP - Supabase Trigger
-- ==============================================================================

-- 1. Añadir columnas necesarias a wise_payments si no existen
ALTER TABLE public.wise_payments 
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS titular_wise text,
  ALTER COLUMN amount_raw DROP NOT NULL,
  ALTER COLUMN currency DROP NOT NULL,
  ALTER COLUMN amount_eur DROP NOT NULL;

ALTER TABLE public.wise_payments
  ALTER COLUMN amount_raw SET DEFAULT 0,
  ALTER COLUMN currency SET DEFAULT 'THB',
  ALTER COLUMN amount_eur SET DEFAULT 0;

-- 2. Función Trigger de Reconciliación
CREATE OR REPLACE FUNCTION public.reconcile_wise_payment()
RETURNS TRIGGER AS $$
DECLARE
    web_row RECORD;
    clean_sender text;
BEGIN
    -- Solo aplica cuando se inserta un registro proveniente de Wise/Gmail (no es un registro web temporal)
    IF NEW.id NOT LIKE 'WEB_%' THEN
        -- Por defecto, cualquier pago que entra de Wise bancario ya está pagado
        NEW.is_paid := true;

        clean_sender := LOWER(TRIM(NEW.sender_name));

        -- Buscar si hay un registro previo de la web pendiente de cobro
        SELECT * INTO web_row
        FROM public.wise_payments
        WHERE id LIKE 'WEB_%'
          AND is_processed = false
          AND is_paid = false
          AND (
              clean_sender LIKE '%' || LOWER(TRIM(sender_name)) || '%'
              OR LOWER(TRIM(sender_name)) LIKE '%' || clean_sender || '%'
              OR (titular_wise IS NOT NULL AND titular_wise <> '' AND clean_sender LIKE '%' || LOWER(TRIM(titular_wise)) || '%')
              OR (customer_name IS NOT NULL AND customer_name <> '' AND clean_sender LIKE '%' || LOWER(TRIM(customer_name)) || '%')
          )
        ORDER BY created_at DESC
        LIMIT 1;

        -- Si encontramos la ficha web previa, heredamos todos sus datos
        IF web_row.id IS NOT NULL THEN
            IF web_row.booking_date IS NOT NULL THEN
                NEW.booking_date := web_row.booking_date;
            END IF;
            IF web_row.phone IS NOT NULL THEN
                NEW.phone := web_row.phone;
            END IF;
            IF web_row.activity IS NOT NULL THEN
                NEW.activity := web_row.activity;
            END IF;
            IF web_row.activity_lines IS NOT NULL THEN
                NEW.activity_lines := web_row.activity_lines;
            END IF;
            IF web_row.customer_name IS NOT NULL THEN
                NEW.customer_name := web_row.customer_name;
            END IF;
            IF web_row.titular_wise IS NOT NULL THEN
                NEW.titular_wise := web_row.titular_wise;
            END IF;
            IF web_row.is_english IS NOT NULL THEN
                NEW.is_english := web_row.is_english;
            END IF;
            IF web_row.num_people IS NOT NULL AND web_row.num_people > 0 THEN
                NEW.num_people := web_row.num_people;
            END IF;

            -- Eliminar la fila temporal WEB_ para no tener duplicados
            DELETE FROM public.wise_payments WHERE id = web_row.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear Trigger
DROP TRIGGER IF EXISTS trg_reconcile_wise_payment ON public.wise_payments;

CREATE TRIGGER trg_reconcile_wise_payment
BEFORE INSERT ON public.wise_payments
FOR EACH ROW
EXECUTE FUNCTION public.reconcile_wise_payment();
