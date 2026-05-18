import { supabase } from '../../../lib/supabaseClient';

/**
 * Módulo de constructores de acciones de deshacer/rehacer (Action Builders) para Carabao.
 * Permite separar completamente la pila de deshacer de la lógica de negocio de la UI,
 * evitando archivos monolíticos y mejorando la mantenibilidad.
 */

/**
 * Acción para modificar el monto Pagado de la liquidación de Carabao.
 */
export const buildCarabaoPaidAction = (month, year, oldValue, newValue, totalAmount, fetchData) => {
  return {
    view: 'carabao',
    description: {
      undo: `Pago de Carabao restaurado a ${oldValue.toLocaleString()} ฿ (era ${newValue.toLocaleString()} ฿)`,
      redo: `Pago de Carabao cambiado a ${newValue.toLocaleString()} ฿`
    },
    undo: async () => {
      // Buscar si ya existe la liquidación
      const { data } = await supabase
        .from('supplier_settlements')
        .select('id')
        .eq('supplier_name', 'Carabao')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (data?.id) {
        const { error } = await supabase
          .from('supplier_settlements')
          .update({
            paid_amount: oldValue,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('supplier_settlements')
          .insert({
            supplier_name: 'Carabao',
            month,
            year,
            paid_amount: oldValue,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      
      if (fetchData) await fetchData();
    },
    redo: async () => {
      // Buscar si ya existe la liquidación
      const { data } = await supabase
        .from('supplier_settlements')
        .select('id')
        .eq('supplier_name', 'Carabao')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (data?.id) {
        const { error } = await supabase
          .from('supplier_settlements')
          .update({
            paid_amount: newValue,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('supplier_settlements')
          .insert({
            supplier_name: 'Carabao',
            month,
            year,
            paid_amount: newValue,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      
      if (fetchData) await fetchData();
    }
  };
};
