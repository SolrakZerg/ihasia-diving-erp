-- ################################################################################
-- STEP 1: DATABASE FUNCTIONS BACKUP
-- Project: IHASIA ERP
-- Generated: 2026-05-05
-- ################################################################################

-- --------------------------------------------------------------------------------
-- Function: calc_total_xpagar
-- Description: Calculates total pending payments for monthly reports.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calc_total_xpagar()
 RETURNS trigger
 LANGUAGE plpgsql
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
    IF NEW.year < 2026 THEN RETURN NEW; END IF;

    -- Proveedores pendientes
    SELECT COALESCE(SUM(pending_amount), 0) INTO v_suppliers_pending
    FROM supplier_settlements WHERE year = NEW.year AND month = NEW.month;

    -- Sueldos pendientes (total_payout = lo que falta pagar tras anticipos)
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
-- Function: get_duplicate_customers
-- Description: Finds customers with duplicate email and names.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_duplicate_customers()
 RETURNS SETOF customers
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT c.*
    FROM customers c
    WHERE EXISTS (
        SELECT 1
        FROM customers c2
        WHERE c2.id <> c.id
          AND LOWER(TRIM(c2.email)) = LOWER(TRIM(c.email))
          AND LOWER(TRIM(c2.first_name)) = LOWER(TRIM(c.first_name))
          AND LOWER(TRIM(c2.last_name)) = LOWER(TRIM(c.last_name))
    )
    ORDER BY c.email, c.created_at;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: recalculate_bote_apartar
-- Description: Calculates amounts for Bote based on T-shirts and insurances.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_bote_apartar(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_tshirts INT;
    v_insurances INT;
    v_total NUMERIC;
BEGIN
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

-- ################################################################################
-- [HERRAMIENTA MANUAL DE EMERGENCIA]
-- Function: recalculate_monthly_report
-- Razón: Esta función recalculas TODO (Facturado, Cobrado, Pendiente). 
-- NO tiene triggers asociados para evitar bloqueos y lentitud. 
-- Usar solo manualmente si los datos del Dashboard no cuadran.
-- ################################################################################
CREATE OR REPLACE FUNCTION public.recalculate_monthly_report(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_facturado numeric;
    v_cobrado numeric;
    v_pendiente numeric;
BEGIN
    -- ESCUDO PROTECTOR: No tocar datos anteriores a 2026
    IF p_year < 2026 THEN RETURN; END IF;
    -- Usamos 'Paid' que es el valor real almacenado en la columna status
    SELECT 
        COALESCE(SUM(total_thb), 0),
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_thb ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status != 'Paid' THEN total_thb ELSE 0 END), 0)
    INTO v_facturado, v_cobrado, v_pendiente
    FROM invoices
    WHERE EXTRACT(YEAR FROM created_at) = p_year 
      AND EXTRACT(MONTH FROM created_at) = p_month;

    INSERT INTO monthly_reports (year, month, facturado, cobrado, pendiente)
    VALUES (p_year, p_month, v_facturado, v_cobrado, v_pendiente)
    ON CONFLICT (year, month) DO UPDATE SET
        facturado = v_facturado,
        cobrado = v_cobrado,
        pendiente = v_pendiente,
        updated_at = NOW();
END;
$function$;

-- ################################################################################
-- [OBSOLETO - ELIMINADO DE LA DB EL 05/05/2026]
-- Function: refresh_monthly_report_totals
-- Razón: Esta función causaba discrepancias graves en el Dashboard.
-- 1. Mezclaba erróneamente importes de la tabla obsoleta 'commissions'.
-- 2. Incluía importes de 'partner_settlements' (socios) en el total de gastos,
--    cuando los socios tienen sus propias columnas y no deben inflar los gastos.
-- Sustituida por: sync_total_gastos_to_report()
-- ################################################################################
/*
CREATE OR REPLACE FUNCTION public.refresh_monthly_report_totals(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_gastos numeric := 0; v_xpagar numeric := 0;
BEGIN
    -- ... (Código antiguo preservado solo para referencia) ...
END;
$function$;
*/

-- --------------------------------------------------------------------------------
-- Function: search_customers_v3
-- Description: Advanced customer search using tokens and unaccent.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_customers_v3(query_text text)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, booking_date date, booked_activity text, passport_number text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
DECLARE
  tokens text[];
BEGIN
  tokens := regexp_split_to_array(trim(query_text), '\s+');
  
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
      unaccent(COALESCE(c.first_name, '')) ILIKE unaccent('%' || t || '%') OR 
      unaccent(COALESCE(c.last_name, '')) ILIKE unaccent('%' || t || '%') OR 
      unaccent(COALESCE(c.email, '')) ILIKE unaccent('%' || t || '%') OR
      unaccent(COALESCE(c.passport_number, '')) ILIKE unaccent('%' || t || '%')
    )
    FROM unnest(tokens) t
  )
  ORDER BY c.booking_date DESC NULLS LAST, c.created_at DESC
  LIMIT 15;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: sync_expenses_to_report
-- Description: Trigger function to sync staff and supplier totals to reports.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_expenses_to_report()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_year INT;
    v_month INT;
    v_total_gastos NUMERIC;
    v_total_xpagar NUMERIC;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_year := OLD.year;
        v_month := OLD.month;
    ELSE
        v_year := NEW.year;
        v_month := NEW.month;
    END IF;

    -- 1. Calcular totales de SUELDOS
    SELECT COALESCE(SUM(total_commissions + total_bonus), 0),
           COALESCE(SUM(total_payout), 0)
    INTO v_total_gastos, v_total_xpagar
    FROM staff_settlements WHERE year = v_year AND month = v_month;

    -- 2. Añadir totales de PROVEEDORES
    v_total_gastos := v_total_gastos + (SELECT COALESCE(SUM(total_amount), 0) FROM supplier_settlements WHERE year = v_year AND month = v_month);
    v_total_xpagar := v_total_xpagar + (SELECT COALESCE(SUM(pending_amount), 0) FROM supplier_settlements WHERE year = v_year AND month = v_month);

    -- 3. Actualizar la tabla monthly_reports
    INSERT INTO monthly_reports (year, month, total_gastos, total_xpagar)
    VALUES (v_year, v_month, v_total_gastos, v_total_xpagar)
    ON CONFLICT (year, month) 
    DO UPDATE SET 
        total_gastos = EXCLUDED.total_gastos,
        total_xpagar = EXCLUDED.total_xpagar,
        updated_at = NOW();

    RETURN NULL;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: sync_invoice_report (Motor A)
-- Description: Core synchronization function for invoice items to monthly reports.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_invoice_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    IF target_year < 2026 THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;

    -- Calculamos usando 'Paid' que es lo que hay en la BD
    SELECT 
        COALESCE(SUM(total_thb), 0),
        COALESCE(SUM(CASE WHEN status != 'Paid' THEN total_thb ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_thb ELSE 0 END), 0)
    INTO t_total, t_pending, t_cobrado
    FROM invoice_items
    WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    INSERT INTO monthly_reports (year, month, facturado, pendiente, cobrado, updated_at)
    VALUES (target_year, target_month, t_total, t_pending, t_cobrado, NOW())
    ON CONFLICT (year, month) DO UPDATE SET
        facturado = EXCLUDED.facturado,
        pendiente = EXCLUDED.pendiente,
        cobrado = EXCLUDED.cobrado,
        updated_at = NOW();

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: sync_monthly_finances
-- Description: Syncs daily expenses and commissions to monthly_expenses.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_monthly_finances()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    target_date DATE;
    target_year INTEGER;
    target_month INTEGER;
    t_expenses NUMERIC;
    c_paid NUMERIC;
    c_pending NUMERIC;
    s_paid NUMERIC;
    s_pending NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN target_date := OLD.date; ELSE target_date := NEW.date; END IF;
    IF target_date IS NULL THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;

    target_year := EXTRACT(YEAR FROM target_date);
    IF target_year < 2026 THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    target_month := EXTRACT(MONTH FROM target_date);

    -- Recalcular Gastos
    SELECT COALESCE(SUM(amount), 0) INTO t_expenses FROM daily_expenses 
    WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    -- Recalcular Comisiones
    SELECT 
        COALESCE(SUM(CASE WHEN is_comm_paid THEN COALESCE(comm_amount_thb, total_thb * 0.1) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT is_comm_paid THEN COALESCE(comm_amount_thb, total_thb * 0.1) ELSE 0 END), 0)
    INTO c_paid, c_pending
    FROM invoice_items
    WHERE is_comm = true AND EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    -- Recalcular Snorkel
    SELECT 
        COALESCE(SUM(CASE WHEN i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0)
    INTO s_paid, s_pending
    FROM invoice_items i
    LEFT JOIN activities a ON i.activity_id = a.id
    WHERE (a.category = 'Snorkeling' OR a.name ILIKE '%snorkel%')
      AND EXTRACT(YEAR FROM i.date) = target_year AND EXTRACT(MONTH FROM i.date) = target_month;

    -- Upsert
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
-- Function: sync_monthly_report_totals
-- Description: Calculates expected cash for monthly reports.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_monthly_report_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    income_total NUMERIC;
    cash_advances_cr NUMERIC;
    cash_advances_bt NUMERIC;
    total_bote NUMERIC;
    pending_bote NUMERIC;
    calculated_cash NUMERIC;
BEGIN
    -- 1. Calcular ingresos en CASH
    SELECT COALESCE(SUM(total_thb), 0) INTO income_total
    FROM public.invoices
    WHERE EXTRACT(YEAR FROM created_at) = NEW.year 
    AND EXTRACT(MONTH FROM created_at) = NEW.month 
    AND payment_method NOT IN ('Wise', 'EUR', 'Transferencia', 'WISE BT', 'WISE CR', 'EUR BT', 'EUR CR');

    -- 2. Calcular adelantos en CASH (Partners)
    SELECT COALESCE(SUM(amount), 0) INTO cash_advances_cr
    FROM public.partner_advances
    WHERE year = NEW.year AND month = NEW.month AND partner_id = 'CR';

    SELECT COALESCE(SUM(amount), 0) INTO cash_advances_bt
    FROM public.partner_advances
    WHERE year = NEW.year AND month = NEW.month AND partner_id = 'BT';

    -- 3. Calcular Bote
    SELECT COALESCE(apartar_amount, 0) INTO total_bote
    FROM public.bote_monthly
    WHERE year = NEW.year AND month = NEW.month;

    -- Usamos el campo bote_pending que tú editas en el Dashboard
    pending_bote := COALESCE(NEW.bote_pending, total_bote);

    -- 4. EFECTIVO ESPERADO
    calculated_cash := COALESCE(NEW.opening_cash, 0) + income_total + cash_advances_cr + cash_advances_bt - (total_bote - pending_bote);

    -- 5. Actualizar el registro
    NEW.expected_cash := calculated_cash;
    
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------------
-- Function: sync_staff_settlement
-- Description: Complex synchronization for staff commissions, bonuses, and advances.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_staff_settlement()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_staff_id uuid;
    v_year int;
    v_month int;
    v_commissions numeric;
    v_advances numeric;
    v_bonus numeric;
    v_adjustments numeric;
    v_assists_count int;
    v_staff_ids uuid[] := '{}';
    v_years int[] := '{}';
    v_months int[] := '{}';
    i int;
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
        v_staff_id := v_staff_ids[i];
        v_year := v_years[i];
        v_month := v_months[i];

        IF v_staff_id IS NULL OR v_year IS NULL OR v_month IS NULL THEN CONTINUE; END IF;

        -- 3. Calcular
        SELECT COALESCE(SUM(ip.amount_thb * ii.quantity), 0) INTO v_commissions
        FROM public.invoice_items ii
        JOIN public.instructor_payouts ip ON ii.activity_id = ip.activity_id
        WHERE ii.instructor_id = v_staff_id AND EXTRACT(YEAR FROM ii.date) = v_year AND EXTRACT(MONTH FROM ii.date) = v_month;

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

-- ################################################################################
-- [OBSOLETO - ELIMINADO DE LA DB EL 05/05/2026]
-- Function: sync_staff_to_report
-- Razón: Esta función era redundante y usaba una columna inexistente (total_pay).
-- Sustituida por: trg_call_sync_total_gastos() -> sync_total_gastos_to_report()
-- ################################################################################
/*
CREATE OR REPLACE FUNCTION public.sync_staff_to_report()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
...
END;
$function$;
*/

-- ################################################################################
-- [OBSOLETO - ELIMINADO DE LA DB EL 05/05/2026]
-- Function: sync_suppliers_to_report
-- Razón: Esta función era PELIGROSA (Veneno). 
-- Sobrescribía la columna 'total_gastos' usando SOLO los datos de proveedores, 
-- borrando del total los sueldos, el bote y los gastos fijos.
-- Sustituida por: trg_call_sync_total_gastos() -> sync_total_gastos_to_report()
-- ################################################################################
/*
CREATE OR REPLACE FUNCTION public.sync_suppliers_to_report()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
...
END;
$function$;
*/

-- --------------------------------------------------------------------------------
-- Function: sync_total_gastos_to_report
-- Description: Centralized function to calculate total expenses from all sources.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_total_gastos_to_report(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
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
    -- ESCUDO PROTECTOR: No tocar datos anteriores a 2026
    IF p_year < 2026 THEN RETURN; END IF;
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

    -- 5. Gastos Financieros (RESTAURADO)
    SELECT COALESCE(grand_total_expenses, 0) INTO v_gastos_fin 
    FROM monthly_expenses WHERE year = p_year AND month = p_month;

    -- Cálculo del Total Final
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

-- ################################################################################
-- [OBSOLETO - ELIMINADO DE LA DB EL 05/05/2026]
-- Function: trg_call_recalculate
-- Razón: Llamaba a recalculate_monthly_report en cada cambio de factura.
-- Causaba lentitud y bloqueos. Eliminado para favorecer sync_invoice_report.
-- ################################################################################
/*
CREATE OR REPLACE FUNCTION public.trg_call_recalculate()
...
END;
$function$;
*/

-- ################################################################################
-- [OBSOLETO - ELIMINADO DE LA DB EL 05/05/2026]
-- Function: trigger_refresh_monthly_report
-- Razón: Actuaba como puente para la función refresh_monthly_report_totals.
-- Al eliminarse la lógica de agregación antigua, este disparador ya no es necesario.
-- ################################################################################
/*
CREATE OR REPLACE FUNCTION public.trigger_refresh_monthly_report()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
...
END;
$function$;
*/

-- --------------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Description: Standard trigger to auto-update updated_at timestamps.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
