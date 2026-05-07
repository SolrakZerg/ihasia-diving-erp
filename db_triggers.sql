-- ################################################################################
-- STEP 2: DATABASE TRIGGERS (Bunker Q1 2026 Edition)
-- Project: IHASIA ERP
-- All triggers updated to call functions in the 'logic' schema.
-- ################################################################################

-- --------------------------------------------------------------------------------
-- Table: bote_monthly
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_bote_to_report ON public.bote_monthly;
CREATE TRIGGER trg_sync_bote_to_report AFTER INSERT OR UPDATE OR DELETE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: daily_expenses
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_sync_expenses_to_monthly ON public.daily_expenses;
CREATE TRIGGER tr_sync_expenses_to_monthly AFTER INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();

-- --------------------------------------------------------------------------------
-- Table: fixed_expenses
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_fixed_to_report ON public.fixed_expenses;
CREATE TRIGGER trg_sync_fixed_to_report AFTER INSERT OR UPDATE OR DELETE ON public.fixed_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_call_sync_fixed_expenses();

-- --------------------------------------------------------------------------------
-- Table: insurance_batches
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_refresh_bote_insurances ON public.insurance_batches;
CREATE TRIGGER tr_refresh_bote_insurances AFTER INSERT OR UPDATE OR DELETE ON public.insurance_batches FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote();

-- --------------------------------------------------------------------------------
-- Table: invoice_items
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_refresh_bote_items ON public.invoice_items;
CREATE TRIGGER tr_refresh_bote_items AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote();

DROP TRIGGER IF EXISTS tr_sync_commissions_to_monthly ON public.invoice_items;
CREATE TRIGGER tr_sync_commissions_to_monthly AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();

DROP TRIGGER IF EXISTS tr_sync_invoice_report ON public.invoice_items;
CREATE TRIGGER tr_sync_invoice_report AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_invoice_report();

DROP TRIGGER IF EXISTS trg_sync_staff_invoices ON public.invoice_items;
CREATE TRIGGER trg_sync_staff_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: monthly_activity_logs
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_sync_total_courses ON public.monthly_activity_logs;
CREATE TRIGGER trigger_sync_total_courses AFTER INSERT OR UPDATE OR DELETE ON public.monthly_activity_logs FOR EACH ROW EXECUTE FUNCTION logic.sync_total_courses_from_logs();

-- --------------------------------------------------------------------------------
-- Table: monthly_expenses
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_monthly_expenses_to_report ON public.monthly_expenses;
CREATE TRIGGER trg_sync_monthly_expenses_to_report AFTER INSERT OR UPDATE OR DELETE ON public.monthly_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: monthly_reports
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_calc_xpagar ON public.monthly_reports;
CREATE TRIGGER trg_calc_xpagar BEFORE INSERT OR UPDATE ON public.monthly_reports FOR EACH ROW EXECUTE FUNCTION logic.calc_total_xpagar();

-- --------------------------------------------------------------------------------
-- Table: staff_adjustments
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_staff_adjustments ON public.staff_adjustments;
CREATE TRIGGER trg_sync_staff_adjustments AFTER INSERT OR UPDATE OR DELETE ON public.staff_adjustments FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_advances
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_staff_advances ON public.staff_advances;
CREATE TRIGGER trg_sync_staff_advances AFTER INSERT OR UPDATE OR DELETE ON public.staff_advances FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_daily_activity
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_staff_activity ON public.staff_daily_activity;
CREATE TRIGGER trg_sync_staff_activity AFTER INSERT OR UPDATE OR DELETE ON public.staff_daily_activity FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_settlements
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_staff_to_report ON public.staff_settlements;
CREATE TRIGGER trg_sync_staff_to_report AFTER INSERT OR UPDATE OR DELETE ON public.staff_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: supplier_settlements
-- --------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_sync_suppliers_to_report ON public.supplier_settlements;
CREATE TRIGGER trg_sync_suppliers_to_report AFTER INSERT OR UPDATE OR DELETE ON public.supplier_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();
