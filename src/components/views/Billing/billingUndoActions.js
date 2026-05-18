import { supabase } from '../../../lib/supabaseClient';
import { recalculateCarabaoSettlement } from '../../../lib/carabaoSettlement';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para Facturación (Billing).
 * Permite separar completamente la pila de deshacer de la lógica de negocio y del renderizado UI,
 * garantizando código limpio y fácil de mantener.
 */

/**
 * Acción para eliminación masiva de múltiples registros de invoice_items.
 */
export const buildDeleteItemsAction = (ids, itemsToDelete, emptyInvoiceIds, invoicesToBackup, fetchData) => ({
  view: 'billing',
  description: {
    undo: `Eliminación de ${ids.length} registros restaurados`,
    redo: `${ids.length} registros eliminados`
  },
  undo: async () => {
    if (invoicesToBackup.length > 0) {
      const { error: invErr } = await supabase.from('invoices').insert(invoicesToBackup);
      if (invErr) throw invErr;
    }
    if (itemsToDelete.length > 0) {
      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToDelete);
      if (itemErr) throw itemErr;
    }
    fetchData(false);
  },
  redo: async () => {
    const { error: delErr } = await supabase.from('invoice_items').delete().in('id', ids);
    if (delErr) throw delErr;

    for (const invId of emptyInvoiceIds) {
      await supabase.from('invoices').delete().eq('id', invId);
    }
    fetchData(false);
  }
});

/**
 * Acción para eliminación de una factura completa con todos sus registros asociados.
 */
export const buildDeleteInvoiceAction = (invoiceId, customerName, invoiceBackup, itemsBackup, fetchData) => ({
  view: 'billing',
  description: {
    undo: `Factura de ${customerName} restaurada`,
    redo: `Factura de ${customerName} eliminada`
  },
  undo: async () => {
    const { error: invErr } = await supabase.from('invoices').insert(invoiceBackup);
    if (invErr) throw invErr;

    if (itemsBackup.length > 0) {
      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsBackup);
      if (itemErr) throw itemErr;
    }
    fetchData(false);
  },
  redo: async () => {
    const { error: delErr } = await supabase.from('invoices').delete().eq('id', invoiceId);
    if (delErr) throw delErr;
    fetchData(false);
  }
});

/**
 * Acción para eliminación de una fila/registro individual dentro de la cuadrícula de Billing.
 */
export const buildDeleteItemRowAction = (itemId, invoiceId, isLastItem, cleanItem, invoiceData, targetDateStr, customerName, onUpdate) => ({
  view: 'billing',
  description: {
    undo: `Registro de ${customerName} restaurado`,
    redo: `Registro de ${customerName} eliminado`
  },
  undo: async () => {
    if (isLastItem && invoiceData) {
      const { error: invErr } = await supabase.from('invoices').insert(invoiceData);
      if (invErr) throw invErr;
    }
    const { error: itemErr } = await supabase.from('invoice_items').insert(cleanItem);
    if (itemErr) throw itemErr;

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  },
  redo: async () => {
    if (isLastItem) {
      const { error: delErr } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (delErr) throw delErr;
    } else {
      const { error: delErr } = await supabase.from('invoice_items').delete().eq('id', itemId);
      if (delErr) throw delErr;
    }

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  }
});

/**
 * Acción para inserción de un sub-registro en blanco.
 */
export const buildAddChildItemAction = (itemId, data, targetDateStr, customerName, onUpdate) => ({
  view: 'billing',
  description: {
    undo: `Nuevo registro para ${customerName} eliminado`,
    redo: `Nuevo registro para ${customerName} restaurado`
  },
  undo: async () => {
    const { error: delErr } = await supabase.from('invoice_items').delete().eq('id', itemId);
    if (delErr) throw delErr;

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  },
  redo: async () => {
    const { error: insErr } = await supabase.from('invoice_items').insert(data);
    if (insErr) throw insErr;

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  }
});

/**
 * Acción para actualización en línea de cualquier campo en la cuadrícula de Billing.
 */
export const buildItemUpdateAction = (itemId, updates, oldValues, targetDateStr, actionDesc, onUpdate) => ({
  view: 'billing',
  description: actionDesc,
  undo: async () => {
    const { error: undoErr } = await supabase.from('invoice_items').update(oldValues).eq('id', itemId);
    if (undoErr) throw undoErr;

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  },
  redo: async () => {
    const { error: redoErr } = await supabase.from('invoice_items').update(updates).eq('id', itemId);
    if (redoErr) throw redoErr;

    if (targetDateStr) {
      const dObj = new Date(targetDateStr);
      if (!isNaN(dObj.getTime())) {
        recalculateCarabaoSettlement(dObj.getMonth() + 1, dObj.getFullYear());
      }
    }
    if (onUpdate) onUpdate();
  }
});

/**
 * Acción para modificar los billetes del Control de Caja (Caja) en Facturas.
 * Centraliza la actualización de cash_control_monthly y monthly_reports.
 */
export const buildBillingCashControlAction = ({
  selectedYear,
  selectedMonth,
  label,
  oldVal,
  newVal,
  oldBills,
  newBills,
  oldTotal,
  newTotal,
  setters: {
    setBills50000,
    setBills1000,
    setBills500,
    setBills100,
    setBills50,
    setBills20,
  }
}) => {
  const formattedOldVal = oldVal === '' || oldVal === null || oldVal === undefined ? 0 : Number(oldVal);
  const formattedNewVal = newVal === '' || newVal === null || newVal === undefined ? 0 : Number(newVal);

  return {
    view: 'billing',
    description: {
      undo: `Billetes de ${label} ฿ restaurados de ${formattedNewVal} a ${formattedOldVal} (Caja: ${oldTotal.toLocaleString()} ฿)`,
      redo: `Billetes de ${label} ฿ cambiados de ${formattedOldVal} a ${formattedNewVal} (Caja: ${newTotal.toLocaleString()} ฿)`
    },
  undo: async () => {
    const { error: err1 } = await supabase.from('cash_control_monthly').upsert({
      year: selectedYear,
      month: selectedMonth + 1,
      b_50000: oldBills['50.000'],
      b_1000: oldBills['1.000'],
      b_500: oldBills['500'],
      b_100: oldBills['100'],
      b_50: oldBills['50'],
      b_20: oldBills['20']
    }, { onConflict: 'year, month' });
    if (err1) throw err1;

    const { error: err2 } = await supabase.from('monthly_reports').upsert({
      year: selectedYear,
      month: selectedMonth + 1,
      cash: oldTotal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'year, month' });
    if (err2) throw err2;

    setBills50000(oldBills['50.000']);
    setBills1000(oldBills['1.000']);
    setBills500(oldBills['500']);
    setBills100(oldBills['100']);
    setBills50(oldBills['50']);
    setBills20(oldBills['20']);
  },
  redo: async () => {
    const { error: err1 } = await supabase.from('cash_control_monthly').upsert({
      year: selectedYear,
      month: selectedMonth + 1,
      b_50000: newBills['50.000'],
      b_1000: newBills['1.000'],
      b_500: newBills['500'],
      b_100: newBills['100'],
      b_50: newBills['50'],
      b_20: newBills['20']
    }, { onConflict: 'year, month' });
    if (err1) throw err1;

    const { error: err2 } = await supabase.from('monthly_reports').upsert({
      year: selectedYear,
      month: selectedMonth + 1,
      cash: newTotal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'year, month' });
    if (err2) throw err2;

    setBills50000(newBills['50.000']);
    setBills1000(newBills['1.000']);
    setBills500(newBills['500']);
    setBills100(newBills['100']);
    setBills50(newBills['50']);
    setBills20(newBills['20']);
  }
};
};

