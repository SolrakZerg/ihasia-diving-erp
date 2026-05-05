-- DATABASE SCHEMA BACKUP - IHASIA ERP
-- Generated: 2026-05-04
-- This file contains the complete definition of Tables, Functions, and Triggers.
-- Use this to restore the DB logic if it gets corrupted.

-------------------------------------------------------
-- 1. FUNCTIONS
-------------------------------------------------------

-- Recalculate Monthly Report (Motor B - Fixed version)
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
    -- FIXED: Using 'Paid' status and SUM from invoices based on created_at
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

-- Sync Invoice Report (Motor A - Fixed version)
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

    -- FIXED: Using 'Paid' status (real DB value)
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

-- Sync Monthly Finances (Commissions & Expenses)
CREATE OR REPLACE FUNCTION public.sync_monthly_finances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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

    -- Upsert monthly_expenses
    INSERT INTO monthly_expenses (year, month, total_expenses, comm_paid, comm_pending, updated_at)
    VALUES (target_year, target_month, t_expenses, c_paid, c_pending, NOW())
    ON CONFLICT (year, month) DO UPDATE SET
        total_expenses = EXCLUDED.total_expenses,
        comm_paid = EXCLUDED.comm_paid,
        comm_pending = EXCLUDED.comm_pending,
        updated_at = NOW();

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-------------------------------------------------------
-- 2. TRIGGERS
-------------------------------------------------------

-- Triggers on invoice_items
-- tr_sync_invoice_report: Updates monthly_reports (Facturado/Cobrado)
-- tr_sync_finances: Updates monthly_expenses (Commissions)
CREATE TRIGGER tr_sync_invoice_report AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION sync_invoice_report();
CREATE TRIGGER tr_sync_finances AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION sync_monthly_finances();

-- Trigger on daily_expenses
CREATE TRIGGER tr_sync_expenses AFTER INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION sync_monthly_finances();

-------------------------------------------------------
-- 3. TABLES STRUCTURE (Columns)
-------------------------------------------------------
-- Table: monthly_reports
-- Columns: year (int), month (int), facturado (numeric), cobrado (numeric), pendiente (numeric), total_gastos (numeric), total_xpagar (numeric), total_pagado (numeric), etc.

-- Table: invoice_items
-- Columns: id (uuid), invoice_id (uuid), customer_id (uuid), activity_id (uuid), date (date), total_thb (numeric), status (text), is_comm (boolean), is_comm_paid (boolean), etc.

-- Table: invoices
-- Columns: id (uuid), total_thb (numeric), status (text), created_at (timestamp), etc.
