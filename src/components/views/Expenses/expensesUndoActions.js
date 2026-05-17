import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para Gastos y Comisiones.
 * Permite separar completamente la pila de deshacer de la lógica de negocio de la UI,
 * evitando archivos monolíticos y mejorando la mantenibilidad.
 */

// Helper interno para buscar el nombre del receptor por su ID
const getRecipientName = (id, options) => {
  const opt = options?.find(o => o.id === id);
  return opt ? opt.name : 'Sin asignar';
};

/**
 * Acción para actualizar comisiones o tours de oxígeno (invoice_items).
 */
export const buildUpdateItemAction = (itemId, field, value, oldValue, item, recipientOptions, fetchData) => {
  const desc = {
    undo: `Deshecho: Modificación restaurada en Comisiones/Oxígeno`,
    redo: `Rehecho: Modificación aplicada en Comisiones/Oxígeno`
  };
  
  const clientName = `${item?.customers?.first_name || ''} ${item?.customers?.last_name || ''}`.trim() || 'Cliente';
  const activityName = `${item?.activities?.name || ''}`.trim() || 'Actividad';

  if (field === 'comm_recipient_id') {
    const oldName = getRecipientName(oldValue, recipientOptions);
    const newName = getRecipientName(value, recipientOptions);
    desc.undo = `Deshecho: Receptor de comisión de ${clientName} (${activityName}) restaurado a ${oldName} (era ${newName})`;
    desc.redo = `Rehecho: Receptor de comisión de ${clientName} (${activityName}) cambiado a ${newName}`;
  } else if (field === 'is_comm_paid') {
    const oldLabel = oldValue ? 'PAGADO' : 'PENDIENTE';
    const newLabel = value ? 'PAGADO' : 'PENDIENTE';
    desc.undo = `Deshecho: Estado de comisión de ${clientName} (${activityName}) restaurado a ${oldLabel}`;
    desc.redo = `Rehecho: Estado de comisión de ${clientName} (${activityName}) cambiado a ${newLabel}`;
  } else if (field === 'comm_amount_thb') {
    desc.undo = `Deshecho: Comisión de ${clientName} (${activityName}) restaurada a ${oldValue || 0} ฿ (era ${value || 0} ฿)`;
    desc.redo = `Rehecho: Comisión de ${clientName} (${activityName}) cambiada a ${value || 0} ฿`;
  } else if (field === 'is_prov_paid') {
    const oldLabel = oldValue ? 'PAGADO' : 'PENDIENTE';
    const newLabel = value ? 'PAGADO' : 'PENDIENTE';
    desc.undo = `Deshecho: Pago a proveedor snorkel de ${clientName} restaurado a ${oldLabel}`;
    desc.redo = `Rehecho: Pago a proveedor snorkel de ${clientName} cambiado a ${newLabel}`;
  } else if (field === 'quantity') {
    desc.undo = `Deshecho: Plazas de snorkel de ${clientName} restauradas a ${oldValue} (eran ${value})`;
    desc.redo = `Rehecho: Plazas de snorkel de ${clientName} actualizadas a ${value}`;
  }

  return {
    view: 'expenses',
    description: desc,
    undo: async () => {
      const { error } = await supabase.from('invoice_items').update({ [field]: oldValue }).eq('id', itemId);
      if (error) throw error;
      fetchData(false);
    },
    redo: async () => {
      const { error } = await supabase.from('invoice_items').update({ [field]: value }).eq('id', itemId);
      if (error) throw error;
      fetchData(false);
    }
  };
};

/**
 * Acción para actualizar cualquier campo de un Gasto Diario (daily_expenses).
 */
export const buildExpenseUpdateAction = (id, field, value, oldValue, expenseDescription, fetchData) => {
  const desc = {
    undo: `Deshecho: Campo '${field}' restaurado a '${oldValue || ''}' (era '${value || ''}') en Gasto '${expenseDescription}'`,
    redo: `Rehecho: Campo '${field}' cambiado a '${value || ''}' (era '${oldValue || ''}') en Gasto '${expenseDescription}'`
  };

  return {
    view: 'expenses',
    description: desc,
    undo: async () => {
      const { error } = await supabase.from('daily_expenses').update({ [field]: oldValue }).eq('id', id);
      if (error) throw error;
      fetchData(false);
    },
    redo: async () => {
      const { error } = await supabase.from('daily_expenses').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      fetchData(false);
    }
  };
};

/**
 * Acción para añadir un nuevo Gasto Diario.
 */
export const buildAddExpenseAction = (newExpense, fetchData) => ({
  view: 'expenses',
  description: {
    undo: `Deshecho: Gasto '${newExpense.description}' de ${newExpense.amount} ฿ eliminado`,
    redo: `Rehecho: Gasto '${newExpense.description}' de ${newExpense.amount} ฿ vuelto a crear`
  },
  undo: async () => {
    const { error } = await supabase.from('daily_expenses').delete().eq('id', newExpense.id);
    if (error) throw error;
    fetchData(false);
  },
  redo: async () => {
    const { error } = await supabase.from('daily_expenses').insert(newExpense);
    if (error) throw error;
    fetchData(false);
  }
});

/**
 * Acción para eliminar un Gasto Diario.
 */
export const buildRemoveExpenseAction = (expenseItem, fetchData) => ({
  view: 'expenses',
  description: {
    undo: `Deshecho: Gasto '${expenseItem.description}' de ${expenseItem.amount} ฿ restaurado`,
    redo: `Rehecho: Gasto '${expenseItem.description}' de ${expenseItem.amount} ฿ eliminado`
  },
  undo: async () => {
    const { error } = await supabase.from('daily_expenses').insert(expenseItem);
    if (error) throw error;
    fetchData(false);
  },
  redo: async () => {
    const { error } = await supabase.from('daily_expenses').delete().eq('id', expenseItem.id);
    if (error) throw error;
    fetchData(false);
  }
});
