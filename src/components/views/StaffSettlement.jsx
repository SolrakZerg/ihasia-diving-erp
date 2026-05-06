import { useState, useEffect, useMemo, useRef } from 'react';
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
  Loader2,
  Search,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function StaffSettlement() {
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [staff, setStaff] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [payoutRules, setPayoutRules] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeStaffIds, setActiveStaffIds] = useState(new Set());
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  
  // Manual Adjustments & Advances
  const [manualAdj, setManualAdj] = useState({}); // { day: { amount, concept } }
  const [adjModal, setAdjModal] = useState({ open: false, day: null, amount: 0, concept: '' });
  const [assists, setAssists] = useState({}); // { day: count }
  const [attendanceOverrides, setAttendanceOverrides] = useState({}); // { day: 'OFF' | 'HALF' | 'WORK' }
  const [advances, setAdvances] = useState([]); // [ { id, amount, date, concept } ]

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const fixedKeys = ['FD', 'SR1', 'SR2', 'DSD1', 'DSD2', 'SD', 'OW', 'AOW', 'S&R', 'CAN'];
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [newAdv, setNewAdv] = useState({ amount: '', concept: 'Adelanto' });

  useEffect(() => {
    fetchStaff();
    fetchPayoutRules();
  }, []);

  useEffect(() => {
    fetchActiveStaff();
  }, [month, year]);

  useEffect(() => {
    if (selectedStaffId) {
      fetchData();
    }
  }, [selectedStaffId, month, year]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('id, first_name, last_name, initials, role, commission_rate').order('first_name');
    if (data) {
      setStaff(data);
    }
  };

  const fetchActiveStaff = async () => {
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    
    const { data } = await supabase
      .from('invoice_items')
      .select('instructor_id')
      .gte('date', firstDay)
      .lte('date', lastDay);
      
    if (data) {
      const ids = new Set(data.map(i => i.instructor_id).filter(Boolean));
      setActiveStaffIds(ids);
      
      if (ids.size > 0 && (!selectedStaffId || !ids.has(selectedStaffId))) {
        setSelectedStaffId(Array.from(ids)[0]);
      }
    } else {
      setActiveStaffIds(new Set());
    }
  };

  const fetchPayoutRules = async () => {
    const { data: rules } = await supabase.from('instructor_payouts').select('*, activities(name, category, id, acronym)');
    if (rules) setPayoutRules(rules);
    
    const { data: acts } = await supabase.from('activities').select('*');
    if (acts) setAllActivities(acts);
  };

  const fetchData = async () => {
    setLoading(true);
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    
    const { data: items, error: fetchError } = await supabase
      .from('invoice_items')
      .select('*, activities(id, name, category, acronym, duration_days), customers(first_name), instructor:staff(id, initials)')
      .gte('date', firstDay) 
      .lte('date', lastDay);

    if (fetchError) console.error("Error fetching items:", fetchError);

    const selectedMember = staff.find(s => s.id === selectedStaffId);

    const filteredItems = (items || []).filter(it => {
      const itInstId = typeof it.instructor_id === 'object' ? it.instructor_id?.id : it.instructor_id;
      const itInitials = it.instructor?.initials;
      
      const matchId = String(itInstId) === String(selectedStaffId);
      const matchInitials = itInitials && selectedMember && itInitials === selectedMember.initials;
      
      return matchId || matchInitials;
    });
    setInvoiceItems(filteredItems);

    const [ { data: settlement }, { data: sAdvances }, { data: sActivity }, { data: sAdjs } ] = await Promise.all([
      supabase.from('staff_settlements').select('*').eq('year', year).eq('month', month).eq('staff_id', selectedStaffId).maybeSingle(),
      supabase.from('staff_advances').select('*').eq('year', year).eq('month', month).eq('staff_id', selectedStaffId),
      supabase.from('staff_daily_activity').select('*').eq('year', year).eq('month', month).eq('staff_id', selectedStaffId),
      supabase.from('staff_adjustments').select('*').eq('year', year).eq('month', month).eq('staff_id', selectedStaffId)
    ]);

    setAdvances(sAdvances || []);
    
    const assistMap = {};
    const attMap = {};
    sActivity?.forEach(row => {
      if (row.assists > 0) assistMap[row.day] = row.assists;
      if (row.attendance_status !== 'AUTO') attMap[row.day] = row.attendance_status;
    });
    setAssists(assistMap);
    setAttendanceOverrides(attMap);

    const adjMap = {};
    sAdjs?.forEach(row => { 
      if (row.amount !== 0 || row.concept) adjMap[row.day] = { amount: row.amount, concept: row.concept || '' }; 
    });
    setManualAdj(adjMap);
    
    setLoading(false);
  };

  const updateDailyActivity = async (day, updates) => {
    const { data: existing } = await supabase.from('staff_daily_activity').select('*').eq('year', year).eq('month', month).eq('day', day).eq('staff_id', selectedStaffId).maybeSingle();
    
    const payload = {
      year, month, day, staff_id: selectedStaffId,
      assists: updates.assists !== undefined ? updates.assists : (existing?.assists || 0),
      attendance_status: updates.attendance_status !== undefined ? updates.attendance_status : (existing?.attendance_status || 'AUTO')
    };

    await supabase.from('staff_daily_activity').upsert(payload, { onConflict: 'year, month, day, staff_id' });
  };

  const handleAdjUpdate = async (day, amount, concept) => {
    const newAmount = amount !== undefined ? (parseFloat(amount) || 0) : (manualAdj[day]?.amount || 0);
    const newConcept = concept !== undefined ? concept : (manualAdj[day]?.concept || '');

    if (newAmount === 0 && !newConcept) {
      setManualAdj(prev => {
        const newMap = { ...prev };
        delete newMap[day];
        return newMap;
      });
      await supabase.from('staff_adjustments').delete().eq('year', year).eq('month', month).eq('day', day).eq('staff_id', selectedStaffId);
    } else {
      setManualAdj(prev => ({ ...prev, [day]: { amount: newAmount, concept: newConcept } }));
      await supabase.from('staff_adjustments').upsert({
        year, month, day, staff_id: selectedStaffId, amount: newAmount, concept: newConcept
      }, { onConflict: 'year, month, day, staff_id' });
    }
  };
  
  const handleAssChange = async (day, value) => {
    if (value === '') {
      setAssists(prev => {
        const newMap = { ...prev };
        delete newMap[day];
        return newMap;
      });
      await updateDailyActivity(day, { assists: 0 });
    } else {
      const val = parseInt(value) || 0;
      setAssists(prev => ({ ...prev, [day]: val }));
      await updateDailyActivity(day, { assists: val });
    }
  };

  const handleAttendanceToggle = async (day) => {
    const current = attendanceOverrides[day] || 'AUTO';
    const states = ['AUTO', 'OFF', 'HALF', 'WORK'];
    const next = states[(states.indexOf(current) + 1) % states.length];
    
    setAttendanceOverrides(prev => ({ ...prev, [day]: next }));
    await updateDailyActivity(day, { attendance_status: next });
  };

  const addAdvance = async (amount, concept = 'Adelanto') => {
    const { data: newAdv } = await supabase.from('staff_advances').insert({
      year, month, staff_id: selectedStaffId, amount: parseFloat(amount) || 0, concept, date: new Date().toISOString()
    }).select().single();

    if (newAdv) setAdvances(prev => [...prev, newAdv]);
  };

  const removeAdvance = async (idx) => {
    const actualId = advances[idx]?.id;
    if (actualId) {
      const { error } = await supabase.from('staff_advances').delete().eq('id', actualId);
      if (!error) setAdvances(prev => prev.filter(a => a.id !== actualId));
    }
  };

  // Matrix Processing
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
    for (let i = 1; i <= daysInMonth; i++) data[i] = { items: {}, colTotals: {}, total: 0 };
    invoiceItems.forEach(item => {
      if (!item.date) return;
      const [y, m, d] = item.date.substring(0, 10).split('-').map(Number);
      if (y !== year || m !== month || !data[d]) return;
      const actId = String(item.activity_id || '');
      let colKey = null;
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      if (fixedCol) colKey = fixedCol.key;
      else {
        const dynCol = dynamicActivities.find(a => String(a.id) === actId);
        if (dynCol) colKey = `dyn_${actId}`;
      }
      if (colKey) {
        const qty = Number(item.quantity ?? 1);
        data[d].items[colKey] = (data[d].items[colKey] || 0) + qty;
        const rule = payoutRules.find(r => String(r.activity_id) === actId);
        if (rule) {
          const money = qty * rule.amount_thb;
          data[d].colTotals[colKey] = (data[d].colTotals[colKey] || 0) + money;
          data[d].total += money;
        }
      }
    });
    return data;
  }, [invoiceItems, payoutRules, month, year, fixedColumns, dynamicActivities]);

  const attendanceData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const map = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = { morning: false, afternoon: false };
    invoiceItems.forEach(item => {
      const duration = item.activities?.duration_days || 0.5;
      const [y, m, d] = (item.date || '').split('-').map(Number);
      if (y !== year || m !== month || !map[d]) return;
      if (duration % 1 !== 0) map[d].morning = true;
      else { map[d].morning = true; map[d].afternoon = true; }
      const fullDaysBefore = (duration % 1 !== 0) ? Math.floor(duration) : (duration - 1);
      for (let i = 1; i <= fullDaysBefore; i++) {
        const prevDate = new Date(year, month - 1, d - i);
        if (prevDate.getMonth() + 1 === month && prevDate.getFullYear() === year) {
          const prevDay = prevDate.getDate();
          if (map[prevDay]) { map[prevDay].morning = true; map[prevDay].afternoon = true; }
        }
      }
    });
    const result = {};
    let fullOffCount = 0;
    let halfOffCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const override = attendanceOverrides[d] || 'AUTO';
      let status = 'WORK';
      if (override === 'AUTO') {
        if (!map[d].morning && !map[d].afternoon) status = 'OFF';
        else if (!map[d].afternoon) status = 'HALF';
      } else status = override;
      result[d] = status;
      if (status === 'OFF') fullOffCount++;
      if (status === 'HALF') halfOffCount++;
    }
    return { grid: result, summary: { fullOff: fullOffCount, halfOff: halfOffCount, totalOff: fullOffCount + (halfOffCount * 0.5) } };
  }, [invoiceItems, attendanceOverrides, month, year]);

  const totalComm = Object.values(matrixData).reduce((acc, d) => acc + d.total, 0);
  const totalAssists = Object.values(assists).reduce((acc, val) => acc + (val * 2000), 0);
  const totalAdj = Object.values(manualAdj).reduce((acc, val) => acc + (val.amount || 0), 0);
  const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);
  const finalBalance = totalComm + totalAssists + totalAdj - totalAdvances;

  // AUTO-SAVE LOGIC
  useEffect(() => {
    if (!selectedStaffId || loading) return;

    const sync = async () => {
      setSyncing(true);
      await supabase.from('staff_settlements').upsert({
        year, month, staff_id: selectedStaffId,
        total_commissions: totalComm,
        total_bonus: totalAssists + totalAdj,
        total_advances: totalAdvances,
        days_off: attendanceData.summary.totalOff,
        assists_count: Object.values(assists).reduce((acc, v) => acc + v, 0),
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month, staff_id' });
      setSyncing(false);
    };

    const timer = setTimeout(sync, 1000); // Debounce to avoid too many writes
    return () => clearTimeout(timer);
  }, [totalComm, totalAssists, totalAdj, totalAdvances, finalBalance, attendanceData.summary.totalOff, selectedStaffId, loading]);

  const selectedMember = staff.find(s => s.id === selectedStaffId);

  return (
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700">
      <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 rounded-2xl text-brand"><Users className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Liquidación de Staff</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Panel de Control de Sueldos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-surface-edge shadow-inner relative">
          <div className="relative">
            <button onClick={() => setShowStaffDropdown(!showStaffDropdown)} className="flex items-center gap-3 px-4 py-2 bg-surface-soft/50 hover:bg-surface-soft rounded-xl border border-surface-edge/50 transition-all min-w-[240px] group">
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs">{selectedMember?.initials || '??'}</div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Instructor</p>
                <p className="text-sm font-black text-white leading-none truncate">{selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Seleccionar...'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showStaffDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStaffDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStaffDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1c2d]/95 backdrop-blur-xl border border-surface-edge rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-surface-edge/50 flex items-center gap-2 bg-white/5"><Search className="w-3.5 h-3.5 text-gray-500 ml-2" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Filtrado por facturación</span></div>
                  <div className="max-h-[500px] overflow-auto custom-scrollbar">
                    {staff.filter(s => activeStaffIds.has(s.id)).map(s => (
                      <button key={s.id} onClick={() => { setSelectedStaffId(s.id); setShowStaffDropdown(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand/10 transition-colors text-left group ${selectedStaffId === s.id ? 'bg-brand/5' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedStaffId === s.id ? 'bg-brand text-[#1a1c2d]' : 'bg-surface-edge text-gray-400 group-hover:bg-brand/20 group-hover:text-brand'}`}>{s.initials}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-black transition-colors ${selectedStaffId === s.id ? 'text-brand' : 'text-gray-300 group-hover:text-white'}`}>{s.first_name} {s.last_name}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{s.role}</p>
                        </div>
                        {selectedStaffId === s.id && <Check className="w-4 h-4 text-brand" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* HYBRID DATE SELECTOR */}
          <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
            <button 
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear(prev => prev - 1);
                } else {
                  setMonth(prev => prev - 1);
                }
              }}
              className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
              <select 
                value={month} 
                onChange={e => setMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
                ))}
              </select>
              
              <div className="w-px h-4 bg-surface-edge/30 mx-1" />

              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear(prev => prev + 1);
                } else {
                  setMonth(prev => prev + 1);
                }
              }}
              className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 px-6 py-2 min-h-0 flex flex-col">
          <div className="h-fit max-h-full bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden max-w-[850px] flex flex-col mx-auto">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-30 bg-table-header/98 backdrop-blur-xl">
                  <tr className="border-b border-surface-edge">
                    <th className="p-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-12 bg-surface-soft">Día</th>
                    {fixedColumns.map(col => (
                      <th key={col.key} className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 transition-colors hover:text-white w-[35px] h-[70px]">
                        <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{col.label.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                      </th>
                    ))}
                    {dynamicActivities.map(act => (
                      <th key={act.id} className="p-0 text-[16px] font-black text-amber-500/80 uppercase tracking-tighter text-center border-l border-surface-edge/30 bg-amber-500/5 w-[35px] h-[70px]">
                        <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{(act.acronym || act.name).split('').slice(0, 8).map((char, i) => <span key={i}>{char}</span>)}</div>
                      </th>
                    ))}
                    <th className="p-0 text-[16px] font-black text-cyan-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-[35px] bg-cyan-500/5 h-[70px]">
                      <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{'ASS'.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                    </th>
                    <th className="p-1 text-[16px] font-black text-brand uppercase tracking-widest text-center border-l border-surface-edge/30 w-16 bg-brand/5 min-w-[64px]">Extra</th>
                    <th className="p-2 text-[12px] font-black text-indigo-400 uppercase tracking-widest text-center w-12 border-l border-surface-edge/30 bg-indigo-500/5 min-w-[48px]">OFF</th>
                    <th className="p-2 text-[16px] font-black text-white uppercase tracking-widest text-right bg-surface-edge/30 w-auto">Total</th>
                  </tr>
                  <tr className="border-b border-surface-edge/50 bg-surface-edge/5 h-8">
                    <td className="p-0 text-center text-gray-500 font-black text-[10px] uppercase tracking-widest bg-surface-soft">TOT</td>
                    {fixedColumns.map(col => (
                      <td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-[13px] font-black text-brand italic">
                        {Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}
                      </td>
                    ))}
                    {dynamicActivities.map(act => (
                      <td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[12px] font-black text-amber-500 bg-amber-500/5">
                        {Object.values(matrixData).reduce((acc, d) => acc + (d.items[`dyn_${act.id}`] || 0), 0)}
                      </td>
                    ))}
                    <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 font-black text-[13px] bg-cyan-500/5">
                      {Object.values(assists).reduce((acc, val) => acc + val, 0)}
                    </td>
                    <td className="p-0 text-center border-l border-surface-edge/10 text-brand font-black text-[11px] bg-brand/5">
                      {totalAdj.toLocaleString()} ฿
                    </td>
                    <td className="p-0 text-center border-l border-surface-edge/10 bg-indigo-500/5">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-black text-emerald-400">{attendanceData.summary.fullOff}F</span>
                        <span className="text-[10px] font-black text-amber-400">{attendanceData.summary.halfOff}H</span>
                      </div>
                    </td>
                    <td className="p-1 text-right border-l border-surface-edge/20 text-emerald-400 font-black text-sm bg-surface-edge/30 pr-4">
                      {(totalComm + totalAssists + totalAdj).toLocaleString()} ฿
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-edge/40">
                  {Object.keys(matrixData).map(day => (
                    <tr key={day} className="group hover:bg-white/5 transition-colors h-[34px]">
                      <td className="p-0 text-center font-black text-gray-600 text-sm">{day}</td>
                      {fixedColumns.map(col => {
                         const count = matrixData[day].items[col.key] || 0;
                         return (<td key={col.key} className="p-0 border-l border-surface-edge/10 text-center w-[35px] min-w-[35px]"><span className={`text-base font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>{count || ''}</span></td>);
                      })}
                      {dynamicActivities.map(act => {
                          const count = matrixData[day].items[`dyn_${act.id}`] || 0;
                          return (<td key={act.id} className="p-0 border-l border-surface-edge/10 text-center bg-amber-500/5 w-[35px] min-w-[35px]"><span className={`text-[17px] font-black ${count > 0 ? 'text-amber-400' : 'text-gray-800'}`}>{count || ''}</span></td>);
                       })}
                      <td className="p-0 border-l border-surface-edge/10 bg-cyan-500/5"><input type="number" value={assists[day] || ''} onChange={(e) => handleAssChange(day, e.target.value)} className="w-full bg-transparent text-center text-cyan-400 font-black text-base outline-none focus:bg-cyan-500/10 rounded py-0" /></td>
                      <td 
                        className="p-0 border-x border-brand/10 bg-slate-500/30 relative cursor-pointer hover:bg-brand/20 transition-all group/adj shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]"
                        onClick={() => setAdjModal({ 
                          open: true, 
                          day, 
                          amount: manualAdj[day]?.amount || 0, 
                          concept: manualAdj[day]?.concept || '' 
                        })}
                      >
                        {/* CUSTOM TOOLTIP */}
                        {manualAdj[day]?.concept && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] font-medium rounded-lg shadow-2xl opacity-0 group-hover/adj:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap border border-white/10 flex flex-col items-center">
                            {manualAdj[day].concept}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                          </div>
                        )}

                        <div className="flex items-center justify-center h-full gap-1">
                          {manualAdj[day]?.amount ? (
                            <span className="text-sm font-black text-white/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                              {manualAdj[day].amount}
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand/20 group-hover/adj:text-brand/60 transition-colors font-black">+</span>
                          )}
                        </div>
                      </td>
                      <td className={`p-0 border-l border-surface-edge/10 text-center cursor-pointer transition-all ${attendanceData.grid[day] === 'OFF' ? 'bg-emerald-500/20' : attendanceData.grid[day] === 'HALF' ? 'bg-amber-500/20' : ''}`} onClick={() => handleAttendanceToggle(day)}>
                        <span className={`text-[11px] font-black ${attendanceData.grid[day] === 'OFF' ? 'text-emerald-400' : attendanceData.grid[day] === 'HALF' ? 'text-amber-400' : 'text-blue-400/90'}`}>{attendanceData.grid[day] === 'OFF' ? 'OFF' : attendanceData.grid[day] === 'HALF' ? 'HALF' : 'WORK'}</span>
                      </td>
                      <td className="p-0 text-right border-l border-surface-edge/10 bg-surface-edge/5 pr-4"><span className={`text-sm font-black ${matrixData[day].total + (manualAdj[day]?.amount || 0) + ((assists[day] || 0) * 2000) > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>{(matrixData[day].total + (manualAdj[day]?.amount || 0) + ((assists[day] || 0) * 2000)).toLocaleString()} ฿</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-30 bg-surface-soft border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
                  <tr className="h-9 font-black">
                    <td className="p-0 text-center text-gray-500 font-black text-[10px] uppercase tracking-widest">TOTAL</td>
                    {fixedColumns.map(col => (
                      <td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-[11px] text-gray-400">
                        {Object.values(matrixData).reduce((acc, d) => acc + (d.colTotals[col.key] || 0), 0).toLocaleString()}
                      </td>
                    ))}
                    {dynamicActivities.map(act => (
                      <td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[11px] text-amber-500/60 bg-amber-500/5">
                        {Object.values(matrixData).reduce((acc, d) => acc + (d.colTotals[`dyn_${act.id}`] || 0), 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 text-[11px] bg-cyan-500/5">
                      {totalAssists.toLocaleString()}
                    </td>
                    <td className="p-0 text-center border-l border-surface-edge/10 text-brand text-[11px] bg-brand/5">
                      {totalAdj.toLocaleString()}
                    </td>
                    <td className="p-0 text-center border-l border-surface-edge/10 bg-indigo-500/5"></td>
                    <td className="p-1 text-right border-l border-surface-edge/20 text-emerald-400 text-lg bg-surface-edge/30 pr-4">
                      {(totalComm + totalAssists + totalAdj).toLocaleString()} ฿
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="w-[380px] bg-surface-soft border-l border-surface-edge flex flex-col p-8 space-y-10 overflow-auto shadow-2xl z-10">
          <div className="bg-emerald-600 rounded-[32px] p-8 shadow-xl shadow-emerald-900/20 relative overflow-hidden group border border-emerald-400/20">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex justify-between items-start relative z-10">
               <p className="text-lg font-black text-emerald-100 uppercase tracking-[0.2em] mb-4 opacity-80">Sueldo</p>
               {syncing && <Loader2 className="w-4 h-4 text-white/50 animate-spin" />}
            </div>
            <div className="relative z-10">
               <h3 className="text-6xl font-black text-white tracking-tighter leading-none mb-2">
                 {finalBalance.toLocaleString()}
                 <span className="text-xl font-black text-emerald-300/40 ml-2 italic">฿</span>
               </h3>
               <div className="flex items-center gap-4 mt-6">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-emerald-950/40 uppercase tracking-widest leading-none mb-1">Días Libres</span>
                    <span className="text-xl font-black text-white leading-none">{attendanceData.summary.totalOff}</span>
                  </div>
                  <div className="w-px h-8 bg-emerald-950/10" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-emerald-950/40 uppercase tracking-widest leading-none mb-1">Asistencias</span>
                    <span className="text-xl font-black text-white leading-none">{Object.values(assists).reduce((acc, v) => acc + v, 0)}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-emerald-950/50 text-[10px] font-black uppercase tracking-[0.2em] mt-6 border-t border-emerald-950/5 pt-4">
                 <TrendingUp className="w-3.5 h-3.5" />
                 <span>Sincronizado</span>
               </div>
            </div>
          </div>

          <section className="space-y-4">
            <h4 className="text-lg font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4" /> Desglose Económico</h4>
            <div className="bg-surface p-6 rounded-2xl border border-surface-edge space-y-4">
              <div className="flex justify-between items-center group/item"><span className="text-base font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Cursos</span><span className="text-base font-black text-white">{totalComm.toLocaleString()} ฿</span></div>
              <div className="flex justify-between items-center group/item"><span className="text-base font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Extras y Ajustes</span><span className={`text-base font-black ${totalAdj + totalAssists >= 0 ? 'text-brand' : 'text-rose-400'}`}>{totalAdj + totalAssists >= 0 ? '+' : ''}{(totalAdj + totalAssists).toLocaleString()}</span></div>
              <div className="h-px bg-surface-edge/50 my-2" />
              <div className="flex justify-between items-center text-rose-400"><span className="text-base font-bold">Cobrado</span><span className="text-base font-black">-{totalAdvances.toLocaleString()} ฿</span></div>
            </div>
          </section>

          <section className="space-y-4 flex-1">
             <div className="flex items-center justify-between"><h4 className="text-lg font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Banknote className="w-4 h-4" /> Pagos</h4><button onClick={() => setShowAdvForm(!showAdvForm)} className={`p-1.5 rounded-lg transition-all ${showAdvForm ? 'bg-rose-500 text-white' : 'bg-brand/10 text-brand hover:bg-brand hover:text-white'}`}>{showAdvForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button></div>
             {showAdvForm && (<div className="bg-surface p-4 rounded-xl border border-brand/30 animate-in slide-in-from-top-2 duration-300 space-y-3"><input type="number" placeholder="Cantidad (฿)" value={newAdv.amount} onChange={e => setNewAdv({...newAdv, amount: e.target.value})} className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white font-black outline-none focus:border-brand" /><input type="text" placeholder="Concepto" value={newAdv.concept} onChange={e => setNewAdv({...newAdv, concept: e.target.value})} className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand" /><button onClick={() => { if (newAdv.amount) { addAdvance(newAdv.amount, newAdv.concept); setNewAdv({ amount: '', concept: 'Adelanto' }); setShowAdvForm(false); } }} className="w-full bg-brand py-2 rounded-lg text-white font-black text-xs shadow-lg shadow-brand/20">Confirmar Pago</button></div>)}
             <div className="space-y-2">{advances.length === 0 ? (<div className="p-8 border-2 border-dashed border-surface-edge rounded-2xl flex flex-col items-center text-center"><div className="p-3 bg-surface rounded-full mb-3"><AlertCircle className="w-5 h-5 text-gray-600" /></div><p className="text-[10px] font-bold text-gray-600 uppercase">Sin pagos este mes</p></div>) : (advances.map((adv, idx) => (<div key={idx} className="bg-surface border border-surface-edge p-4 rounded-xl flex items-center justify-between group/adv hover:border-brand/30 transition-all"><div className="flex flex-col"><span className="text-base font-black text-white">{adv.amount.toLocaleString()} ฿</span><span className="text-sm text-gray-500 uppercase font-bold tracking-tighter">{new Date(adv.date).toLocaleDateString()} • {adv.concept}</span></div><button onClick={() => removeAdvance(idx)} className="opacity-0 group-hover/adv:opacity-100 p-1.5 text-gray-500 hover:text-rose-500 transition-all"><Plus className="w-3.5 h-3.5 rotate-45" /></button></div>)))}</div>
          </section>
        </div>
      </div>

      {/* MODAL DE AJUSTE PREMIUM */}
      {adjModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a1c2d]/90 border border-surface-edge/50 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
            <div className="p-8 border-b border-surface-edge/30 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white leading-none">Ajuste Manual</h3>
                <p className="text-sm font-black text-brand uppercase tracking-[0.2em] mt-3">Día {adjModal.day} · {months[month-1]} {year}</p>
              </div>
              <button onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad del Extra</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-brand transition-colors">฿</span>
                  <input 
                    type="number" 
                    autoFocus
                    value={adjModal.amount} 
                    onChange={(e) => setAdjModal(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-6 pl-12 text-4xl font-black text-white outline-none focus:border-brand/50 focus:bg-brand/5 transition-all appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Concepto o Motivo</label>
                <textarea 
                  value={adjModal.concept} 
                  onChange={(e) => setAdjModal(prev => ({ ...prev, concept: e.target.value }))}
                  className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-6 text-base font-bold text-gray-300 outline-none focus:border-brand/50 focus:bg-brand/5 transition-all min-h-[140px] resize-none placeholder:text-gray-700"
                  placeholder="Escribe aquí el motivo del ajuste..."
                />
              </div>
            </div>

            <div className="p-6 bg-white/5 flex gap-4">
              <button 
                onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })}
                className="flex-1 px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleAdjUpdate(adjModal.day, adjModal.amount, adjModal.concept);
                  setAdjModal({ open: false, day: null, amount: 0, concept: '' });
                }}
                className="flex-[2] px-6 py-5 rounded-2xl font-black text-base uppercase tracking-widest bg-brand text-[#1a1c2d] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
