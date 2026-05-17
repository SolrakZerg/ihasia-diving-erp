import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para Nóminas.
 * Permite separar completamente la pila de deshacer de la lógica de negocio de la UI,
 * evitando archivos monolíticos y mejorando la mantenibilidad.
 */

/**
 * Acción para cambiar las asistencias manuales de un día.
 */
export const buildAssChangeAction = (day, value, oldAss, handleAssChange, fetchData) => ({
  view: 'nominas',
  description: {
    undo: `Deshecho: Asistencias del día ${day} restauradas a ${oldAss || 0}`,
    redo: `Rehecho: Asistencias del día ${day} cambiadas a ${value || 0}`
  },
  undo: async () => {
    await handleAssChange(day, oldAss, true);
    fetchData();
  },
  redo: async () => {
    await handleAssChange(day, value, true);
    fetchData();
  }
});

/**
 * Acción para alternar el estado de asistencia diaria (AUTO, OFF, HALF, WORK).
 */
export const buildAttendanceToggleAction = (day, next, current, handleAttendanceToggle, fetchData) => ({
  view: 'nominas',
  description: {
    undo: `Deshecho: Asistencia del día ${day} restaurada a ${current}`,
    redo: `Rehecho: Asistencia del día ${day} cambiada a ${next}`
  },
  undo: async () => {
    await handleAttendanceToggle(day, current, true);
    fetchData();
  },
  redo: async () => {
    await handleAttendanceToggle(day, next, true);
    fetchData();
  }
});

/**
 * Acción para añadir un nuevo cobro/anticipo.
 */
export const buildAddAdvanceAction = (newAdv, memberName, fetchData) => ({
  view: 'nominas',
  description: {
    undo: `Deshecho: Anticipo de ${newAdv.amount} ฿ a ${memberName} eliminado`,
    redo: `Rehecho: Anticipo de ${newAdv.amount} ฿ a ${memberName} vuelto a crear`
  },
  undo: async () => {
    await supabase.from('staff_advances').delete().eq('id', newAdv.id);
    fetchData();
  },
  redo: async () => {
    await supabase.from('staff_advances').insert(newAdv);
    fetchData();
  }
});

/**
 * Acción para actualizar cantidad o concepto de un anticipo de forma contextual.
 */
export const buildUpdateAdvanceAction = (id, updates, oldAdvanceState, memberName, fetchData) => {
  let undoDesc = `Deshecho: Anticipo de ${memberName} restaurado`;
  let redoDesc = `Rehecho: Anticipo de ${memberName} actualizado`;

  const isAmountChange = updates.amount !== undefined && updates.amount !== oldAdvanceState.amount;
  const isConceptChange = updates.concept !== undefined && updates.concept !== oldAdvanceState.concept;

  if (isAmountChange) {
    undoDesc = `Deshecho: Cantidad de anticipo de ${memberName} restaurada a ${oldAdvanceState.amount} ฿ (era ${updates.amount} ฿)`;
    redoDesc = `Rehecho: Cantidad de anticipo de ${memberName} actualizada a ${updates.amount} ฿`;
  } else if (isConceptChange) {
    const oldVal = oldAdvanceState.concept ? `"${oldAdvanceState.concept}"` : 'Sin concepto';
    const newVal = updates.concept ? `"${updates.concept}"` : 'Sin concepto';
    undoDesc = `Deshecho: Concepto de anticipo de ${memberName} restaurado a ${oldVal} (era ${newVal})`;
    redoDesc = `Rehecho: Concepto de anticipo de ${memberName} actualizado a ${newVal}`;
  }

  return {
    view: 'nominas',
    description: {
      undo: undoDesc,
      redo: redoDesc
    },
    undo: async () => {
      await supabase.from('staff_advances').update(oldAdvanceState).eq('id', id);
      fetchData();
    },
    redo: async () => {
      await supabase.from('staff_advances').update(updates).eq('id', id);
      fetchData();
    }
  };
};

/**
 * Acción para eliminar un anticipo.
 */
export const buildRemoveAdvanceAction = (actualId, advanceItem, memberName, fetchData) => ({
  view: 'nominas',
  description: {
    undo: `Deshecho: Anticipo de ${advanceItem.amount} ฿ restaurado para ${memberName}`,
    redo: `Rehecho: Anticipo de ${advanceItem.amount} ฿ eliminado para ${memberName}`
  },
  undo: async () => {
    await supabase.from('staff_advances').insert(advanceItem);
    fetchData();
  },
  redo: async () => {
    await supabase.from('staff_advances').delete().eq('id', actualId);
    fetchData();
  }
});

/**
 * Acción para actualizar los ajustes manuales de un día.
 */
export const buildAdjUpdateAction = (day, newAmount, newConcept, oldAdj, handleAdjUpdate, fetchData) => ({
  view: 'nominas',
  description: {
    undo: `Deshecho: Ajuste del día ${day} restaurado a '${oldAdj?.concept || ''}' (${oldAdj?.amount || 0} ฿)`,
    redo: `Rehecho: Ajuste del día ${day} cambiado a '${newConcept}' (${newAmount} ฿)`
  },
  undo: async () => {
    await handleAdjUpdate(day, oldAdj?.amount || 0, oldAdj?.concept || '', true);
    fetchData();
  },
  redo: async () => {
    await handleAdjUpdate(day, newAmount, newConcept, true);
    fetchData();
  }
});
