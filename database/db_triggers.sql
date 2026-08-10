-- ################################################################################
-- DATABASE TRIGGERS (Respaldo Literal Documentado Supabase Q3 2026)
-- Project: IHASIA ERP
-- Organization: public (API) and logic (Internal)
-- Extraído literalmente vía PostgreSQL pg_get_triggerdef()
-- ################################################################################

-- ================================================================================
-- Tabla: public.bizums
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_bizums_before_save
-- Evento: BEFORE INSERT OR UPDATE ON public.bizums
-- Función: public.fn_trg_bizums_before_save()
-- Propósito: Autocalcula el indicador boolean `has_retention` si la reserva está retenida o devuelta parcialmente.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_bizums_before_save BEFORE INSERT OR UPDATE ON public.bizums FOR EACH ROW EXECUTE FUNCTION fn_trg_bizums_before_save();

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_bizum_to_invoice_item
-- Evento: AFTER INSERT OR UPDATE ON public.bizums
-- Función: public.fn_trg_sync_bizum_to_invoice_item()
-- Propósito: Propaga en tiempo real los cambios de estado en Bizum (pagado/devuelto/retenido) hacia las facturas.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_bizum_to_invoice_item AFTER INSERT OR UPDATE ON public.bizums FOR EACH ROW EXECUTE FUNCTION fn_trg_sync_bizum_to_invoice_item();


-- ================================================================================
-- Tabla: public.bote_expenses
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_bote_expenses_to_monthly
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.bote_expenses
-- Función: logic.func_sync_bote_expenses_to_monthly()
-- Propósito: Suma los gastos diarios del bote y actualiza `bote_monthly.expenses_total`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_bote_expenses_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.bote_expenses FOR EACH ROW EXECUTE FUNCTION logic.func_sync_bote_expenses_to_monthly();


-- ================================================================================
-- Tabla: public.bote_monthly
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_calculate_bote_final_balance
-- Evento: BEFORE INSERT OR UPDATE ON public.bote_monthly
-- Función: logic.func_calculate_bote_final_balance()
-- Propósito: Autocalcula el saldo final del bote: final_balance = inicial + apartar - pendiente - gastos.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_calculate_bote_final_balance BEFORE INSERT OR UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.func_calculate_bote_final_balance();

-- --------------------------------------------------------------------------------
-- Trigger: trg_cascade_bote_initial_balance
-- Evento: AFTER UPDATE ON public.bote_monthly
-- Función: logic.func_cascade_bote_initial_balance()
-- Propósito: Transfiere en cascada el `final_balance` del mes como `initial_balance` del mes siguiente.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_cascade_bote_initial_balance AFTER UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.func_cascade_bote_initial_balance();

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_bote_to_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.bote_monthly
-- Función: logic.trg_sync_total_gastos_to_report()
-- Propósito: Sincroniza la cantidad a apartar para el bote en `monthly_reports.total_gastos`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_bote_to_report AFTER INSERT OR DELETE OR UPDATE ON public.bote_monthly FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();


-- ================================================================================
-- Tabla: public.daily_expenses
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: tr_sync_expenses_to_monthly
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.daily_expenses
-- Función: logic.sync_monthly_finances()
-- Propósito: Recalcula la suma de gastos diarios y los sincroniza en `monthly_expenses.total_expenses`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_sync_expenses_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.daily_expenses FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();


-- ================================================================================
-- Tabla: public.fixed_expenses
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_fixed_to_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.fixed_expenses
-- Función: logic.trg_call_sync_fixed_expenses()
-- Propósito: Re-dispara el acumulado de gastos fijos en `monthly_reports.total_gastos` tras cambios en la configuración.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_fixed_to_report AFTER INSERT OR DELETE OR UPDATE ON public.fixed_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_call_sync_fixed_expenses();


-- ================================================================================
-- Tabla: public.insurance_batches
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: tr_refresh_bote_insurances
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.insurance_batches
-- Función: logic.trigger_recalculate_bote_insurances()
-- Propósito: Recalcula el importe de fondos a apartar para el bote según los seguros emitidos (75 THB/seguro).
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_refresh_bote_insurances AFTER INSERT OR DELETE OR UPDATE ON public.insurance_batches FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote_insurances();


-- ================================================================================
-- Tabla: public.invoice_items
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: tr_refresh_bote_items
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items
-- Función: logic.trigger_recalculate_bote_invoices()
-- Propósito: Recalcula el bote mensual por camisetas incluidas en las partidas de factura de cursos.
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_refresh_bote_items AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.trigger_recalculate_bote_invoices();

-- --------------------------------------------------------------------------------
-- Trigger: tr_sync_commissions_to_monthly
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items
-- Función: logic.sync_monthly_finances()
-- Propósito: Recalcula comisiones de promotores y gastos de alquiler de snorkel en `monthly_expenses`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_sync_commissions_to_monthly AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_monthly_finances();

-- --------------------------------------------------------------------------------
-- Trigger: tr_sync_invoice_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items
-- Función: logic.sync_invoice_report()
-- Propósito: Sincroniza facturado, pendiente y cobrado en `monthly_reports`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER tr_sync_invoice_report AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_invoice_report();

-- --------------------------------------------------------------------------------
-- Trigger: trg_billing_auto_import_calendar_deposit
-- Evento: AFTER INSERT OR UPDATE ON public.invoice_items
-- Función: public.fn_trg_billing_auto_import_calendar_deposit()
-- Propósito: Auto-importa depósitos Wise desde Google Calendar al asignar cliente a una factura.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_billing_auto_import_calendar_deposit AFTER INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION fn_trg_billing_auto_import_calendar_deposit();

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_invoice_item_bizum
-- Evento: BEFORE INSERT OR UPDATE ON public.invoice_items
-- Función: public.fn_trg_sync_invoice_item_bizum()
-- Propósito: Busca y asigna depósitos de Bizum en euros al asociar cliente a la partida de factura.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_invoice_item_bizum BEFORE INSERT OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION fn_trg_sync_invoice_item_bizum();

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_invoice_to_ssi
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items
-- Función: logic.func_trigger_invoice_to_ssi()
-- Propósito: Sincroniza los conteos de cursos SSI vendidos con `ssi_monthly_breakdown`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_invoice_to_ssi AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.func_trigger_invoice_to_ssi();

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_staff_invoices
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items
-- Función: logic.sync_staff_settlement()
-- Propósito: Sincroniza las comisiones por curso del instructor en `staff_settlements`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_invoices AFTER INSERT OR DELETE OR UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();


-- ================================================================================
-- Tabla: public.monthly_activity_logs
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trigger_sync_total_courses
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.monthly_activity_logs
-- Función: logic.sync_total_courses_from_logs()
-- Propósito: Suma cursos de la columna widget 1 y los sincroniza en `monthly_reports.total_courses`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trigger_sync_total_courses AFTER INSERT OR DELETE OR UPDATE ON public.monthly_activity_logs FOR EACH ROW EXECUTE FUNCTION logic.sync_total_courses_from_logs();


-- ================================================================================
-- Tabla: public.monthly_expenses
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_monthly_expenses_to_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.monthly_expenses
-- Función: logic.trg_sync_total_gastos_to_report()
-- Propósito: Sincroniza gastos financieros en `monthly_reports.total_gastos`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_monthly_expenses_to_report AFTER INSERT OR DELETE OR UPDATE ON public.monthly_expenses FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();


-- ================================================================================
-- Tabla: public.monthly_reports
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_calc_xpagar
-- Evento: BEFORE INSERT OR UPDATE ON public.monthly_reports
-- Función: logic.calc_total_xpagar()
-- Propósito: Autocalcula el pasivo total `total_xpagar` sumando todos los compromisos financieros.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_calc_xpagar BEFORE INSERT OR UPDATE ON public.monthly_reports FOR EACH ROW EXECUTE FUNCTION logic.calc_total_xpagar();


-- ================================================================================
-- Tabla: public.ssi_monthly_breakdown
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_fill_ssi_breakdown_unit_cost
-- Evento: BEFORE INSERT OR UPDATE ON public.ssi_monthly_breakdown
-- Función: logic.func_fill_ssi_breakdown_unit_cost()
-- Propósito: Completa el unit_cost de SSI automáticamente desde la tabla `activities`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_fill_ssi_breakdown_unit_cost BEFORE INSERT OR UPDATE ON public.ssi_monthly_breakdown FOR EACH ROW EXECUTE FUNCTION logic.func_fill_ssi_breakdown_unit_cost();

-- --------------------------------------------------------------------------------
-- Trigger: trigger_update_ssi_total
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.ssi_monthly_breakdown
-- Función: logic.trigger_update_ssi_total_amount()
-- Propósito: Recalcula la factura total de SSI en `supplier_settlements`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trigger_update_ssi_total AFTER INSERT OR DELETE OR UPDATE ON public.ssi_monthly_breakdown FOR EACH ROW EXECUTE FUNCTION logic.trigger_update_ssi_total_amount();


-- ================================================================================
-- Tabla: public.staff_adjustments
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_staff_adjustments
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.staff_adjustments
-- Función: logic.sync_staff_settlement()
-- Propósito: Recalcula ajustes en la nómina del instructor en `staff_settlements`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_adjustments AFTER INSERT OR DELETE OR UPDATE ON public.staff_adjustments FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();


-- ================================================================================
-- Tabla: public.staff_advances
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_staff_advances
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.staff_advances
-- Función: logic.sync_staff_settlement()
-- Propósito: Sincroniza adelantos de sueldo a la liquidación del instructor en `staff_settlements`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_advances AFTER INSERT OR DELETE OR UPDATE ON public.staff_advances FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();


-- ================================================================================
-- Tabla: public.staff_daily_activity
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_staff_activity
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.staff_daily_activity
-- Función: logic.sync_staff_settlement()
-- Propósito: Sincroniza asistencias/guardias de barco a la nómina en `staff_settlements`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_activity AFTER INSERT OR DELETE OR UPDATE ON public.staff_daily_activity FOR EACH ROW EXECUTE FUNCTION logic.sync_staff_settlement();


-- ================================================================================
-- Tabla: public.staff_settlements
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_staff_to_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.staff_settlements
-- Función: logic.trg_sync_total_gastos_to_report()
-- Propósito: Sincroniza sueldos totales y pendientes en `monthly_reports.total_gastos`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_staff_to_report AFTER INSERT OR DELETE OR UPDATE ON public.staff_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();


-- ================================================================================
-- Tabla: public.supplier_settlements
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Trigger: trg_sync_suppliers_to_report
-- Evento: AFTER INSERT OR DELETE OR UPDATE ON public.supplier_settlements
-- Función: logic.trg_sync_total_gastos_to_report()
-- Propósito: Sincroniza facturas de proveedores pagadas en `monthly_reports.total_gastos`.
-- --------------------------------------------------------------------------------
CREATE TRIGGER trg_sync_suppliers_to_report AFTER INSERT OR DELETE OR UPDATE ON public.supplier_settlements FOR EACH ROW EXECUTE FUNCTION logic.trg_sync_total_gastos_to_report();
