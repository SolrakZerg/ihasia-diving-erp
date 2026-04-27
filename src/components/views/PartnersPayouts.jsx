import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Calendar, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Banknote, 
  TrendingUp,
  Receipt,
  AlertCircle,
  ChevronDown,
  Info,
  DollarSign,
  Briefcase,
  Timer,
  X,
  UsersRound,
  Coins,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  CalendarDays,
  Package,
  TrendingDown
} from 'lucide-react';

const PARTNER_IDS = [
  '47ad3626-e74b-4b9b-bb56-4d50961e2711', // Carlos (CR)
  '5d25291d-d1ca-4232-808b-5adbb5f6cb19'  // Berta (BT)
];

const LOG_OPTIONS = [
  { id: 'EMPTY', label: '-', color: 'bg-transparent text-gray-600' },
  { id: 'CR', label: 'CR', color: 'bg-blue-600 text-white' },
  { id: 'BT', label: 'BT', color: 'bg-pink-600 text-white' },
  { id: 'CRBT', label: 'CRBT', color: 'bg-indigo-600 text-white' },
  { id: 'CR_HALF', label: 'CR ½ DÍA', color: 'bg-blue-400 text-white' },
  { id: 'BT_HALF', label: 'BT ½ DÍA', color: 'bg-pink-400 text-white' }
];

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
`;

function LiquidationTable({ 
  partner, 
  total, 
  form, 
  setForm, 
  advances, 
  onAdd, 
  onDelete,
  onSaveInline
}) {
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ day: '', amount: '', concept: '' });

  const startInlineEdit = (a) => {
    setInlineEditId(a.id);
    setInlineForm({ 
      day: a.date.split('-')[2], 
      amount: a.amount.toString(), 
      concept: a.concept 
    });
  };

  const cancelInline = () => {
    setInlineEditId(null);
  };

  const saveInline = (id) => {
    onSaveInline(id, partner, inlineForm);
    setInlineEditId(null);
  };

  return (
    <section className={`flex flex-col bg-[#1f2937] rounded-3xl border ${partner === 'CR' ? 'border-blue-500/20' : 'border-pink-500/20'} overflow-hidden shadow-xl`}>
      <div className={`${partner === 'CR' ? 'bg-blue-600' : 'bg-pink-600'} px-4 py-1.5 flex justify-between items-center`}>
        <h4 className="text-[12px] font-black text-white uppercase tracking-wider">{partner} Cobrado Cash</h4>
        <div className="flex items-center gap-2">
           <span className="text-[16px] font-black text-white drop-shadow-lg">{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-[9px] font-black text-gray-500 uppercase">
              <th className="w-[50px] px-2 py-1 text-center">Día</th>
              <th className="w-[80px] px-1 py-1">OUT</th>
              <th className="px-1 py-1">Concepto</th>
              <th className="w-[80px] px-2 py-1 text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {/* Input Row (Always for Add) */}
            <tr className="bg-indigo-500/5">
              <td className="px-1 py-0.5">
                <input 
                  type="number" 
                  value={form.day} 
                  onChange={e => setForm({ ...form, day: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-black text-white p-1 rounded border border-white/10 text-center outline-none no-spinner" 
                />
              </td>
              <td className="px-0.5 py-0.5">
                <input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-black text-white p-1 rounded border border-white/10 text-center outline-none no-spinner" 
                  placeholder="0"
                />
              </td>
              <td className="px-0.5 py-0.5">
                <input 
                  type="text" 
                  value={form.concept} 
                  onChange={e => setForm({ ...form, concept: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-bold text-gray-300 p-1 rounded border border-white/10 outline-none" 
                  placeholder="Nuevo..."
                />
              </td>
              <td className="px-2 py-0.5 text-right pr-4">
                <button onClick={() => onAdd(partner)} className={`p-1 rounded text-white shadow-lg transition-all active:scale-90 ${partner === 'CR' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                   <Plus className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
            {/* Data Rows */}
            {advances.filter(a => a.partner === partner).sort((a, b) => new Date(b.date) - new Date(a.date)).map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                {inlineEditId === a.id ? (
                  <>
                    <td className="px-1 py-1">
                      <input type="number" value={inlineForm.day} onChange={e=>setInlineForm({...inlineForm, day: e.target.value})} className="w-full bg-white/10 text-[12px] font-black text-white p-1 rounded border border-indigo-500/50 text-center outline-none no-spinner" />
                    </td>
                    <td className="px-0.5 py-1">
                      <input type="number" value={inlineForm.amount} onChange={e=>setInlineForm({...inlineForm, amount: e.target.value})} className="w-full bg-white/10 text-[12px] font-black text-white p-1 rounded border border-indigo-500/50 text-center outline-none no-spinner" />
                    </td>
                    <td className="px-0.5 py-1">
                      <input type="text" value={inlineForm.concept} onChange={e=>setInlineForm({...inlineForm, concept: e.target.value})} className="w-full bg-white/10 text-[12px] font-bold text-white p-1 rounded border border-indigo-500/50 outline-none" />
                    </td>
                    <td className="px-2 py-1 text-right pr-4">
                       <div className="flex items-center justify-end gap-1">
                          <button onClick={()=>saveInline(a.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelInline} className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"><X className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5 text-[12px] font-black text-gray-500 text-center">{a.date.split('-')[2]}</td>
                    <td className={`px-1 py-1.5 text-[12px] font-black ${partner === 'CR' ? 'text-blue-400' : 'text-pink-400'}`}>{a.amount.toLocaleString()}</td>
                    <td className="px-1 py-1.5 text-[12px] font-bold text-gray-400 truncate">{a.concept}</td>
                    <td className="px-2 py-1.5 text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startInlineEdit(a)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(a.id)} className="p-1 hover:bg-rose-500/10 rounded text-gray-500 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {advances.filter(a => a.partner === partner).length === 0 && (
              <tr><td colSpan="4" className="text-center py-4 text-[9px] font-black text-gray-700 uppercase tracking-widest">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PartnersPayouts() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [crForm, setCrForm] = useState({ day: new Date().getDate(), amount: '', concept: '' });
  const [btForm, setBtForm] = useState({ day: new Date().getDate(), amount: '', concept: '' });
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [dailyLog, setDailyLog] = useState({}); 
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchPayoutRules = async () => {
    const { data: rules } = await supabase.from('instructor_payouts').select('*, activities(name, category, id, acronym)');
    if (rules) setPayoutRules(rules);
    const { data: acts } = await supabase.from('activities').select('*');
    if (acts) setAllActivities(acts);
  };

  const calculateMonthStats = (logData, y, m) => {
    const daysInMonth = new Date(y, m, 0).getDate();
    const s = { 
      CR: { office: 0, water: 0, theory: 0, fullOff: 0, halfOff: 0, totalOff: 0 }, 
      BT: { office: 0, water: 0, theory: 0, fullOff: 0, halfOff: 0, totalOff: 0 }
    };
    const logMap = {};
    (logData || []).forEach(row => { logMap[row.date] = { off: row.off_id }; });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const log = logMap[dateStr] || {};
      const val = log.off || 'EMPTY';
      if (val === 'CR') s.CR.fullOff += 1;
      if (val === 'BT') s.BT.fullOff += 1;
      if (val === 'CRBT') { s.CR.fullOff += 1; s.BT.fullOff += 1; }
      if (val === 'CR_HALF') s.CR.halfOff += 1;
      if (val === 'BT_HALF') s.BT.halfOff += 1;
    }
    s.CR.totalOff = s.CR.fullOff + (s.CR.halfOff * 0.5);
    s.BT.totalOff = s.BT.fullOff + (s.BT.halfOff * 0.5);
    return s;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      
      const settingsKey = `partner_payout_CRBT_${year}_${month}`;
      const boteInitialKey = `bote_initial_${year}_${month}`;
      
      const [ { data: setting }, { data: boteSetting } ] = await Promise.all([
        supabase.from('settings').select('value').eq('key', settingsKey).maybeSingle(),
        supabase.from('settings').select('value').eq('key', boteInitialKey).maybeSingle()
      ]);
      
      // 1. Initial Bote (Synchronized with BoteManagement)
      if (boteSetting?.value) {
        setInitialBote(Number(boteSetting.value));
      } else {
        // Fallback to carryover logic if not set
        const prevM = month === 1 ? 12 : month - 1;
        const prevY = month === 1 ? year - 1 : year;
        const prevBoteKey = `bote_final_${prevY}_${prevM}`;
        const { data: pbRow } = await supabase.from('settings').select('value').eq('key', prevBoteKey).maybeSingle();
        setInitialBote(pbRow ? Number(pbRow.value) : 70000);
      }

      // 2. Partner-specific settings
      if (setting?.value) {
        setManualAdj(setting.value.adjustments || {});
        setAssists(setting.value.assists || {});
        setAdvances(setting.value.advances || []);
        setPrevMonthBalance(setting.value.prevMonthBalance || { CR: 0, BT: 0 });
      } else {
        // ... rest of the legacy carryover for partners if needed
        setManualAdj({}); setAssists({}); setAdvances([]);
      }

      // 2. Fetch Monthly Operational Data
      const { data: allItems } = await supabase
        .from('invoice_items')
        .select('*, activities(id, name, category, acronym, tshirt_included)')
        .gte('date', firstDay)
        .lte('date', lastDay);
      
      // Filter for Table (Only CR & BT)
      setInvoiceItems((allItems || []).filter(i => PARTNER_IDS.includes(i.instructor_id)));

      const { data: logData } = await supabase.from('partner_daily_log').select('*').gte('date', firstDay).lte('date', lastDay);
      const logMap = {};
      (logData || []).forEach(row => { logMap[row.date] = { office: row.office_id, water: row.water_id, theory: row.theory_id, off: row.off_id }; });
      setDailyLog(logMap);

      // 3. Fetch Bote Stats (T-shirts from ALL staff & Insurances)
      const tCount = allItems?.filter(i => i.activities?.tshirt_included).reduce((acc, i) => acc + Number(i.quantity ?? 1), 0) || 0;
      const { data: batches } = await supabase.from('insurance_batches').select('total_pax').gte('created_at', firstDay).lte('created_at', lastDay);
      const iCount = batches?.reduce((acc, b) => acc + (b.total_pax || 0), 0) || 0;
      setBoteStats({ tshirts: tCount, insurances: iCount });

      // 4. Fetch Bote Expenses
      const { data: bExpenses } = await supabase.from('bote_expenses').select('*').gte('date', firstDay).lte('date', lastDay);
      setBoteExpenses(bExpenses || []);

    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveToSettings = async (overrides = {}) => {
    const settingsKey = `partner_payout_CRBT_${year}_${month}`;
    const payload = { adjustments: manualAdj, advances, assists, initialBote, prevMonthBalance, ...overrides };
    await supabase.from('settings').upsert({ key: settingsKey, value: payload }, { onConflict: 'key' });
  };

  const addAdvance = (partner) => {
    const form = partner === 'CR' ? crForm : btForm;
    if (!form.amount || !form.concept) return;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${form.day.toString().padStart(2, '0')}`;
    const item = { ...form, date: dateStr, partner, id: Date.now(), amount: parseFloat(form.amount) };
    const updated = [...advances, item];
    setAdvances(updated);
    saveToSettings({ advances: updated });
    const reset = { day: new Date().getDate(), amount: '', concept: '' };
    if (partner === 'CR') setCrForm(reset);
    else setBtForm(reset);
  };

  const saveInlineEdit = (id, partner, inlineForm) => {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${inlineForm.day.toString().padStart(2, '0')}`;
    const updated = advances.map(a => a.id === id ? { ...a, amount: parseFloat(inlineForm.amount), concept: inlineForm.concept, date: dateStr } : a);
    setAdvances(updated);
    saveToSettings({ advances: updated });
  };

  const deleteAdvance = (id) => {
    const updated = advances.filter(a => a.id !== id);
    setAdvances(updated);
    saveToSettings({ advances: updated });
  };

  const updateLog = async (date, field, value) => {
    const current = dailyLog[date] || {};
    const updated = { ...current, [field]: value };
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
      const qty = Number(item.quantity ?? 1);
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
  const finalBoteProyectado = initialBote + totalComm + totalAssists + totalAdj - totalAdvances;

  const totalCRAdvances = advances.filter(a => a.partner === 'CR').reduce((acc, a) => acc + a.amount, 0);
  const totalBTAdvances = advances.filter(a => a.partner === 'BT').reduce((acc, a) => acc + a.amount, 0);

  // Per-partner totals (50/50 split of gross income)
  const grossIncome = totalComm + totalAssists + totalAdj;
  const halfGross = grossIncome / 2;
  
  const totalCRPayout = halfGross - totalCRAdvances;
  const totalBTPayout = halfGross - totalBTAdvances;

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700 overflow-hidden text-slate-300">
      <style>{noSpinnerStyle}</style>
      
      {/* Top Header */}
      <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><UsersRound className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Liquidación Socios (CRBT)</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-none mt-1">Gestión Unificada</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-surface-edge shadow-inner">
          <div className="flex items-center gap-1 px-3">
            <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="p-1 hover:bg-surface-edge rounded-lg text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
            <span className="text-white font-black text-sm min-w-[100px] text-center uppercase tracking-tighter">{months[month - 1]} {year}</span>
            <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="p-1 hover:bg-surface-edge rounded-lg text-gray-400"><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-2">
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
            <div className="flex gap-6 justify-center items-start min-w-max h-full px-4">
              
              {/* Table 1: ACTIVIDAD CONSOLIDADA */}
              <div className="flex-none w-fit max-w-[850px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-full">
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead className="sticky top-0 z-30 bg-table-header/98 backdrop-blur-xl h-[70px]">
                      <tr className="border-b border-surface-edge">
                        <th className="p-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-12 bg-surface-soft">Día</th>
                        {fixedColumns.map(col => (
                          <th key={col.key} className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[35px]">
                            <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{col.label.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                          </th>
                        ))}
                        {dynamicActivities.map(act => (
                          <th key={act.id} className="p-0 text-[16px] font-black text-amber-500/80 uppercase tracking-tighter text-center border-l border-surface-edge/30 bg-amber-500/5 w-[35px]">
                            <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{(act.acronym || act.name).split('').slice(0, 8).map((char, i) => <span key={i}>{char}</span>)}</div>
                          </th>
                        ))}
                        <th className="p-0 text-[16px] font-black text-cyan-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-[35px] bg-cyan-500/5">
                          <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{'ASS'.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                        </th>
                        <th className="p-1 text-[16px] font-black text-indigo-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-16 bg-indigo-500/5 min-w-[64px]">Extra</th>
                        <th className="p-2 text-[16px] font-black text-white uppercase tracking-widest text-right bg-surface-edge/30 w-auto">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-edge/40">
                      {Object.keys(matrixData).map(day => (
                        <tr key={day} className="group hover:bg-white/5 transition-colors h-9">
                          <td className="p-0 text-center font-black text-gray-600 text-sm">{day}</td>
                          {fixedColumns.map(col => {
                             const count = matrixData[day].items[col.key] || 0;
                             return (<td key={col.key} className="p-0 border-l border-surface-edge/10 text-center w-[35px] min-w-[35px]"><span className={`text-base font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>{count || ''}</span></td>);
                          })}
                          {dynamicActivities.map(act => {
                              const count = matrixData[day].items[`dyn_${act.id}`] || 0;
                              return (<td key={act.id} className="p-0 border-l border-surface-edge/10 text-center bg-amber-500/5 w-[35px] min-w-[35px]"><span className={`text-[17px] font-black ${count > 0 ? 'text-amber-400' : 'text-gray-800'}`}>{count || ''}</span></td>);
                           })}
                          <td className="p-0 border-l border-surface-edge/10 bg-cyan-500/5"><input type="number" value={assists[day] || ''} onChange={(e) => { const n = {...assists, [day]: parseInt(e.target.value)||0}; setAssists(n); saveToSettings({assists:n}); }} className="w-full bg-transparent text-center text-cyan-400 font-black text-base outline-none no-spinner" placeholder="0" /></td>
                          <td className="p-0 border-l border-surface-edge/10 bg-indigo-500/5"><input type="number" value={manualAdj[day] || ''} onChange={(e) => { const n = {...manualAdj, [day]: parseFloat(e.target.value)||0}; setManualAdj(n); saveToSettings({adjustments:n}); }} className="w-full bg-transparent text-center text-indigo-400 font-black text-sm outline-none no-spinner" placeholder="0" /></td>
                          <td className="p-0 text-right border-l border-surface-edge/10 bg-surface-edge/5 pr-4">
                            <span className={`text-sm font-black ${matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000) > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                              {(matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000)).toLocaleString()} ฿
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-30 bg-surface-soft border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)] h-9 font-black">
                      <tr>
                        <td className="p-0 text-center text-gray-500 text-[10px] uppercase">TOT</td>
                        {fixedColumns.map(col => (<td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-sm text-gray-300">{Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}</td>))}
                        {dynamicActivities.map(act => (<td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[13px] text-amber-500/60 bg-amber-500/5">{Object.values(matrixData).reduce((acc, d) => acc + (d.items[`dyn_${act.id}`] || 0), 0)}</td>))}
                        <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 text-sm bg-cyan-500/5">{Object.values(assists).reduce((acc, val) => acc + val, 0)}</td>
                        <td className="p-0 text-center border-l border-surface-edge/10 text-indigo-400 text-sm bg-indigo-500/5">{totalAdj.toLocaleString()} ฿</td>
                        <td className="p-1 text-right border-l border-surface-edge/20 text-emerald-400 text-lg bg-surface-edge/30 pr-4">{(totalComm + totalAssists + totalAdj).toLocaleString()} ฿</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Table 2: LOG DIARIO INDIVIDUAL */}
              <div className="flex-none min-w-[400px] max-w-[550px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-full">
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead className="sticky top-0 z-40 bg-black/80 backdrop-blur-md h-[70px]">
                      <tr className="border-b border-surface-edge">
                        <th className="px-2 text-[16px] font-black text-slate-400 uppercase tracking-widest w-20 text-right pr-4">Día</th>
                        {['OFIC', 'AGUA', 'TEO', 'OFF'].map(h => (<th key={h} className="text-[16px] font-black text-slate-400 uppercase text-center border-l border-surface-edge/20">{h}</th>))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-edge/10">
                      {Array.from({length: new Date(year, month, 0).getDate()}).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const log = dailyLog[dateStr] || {};
                        const dayName = new Date(year, month-1, day).toLocaleDateString('es-ES', {weekday: 'short'}).toUpperCase();
                        return (
                          <tr key={day} className="hover:bg-white/5 transition-colors h-9">
                            <td className="pr-4 text-right">
                               <div className="flex items-center justify-end gap-2 leading-none">
                                  <span className="text-[10px] font-black text-slate-600">{dayName.slice(0,3)}</span>
                                  <span className="text-xs font-black text-white w-4">{day}</span>
                               </div>
                            </td>
                            {['office', 'water', 'theory', 'off'].map(field => (
                              <td key={field} className="px-0.5 border-l border-surface-edge/10">
                                 <select value={log[field] || 'EMPTY'} onChange={e => updateLog(dateStr, field, e.target.value)} className={`w-full text-[12px] font-black rounded-md px-1 py-1.5 outline-none appearance-none text-center ${LOG_OPTIONS.find(o => o.id === (log[field] || 'EMPTY'))?.color}`}>
                                   {LOG_OPTIONS.map(opt => <option key={opt.id} value={opt.id} className="bg-surface text-white">{opt.label}</option>)}
                                 </select>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-30 bg-black/90 border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.5)] h-10 font-black text-[14px]">
                      <tr>
                        <td className="pr-4 text-right text-slate-500 uppercase text-[11px]">TOT</td>
                        {['office', 'water', 'theory', 'totalOff'].map(field => (
                          <td key={field} className="text-center border-l border-surface-edge/10 p-0">
                            <div className="flex h-full items-center divide-x divide-white/5">
                               <div className="flex-1 text-blue-400 py-2">{stats.CR[field]}</div>
                               <div className="flex-1 text-pink-400 py-2">{stats.BT[field]}</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`absolute top-4 right-0 z-50 p-2 bg-surface-edge border border-surface-edge text-white rounded-l-xl shadow-2xl hover:bg-brand transition-all duration-300`}>
          {sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <div className={`bg-surface border-l border-surface-edge flex flex-col overflow-hidden transition-all duration-500 ease-in-out shadow-2xl z-10 ${sidebarOpen ? 'w-[400px] p-6 opacity-100' : 'w-0 p-0 opacity-0'}`}>
          <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 min-w-[352px] mt-10 pb-10">
            
            {/* 1. Recuento de Días */}
            <section className="space-y-4">
               <div className="bg-surface-soft border border-surface-edge rounded-3xl overflow-hidden shadow-xl">
                  <table className="w-full text-center border-collapse text-[12px] table-fixed">
                     <thead>
                        <tr className="bg-black/40 border-b border-surface-edge">
                          <th className="p-[1px]"></th>
                          <th className="p-[1px] bg-blue-500/5 text-blue-400 font-black">OFF</th>
                          <th className="p-[1px] bg-blue-500/5 text-blue-400 font-black">1/2</th>
                          <th className="p-[1px] bg-blue-500/10 text-blue-400 font-black">TOT</th>
                          <th className="p-[1px] text-gray-500 font-black uppercase">Ant.</th>
                          <th className="p-[1px] bg-white/5 font-black uppercase">TOT 2</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-surface-edge/10">
                        {['CR', 'BT'].map(p => (
                          <tr key={p} className="h-10 font-black text-xs">
                            <td className="p-[1px] h-10">
                               <div className={`w-full h-[38px] rounded-md flex items-center justify-center text-white font-black text-[11px] ${p === 'CR' ? 'bg-blue-600' : 'bg-pink-600'}`}>{p}</div>
                            </td>
                            <td className="p-[1px] text-blue-400 bg-blue-500/5 text-[12px]">{stats[p].fullOff}</td>
                            <td className="p-[1px] text-blue-400 bg-blue-500/5 text-[12px]">{stats[p].halfOff}</td>
                            <td className="p-[1px] text-blue-400 bg-blue-500/10 text-[12px]">{stats[p].totalOff}</td>
                            <td className="p-[1px] text-gray-500 font-bold text-[12px]">{prevMonthBalance[p]}</td>
                            <td className="p-[1px] text-white bg-white/5 text-[12px]">{stats[p].totalOff + prevMonthBalance[p]}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               {diffDays !== 0 && (
                  <div className={`p-5 rounded-[28px] flex flex-col items-center justify-center gap-2 shadow-2xl border-2 transition-all animate-in zoom-in duration-500 ${diffDays > 0 ? 'bg-pink-600 border-pink-400 text-white shadow-pink-900/40' : 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40'}`}>
                     <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-white/80" />
                        <span className="text-[16px] font-black uppercase tracking-tighter">
                          {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'día' : 'días'} le debes a {diffDays > 0 ? 'BT' : 'CR'}
                        </span>
                     </div>
                     <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Compensación de Días Libres</p>
                  </div>
               )}
            </section>

            {/* 2. Liquidaciones INDIVIDUALES */}
            <div className="space-y-6 mt-12">
              <LiquidationTable 
                partner="CR" 
                total={totalCRAdvances} 
                form={crForm} 
                setForm={setCrForm} 
                advances={advances}
                onAdd={addAdvance}
                onDelete={deleteAdvance}
                onSaveInline={saveInlineEdit}
              />
              <LiquidationTable 
                partner="BT" 
                total={totalBTAdvances} 
                form={btForm} 
                setForm={setBtForm} 
                advances={advances}
                onAdd={addAdvance}
                onDelete={deleteAdvance}
                onSaveInline={saveInlineEdit}
              />
            </div>

            {/* Estado del Bote Sidebar Widget */}
            <section className="space-y-4 mt-12">
               <div className="bg-[#1f2937] border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="bg-amber-400 py-3 px-8">
                     <p className="text-[12px] font-black text-amber-950 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Package className="w-4 h-4" /> ESTADO DEL BOTE
                     </p>
                  </div>
                  
                  <div className="p-8 space-y-6 relative z-10">

                    <div className="space-y-4">
                       <div className="flex justify-between items-center group/item">
                         <span className="text-sm font-black text-zinc-400 uppercase tracking-widest group-hover/item:text-zinc-200 transition-colors">FONDO INICIAL</span>
                         <span className="text-lg font-black text-amber-500 tracking-tighter">{initialBote.toLocaleString()} ฿</span>
                       </div>

                       <div className="flex justify-between items-center group/item">
                         <span className="text-sm font-black text-zinc-400 uppercase tracking-widest group-hover/item:text-zinc-200 transition-colors">INGRESOS BOTE</span>
                         <span className="text-lg font-black text-emerald-400 tracking-tighter">+{((boteStats.tshirts * 160) + (boteStats.insurances * 75)).toLocaleString()} ฿</span>
                       </div>

                       <div className="flex justify-between items-center group/item">
                         <span className="text-sm font-black text-zinc-400 uppercase tracking-widest group-hover/item:text-zinc-200 transition-colors">GASTOS MATERIAL</span>
                         <span className="text-lg font-black text-rose-400 tracking-tighter">-{boteExpenses.reduce((acc, e) => acc + Number(e.amount), 0).toLocaleString()} ฿</span>
                       </div>
                    </div>

                    <div className="pt-6 border-t-2 border-white/5 flex flex-col items-center">
                      <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">SALDO FINAL PROYECTADO</p>
                      <h2 className="text-5xl font-black text-white tracking-tighter flex items-baseline gap-2">
                        {(initialBote + (boteStats.tshirts * 160) + (boteStats.insurances * 75) - boteExpenses.reduce((acc, e) => acc + Number(e.amount), 0)).toLocaleString()} 
                        <span className="text-xl text-brand italic opacity-50">฿</span>
                      </h2>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
