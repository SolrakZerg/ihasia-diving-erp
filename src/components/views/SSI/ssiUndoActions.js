import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para SSI.
 * Permite separar completamente la pila de deshacer de la lógica de negocio y del renderizado UI,
 * garantizando código limpio, modularidad y fácil mantenimiento.
 */

/**
 * Acción para modificar el Ajuste Manual (AJ.) de una actividad de SSI.
 */
export const buildSsiAdjustmentAction = (activityId, activityName, selectedYear, selectedMonth, oldValue, newValue, fetchData) => ({
  view: 'ssi',
  description: {
    undo: `Ajuste de ${activityName} restaurado a ${oldValue}`,
    redo: `Ajuste de ${activityName} cambiado a ${newValue}`
  },
  undo: async () => {
    const { error } = await supabase
      .from('ssi_monthly_breakdown')
      .upsert({
        year: selectedYear,
        month: selectedMonth + 1,
        activity_id: activityId,
        manual_adjustment: oldValue
      }, { onConflict: 'year,month,activity_id' });
    if (error) throw error;
    fetchData(true);
  },
  redo: async () => {
    const { error } = await supabase
      .from('ssi_monthly_breakdown')
      .upsert({
        year: selectedYear,
        month: selectedMonth + 1,
        activity_id: activityId,
        manual_adjustment: newValue
      }, { onConflict: 'year,month,activity_id' });
    if (error) throw error;
    fetchData(true);
  }
});

/**
 * Acción para modificar el Adelanto (PRÓX. MES) de SSI.
 */
export const buildSsiAdelantoAction = (oldValue, newValue, setMesAnterior, saveSettlement, manualPaid) => ({
  view: 'ssi',
  description: {
    undo: `Adelanto (próx. mes) restaurado a ${oldValue.toLocaleString()} ฿`,
    redo: `Adelanto (próx. mes) cambiado a ${newValue.toLocaleString()} ฿`
  },
  undo: async () => {
    setMesAnterior(oldValue);
    await saveSettlement(oldValue, manualPaid);
  },
  redo: async () => {
    setMesAnterior(newValue);
    await saveSettlement(newValue, manualPaid);
  }
});

/**
 * Acción para modificar el monto Pagado de SSI.
 */
export const buildSsiPaidAction = (oldValue, newValue, setManualPaid, saveSettlement, mesAnterior) => ({
  view: 'ssi',
  description: {
    undo: `Pago de SSI restaurado a ${oldValue.toLocaleString()} ฿`,
    redo: `Pago de SSI cambiado a ${newValue.toLocaleString()} ฿`
  },
  undo: async () => {
    setManualPaid(oldValue);
    await saveSettlement(mesAnterior, oldValue);
  },
  redo: async () => {
    setManualPaid(newValue);
    await saveSettlement(mesAnterior, newValue);
  }
});
