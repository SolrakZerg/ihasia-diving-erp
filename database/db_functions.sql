-- ################################################################################
-- STEP 1: DATABASE FUNCTIONS (Bunker Q1 2026 Edition)
-- Project: IHASIA ERP
-- Organization: public (API) and logic (Internal)
-- ################################################################################

-- ================================================================================
-- SECTION 1: PUBLIC API FUNCTIONS (Accessible via PostgREST)
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Function: public.search_customers_v3
-- Description: Advanced customer search using tokens and unaccent.
-- Esta es el buscador avanzado de clientes que permite usar fragmentos de texto y tildes.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_customers_v3(query_text text)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, booking_date date, booked_activity text, passport_number text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  tokens text[];
BEGIN
  tokens := regexp_split_to_array(trim(query_text), '\\s+');
  
  RETURN QUERY
  SELECT 
    c.id, 
    c.first_name, 
    c.last_name, 
    c.email, 
    c.booking_date, 
    c.booked_activity,
    c.passport_number,
    c.created_at
  FROM customers c
  WHERE (
    SELECT bool_and(
      extensions.unaccent(COALESCE(c.first_name, '')) ILIKE extensions.unaccent('%' || t || '%') OR 
      extensions.unaccent(COALESCE(c.last_name, '')) ILIKE extensions.unaccent('%' || t || '%') OR 
      extensions.unaccent(COALESCE(c.email, '')) ILIKE extensions.unaccent('%' || t || '%') OR
      extensions.unaccent(COALESCE(c.passport_number, '')) ILIKE extensions.unaccent('%' || t || '%')
    )
    FROM unnest(tokens) t
  )
  ORDER BY c.booking_date DESC NULLS LAST, c.created_at DESC
  LIMIT 15;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: public.get_duplicate_customers
-- Description: Finds customers with duplicate email and names.
-- Esta busca clientes duplicados por nombre y email.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_duplicate_customers()
 RETURNS SETOF customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT c.* FROM customers c
    WHERE EXISTS (
        SELECT 1 FROM customers c2 WHERE c2.id <> c.id
          AND LOWER(TRIM(c2.email)) = LOWER(TRIM(c.email))
          AND LOWER(TRIM(c2.first_name)) = LOWER(TRIM(c.first_name))
          AND LOWER(TRIM(c2.last_name)) = LOWER(TRIM(c.last_name))
    ) ORDER BY c.email, c.created_at;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: public.sync_monthly_activity_logs
-- Description: Atomically syncs monthly activity counts (Delete + Insert).
-- Esta sincroniza el conteo de actividades mensuales para las estadísticas del ERP.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_monthly_activity_logs(p_year integer, p_month integer, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Borrar registros existentes para ese mes/año (Limpieza total)
    DELETE FROM public.monthly_activity_logs
    WHERE year = p_year AND month = p_month;

    -- 2. Insertar solo si hay datos y el contador es mayor que 0
    IF p_data IS NOT NULL AND jsonb_array_length(p_data) > 0 THEN
        INSERT INTO public.monthly_activity_logs (year, month, activity_id, count, updated_at)
        SELECT 
            p_year, 
            p_month, 
            (item->>'activity_id')::UUID, 
            (item->>'count')::INT, 
            NOW()
        FROM jsonb_array_elements(p_data) AS item
        WHERE (item->>'count')::INT > 0;
    END IF;
END;
$function$;


-- ================================================================================
-- SECTION 2: INTERNAL LOGIC FUNCTIONS (Schema: logic)
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Function: logic.calc_total_xpagar
-- Description: Trigger that sums all pending payments for the month in monthly_reports.
-- Esta suma todo lo que queda pendiente de pagar en el mes (proveedores, sueldos, fijos, etc.) en el reporte mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.calc_total_xpagar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_suppliers_pending NUMERIC;
    v_sueldos_pending   NUMERIC;
    v_gastos_pending    NUMERIC;
    v_fijo_office       NUMERIC;
    v_fijo_infinity     NUMERIC;
    v_fijo_pae          NUMERIC;
    v_fijo_polimigra    NUMERIC;
    v_bote_pending      NUMERIC;
BEGIN
    -- SUPER ESCUDO PROTECTOR (Ene-Mar 2026)
    IF NEW.year < 2026 OR (NEW.year = 2026 AND NEW.month <= 3) THEN 
        RETURN NEW; 
    END IF;

    -- Proveedores pendientes
    SELECT COALESCE(SUM(pending_amount), 0) INTO v_suppliers_pending
    FROM supplier_settlements WHERE year = NEW.year AND month = NEW.month;

    -- Sueldos pendientes
    SELECT COALESCE(SUM(total_payout), 0) INTO v_sueldos_pending
    FROM staff_settlements WHERE year = NEW.year AND month = NEW.month;

    -- Gastos financieros pendientes
    SELECT COALESCE(grand_total_pending, 0) INTO v_gastos_pending
    FROM monthly_expenses WHERE year = NEW.year AND month = NEW.month;

    -- Valores base de fijos
    SELECT COALESCE(amount, 0) INTO v_fijo_office    FROM fixed_expenses WHERE name ILIKE '%office%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_infinity  FROM fixed_expenses WHERE name ILIKE '%infinity%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_pae       FROM fixed_expenses WHERE name ILIKE '%pae%' OR name ILIKE '%p ae%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_polimigra FROM fixed_expenses WHERE name ILIKE '%poli%' LIMIT 1;

    -- Bote pendiente
    SELECT COALESCE(apartar_amount, 0) INTO v_bote_pending
    FROM bote_monthly WHERE year = NEW.year AND month = NEW.month;

    NEW.total_xpagar :=
        v_suppliers_pending
        + v_sueldos_pending
        + v_gastos_pending
        + COALESCE(NEW.office_xpagar,    v_fijo_office)
        + COALESCE(NEW.infinity_xpagar,  v_fijo_infinity)
        + COALESCE(NEW.pae_xpagar,       v_fijo_pae)
        + COALESCE(NEW.polimigra_xpagar, v_fijo_polimigra)
        + COALESCE(NEW.bote_xpagar,      v_bote_pending);

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.recalculate_bote_apartar
-- Description: Calculates total amount to set aside for 'Bote' (t-shirts and insurance).
-- Esta calcula cuánto dinero hay que "apartar" para el bote por cada camiseta y seguro.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.recalculate_bote_apartar(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_tshirts INT;
    v_insurances INT;
    v_total NUMERIC;
BEGIN
    -- SUPER ESCUDO PROTECTOR (Ene-Mar 2026)
    IF p_year < 2026 OR (p_year = 2026 AND p_month <= 3) THEN 
        RETURN; 
    END IF;

    -- 1. Contar camisetas usando la FECHA DEL CURSO (date), no la fecha de registro
    SELECT COALESCE(SUM(i.quantity), 0) INTO v_tshirts
    FROM public.invoice_items i
    JOIN public.activities a ON i.activity_id = a.id
    WHERE a.tshirt_included = true
    AND EXTRACT(YEAR FROM i.date) = p_year
    AND EXTRACT(MONTH FROM i.date) = p_month;

    -- 2. Contar seguros de los lotes
    SELECT COALESCE(SUM(total_pax), 0) INTO v_insurances
    FROM public.insurance_batches
    WHERE EXTRACT(YEAR FROM created_at) = p_year
    AND EXTRACT(MONTH FROM created_at) = p_month;

    -- 3. Calcular total (160 por camiseta, 75 por seguro)
    v_total := (v_tshirts * 160) + (v_insurances * 75);

    -- 4. Actualizar tabla bote_monthly
    INSERT INTO public.bote_monthly (year, month, apartar_amount, updated_at)
    VALUES (p_year, p_month, v_total, now())
    ON CONFLICT (year, month) DO UPDATE 
    SET apartar_amount = v_total, updated_at = now();
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.trigger_recalculate_bote
-- Description: Bridge trigger for insurance and invoices to call recalculate_bote_apartar.
-- Esta es el "puente" que llama a la función anterior cuando hay cambios en seguros o ítems de facturas.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trigger_recalculate_bote()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM logic.recalculate_bote_apartar(
        EXTRACT(YEAR FROM COALESCE(NEW.created_at, OLD.created_at))::INT,
        EXTRACT(MONTH FROM COALESCE(NEW.created_at, OLD.created_at))::INT
    );
    RETURN NULL;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_total_gastos_to_report
-- Description: Aggregates all expenses (suppliers, staff, bote, fixed, finance) into monthly_reports.
-- Esta es "La Jefa", agrega todos los gastos mensuales en el reporte.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_gastos_to_report(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_suppliers numeric;
    v_sueldos_total numeric;
    v_sueldos_pendiente numeric;
    v_bote numeric;
    v_fijos numeric;
    v_gastos_fin numeric;
    v_total_gastos numeric;
BEGIN
    -- SUPER ESCUDO PROTECTOR
    IF p_year < 2026 OR (p_year = 2026 AND p_month <= 3) THEN 
        RETURN; 
    END IF;

    -- 1. Proveedores: Todo lo pagado en Settlements
    SELECT COALESCE(SUM(total_amount), 0) INTO v_suppliers 
    FROM supplier_settlements WHERE year = p_year AND month = p_month;

    -- 2. Sueldos: TOTAL (coste real) y PENDIENTE (lo que falta por pagar)
    SELECT 
        COALESCE(SUM(total_commissions + total_bonus), 0),
        COALESCE(SUM(total_payout), 0)
    INTO v_sueldos_total, v_sueldos_pendiente
    FROM staff_settlements WHERE year = p_year AND month = p_month;

    -- 3. Bote: Cantidad apartada ese mes
    SELECT COALESCE(SUM(apartar_amount), 0) INTO v_bote 
    FROM bote_monthly WHERE year = p_year AND month = p_month;

    -- 4. Gastos Fijos: Suma de la tabla de configuración
    SELECT COALESCE(SUM(amount), 0) INTO v_fijos FROM fixed_expenses;

    -- 5. Gastos Financieros (Comisiones, Snorkel y Libro de Gastos)
    SELECT COALESCE(grand_total_expenses, 0) INTO v_gastos_fin 
    FROM monthly_expenses WHERE year = p_year AND month = p_month;

    -- Cálculo del Total Final Agregado
    v_total_gastos := v_suppliers + v_sueldos_total + v_bote + v_fijos + v_gastos_fin;

    -- Actualización atómica en monthly_reports
    INSERT INTO monthly_reports (year, month, total_gastos, sueldos_total, sueldos_pendiente, updated_at)
    VALUES (p_year, p_month, v_total_gastos, v_sueldos_total, v_sueldos_pendiente, NOW())
    ON CONFLICT (year, month) 
    DO UPDATE SET 
        total_gastos = v_total_gastos,
        sueldos_total = v_sueldos_total,
        sueldos_pendiente = v_sueldos_pendiente,
        updated_at = NOW();
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.trg_sync_total_gastos_to_report
-- Description: Bridge trigger for bote/expenses to sync total expenses to report.
-- Esta es el puente que actualiza el reporte cuando cambian los gastos del bote o financieros.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trg_sync_total_gastos_to_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_year  INTEGER;
    v_month INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_year := OLD.year; v_month := OLD.month;
    ELSE
        v_year := NEW.year; v_month := NEW.month;
    END IF;
    PERFORM logic.sync_total_gastos_to_report(v_year, v_month);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_invoice_report
-- Description: Syncs invoiced, pending, and collected totals to monthly_reports.
-- Esta sincroniza los totales de facturas (Facturado, Pendiente, Cobrado) con el reporte mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_invoice_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_date DATE;
    target_year INTEGER;
    target_month INTEGER;
    t_total NUMERIC;
    t_pending NUMERIC;
    t_cobrado NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN target_date := OLD.date; ELSE target_date := NEW.date; END IF;
    IF target_date IS NULL THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;

    target_year := EXTRACT(YEAR FROM target_date);
    target_month := EXTRACT(MONTH FROM target_date);

    -- SUPER ESCUDO PROTECTOR: No tocar nada anterior a Abril 2026
    IF target_year < 2026 OR (target_year = 2026 AND target_month <= 3) THEN 
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; 
    END IF;

    -- Calculamos usando 'Paid' que es lo que hay en la BD
    SELECT 
        COALESCE(SUM(total_thb), 0),
        COALESCE(SUM(CASE WHEN status != 'Paid' THEN total_thb ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_thb ELSE 0 END), 0)
    INTO t_total, t_pending, t_cobrado
    FROM invoice_items WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    INSERT INTO monthly_reports (year, month, facturado, pendiente, cobrado, updated_at)
    VALUES (target_year, target_month, t_total, t_pending, t_cobrado, NOW())
    ON CONFLICT (year, month) DO UPDATE SET facturado = EXCLUDED.facturado, pendiente = EXCLUDED.pendiente, cobrado = EXCLUDED.cobrado, updated_at = NOW();

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_monthly_finances
-- Description: Syncs daily expenses and commissions to monthly_expenses.
-- Se encarga de sincronizar los gastos diarios (daily_expenses) y las comisiones al reporte mensual de gastos. 
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_monthly_finances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_date DATE; target_year INTEGER; target_month INTEGER;
    t_expenses NUMERIC; c_paid NUMERIC; c_pending NUMERIC; s_paid NUMERIC; s_pending NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN target_date := OLD.date; ELSE target_date := NEW.date; END IF;
    IF target_date IS NULL THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;

    target_year := EXTRACT(YEAR FROM target_date);
    target_month := EXTRACT(MONTH FROM target_date);

    -- SUPER ESCUDO PROTECTOR: No tocar nada anterior a Abril 2026
    IF target_year < 2026 OR (target_year = 2026 AND target_month <= 3) THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- Recalcular Gastos
    SELECT COALESCE(SUM(amount), 0) INTO t_expenses FROM daily_expenses 
    WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    -- Recalcular Comisiones
    SELECT 
        COALESCE(SUM(CASE WHEN is_comm_paid THEN COALESCE(comm_amount_thb, total_thb * 0.1) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT is_comm_paid THEN COALESCE(comm_amount_thb, total_thb * 0.1) ELSE 0 END), 0)
    INTO c_paid, c_pending FROM invoice_items
    WHERE is_comm = true AND EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    -- Recalcular Snorkel
    SELECT 
        COALESCE(SUM(CASE WHEN i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0)
    INTO s_paid, s_pending FROM invoice_items i LEFT JOIN activities a ON i.activity_id = a.id
    WHERE (a.category = 'Snorkeling' OR a.name ILIKE '%snorkel%')
      AND EXTRACT(YEAR FROM i.date) = target_year AND EXTRACT(MONTH FROM i.date) = target_month;

    -- Upsert en monthly_expenses
    INSERT INTO monthly_expenses (
        year, month, total_expenses, comm_paid, comm_pending, 
        snorkel_paid, snorkel_pending, grand_total_expenses, grand_total_pending, updated_at
    )
    VALUES (
        target_year, target_month, t_expenses, c_paid, c_pending, 
        s_paid, s_pending, (t_expenses + c_paid + c_pending + s_paid + s_pending), (c_pending + s_pending), NOW()
    )
    ON CONFLICT (year, month) DO UPDATE SET 
        total_expenses = EXCLUDED.total_expenses, 
        comm_paid = EXCLUDED.comm_paid, 
        comm_pending = EXCLUDED.comm_pending, 
        snorkel_paid = EXCLUDED.snorkel_paid, 
        snorkel_pending = EXCLUDED.snorkel_pending, 
        grand_total_expenses = EXCLUDED.grand_total_expenses, 
        grand_total_pending = EXCLUDED.grand_total_pending, 
        updated_at = NOW();

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_staff_settlement
-- Description: Calculates commissions, assistance bonuses and salary adjustments.
-- Esta calcula las comisiones, bonus por asistencia (2000 THB) y ajustes de sueldos del personal.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_staff_settlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_staff_id uuid; v_year int; v_month int; v_commissions numeric; v_advances numeric; v_bonus numeric; v_adjustments numeric; v_assists_count int; v_staff_ids uuid[] := '{}'; v_years int[] := '{}'; v_months int[] := '{}'; i int;
BEGIN
    -- 1. Recolectar datos
    IF TG_TABLE_NAME = 'invoice_items' THEN
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            v_staff_ids := array_append(v_staff_ids, NEW.instructor_id);
            v_years := array_append(v_years, EXTRACT(YEAR FROM NEW.date)::int);
            v_months := array_append(v_months, EXTRACT(MONTH FROM NEW.date)::int);
        END IF;
        IF TG_OP IN ('DELETE', 'UPDATE') THEN
            v_staff_ids := array_append(v_staff_ids, OLD.instructor_id);
            v_years := array_append(v_years, EXTRACT(YEAR FROM OLD.date)::int);
            v_months := array_append(v_months, EXTRACT(MONTH FROM OLD.date)::int);
        END IF;
    ELSE
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            v_staff_ids := array_append(v_staff_ids, NEW.staff_id);
            v_years := array_append(v_years, NEW.year);
            v_months := array_append(v_months, NEW.month);
        END IF;
        IF TG_OP IN ('DELETE', 'UPDATE') THEN
            v_staff_ids := array_append(v_staff_ids, OLD.staff_id);
            v_years := array_append(v_years, OLD.year);
            v_months := array_append(v_months, OLD.month);
        END IF;
    END IF;

    -- 2. Iterar sobre los afectados
    FOR i IN 1 .. array_length(v_staff_ids, 1) LOOP
        v_staff_id := v_staff_ids[i]; v_year := v_years[i]; v_month := v_months[i];
        IF v_staff_id IS NULL OR v_year IS NULL OR v_month IS NULL THEN CONTINUE; END IF;
        
        -- SUPER ESCUDO PROTECTOR (Ene-Mar 2026)
        IF v_year < 2026 OR (v_year = 2026 AND v_month <= 3) THEN CONTINUE; END IF;

        -- 3. Calcular
        SELECT COALESCE(SUM(ip.amount_thb * ii.quantity), 0) INTO v_commissions FROM public.invoice_items ii JOIN public.instructor_payouts ip ON ii.activity_id = ip.activity_id WHERE ii.instructor_id = v_staff_id AND EXTRACT(YEAR FROM ii.date) = v_year AND EXTRACT(MONTH FROM ii.date) = v_month;
        SELECT COALESCE(SUM(amount), 0) INTO v_advances FROM public.staff_advances WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        SELECT COALESCE(SUM(assists * 2000), 0), COALESCE(SUM(assists), 0) INTO v_bonus, v_assists_count FROM public.staff_daily_activity WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        SELECT COALESCE(SUM(amount), 0) INTO v_adjustments FROM public.staff_adjustments WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;

        -- 4. Guardar o borrar
        IF v_commissions = 0 AND v_advances = 0 AND v_bonus = 0 AND v_adjustments = 0 AND v_assists_count = 0 THEN
            DELETE FROM public.staff_settlements WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        ELSE
            INSERT INTO public.staff_settlements (staff_id, year, month, total_commissions, total_advances, total_bonus, assists_count, updated_at)
            VALUES (v_staff_id, v_year, v_month, v_commissions, v_advances, v_bonus + v_adjustments, v_assists_count, now())
            ON CONFLICT (staff_id, year, month) DO UPDATE SET 
                total_commissions = EXCLUDED.total_commissions, 
                total_advances = EXCLUDED.total_advances, 
                total_bonus = EXCLUDED.total_bonus, 
                assists_count = EXCLUDED.assists_count, 
                updated_at = EXCLUDED.updated_at;
        END IF;
    END LOOP;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.update_updated_at_column
-- Description: Standard trigger to auto-update updated_at timestamps.
-- Esta es la función estándar que actualiza automáticamente la fecha de modificación de un registro.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.trg_call_sync_fixed_expenses
-- Description: Trigger bridge to sync total expenses when fixed expenses change.
-- Esta es el puente que actualiza el reporte de gastos totales cuando cambian los gastos fijos configurados.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trg_call_sync_fixed_expenses()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_year INTEGER; v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::INTEGER; v_month := EXTRACT(MONTH FROM NOW())::INTEGER;
    PERFORM logic.sync_total_gastos_to_report(v_year, v_month);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_total_courses_from_logs
-- Description: Updates total_courses in monthly_reports based on activity logs.
-- Esta sincroniza el sumatorio total de cursos en el reporte mensual basándose en los logs de actividad.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_courses_from_logs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_year INT; v_month INT; v_total_courses INT;
BEGIN
    -- 1. Identificar periodo
    IF TG_OP = 'DELETE' THEN 
        v_year := OLD.year; v_month := OLD.month; 
    ELSE 
        v_year := NEW.year; v_month := NEW.month; 
    END IF;

    -- SUPER ESCUDO PROTECTOR (No tocar nada anterior a Abril 2026)
    IF v_year < 2026 OR (v_year = 2026 AND v_month <= 3) THEN 
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; 
    END IF;

    -- 2. Calcular total de cursos (donde widget_column = 1)
    SELECT COALESCE(SUM(CASE WHEN a.widget_column = 1 THEN l.count ELSE 0 END), 0)::INT 
    INTO v_total_courses 
    FROM monthly_activity_logs l 
    JOIN activities a ON l.activity_id = a.id 
    WHERE l.year = v_year AND l.month = v_month;

    -- 3. Actualizar el reporte mensual
    UPDATE monthly_reports 
    SET total_courses = v_total_courses 
    WHERE year = v_year AND month = v_month;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.sync_total_courses_trigger
-- Description: Auxiliary sync for total_courses on monthly_reports updates.
-- Esta es el puente que asegura que el total de cursos se actualice en el reporte cuando cambian los logs.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_courses_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- SUPER ESCUDO PROTECTOR
    IF NEW.year < 2026 OR (NEW.year = 2026 AND NEW.month <= 3) THEN 
        RETURN NEW; 
    END IF;

    -- Asegurar que si el reporte se actualiza y no tiene cursos, los coja de los logs
    IF NEW.year >= 2026 AND NEW.total_courses IS NOT NULL AND NEW.total_courses > 0 THEN
        UPDATE monthly_reports 
        SET total_courses = NEW.total_courses 
        WHERE year = NEW.year 
          AND month = NEW.month 
          AND (total_courses IS NULL OR total_courses = 0);
    END IF;

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: logic.func_trigger_invoice_to_ssi
-- Description: Trigger that calculates SSI breakdown when invoice items change (UPSERT).
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_trigger_invoice_to_ssi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_date DATE;
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    -- 1. Obtener la fecha de la factura afectada
    IF (TG_OP = 'DELETE') THEN
        v_date := OLD.date;
        IF (v_date IS NULL) THEN
            SELECT created_at::DATE INTO v_date FROM public.invoices WHERE id = OLD.invoice_id;
        END IF;
    ELSE
        v_date := NEW.date;
        IF (v_date IS NULL) THEN
            SELECT created_at::DATE INTO v_date FROM public.invoices WHERE id = NEW.invoice_id;
        END IF;
    END IF;

    IF (v_date IS NULL) THEN 
        IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    v_year := EXTRACT(YEAR FROM v_date)::INTEGER;
    v_month := EXTRACT(MONTH FROM v_date)::INTEGER;

    -- 2. Resetear system_quantity a 0 para todas las actividades de ese mes
    UPDATE public.ssi_monthly_breakdown 
    SET system_quantity = 0 
    WHERE year = v_year AND month = v_month;

    -- 3. Calcular e Insertar/Actualizar los totales reales de las facturas
    INSERT INTO public.ssi_monthly_breakdown (year, month, activity_id, system_quantity, unit_cost)
    SELECT 
        v_year, 
        v_month, 
        ii.activity_id,
        SUM(ii.quantity),
        COALESCE(a.ssi_cost_thb, 0)
    FROM public.invoice_items ii
    JOIN public.activities a ON ii.activity_id = a.id
    WHERE a.is_ssi_active = true
      AND EXTRACT(YEAR FROM ii.date) = v_year 
      AND EXTRACT(MONTH FROM ii.date) = v_month
    GROUP BY ii.activity_id, a.ssi_cost_thb
    ON CONFLICT (year, month, activity_id) 
    DO UPDATE SET 
        system_quantity = EXCLUDED.system_quantity,
        unit_cost = EXCLUDED.unit_cost;

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Table: ssi_monthly_breakdown (Total Calculation)
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_ssi_total_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_year integer;
    v_month integer;
BEGIN
    -- Detectar si es un borrado o una inserción/actualización
    IF (TG_OP = 'DELETE') THEN
        v_year := OLD.year;
        v_month := OLD.month;
    ELSE
        v_year := NEW.year;
        v_month := NEW.month;
    END IF;

    -- Si no hay año o mes, no hacemos nada
    IF (v_year IS NULL OR v_month IS NULL) THEN
        IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- Llamar a nuestra función de recuento que sí resta el mes anterior
    PERFORM logic.func_recount_ssi_month(v_year, v_month);

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Table: ssi_monthly_breakdown (Recount)
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_recount_ssi_month(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_calculated_total numeric;
  v_adj_prev numeric;
  v_impact numeric;
  v_total numeric;
BEGIN
  -- 1. Sumar los totales de las filas
  SELECT COALESCE(SUM(total_fila), 0)
  INTO v_calculated_total
  FROM public.ssi_monthly_breakdown
  WHERE year = p_year AND month = p_month;
  
  -- 2. Leer el ajuste (mes_anterior) de la fila del MES ACTUAL
  SELECT COALESCE(mes_anterior, 0)
  INTO v_adj_prev
  FROM public.supplier_settlements
  WHERE supplier_name = 'SSI'
  AND year = p_year AND month = p_month;
  
  -- 3. Calcular impacto
  v_impact := v_adj_prev * 1067;
  
  -- 4. Total = Calculado - Impacto
  v_total := v_calculated_total - v_impact;
  
  -- 5. Actualizar supplier_settlements
  UPDATE public.supplier_settlements
  SET total_amount = v_total
  WHERE supplier_name = 'SSI' AND year = p_year AND month = p_month;
END;
$function$;


