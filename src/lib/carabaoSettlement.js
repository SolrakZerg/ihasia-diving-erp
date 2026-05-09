import { supabase } from './supabaseClient';

export const recalculateCarabaoSettlement = async (month, year) => {
  try {
    // 1. Obtener todas las actividades
    const { data: allActivities } = await supabase.from('activities').select('*');
    if (!allActivities) return;

    // 2. Obtener los ítems del mes
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    const { data: invoiceItems } = await supabase.from('invoice_items')
      .select('*, activities(id, name, category, acronym, tanks_weight, is_supplier_billable)')
      .gte('date', firstDay)
      .lte('date', lastDay);
      
    if (!invoiceItems) return;

    // 3. Obtener settlement actual (para config_invoice)
    const { data: settlement } = await supabase
      .from('supplier_settlements')
      .select('*')
      .eq('supplier_name', 'Carabao')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    // Reconstruir lógicas de SupplierPayout.jsx
    const fixedKeys = ['FD', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

    const fixedColumns = fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const pGroup = (a?.payout_group || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        return pGroup === cleanK;
      });
      return { key, label: key, activityIds: matches.map(m => m.id) };
    });

    const billableActivities = allActivities.filter(a => (parseFloat(a.tanks_weight) > 0 || a.is_supplier_billable));

    const qtyMap = {};
    invoiceItems.forEach(item => {
      if (item.activity_id) {
        qtyMap[item.activity_id] = (qtyMap[item.activity_id] || 0) + Number(item.quantity ?? 1);
      }
    });

    const availableActivitiesForMonth = allActivities.filter(a => {
      const isBillable = a.is_supplier_billable && qtyMap[a.id] > 0;
      if (!isBillable) return false;
      const actId = String(a.id);
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      const key = fixedCol?.key;
      const isTankGroup = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(key);
      return !isTankGroup;
    });

    let selectedInvoiceRows = settlement?.invoice_config || [];

    if (selectedInvoiceRows.length === 0) {
      const findId = (key) => {
        const col = fixedColumns.find(c => c.key === key);
        return col?.activityIds[0];
      };

      const hasSR = availableActivitiesForMonth.some(a => a.acronym === 'S&R' || a.name.includes('Rescue'));
      const hasDMT = availableActivitiesForMonth.some(a => a.acronym === 'DMT' || a.name.includes('Divemaster'));

      const defaultTemplate = [
        { id: 'tank_group', type: 'tank_group' },
        { id: findId('OW'), type: 'activity' },
        { id: findId('AOW'), type: 'activity' },
        { id: findId('SD'), type: 'activity' }
      ];

      if (hasSR) defaultTemplate.push({ id: findId('S&R'), type: 'activity' });
      if (hasDMT) defaultTemplate.push({ id: findId('DMT'), type: 'activity' });

      selectedInvoiceRows = defaultTemplate.filter(r => r.id || r.type === 'tank_group');
    }

    // Calcular montos
    let tankGroupQty = 0;
    const pool = [];
    const monthQtyMap = {};
    invoiceItems.forEach(item => {
      const actId = item.activity_id;
      if (actId) monthQtyMap[actId] = (monthQtyMap[actId] || 0) + Number(item.quantity ?? 1);
    });

    billableActivities.filter(a => a.is_supplier_billable).forEach(act => {
      const actId = String(act.id);
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      const key = fixedCol?.key;
      const qty = monthQtyMap[act.id] || 0;

      const isTankGroup = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(key);

      if (isTankGroup) {
        const tankMultiplier = (key === 'DSD2' || key === 'SR2') ? 2 : 1;
        tankGroupQty += (qty * tankMultiplier);
      } else {
        pool.push({
          id: act.id,
          code: act.acronym || act.name.slice(0,3),
          desc: act.name,
          qty: qty,
          price: (parseFloat(act.tanks_weight) || 0) * 500,
          amount: qty * (parseFloat(act.tanks_weight) || 0) * 500,
          type: 'activity'
        });
      }
    });

    const finalPool = [...pool];
    if (tankGroupQty >= 0) { // Incluir siempre tanques
      finalPool.unshift({
        id: 'tank_group',
        code: 'Tanks',
        desc: 'Tanks (FD + DSD + SR)',
        qty: tankGroupQty,
        price: 500,
        amount: tankGroupQty * 500,
        type: 'tank_group'
      });
    }

    const grandTotal = finalPool.reduce((acc, row) => acc + (row.amount || 0), 0);

    // Guardar en DB
    const payload = {
      supplier_name: 'Carabao',
      month,
      year,
      total_amount: grandTotal,
      invoice_config: selectedInvoiceRows,
      updated_at: new Date().toISOString()
    };

    if (settlement) {
      // No sobreescribir paid_amount
      await supabase.from('supplier_settlements').update(payload).eq('id', settlement.id);
    } else {
      payload.paid_amount = 0;
      await supabase.from('supplier_settlements').insert(payload);
    }
    
    console.log(`[Carabao] Recalculated total for ${month}/${year}: ${grandTotal}`);

  } catch (error) {
    console.error("[Carabao] Error recalculating settlement:", error);
  }
};
