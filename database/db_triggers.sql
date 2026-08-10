-- ################################################################################
-- DATABASE TRIGGERS (Respaldo Literal Supabase Q3 2026)
-- Project: IHASIA ERP
-- Organization: public (API) and logic (Internal)
-- Extraído literalmente vía PostgreSQL pg_get_triggerdef()
-- ################################################################################

-- ================================================================================
-- Table: public.bizums
-- ================================================================================
CREATE TRIGGER trg_bizums_before_save BEFORE INSERT OR UPDATE ON public.bizums FOR EACH ROW EXECUTE FUNCTION fn_trg_bizums_before_save();
CREATE TRIGGER trg_sync_bizum_to_invoice_item AFTER INSERT OR UPDATE ON public.bizums FOR EACH ROW EXECUTE FUNCTION fn_trg_sync_bizum_to_invoice_item();

-- ================================================================================
-- Table: public.bote_expenses
-- ================================================================================
CREATE TRIGGER trg_sync_bote_expenses_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.bote_expenses FOR EACH ROW EXECUTE FUNCTION logic.func_sync_bote_expenses_to_monthly();

-- ================================================================================
-- Table: public.bote_monthly
-- ================================================================================
CREATE TRIGGER trg_calculate_bote_final_balance BEFORE INSERT OR UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.func_calculate_bote_final_balance();
CREATE TRIGGER trg_cascade_bote_initial_balance AFTER UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.func_cascade_bote_initial_balance();
CREATE TRIGGER trg_sync_bote_to_report AFTER INSERT OR DELETE OR UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- ================================================================================
-- Table: public.daily_expenses
-- ================================================================================
CREATE TRIGGER tr_sync_expenses_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();

-- ================================================================================
-- Table: public.fixed_expenses
-- ================================================================================
CREATE TRIGGER trg_sync_fixed_to_report AFTER INSERT OR DELETE OR UPDATE ON public.fixed_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_call_sync_fixed_expenses();

-- ================================================================================
-- Table: public.insurance_batches
-- ================================================================================
CREATE TRIGGER tr_refresh_bote_insurances AFTER INSERT OR DELETE OR UPDATE ON public.insurance_batches FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote_insurances();

-- ================================================================================
-- Table: public.invoice_items
-- ================================================================================
CREATE TRIGGER tr_refresh_bote_items AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote_invoices();
CREATE TRIGGER tr_sync_commissions_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();
CREATE TRIGGER tr_sync_invoice_report AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_invoice_report();
CREATE TRIGGER trg_billing_auto_import_calendar_deposit AFTER INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION fn_trg_billing_auto_import_calendar_deposit();
CREATE TRIGGER trg_sync_invoice_item_bizum BEFORE INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION fn_trg_sync_invoice_item_bizum();
CREATE TRIGGER trg_sync_invoice_to_ssi AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.func_trigger_invoice_to_ssi();
CREATE TRIGGER trg_sync_staff_invoices AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- ================================================================================
-- Table: public.monthly_activity_logs
-- ================================================================================
CREATE TRIGGER trigger_sync_total_courses AFTER INSERT OR DELETE OR UPDATE ON public.monthly_activity_logs FOR EACH ROW EXECUTE FUNCTION logic.sync_total_courses_from_logs();

-- ================================================================================
-- Table: public.monthly_expenses
-- ================================================================================
CREATE TRIGGER trg_sync_monthly_expenses_to_report AFTER INSERT OR DELETE OR UPDATE ON public.monthly_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- ================================================================================
-- Table: public.monthly_reports
-- ================================================================================
CREATE TRIGGER trg_calc_xpagar BEFORE INSERT OR UPDATE ON public.monthly_reports FOR EACH ROW EXECUTE FUNCTION logic.calc_total_xpagar();

-- ================================================================================
-- Table: public.ssi_monthly_breakdown
-- ================================================================================
CREATE TRIGGER trg_fill_ssi_breakdown_unit_cost BEFORE INSERT OR UPDATE ON public.ssi_monthly_breakdown FOR EACH ROW EXECUTE FUNCTION logic.func_fill_ssi_breakdown_unit_cost();
CREATE TRIGGER trigger_update_ssi_total AFTER INSERT OR DELETE OR UPDATE ON public.ssi_monthly_breakdown FOR EACH ROW EXECUTE FUNCTION logic.trigger_update_ssi_total_amount();

-- ================================================================================
-- Table: public.staff_adjustments
-- ================================================================================
CREATE TRIGGER trg_sync_staff_adjustments AFTER INSERT OR DELETE OR UPDATE ON public.staff_adjustments FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- ================================================================================
-- Table: public.staff_advances
-- ================================================================================
CREATE TRIGGER trg_sync_staff_advances AFTER INSERT OR DELETE OR UPDATE ON public.staff_advances FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- ================================================================================
-- Table: public.staff_daily_activity
-- ================================================================================
CREATE TRIGGER trg_sync_staff_activity AFTER INSERT OR DELETE OR UPDATE ON public.staff_daily_activity FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();

-- ================================================================================
-- Table: public.staff_settlements
-- ================================================================================
CREATE TRIGGER trg_sync_staff_to_report AFTER INSERT OR DELETE OR UPDATE ON public.staff_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();

-- ================================================================================
-- Table: public.supplier_settlements
-- ================================================================================
CREATE TRIGGER trg_sync_suppliers_to_report AFTER INSERT OR DELETE OR UPDATE ON public.supplier_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();
