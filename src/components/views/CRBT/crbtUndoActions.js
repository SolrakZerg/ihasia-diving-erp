import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para CRBT.
 * Permite separar completamente la pila de deshacer de la lógica de negocio de la UI,
 * evitando archivos monolíticos y mejorando la mantenibilidad.
 */

// Mapa para convertir los nombres de campos del frontend a los nombres de columna en la BD
const DB_FIELD_MAP = {
  office: 'office_id',
  water: 'water_id',
  theory: 'theory_id',
  off: 'off_id'
};

/**
 * Acción para modificar las asistencias (ASS) en CRBT.
 */
export const buildCRBTOfficeAssistAction = (year, month, day, oldValue, newValue) => {
  return {
    view: 'crbt',
    description: {
      undo: `Asistencias del día ${day} restauradas a ${oldValue} (eran ${newValue})`,
      redo: `Asistencias del día ${day} cambiadas a ${newValue}`
    },
    undo: async () => {
      const { error } = await supabase
        .from('partner_daily_activity')
        .upsert(
          { year, month, day, partner_id: 'CRBT', assists: oldValue },
          { onConflict: 'year, month, day, partner_id' }
        );
      if (error) throw error;
    },
    redo: async () => {
      const { error } = await supabase
        .from('partner_daily_activity')
        .upsert(
          { year, month, day, partner_id: 'CRBT', assists: newValue },
          { onConflict: 'year, month, day, partner_id' }
        );
      if (error) throw error;
    }
  };
};

/**
 * Acción para modificar los ajustes manuales (Extra) en CRBT.
 */
export const buildCRBTAdjustmentAction = (year, month, day, oldValue, newValue) => {
  return {
    view: 'crbt',
    description: {
      undo: `Ajuste manual del día ${day} restaurado a ${oldValue.toLocaleString()} ฿ (era ${newValue.toLocaleString()} ฿)`,
      redo: `Ajuste manual del día ${day} cambiado a ${newValue.toLocaleString()} ฿`
    },
    undo: async () => {
      const { error } = await supabase
        .from('partner_adjustments')
        .upsert(
          { year, month, day, partner_id: 'CRBT', amount: oldValue },
          { onConflict: 'year, month, day, partner_id' }
        );
      if (error) throw error;
    },
    redo: async () => {
      const { error } = await supabase
        .from('partner_adjustments')
        .upsert(
          { year, month, day, partner_id: 'CRBT', amount: newValue },
          { onConflict: 'year, month, day, partner_id' }
        );
      if (error) throw error;
    }
  };
};

/**
 * Acción para modificar los dropdowns del log de actividad diaria en CRBT.
 */
export const buildCRBTDailyLogAction = (date, field, oldValue, newValue) => {
  const columnName = DB_FIELD_MAP[field];
  const dayStr = date.split('-')[2];
  
  return {
    view: 'crbt',
    description: {
      undo: `Log de ${field.toUpperCase()} del día ${parseInt(dayStr)} restaurado a ${oldValue} (era ${newValue})`,
      redo: `Log de ${field.toUpperCase()} del día ${parseInt(dayStr)} cambiado a ${newValue}`
    },
    undo: async () => {
      // 1. Obtener el registro actual
      const { data } = await supabase
        .from('partner_daily_log')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      // 2. Fusionar con el valor viejo
      const updated = {
        office_id: data?.office_id || 'EMPTY',
        water_id: data?.water_id || 'EMPTY',
        theory_id: data?.theory_id || 'EMPTY',
        off_id: data?.off_id || 'EMPTY',
        [columnName]: oldValue
      };

      // 3. Upsert
      const { error } = await supabase
        .from('partner_daily_log')
        .upsert({ date, ...updated }, { onConflict: 'date' });
      if (error) throw error;
    },
    redo: async () => {
      // 1. Obtener el registro actual
      const { data } = await supabase
        .from('partner_daily_log')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      // 2. Fusionar con el valor nuevo
      const updated = {
        office_id: data?.office_id || 'EMPTY',
        water_id: data?.water_id || 'EMPTY',
        theory_id: data?.theory_id || 'EMPTY',
        off_id: data?.off_id || 'EMPTY',
        [columnName]: newValue
      };

      // 3. Upsert
      const { error } = await supabase
        .from('partner_daily_log')
        .upsert({ date, ...updated }, { onConflict: 'date' });
      if (error) throw error;
    }
  };
};

/**
 * Acción para agregar un pago cash (Adelanto).
 */
export const buildCRBTAddAdvanceAction = (advanceObj) => {
  return {
    view: 'crbt',
    description: {
      undo: `Pago cash eliminado: ${advanceObj.concept} (${advanceObj.amount.toLocaleString()} ฿) para ${advanceObj.partner_id}`,
      redo: `Pago cash restaurado: ${advanceObj.concept} (${advanceObj.amount.toLocaleString()} ฿) para ${advanceObj.partner_id}`
    },
    undo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .delete()
        .eq('id', advanceObj.id);
      if (error) throw error;
    },
    redo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .insert(advanceObj);
      if (error) throw error;
    }
  };
};

/**
 * Acción para eliminar un pago cash.
 */
export const buildCRBTDeleteAdvanceAction = (advanceObj) => {
  return {
    view: 'crbt',
    description: {
      undo: `Pago cash restaurado: ${advanceObj.concept} (${advanceObj.amount.toLocaleString()} ฿) para ${advanceObj.partner_id}`,
      redo: `Pago cash eliminado: ${advanceObj.concept} (${advanceObj.amount.toLocaleString()} ฿) para ${advanceObj.partner_id}`
    },
    undo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .insert(advanceObj);
      if (error) throw error;
    },
    redo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .delete()
        .eq('id', advanceObj.id);
      if (error) throw error;
    }
  };
};

/**
 * Acción para editar en línea un pago cash.
 */
export const buildCRBTEditAdvanceAction = (id, oldAdv, newAdv) => {
  return {
    view: 'crbt',
    description: {
      undo: `Edición de pago cash revertida a: ${oldAdv.concept} (${oldAdv.amount.toLocaleString()} ฿)`,
      redo: `Edición de pago cash aplicada: ${newAdv.concept} (${newAdv.amount.toLocaleString()} ฿)`
    },
    undo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .update({
          amount: oldAdv.amount,
          concept: oldAdv.concept,
          date: oldAdv.date
        })
        .eq('id', id);
      if (error) throw error;
    },
    redo: async () => {
      const { error } = await supabase
        .from('partner_advances')
        .update({
          amount: newAdv.amount,
          concept: newAdv.concept,
          date: newAdv.date
        })
        .eq('id', id);
      if (error) throw error;
    }
  };
};
