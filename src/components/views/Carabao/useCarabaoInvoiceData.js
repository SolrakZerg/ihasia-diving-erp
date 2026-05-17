import { useMemo, useEffect } from 'react';

export default function useCarabaoInvoiceData({
  invoiceItems,
  allActivities,
  selectedInvoiceRows,
  setSelectedInvoiceRows,
  paidAmount
}) {
  const fixedKeys = ['FD', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

  // 1. Mapeo de columnas fijas
  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));
    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const pGroup = (a?.payout_group || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        return pGroup === cleanK;
      });
      return { key, label: key, activityIds: matches.map(m => m.id) };
    });
  }, [allActivities]);

  // 2. Filtrar actividades facturables
  const billableActivities = useMemo(() => {
    return allActivities.filter(a => (parseFloat(a.tanks_weight) > 0 || a.is_supplier_billable));
  }, [allActivities]);

  // 3. Filtrar actividades disponibles para el mes
  const availableActivitiesForMonth = useMemo(() => {
    const qtyMap = {};
    invoiceItems.forEach(item => {
      if (item.activity_id) {
        qtyMap[item.activity_id] = (qtyMap[item.activity_id] || 0) + (Number(item.quantity) || 0);
      }
    });
    return allActivities.filter(a => {
      const isBillable = a.is_supplier_billable && qtyMap[a.id] > 0;
      if (!isBillable) return false;
      const actId = String(a.id);
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      const key = fixedCol?.key;
      const isTankGroup = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(key);
      return !isTankGroup;
    });
  }, [invoiceItems, allActivities, fixedColumns]);

  // 4. Lógica de datos de factura (Automática por defecto pero editable)
  const dynamicInvoiceData = useMemo(() => {
    let tankGroupQty = 0;
    const pool = [];
    
    const monthQtyMap = {};
    invoiceItems.forEach(item => {
      const actId = item.activity_id;
      if (actId) monthQtyMap[actId] = (monthQtyMap[actId] || 0) + (Number(item.quantity) || 0);
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
    if (tankGroupQty >= 0) {
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

    // Mapear los seleccionados a sus datos reales
    return selectedInvoiceRows.map(row => {
      if (!row.id) return { id: '', code: '---', desc: '', qty: 0, price: 0, amount: 0 };
      
      if (row.type === 'manual') {
        const qty = row.qty === '' ? '' : (row.qty || 0);
        const price = row.price === '' ? '' : (row.price || 0);
        return {
          id: row.id,
          code: row.code || '---',
          desc: row.desc || '',
          qty: qty,
          price: price,
          amount: (parseFloat(qty) || 0) * (parseFloat(price) || 0),
          type: 'manual'
        };
      }
      
      let baseData = {};
      if (row.type === 'tank_group') {
        baseData = finalPool.find(p => p.type === 'tank_group');
      } else {
        baseData = finalPool.find(p => p.id === row.id) || { id: row.id, code: '???', desc: 'No encontrado', qty: 0, price: 0, amount: 0 };
      }
      
      // Aplicar offset si es tank_group
      if (row.type === 'tank_group') {
        const tanksToRemove = row.tanksToRemove || 0;
        const qty = Math.max(0, baseData.qty - tanksToRemove);
        const amount = qty * baseData.price;
        return { ...baseData, qty, amount, tanksToRemove };
      }
      
      return baseData;
    }).filter(Boolean);
  }, [invoiceItems, selectedInvoiceRows, fixedColumns, billableActivities, availableActivitiesForMonth]);

  // 5. Totales
  const grandTotal = useMemo(() => {
    return dynamicInvoiceData.reduce((acc, row) => acc + row.amount, 0);
  }, [dynamicInvoiceData]);

  const remainingBalance = grandTotal - paidAmount;

  // 6. Inicializar plantilla por defecto
  useEffect(() => {
    if (allActivities.length > 0 && selectedInvoiceRows.length === 0) {
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

      const finalTemplate = defaultTemplate.filter(r => r.id || r.type === 'tank_group');
      if (finalTemplate.length > 0) {
        setSelectedInvoiceRows(finalTemplate);
      }
    }
  }, [allActivities, fixedColumns, availableActivitiesForMonth, selectedInvoiceRows.length, setSelectedInvoiceRows]);

  return {
    dynamicInvoiceData,
    availableActivitiesForMonth,
    grandTotal,
    remainingBalance
  };
}
