-- ################################################################################
-- STEP 2: DATABASE TRIGGERS BACKUP
-- Project: IHASIA ERP
-- Generated: 2026-05-05
-- ################################################################################

-- --------------------------------------------------------------------------------
-- Table: bote_expenses
-- --------------------------------------------------------------------------------


-- --------------------------------------------------------------------------------
-- Table: bote_monthly
-- --------------------------------------------------------------------------------
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_bote AFTER INSERT OR UPDATE OR DELETE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();
CREATE TRIGGER trg_sync_bote_to_report AFTER INSERT OR UPDATE OR DELETE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: commissions
-- --------------------------------------------------------------------------------
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_commissions AFTER INSERT OR UPDATE OR DELETE ON public.commissions FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();

-- --------------------------------------------------------------------------------
-- Table: daily_expenses
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_sync_expenses_to_monthly AFTER INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION sync_monthly_finances();
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_daily_expenses AFTER INSERT OR UPDATE OR DELETE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();

-- --------------------------------------------------------------------------------
-- Table: fixed_expenses
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_fixed_to_report AFTER INSERT OR UPDATE OR DELETE ON public.fixed_expenses FOR EACH ROW EXECUTE FUNCTION trg_call_sync_fixed_expenses();

-- --------------------------------------------------------------------------------
-- Table: insurance_batches
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_refresh_bote_insurances AFTER INSERT OR UPDATE OR DELETE ON public.insurance_batches FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_bote();

-- --------------------------------------------------------------------------------
-- Table: invoice_items
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_refresh_bote_items AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_bote();
CREATE TRIGGER tr_sync_commissions_to_monthly AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION sync_monthly_finances();
CREATE TRIGGER tr_sync_invoice_report AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION sync_invoice_report();
CREATE TRIGGER trg_sync_staff_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: monthly_expenses
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_monthly_expenses_to_report AFTER INSERT OR UPDATE OR DELETE ON public.monthly_expenses FOR EACH ROW EXECUTE FUNCTION trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: monthly_reports
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_calc_xpagar BEFORE INSERT OR UPDATE ON public.monthly_reports FOR EACH ROW EXECUTE FUNCTION calc_total_xpagar();

-- --------------------------------------------------------------------------------
-- Table: partner_settlements
-- --------------------------------------------------------------------------------
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_partners AFTER INSERT OR UPDATE OR DELETE ON public.partner_settlements FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();

-- --------------------------------------------------------------------------------
-- Table: staff_adjustments
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_adjustments AFTER INSERT OR UPDATE OR DELETE ON public.staff_adjustments FOR EACH ROW EXECUTE FUNCTION sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_advances
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_advances AFTER INSERT OR UPDATE OR DELETE ON public.staff_advances FOR EACH ROW EXECUTE FUNCTION sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_daily_activity
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_activity AFTER INSERT OR UPDATE OR DELETE ON public.staff_daily_activity FOR EACH ROW EXECUTE FUNCTION sync_staff_settlement();

-- --------------------------------------------------------------------------------
-- Table: staff_settlements
-- --------------------------------------------------------------------------------
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_staff AFTER INSERT OR UPDATE OR DELETE ON public.staff_settlements FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();
CREATE TRIGGER trg_sync_staff_to_report AFTER INSERT OR UPDATE OR DELETE ON public.staff_settlements FOR EACH ROW EXECUTE FUNCTION trg_sync_total_gastos_to_report();

-- --------------------------------------------------------------------------------
-- Table: supplier_settlements
-- --------------------------------------------------------------------------------
-- [ELIMINADO 05/05/2026] -- CREATE TRIGGER trg_refresh_suppliers AFTER INSERT OR UPDATE OR DELETE ON public.supplier_settlements FOR EACH ROW EXECUTE FUNCTION trigger_refresh_monthly_report();
CREATE TRIGGER trg_sync_suppliers_to_report AFTER INSERT OR UPDATE OR DELETE ON public.supplier_settlements FOR EACH ROW EXECUTE FUNCTION trg_sync_total_gastos_to_report();
