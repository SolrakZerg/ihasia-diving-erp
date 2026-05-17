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
    undo: `Deshecho: Eliminación de ${ids.length} registros restaurados`,
    redo: `Rehecho: ${ids.length} registros eliminados`
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
    undo: `Deshecho: Factura de ${customerName} restaurada`,
    redo: `Rehecho: Factura de ${customerName} eliminada`
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
    undo: `Deshecho: Eliminación de registro de ${customerName} restaurado`,
    redo: `Rehecho: Registro de ${customerName} eliminado`
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
    undo: `Deshecho: Nuevo registro para ${customerName} eliminado`,
    redo: `Rehecho: Nuevo registro para ${customerName} restaurado`
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
