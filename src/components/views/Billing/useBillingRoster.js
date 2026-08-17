import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { mapActivityCode, addDaysToDate } from '../../../utils/rosterUtils';

function calculateStartDateFromCompletionDate(completionDate, rawActivity) {
  if (!completionDate) return completionDate;
  const code = mapActivityCode(rawActivity);

  if (code === 'OW') {
    // Open Water (3 días): La fecha de factura es el último día (Día 3). Restamos 2 días para fijar la fecha de inicio (Día 1: CONF).
    return addDaysToDate(completionDate, -2);
  }
  if (code === 'AOW' || code === 'SD') {
    // Advanced (2 días) / Scuba Diver (2 días): La fecha de factura es el último día (Día 2). Restamos 1 día para fijar la fecha de inicio (Día 1).
    return addDaysToDate(completionDate, -1);
  }
  return completionDate;
}

export function useBillingRoster({ invoices, staff, activities, selectedItemIds, setSelectedItemIds }) {
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterTargetCustomers, setRosterTargetCustomers] = useState([]);

  // Abrir Roster desde la barra de acciones en lote (selección múltiple)
  const handleOpenRosterBulk = async () => {
    if (selectedItemIds.size === 0) return;
    const rawTargets = [];

    invoices.forEach(inv => {
      const lineItems = inv.invoice_items || inv.items || [];
      lineItems.forEach(item => {
        if (selectedItemIds.has(item.id)) {
          const cust = item.customers || {
            id: item.customer_id || item.id,
            first_name: item.temporary_name || 'Buceador',
            last_name: ''
          };
          const staffObj = staff.find(s => String(s.id) === String(item.instructor_id));
          const actObj = activities.find(a => String(a.id) === String(item.activity_id));
          const actName = actObj?.acronym || actObj?.name;
          const defaultStartDate = calculateStartDateFromCompletionDate(item.date, actName);

          rawTargets.push({
            ...cust,
            customer_id: item.customer_id,
            id: cust.id || item.id,
            defaultDate: defaultStartDate,
            defaultActivity: actName,
            defaultStaff: staffObj?.initials || item.staff?.initials || ''
          });
        }
      });
    });

    if (rawTargets.length === 0) return;

    // Refrescar tallas actualizadas de Supabase para cada cliente
    const custIds = rawTargets.map(t => t.customer_id || t.id).filter(Boolean);
    let freshMap = {};

    if (custIds.length > 0) {
      try {
        const { data: freshCusts } = await supabase
          .from('customers')
          .select('id, bcd_size, suit_size, fins_size')
          .in('id', custIds);
        
        if (freshCusts) {
          freshCusts.forEach(c => { freshMap[c.id] = c; });
        }
      } catch (err) {
        console.warn('No se pudieron refrescar tallas:', err);
      }
    }

    const finalTargets = rawTargets.map(t => {
      const fresh = freshMap[t.customer_id || t.id];
      return {
        ...t,
        bcd_size: fresh?.bcd_size || t.bcd_size || t.bcd,
        suit_size: fresh?.suit_size || t.suit_size || t.suit,
        fins_size: fresh?.fins_size || t.fins_size || t.fins,
      };
    });

    setRosterTargetCustomers(finalTargets);
    setIsRosterModalOpen(true);
  };

  // Abrir Roster para una sola fila de factura
  const handleSendSingleToRoster = async (item) => {
    let cust = item.customers || {
      id: item.customer_id || item.id,
      first_name: item.temporary_name || 'Buceador',
      last_name: ''
    };

    if (item.customer_id) {
      try {
        const { data: freshCust } = await supabase
          .from('customers')
          .select('*')
          .eq('id', item.customer_id)
          .single();
        if (freshCust) {
          cust = { ...cust, ...freshCust };
        }
      } catch (err) {
        console.warn('Error al obtener cliente actualizado:', err);
      }
    }

    const staffObj = staff.find(s => String(s.id) === String(item.instructor_id));
    const actObj = activities.find(a => String(a.id) === String(item.activity_id));
    const actName = actObj?.acronym || actObj?.name;
    const defaultStartDate = calculateStartDateFromCompletionDate(item.date, actName);

    setRosterTargetCustomers([{
      ...cust,
      id: cust.id || item.id,
      defaultDate: defaultStartDate,
      defaultActivity: actName,
      defaultStaff: staffObj?.initials || item.staff?.initials || ''
    }]);
    setIsRosterModalOpen(true);
  };

  return {
    isRosterModalOpen,
    setIsRosterModalOpen,
    rosterTargetCustomers,
    handleOpenRosterBulk,
    handleSendSingleToRoster,
  };
}
