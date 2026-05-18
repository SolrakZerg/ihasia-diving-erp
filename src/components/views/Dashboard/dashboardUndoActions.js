import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones (Action Builders) para Deshacer/Rehacer (Undo/Redo) en el Dashboard.
 * Centraliza la lógica de reversión de estados financieros del Dashboard para mantener
 * los componentes y ganchos de lógica de negocio desacoplados y limpios.
 */

/**
 * Acción para modificar la Caja Inicial (Mes Anterior) en monthly_reports.
 */
export const buildDashboardOpeningCashAction = (year, month, oldVal, newVal, fetchDashboardData) => {
  const oldNum = oldVal === '' ? 0 : Number(oldVal);
  const newNum = newVal === '' ? 0 : Number(newVal);

  return {
    view: 'dashboard',
    description: {
      undo: `Deshecho: Caja Inicial cambiada de ${newNum.toLocaleString()} a ${oldNum.toLocaleString()}`,
      redo: `Rehecho: Caja Inicial cambiada de ${oldNum.toLocaleString()} a ${newNum.toLocaleString()}`
    },
    undo: async () => {
      const { error } = await supabase.from('monthly_reports').upsert({
        year,
        month,
        mes_anterior: oldNum,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month' });

      if (error) throw error;
      await fetchDashboardData();
    },
    redo: async () => {
      const { error } = await supabase.from('monthly_reports').upsert({
        year,
        month,
        mes_anterior: newNum,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month' });

      if (error) throw error;
      await fetchDashboardData();
    }
  };
};

/**
 * Acción para modificar los montos Pendientes por Pagar (Bote, Office, Infinity, P AE, Poli Migra).
 */
export const buildDashboardPendingAction = (year, month, col, name, oldVal, newVal, fetchDashboardData) => {
  const oldNum = oldVal === '' || oldVal === null || oldVal === undefined ? null : Number(oldVal);
  const newNum = newVal === '' || newVal === null || newVal === undefined ? null : Number(newVal);

  const formatValue = (v) => {
    if (v === '' || v === null || v === undefined) return 'No pendiente';
    const n = Number(v);
    return isNaN(n) ? v : n.toLocaleString();
  };

  return {
    view: 'dashboard',
    description: {
      undo: `Deshecho: Pendiente de ${name} cambiado de ${formatValue(newVal)} a ${formatValue(oldVal)}`,
      redo: `Rehecho: Pendiente de ${name} cambiado de ${formatValue(oldVal)} a ${formatValue(newVal)}`
    },
    undo: async () => {
      const { error: rErr } = await supabase.from('monthly_reports').upsert({
        year,
        month,
        [col]: oldNum,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month' });

      if (rErr) throw rErr;

      if (col === 'bote_xpagar') {
        const { error: bErr } = await supabase.from('bote_monthly').upsert({
          year,
          month,
          pending_amount: oldNum,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' });
        if (bErr) throw bErr;
      }

      await fetchDashboardData();
    },
    redo: async () => {
      const { error: rErr } = await supabase.from('monthly_reports').upsert({
        year,
        month,
        [col]: newNum,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month' });

      if (rErr) throw rErr;

      if (col === 'bote_xpagar') {
        const { error: bErr } = await supabase.from('bote_monthly').upsert({
          year,
          month,
          pending_amount: newNum,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' });
        if (bErr) throw bErr;
      }

      await fetchDashboardData();
    }
  };
};
