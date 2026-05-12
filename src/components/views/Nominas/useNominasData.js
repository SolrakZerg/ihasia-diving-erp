import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useNominasData() {
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
  
  // Manual Adjustments & Advances
  const [manualAdj, setManualAdj] = useState({}); // { day: { amount, concept } }
  const [adjModal, setAdjModal] = useState({ open: false, day: null, amount: 0, concept: '' });
  const [assists, setAssists] = useState({}); // { day: count }
  const [attendanceOverrides, setAttendanceOverrides] = useState({}); // { day: 'OFF' | 'HALF' | 'WORK' }
  const [advances, setAdvances] = useState([]); // [ { id, amount, date, concept } ]

  const fixedKeys = ['FD', 'SR1', 'SR2', 'DSD1', 'DSD2', 'SD', 'OW', 'AOW', 'S&R', 'CAN'];

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

  const addAdvance = async (amount, concept = '') => {
    const { data: newAdv } = await supabase.from('staff_advances').insert({
      year, month, staff_id: selectedStaffId, amount: parseFloat(amount) || 0, concept, date: new Date().toISOString()
    }).select().single();

    if (newAdv) {
      setAdvances(prev => [...prev, newAdv]);
      return newAdv;
    }
    return null;
  };

  const updateAdvance = async (id, updates) => {
    const { data, error } = await supabase.from('staff_advances').update(updates).eq('id', id).select().single();
    if (error) {
      console.error("Error updating advance:", error);
    }
    if (data) {
      setAdvances(prev => prev.map(a => a.id === id ? data : a));
      return data;
    }
    return null;
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

  return {
    selectedStaffId, setSelectedStaffId,
    month, setMonth,
    year, setYear,
    staff, activeStaffIds,
    loading, syncing,
    adjModal, setAdjModal,
    manualAdj, assists, advances,
    fixedColumns, dynamicActivities, matrixData, attendanceData,
    totalComm, totalAssists, totalAdj, totalAdvances, finalBalance,
    selectedMember,
    
    handleAdjUpdate, handleAssChange, handleAttendanceToggle, addAdvance, removeAdvance, updateAdvance
  };
}
