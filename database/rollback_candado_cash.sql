-- ################################################################################
-- SCRIPT DE ROLLBACK: CANDADO DE RESERVAS CASH
-- Ejecutar este script en Supabase SQL Editor si por cualquier motivo se desea
-- desarmar el candado y restaurar el trigger exactamente a su estado del 3 de octubre 2026.
-- ################################################################################

-- 1. Restaurar la función trigger original previa al candado
CREATE OR REPLACE FUNCTION public.fn_trg_billing_auto_import_calendar_deposit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cust record;
  v_cal_res jsonb;
  v_reserva_exists boolean;
  v_bizum_exists boolean;
  v_event_already_imported boolean;
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

  -- 4. Comprobar si ya existe una línea de Reserva para ESTA factura
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoice_items 
    WHERE invoice_id = NEW.invoice_id 
      AND activity_id = v_reserva_activity_id
  ) INTO v_reserva_exists;

  IF v_reserva_exists THEN
    RETURN NEW;
  END IF;

  -- 5. Obtener datos del cliente
  SELECT first_name, last_name, phone, booking_date
  INTO v_cust
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF NOT FOUND OR v_cust.booking_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- 6. Consultar Google Calendar
  BEGIN
    v_cal_res := public.fn_match_google_calendar_deposit(v_cust.first_name, v_cust.last_name, v_cust.phone, v_cust.booking_date);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al consultar Google Calendar en trigger: %', SQLERRM;
    RETURN NEW;
  END;

  -- 7. Si hay coincidencia de Wise, insertar la línea de Reserva
  IF v_cal_res->>'matched' = 'true' THEN
    -- 7.5. PREVENIR DUPLICIDAD GLOBAL: Comprobar si este evento de Google Calendar ya fue importado
    -- en cualquier otra factura del sistema usando el texto de la nota (independiente de la fecha de la fila)
    SELECT EXISTS (
      SELECT 1 
      FROM public.invoice_items 
      WHERE notes = 'Auto-importado de Google Calendar: ' || (v_cal_res->>'event_summary')
    ) INTO v_event_already_imported;

    IF v_event_already_imported THEN
      RETURN NEW;
    END IF;

    -- Insertamos el registro de reserva con DATE = NULL para que lo establezcas manualmente
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
      NULL,
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
$function$;

COMMENT ON FUNCTION public.fn_trg_billing_auto_import_calendar_deposit() IS 'Importa automáticamente reservas desde Google Calendar como ítems de factura.';

-- 2. (Opcional) Eliminar la tabla cash_reservations si se desea limpieza total
-- DROP TABLE IF EXISTS public.cash_reservations CASCADE;
