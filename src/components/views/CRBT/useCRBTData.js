import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';
import {
  buildCRBTOfficeAssistAction,
  buildCRBTAdjustmentAction,
  buildCRBTDailyLogAction,
  buildCRBTAddAdvanceAction,
  buildCRBTDeleteAdvanceAction,
  buildCRBTEditAdvanceAction
} from './crbtUndoActions';

const PARTNER_IDS = [
  '47ad3626-e74b-4b9b-bb56-4d50961e2711', // Carlos (CR)
  '5d25291d-d1ca-4232-808b-5adbb5f6cb19'  // Berta (BT)
];

export const LOG_OPTIONS = [
  { id: 'EMPTY', label: '-', color: 'bg-transparent text-gray-600' },
  { id: 'CR', label: 'CR', color: 'bg-blue-600 text-white' },
  { id: 'BT', label: 'BT', color: 'bg-pink-600 text-white' },
  { id: 'CRBT', label: 'CRBT', color: 'bg-indigo-600 text-white' },
  { id: 'CR_HALF', label: 'CR ½ DÍA', color: 'bg-blue-400 text-white' },
  { id: 'BT_HALF', label: 'BT ½ DÍA', color: 'bg-pink-400 text-white' }
];

export default function useCRBTData() {
  const { pushAction, refreshTrigger } = useUndo();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [crForm, setCrForm] = useState({ day: new Date().getDate(), amount: '', concept: '' });
  const [btForm, setBtForm] = useState({ day: new Date().getDate(), amount: '', concept: '' });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [dailyLog, setDailyLog] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [manualAdj, setManualAdj] = useState({}); 
  const [assists, setAssists] = useState({}); 
  const [advances, setAdvances] = useState([]); 
  const [prevMonthBalance, setPrevMonthBalance] = useState({ CR: 0, BT: 0 });

  const [allActivities, setAllActivities] = useState([]);
  const [initialBote, setInitialBote] = useState(70000);
  const [boteStats, setBoteStats] = useState({ tshirts: 0, insurances: 0 });
  const [boteExpenses, setBoteExpenses] = useState([]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const fixedKeys = ['FD', 'SR1', 'SR2', 'DSD1', 'DSD2', 'SD', 'OW', 'AOW', 'S&R', 'CAN'];

  useEffect(() => {
    fetchPayoutRules();
  }, []);

  const prevMonthRef = useRef(month);
  const prevYearRef = useRef(year);

  useEffect(() => {
    const isPeriodChange = prevMonthRef.current !== month || prevYearRef.current !== year;
    prevMonthRef.current = month;
    prevYearRef.current = year;

    fetchData(isPeriodChange);
  }, [month, year, refreshTrigger]);

  const fetchPayoutRules = async () => {
    const { data: rules } = await supabase.from('instructor_payouts').select('*, activities(name, category, id, acronym)');
    if (rules) setPayoutRules(rules);
    const { data: acts } = await supabase.from('activities').select('*');
    if (acts) setAllActivities(acts);
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const [ { data: pSettlement }, { data: pAdvances }, { data: pDaily }, { data: pAdjs }, { data: bMonthly } ] = await Promise.all([
        supabase.from('partner_settlements').select('*').eq('year', year).eq('month', month).eq('partner_id', 'CRBT').maybeSingle(),
        supabase.from('partner_advances').select('*').eq('year', year).eq('month', month),
        supabase.from('partner_daily_activity').select('*').eq('year', year).eq('month', month),
        supabase.from('partner_adjustments').select('*').eq('year', year).eq('month', month),
        supabase.from('bote_monthly').select('*').eq('year', year).eq('month', month).maybeSingle()
      ]);
      
      if (bMonthly) {
        setInitialBote(Number(bMonthly.initial_balance || 0));
        setBoteStats({ 
          tshirts: 0, 
          insurances: 0,
          income: Number(bMonthly.apartar_amount || 0),
          expenses: Number(bMonthly.expenses_total || 0),
          final: Number(bMonthly.final_balance || 0)
        });
      } else {
        const prevM = month === 1 ? 12 : month - 1;
        const prevY = month === 1 ? year - 1 : year;
        const { data: prevB } = await supabase.from('bote_monthly').select('final_balance').eq('year', prevY).eq('month', prevM).maybeSingle();
        setInitialBote(prevB ? Number(prevB.final_balance) : 70000);
        setBoteStats({ income: 0, expenses: 0, final: prevB ? Number(prevB.final_balance) : 70000 });
      }

      setAdvances(pAdvances || []);
      const assistMap = {};
      pDaily?.forEach(row => { if (row.assists > 0) assistMap[row.day] = row.assists; });
      setAssists(assistMap);
      const adjMap = {};
      pAdjs?.forEach(row => { if (row.amount !== 0) adjMap[row.day] = row.amount; });
      setManualAdj(adjMap);

      if (pSettlement) {
        const val = Number(pSettlement.prev_day_balance || 0);
        if (val >= 0) {
          setPrevMonthBalance({ CR: val, BT: 0 });
        } else {
          setPrevMonthBalance({ CR: 0, BT: Math.abs(val) });
        }
      } else {
        setPrevMonthBalance({ CR: 0, BT: 0 });
      }

      const { data: allItems } = await supabase.from('invoice_items').select('*, activities(id, name, category, acronym, tshirt_included)').gte('date', firstDay).lte('date', lastDay);
      setInvoiceItems((allItems || []).filter(i => PARTNER_IDS.includes(i.instructor_id)));

      const { data: logData } = await supabase.from('partner_daily_log').select('*').gte('date', firstDay).lte('date', lastDay);
      const logMap = {};
      (logData || []).forEach(row => { logMap[row.date] = { office: row.office_id, water: row.water_id, theory: row.theory_id, off: row.off_id }; });
      setDailyLog(logMap);

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addAdvance = async (partner) => {
    const form = partner === 'CR' ? crForm : btForm;
    if (!form.amount || !form.concept) return false;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${form.day.toString().padStart(2, '0')}`;
    const { data: newAdv } = await supabase.from('partner_advances').insert({ year, month, partner_id: partner, amount: parseFloat(form.amount), concept: form.concept, date: dateStr }).select().single();
    if (newAdv) {
      pushAction(buildCRBTAddAdvanceAction(newAdv));
      setAdvances([...advances, newAdv]);
      const reset = { day: new Date().getDate(), amount: '', concept: '' };
      if (partner === 'CR') setCrForm(reset); else setBtForm(reset);
      return true;
    }
    return false;
  };

  const saveInlineEdit = async (id, partner, inlineForm) => {
    const oldAdv = advances.find(a => a.id === id);
    if (!oldAdv) return false;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${inlineForm.day.toString().padStart(2, '0')}`;
    const newAdv = { ...oldAdv, amount: parseFloat(inlineForm.amount), concept: inlineForm.concept, date: dateStr };

    if (oldAdv.amount === newAdv.amount && oldAdv.concept === newAdv.concept && oldAdv.date === newAdv.date) return true;

    const { error } = await supabase.from('partner_advances').update({ amount: parseFloat(inlineForm.amount), concept: inlineForm.concept, date: dateStr }).eq('id', id);
    if (!error) {
      pushAction(buildCRBTEditAdvanceAction(id, oldAdv, newAdv));
      setAdvances(advances.map(a => a.id === id ? newAdv : a));
      return true;
    }
    return false;
  };

  const deleteAdvance = async (id) => {
    const oldAdv = advances.find(a => a.id === id);
    if (!oldAdv) return;
    const { error } = await supabase.from('partner_advances').delete().eq('id', id);
    if (!error) {
      pushAction(buildCRBTDeleteAdvanceAction(oldAdv));
      setAdvances(advances.filter(a => a.id !== id));
    }
  };

  const updateAssist = async (day, val) => {
    const num = parseInt(val) || 0;
    const oldVal = assists[day] || 0;
    if (num === oldVal) return;

    pushAction(buildCRBTOfficeAssistAction(year, month, day, oldVal, num));
    setAssists(prev => ({ ...prev, [day]: num }));
    await supabase.from('partner_daily_activity').upsert({ year, month, day, partner_id: 'CRBT', assists: num }, { onConflict: 'year, month, day, partner_id' });
  };

  const updateAdjustment = async (day, val) => {
    const num = parseFloat(val) || 0;
    const oldVal = manualAdj[day] || 0;
    if (num === oldVal) return;

    pushAction(buildCRBTAdjustmentAction(year, month, day, oldVal, num));
    setManualAdj(prev => ({ ...prev, [day]: num }));
    await supabase.from('partner_adjustments').upsert({ year, month, day, partner_id: 'CRBT', amount: num }, { onConflict: 'year, month, day, partner_id' });
  };

  const updateLog = async (date, field, value) => {
    const current = dailyLog[date] || {};
    const oldValue = current[field] || 'EMPTY';
    if (value === oldValue) return;

    const updated = { ...current, [field]: value };
    pushAction(buildCRBTDailyLogAction(date, field, oldValue, value));
    const { error } = await supabase.from('partner_daily_log').upsert({ date, office_id: updated.office || 'EMPTY', water_id: updated.water || 'EMPTY', theory_id: updated.theory || 'EMPTY', off_id: updated.off || 'EMPTY' }, { onConflict: 'date' });
    if (!error) setDailyLog({ ...dailyLog, [date]: updated });
  };

  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));
    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const acro = (a?.acronym || '').toUpperCase().trim();
        const name = (a?.name || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        if (cleanK === 'FD') return acro.startsWith('FD') || name.startsWith('FUNDIVE');
        if (cleanK === 'SR1') return name.includes('REFRESH') && (name.includes('1') || !name.includes('2'));
        if (cleanK === 'SR2') return name.includes('REFRESH') && name.includes('2');
        if (cleanK === 'DSD1') return (name.includes('BAUTIZO') || name.includes('DSD')) && (name.includes('1') || !name.includes('2'));
        if (cleanK === 'DSD2') return (name.includes('BAUTIZO') || name.includes('DSD')) && name.includes('2');
        if (cleanK === 'OW') return acro === 'OW' || name.includes('OPEN WATER');
        if (cleanK === 'AOW') return acro === 'AOW' || name.includes('ADVANCED');
        if (cleanK === 'CAN') return acro === 'CAN' || acro === 'CAN2' || name.includes('CAN');
        return acro === cleanK || name === cleanK;
      });
      return { key, label: key, activityIds: matches.map(m => m.id) };
    });
  }, [allActivities]);

  const dynamicActivities = useMemo(() => {
    const fixedIds = new Set(fixedColumns.flatMap(c => c.activityIds).map(String));
    const seenIds = new Set();
    invoiceItems.forEach(item => {
      const actId = String(item.activity_id || '');
      if (actId && !fixedIds.has(actId)) seenIds.add(actId);
    });
    return Array.from(seenIds).map(id => allActivities.find(a => String(a.id) === id)).filter(Boolean);
  }, [invoiceItems, fixedColumns, allActivities]);

  const matrixData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = {};
    for (let i = 1; i <= daysInMonth; i++) data[i] = { items: {}, total: 0 };
    invoiceItems.forEach(item => {
      if (!item.date) return;
      const d = parseInt(item.date.split('-')[2]);
      const actId = String(item.activity_id || '');
      let colKey = null;
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      if (fixedCol) colKey = fixedCol.key;
      else {
        const dynCol = dynamicActivities.find(a => String(a.id) === actId);
        if (dynCol) colKey = `dyn_${actId}`;
      }
      if (!colKey || !data[d]) return;
      const qty = Number(item.quantity) || 0;
      data[d].items[colKey] = (data[d].items[colKey] || 0) + qty;
      const rule = payoutRules.find(r => String(r.activity_id) === actId);
      if (rule) data[d].total += qty * rule.amount_thb;
    });
    return data;
  }, [invoiceItems, payoutRules, month, year, fixedColumns, dynamicActivities]);

  const stats = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const s = { 
      CR: { office: 0, water: 0, theory: 0, fullOff: 0, halfOff: 0, totalOff: 0 }, 
      BT: { office: 0, water: 0, theory: 0, fullOff: 0, halfOff: 0, totalOff: 0 }
    };
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const log = dailyLog[dateStr] || {};
      ['office', 'water', 'theory', 'off'].forEach(field => {
        const val = log[field] || 'EMPTY';
        if (val === 'CR') s.CR[field === 'off' ? 'fullOff' : field] += 1;
        if (val === 'BT') s.BT[field === 'off' ? 'fullOff' : field] += 1;
        if (val === 'CRBT') { s.CR[field === 'off' ? 'fullOff' : field] += 1; s.BT[field === 'off' ? 'fullOff' : field] += 1; }
        if (val === 'CR_HALF') s.CR[field === 'off' ? 'halfOff' : field] += 1;
        if (val === 'BT_HALF') s.BT[field === 'off' ? 'halfOff' : field] += 1;
      });
    }
    s.CR.totalOff = s.CR.fullOff + (s.CR.halfOff * 0.5);
    s.BT.totalOff = s.BT.fullOff + (s.BT.halfOff * 0.5);
    return s;
  }, [dailyLog, year, month]);

  const diffDays = (stats.CR.totalOff + prevMonthBalance.CR) - (stats.BT.totalOff + prevMonthBalance.BT);
  const totalComm = Object.values(matrixData).reduce((acc, d) => acc + d.total, 0);
  const totalAssists = Object.values(assists).reduce((acc, val) => acc + (val * 2000), 0);
  const totalAdj = Object.values(manualAdj).reduce((acc, val) => acc + val, 0);
  const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);
  
  const grossIncome = totalComm + totalAssists + totalAdj;
  const netRemaining = grossIncome - totalAdvances;

  useEffect(() => {
    if (loading) return;
    
    const sync = async () => {
      setSyncing(true);
      try {
        await supabase.from('partner_settlements').upsert({
          year, month, partner_id: 'CRBT',
          total_generated: totalComm,
          total_adjustments: totalAssists + totalAdj,
          total_advances: totalAdvances,
          net_payout: netRemaining,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month, partner_id' });

        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        
        await supabase.from('partner_settlements').upsert({
          year: nextYear,
          month: nextMonth,
          partner_id: 'CRBT',
          prev_day_balance: diffDays,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month, partner_id' });

        const crCash = advances.filter(a => a.partner_id === 'CR').reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
        const btCash = advances.filter(a => a.partner_id === 'BT').reduce((acc, a) => acc + (Number(a.amount) || 0), 0);

        await supabase.from('monthly_reports').upsert({
          year, month,
          cr_cash: crCash,
          bt_cash: btCash,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' });

      } catch (err) {
        console.error("[PartnersPayouts] Sync error:", err);
      } finally {
        setSyncing(false);
      }
    };

    const timer = setTimeout(sync, 1500);
    return () => clearTimeout(timer);
  }, [totalComm, totalAssists, totalAdj, totalAdvances, netRemaining, month, year, loading, advances, diffDays]);

  return {
    month, setMonth,
    year, setYear,
    crForm, setCrForm,
    btForm, setBtForm,
    invoiceItems,
    payoutRules,
    dailyLog,
    loading,
    syncing,
    sidebarOpen, setSidebarOpen,
    manualAdj,
    assists,
    advances,
    prevMonthBalance,
    allActivities,
    initialBote,
    boteStats,
    months,
    fixedColumns,
    dynamicActivities,
    matrixData,
    stats,
    diffDays,
    totalComm,
    totalAssists,
    totalAdj,
    totalAdvances,
    grossIncome,
    netRemaining,
    addAdvance,
    saveInlineEdit,
    deleteAdvance,
    updateAssist,
    updateAdjustment,
    updateLog
  };
}
