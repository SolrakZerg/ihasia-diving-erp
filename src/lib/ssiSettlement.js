import { supabase } from './supabaseClient';

export const recalculateSSISettlement = async (month, year) => {
  try {
    // 1. Fetch active SSI activities
    const { data: activities } = await supabase.from('activities').select('*').eq('is_ssi_active', true);
    if (!activities || activities.length === 0) return;
    const activeActivityIds = activities.map(a => a.id);

    // 2. Fetch invoice items
    const mm = String(month).padStart(2, '0');
    const firstDay = `${year}-${mm}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

    const { data: items } = await supabase.from('invoice_items')
      .select('*, activities!inner(id, ssi_cost_thb)')
      .gte('date', firstDay).lte('date', lastDay)
      .in('activity_id', activeActivityIds);

    // 3. Calculate subtotal
    let calculatedTotal = 0;
    if (items) {
      const agg = {};
      activities.forEach(act => {
        agg[act.id] = { count: 0, ssi_cost: parseFloat(act.ssi_cost_thb) || 0 };
      });
      items.forEach(item => {
        if (agg[item.activity_id]) {
          agg[item.activity_id].count += Number(item.quantity ?? 1);
        }
      });
      calculatedTotal = Object.values(agg).reduce((sum, a) => sum + (a.count * a.ssi_cost), 0);
    }

    // 4. Fetch settlements for adjNext and adjPrev
    const { data: current } = await supabase
      .from('supplier_settlements')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .ilike('supplier_name', '%SSI%')
      .maybeSingle();

    const adjNext = current?.invoice_config?.adjNext || 0;

    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    const { data: prev } = await supabase
      .from('supplier_settlements')
      .select('invoice_config')
      .eq('year', prevYear)
      .eq('month', prevMonth)
      .ilike('supplier_name', '%SSI%')
      .maybeSingle();

    const adjPrev = prev?.invoice_config?.adjNext || 0;

    // 5. Calculate totalSsi
    const FIXED_ADJ_PRICE = 1067;
    const adjustmentsTotal = (adjNext * FIXED_ADJ_PRICE) - (adjPrev * FIXED_ADJ_PRICE);
    const totalSsi = calculatedTotal + adjustmentsTotal;

    // 6. Save to DB
    const payload = {
      supplier_name: 'SSI',
      year,
      month,
      total_amount: totalSsi,
      updated_at: new Date().toISOString()
    };
    if (current?.invoice_config) {
      payload.invoice_config = current.invoice_config;
    } else {
      payload.invoice_config = { adjNext: 0 };
    }

    if (current) {
      // Keep existing paid_amount
      await supabase.from('supplier_settlements').update(payload).eq('id', current.id);
    } else {
      payload.paid_amount = 0;
      await supabase.from('supplier_settlements').insert(payload);
    }

    console.log(`[SSI] Recalculated total for ${month}/${year}: ${totalSsi}`);
  } catch (err) {
    console.error("[SSI] Error recalculating settlement:", err);
  }
};
