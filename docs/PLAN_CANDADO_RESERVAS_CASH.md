# Plan de Implementación: Candado de Reservas Cash (Evitar Reservas Zombi)

**Fecha de redacción:** 2 de Octubre de 2026  
**Objetivo:** Erradicar la re-importación no deseada de depósitos de reservas en Cash cuando se borra manualmente la línea de reserva en la factura y posteriormente se añade otra actividad al cliente (con el botón `+`, desde Asegurados o desde Clientes).

---

## 1. El Problema a Resolver

1. **Flujo habitual en Cash:**
   * Un cliente reserva con 1.000 THB en efectivo (registrado con Addtocalendar 5.1 en Google Calendar).
   * Al crearle la factura con el Open Water (9.000 THB), el trigger auto-importa la línea de Reserva de 1.000 THB en Cash.
   * El cliente llega a la escuela y paga 8.000 THB en efectivo. El usuario borra la línea de reserva de 1.000 THB y deja el Open Water a 9.000 THB para cuadrar la caja.
2. **El Fallo ("Reserva Zombi"):**
   * Más tarde, el cliente decide hacer otra actividad (ej. *Deep Adventure*). El usuario pulsa el botón **`+`** para añadir la nueva línea.
   * El trigger actual comprueba si hay una línea de reserva en la factura. Al haber sido borrada, el trigger cree que falta, consulta Google Calendar de nuevo y **vuelve a insertar la reserva de 1.000 THB**.
3. **El caso David (Reserva Manual Previa):**
   * El cliente deja 1.000 THB en cash antes de estar registrado en la base de datos.
   * El usuario crea una línea de reserva manual en la factura.
   * Cuando el cliente se registra en la web y se enlaza con esa línea manual, si el día del curso se borra la reserva y luego se añade otra actividad con `+`, el sistema tampoco debe resucitarla desde Calendar.

---

## 2. Arquitectura de la Solución (Candado 1 Optimizado)

### 2.1 Nueva Tabla: `public.billing_imported_calendar_events`
Actúa como un **libro de registro local instantáneo (1 ms)** para no tener que llamar a Google Calendar si la reserva de ese viaje ya fue consumida o procesada.

```sql
CREATE TABLE IF NOT EXISTS public.billing_imported_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  google_event_id text,
  event_summary text,
  imported_at timestamptz DEFAULT now(),
  
  -- Garantiza que para ese cliente y esa fecha de viaje no haya duplicados
  CONSTRAINT unique_customer_booking_deposit UNIQUE (customer_id, booking_date)
);

CREATE INDEX IF NOT EXISTS idx_billing_imported_cust_date 
ON public.billing_imported_calendar_events (customer_id, booking_date);
```

### 2.2 Principio de Independencia de Fechas de Facturación
* **IMPORTANTE:** La fecha que se utiliza para el control **SIEMPRE es `customers.booking_date`** (la fecha de llegada/reserva guardada en la ficha del cliente).
* La fecha de la línea de la factura (`invoice_items.date`) **no interviene para nada**: el usuario puede dejarla vacía o ponerle la fecha de fin de curso (ej. día 12) para su ordenación habitual en la factura sin ningún impacto en este candado.

---

## 3. Lógica del Trigger en Supabase (`fn_trg_billing_auto_import_calendar_deposit`)

El trigger modificado seguirá este orden estricto de ejecución:

```
[ Se añade / modifica línea en Facturación con customer_id ]
                     │
                     ▼
  [ 1. ¿Es la propia línea de Reserva? ] ──────────────► Si SÍ: anota en el libro de
                     │ (No)                               registro (Cubre caso David)
                     ▼
  [ 2. ¿Tiene depósito Bizum local? ] ─────────────────► Si SÍ: Salir (RETURN NEW)
                     │ (No)
                     ▼
  [ 3. ¿La factura ya tiene línea de Reserva? ] ───────► Si SÍ: Salir (RETURN NEW)
                     │ (No)
                     ▼
  [ 4. CHEQUEO LOCAL INSTANTÁNEO (1 ms) ]
  ¿Existe (customer_id, booking_date) en
   billing_imported_calendar_events?
                     │
         ┌───────────┴───────────┐
      (Si SÍ)                 (Si NO)
         ▼                       ▼
  [ Salir inmediatamente ]    [ 5. Consultar Google Calendar API ]
  - Cero llamadas a Google        │
  - Pantalla ultra rápida         ▼
  - Reserva zombi bloqueada   [ 6. Si hay evento coincidente: ]
                                - Inserta Reserva en invoice_items
                                - Inserta registro en
                                  billing_imported_calendar_events
```

---

## 4. Script SQL de Migración Completo (Para ejecutar mañana)

```sql
-- ==============================================================================
-- MIGRACIÓN: Candado de Reservas de Calendar contra Reservas Zombi
-- ==============================================================================

-- 1. Crear tabla de control de reservas procesadas
CREATE TABLE IF NOT EXISTS public.billing_imported_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  google_event_id text,
  event_summary text,
  imported_at timestamptz DEFAULT now(),
  CONSTRAINT unique_customer_booking_deposit UNIQUE (customer_id, booking_date)
);

CREATE INDEX IF NOT EXISTS idx_billing_imported_cust_date 
ON public.billing_imported_calendar_events (customer_id, booking_date);

-- 2. Sembrar la tabla con el histórico existente de reservas ya importadas en invoice_items
INSERT INTO public.billing_imported_calendar_events (customer_id, booking_date, event_summary)
SELECT DISTINCT 
  c.id AS customer_id,
  c.booking_date,
  SUBSTRING(ii.notes FROM 'Auto-importado de Google Calendar: (.*)') AS event_summary
FROM public.invoice_items ii
JOIN public.customers c ON c.id = ii.customer_id
WHERE ii.notes LIKE 'Auto-importado de Google Calendar: %'
  AND c.booking_date IS NOT NULL
ON CONFLICT (customer_id, booking_date) DO NOTHING;

-- 3. Actualizar la función del Trigger de auto-importación
CREATE OR REPLACE FUNCTION public.fn_trg_billing_auto_import_calendar_deposit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cust record;
  v_cal_res jsonb;
  v_reserva_exists boolean;
  v_bizum_exists boolean;
  v_already_processed boolean;
  v_reserva_activity_id uuid := '06ee3b83-af61-462e-9e98-b8dc90107ef9';
BEGIN
  -- 1. Si la línea que se está insertando/modificando ES la propia Reserva (ej. David manual):
  -- Registramos a David en el candado para que su fecha quede sellada
  IF NEW.activity_id = v_reserva_activity_id THEN
    IF NEW.customer_id IS NOT NULL THEN
      SELECT booking_date INTO v_cust FROM public.customers WHERE id = NEW.customer_id;
      IF FOUND AND v_cust.booking_date IS NOT NULL THEN
        INSERT INTO public.billing_imported_calendar_events (customer_id, booking_date, event_summary)
        VALUES (NEW.customer_id, v_cust.booking_date, 'Reserva manual / asignada en factura')
        ON CONFLICT (customer_id, booking_date) DO NOTHING;
      END IF;
    END IF;
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

  -- 3. Si ya tiene Bizum local asignado, omitir Google Calendar
  IF NEW.bizum_deposit_eur IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.fn_match_bizum_deposit(NEW.customer_id)
  ) INTO v_bizum_exists;

  IF v_bizum_exists THEN
    RETURN NEW;
  END IF;

  -- 4. Comprobar si ya existe una línea de Reserva en ESTA factura
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

  -- 6. CANDADO PREVIO INSTANTÁNEO (1 ms):
  -- Si este cliente ya tiene su reserva procesada para esta fecha de viaje, salir sin llamar a Google
  SELECT EXISTS (
    SELECT 1 
    FROM public.billing_imported_calendar_events
    WHERE customer_id = NEW.customer_id 
      AND booking_date = v_cust.booking_date
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN NEW;
  END IF;

  -- 7. Consultar Google Calendar (solo si no estaba en la tabla de control)
  BEGIN
    v_cal_res := public.fn_match_google_calendar_deposit(v_cust.first_name, v_cust.last_name, v_cust.phone, v_cust.booking_date);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al consultar Google Calendar en trigger: %', SQLERRM;
    RETURN NEW;
  END;

  -- 8. Si hay coincidencia, insertar la línea de Reserva Y registrar en el Candado
  IF v_cal_res->>'matched' = 'true' THEN
    -- Registrar en el libro de control para bloquear futuras resurrecciones
    INSERT INTO public.billing_imported_calendar_events (
      customer_id, 
      booking_date, 
      google_event_id, 
      event_summary
    ) VALUES (
      NEW.customer_id, 
      v_cust.booking_date, 
      v_cal_res->>'event_id', 
      v_cal_res->>'event_summary'
    ) ON CONFLICT (customer_id, booking_date) DO NOTHING;

    -- Insertar la línea de reserva en invoice_items
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
```

---

## 5. Pasos de Verificación para Mañana

1. **Prueba 1: Auto-importación habitual y borrado en Cash**
   * Crear factura para un cliente con reserva en Calendar (ej. Emelie o similar).
   * Comprobar que se crea la línea de Reserva.
   * Borrar la línea de Reserva con la papelera.
   * Pulsar el botón **`+`** para añadir otra actividad al mismo cliente.
   * **Resultado esperado:** La nueva línea se crea al instante y **NO** se re-importa la reserva de 1.000 THB.

2. **Prueba 2: Reserva manual (Caso David)**
   * Crear factura con línea manual de Reserva (1.000 THB cash).
   * Asignar al cliente David a la fila.
   * Borrar la línea manual de Reserva.
   * Pulsar el botón **`+`**.
   * **Resultado esperado:** Google Calendar **NO** re-importa el evento de David.

3. **Prueba 3: Nuevo viaje en el futuro**
   * Si un cliente regresa meses después y tiene un nuevo `booking_date`, verificar que el candado permite importar su nueva reserva.

---

## 6. Archivos del Repositorio a Actualizar tras la Migración
* `database/db_tables.sql` (Añadir definición de `billing_imported_calendar_events`).
* `database/db_functions.sql` (Actualizar código de `fn_trg_billing_auto_import_calendar_deposit`).
