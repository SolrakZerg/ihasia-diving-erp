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
  Timer
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
  
  // Manual Adjustments & Advances (stored in settings for now)
  const [manualAdj, setManualAdj] = useState({}); // { day: amount }
  const [assists, setAssists] = useState({}); // { day: count }
  const [attendanceOverrides, setAttendanceOverrides] = useState({}); // { day: 'OFF' | 'HALF' | 'WORK' }
  const [advances, setAdvances] = useState([]); // [ { amount, date, concept } ]

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
    if (selectedStaffId) {
      fetchData();
    }
  }, [selectedStaffId, month, year]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff').select('id, first_name, last_name, initials, role, base_salary, commission_rate').order('first_name');
    if (data) {
      setStaff(data);
      if (data.length > 0 && !selectedStaffId) setSelectedStaffId(data[0].id);
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

    // DEBUG: Let's see EVERY record for a moment to find the missing one
    // Filter by initials OR ID
    const filteredItems = (items || []).filter(it => {
      const itInstId = typeof it.instructor_id === 'object' ? it.instructor_id?.id : it.instructor_id;
      const itInitials = it.instructor?.initials;
      
      const matchId = String(itInstId) === String(selectedStaffId);
      const matchInitials = itInitials && selectedMember && itInitials === selectedMember.initials;
      
      return matchId || matchInitials;
    });
    setInvoiceItems(filteredItems);

    // Fetch Adjustments/Advances from settings
    const settingsKey = `staff_payout_${selectedStaffId}_${year}_${month}`;
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', settingsKey)
      .single();

    if (setting?.value) {
      setManualAdj(setting.value.adjustments || {});
      setAssists(setting.value.assists || {});
      setAttendanceOverrides(setting.value.attendanceOverrides || {});
      setAdvances(setting.value.advances || []);
    } else {
      setManualAdj({});
      setAssists({});
      setAttendanceOverrides({});
      setAdvances([]);
    }
    
    setLoading(false);
  };

  const saveToSettings = async (newAdj, newAdv, newAss, newAtt) => {
    const settingsKey = `staff_payout_${selectedStaffId}_${year}_${month}`;
    const payload = { adjustments: newAdj, advances: newAdv, assists: newAss, attendanceOverrides: newAtt || attendanceOverrides };
    
    const { error } = await supabase
      .from('settings')
      .upsert({ key: settingsKey, value: payload }, { onConflict: 'key' });
      
    if (error) console.error('Error saving settings:', error);
  };

  const handleAdjChange = (day, value) => {
    const val = parseFloat(value) || 0;
    const nextAdj = { ...manualAdj, [day]: val };
    setManualAdj(nextAdj);
    saveToSettings(nextAdj, advances, assists);
  };
  
  const handleAssChange = (day, value) => {
    const val = parseInt(value) || 0;
    const nextAss = { ...assists, [day]: val };
    setAssists(nextAss);
    saveToSettings(manualAdj, advances, nextAss, attendanceOverrides);
  };

  const handleAttendanceToggle = (day) => {
    const current = attendanceOverrides[day] || 'AUTO';
    const states = ['AUTO', 'OFF', 'HALF', 'WORK'];
    const next = states[(states.indexOf(current) + 1) % states.length];
    
    const nextAtt = { ...attendanceOverrides, [day]: next };
    setAttendanceOverrides(nextAtt);
    saveToSettings(manualAdj, advances, assists, nextAtt);
  };

  const addAdvance = (amount, concept = 'Adelanto') => {
    const newAdv = [...advances, { amount: parseFloat(amount) || 0, date: new Date().toISOString(), concept }];
    setAdvances(newAdv);
    saveToSettings(manualAdj, newAdv, assists);
  };

  const removeAdvance = (idx) => {
    const newAdv = advances.filter((_, i) => i !== idx);
    setAdvances(newAdv);
    saveToSettings(manualAdj, newAdv, assists);
  };

  // Matrix Processing
  // Identify and group fixed columns based on ALL activities
  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));

    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const acro = (a?.acronym || '').toUpperCase().trim();
        const name = (a?.name || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        
        // Grouping logic by acronym OR name patterns
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
      
      return {
        key,
        label: key,
        activityIds: matches.map(m => m.id)
      };
    });
  }, [allActivities]);

  // Identify dynamic columns (activities done this month that aren't in fixedColumns)
  const dynamicActivities = useMemo(() => {
    const fixedIds = new Set(fixedColumns.flatMap(c => c.activityIds).map(String));
    const seenIds = new Set();

    invoiceItems.forEach(item => {
      const actId = String(item.activity_id || '');
      if (actId && !fixedIds.has(actId)) {
        seenIds.add(actId);
      }
    });

    return Array.from(seenIds)
      .map(id => {
        const act = allActivities.find(a => String(a.id) === id);
        return act;
      })
      .filter(Boolean);
  }, [invoiceItems, fixedColumns, allActivities]);

  const matrixData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = {};
    
    // Initialize days
    for (let i = 1; i <= daysInMonth; i++) {
      data[i] = { items: {}, total: 0 };
    }

    // Process invoice items
    invoiceItems.forEach(item => {
      if (!item.date) return;
      const cleanDate = item.date.substring(0, 10);
      const [y, m, d] = cleanDate.split('-').map(Number);
      const day = d;
      if (y !== year || m !== month) return; 
      
      const actId = String(item.activity_id || '');
      const activity = item.activities;
      
      // Find the right column key (Fixed or Dynamic)
      let colKey = null;
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      if (fixedCol) {
        colKey = fixedCol.key;
      } else {
        // Fallback: If not found by ID, try matching by name for common categories
        const name = (activity?.name || '').toUpperCase();
        if (name.includes('OPEN WATER')) colKey = 'OW';
        else if (name.includes('ADVANCED')) colKey = 'AOW';
        else if (name.includes('FUNDIVE') || name.startsWith('FD')) colKey = 'FD';
        
        if (!colKey) {
          const dynCol = dynamicActivities.find(a => String(a.id) === actId);
          if (dynCol) colKey = `dyn_${actId}`;
        }
      }

      if (!colKey || !data[day]) return;

      if (!data[day].items[colKey]) data[day].items[colKey] = 0;
      data[day].items[colKey] += (item.quantity || 1);

      // Calculate value based on rules
      // Look for rule by activity ID OR by name if it's a fixed category
      const rule = payoutRules.find(r => String(r.activity_id) === actId);
      if (rule) {
        data[day].total += (item.quantity || 1) * rule.amount_thb;
      }
    });

    return data;
  }, [invoiceItems, payoutRules, month, year, fixedColumns, dynamicActivities]);

  // Attendance & Free Days Engine
  const attendanceData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const map = {};
    for (let i = 1; i <= daysInMonth; i++) {
      map[i] = { morning: false, afternoon: false };
    }

    invoiceItems.forEach(item => {
      const duration = item.activities?.duration_days || 0.5;
      const [y, m, d] = (item.date || '').split('-').map(Number);
      if (y !== year || m !== month) return;

      // Day 0 Logic
      if (duration % 1 !== 0) {
        map[d].morning = true;
      } else {
        map[d].morning = true;
        map[d].afternoon = true;
      }

      // Previous Days Logic
      const fullDaysBefore = (duration % 1 !== 0) ? Math.floor(duration) : (duration - 1);
      for (let i = 1; i <= fullDaysBefore; i++) {
        const prevDate = new Date(year, month - 1, d - i);
        if (prevDate.getMonth() + 1 === month && prevDate.getFullYear() === year) {
          const prevDay = prevDate.getDate();
          map[prevDay].morning = true;
          map[prevDay].afternoon = true;
        }
      }
    });

    // Process Overrides and calculate final status
    const result = {};
    let fullOffCount = 0;
    let halfOffCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const override = attendanceOverrides[d] || 'AUTO';
      let status = 'WORK'; // Default

      if (override === 'AUTO') {
        if (!map[d].morning && !map[d].afternoon) status = 'OFF';
        else if (!map[d].afternoon) status = 'HALF';
      } else {
        status = override;
      }

      result[d] = status;
      if (status === 'OFF') fullOffCount++;
      if (status === 'HALF') halfOffCount++;
    }

    return { grid: result, summary: { fullOff: fullOffCount, halfOff: halfOffCount, totalOff: fullOffCount + (halfOffCount * 0.5) } };
  }, [invoiceItems, attendanceOverrides, month, year]);



  const selectedMember = staff.find(s => s.id === selectedStaffId);

  // Totals
  const totalComm = Object.values(matrixData).reduce((acc, d) => acc + d.total, 0);
  const totalAssists = Object.values(assists).reduce((acc, val) => acc + (val * 2000), 0);
  const totalAdj = Object.values(manualAdj).reduce((acc, val) => acc + val, 0);
  const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);
  const baseSalary = selectedMember?.base_salary || 0;
  const finalBalance = baseSalary + totalComm + totalAssists + totalAdj - totalAdvances;

  return (
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700">
      
      {/* Top Header Selector */}
      <div className="bg-surface-soft/50 border-b border-surface-edge p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 rounded-2xl text-brand">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">Liquidación de Staff</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Panel de Control de Sueldos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-surface-edge shadow-inner">
          <select 
            value={selectedStaffId || ''} 
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-transparent text-white font-black px-4 py-2 outline-none border-r border-surface-edge cursor-pointer hover:text-brand transition-colors"
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 px-3">
            <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="p-1 hover:bg-surface-edge rounded-lg text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
            <span className="text-white font-black text-sm min-w-[100px] text-center uppercase tracking-tighter">
              {months[month - 1]} {year}
            </span>
            <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="p-1 hover:bg-surface-edge rounded-lg text-gray-400"><ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Matrix Table */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-table-header/90 backdrop-blur-xl border-b border-surface-edge sticky top-0 z-10">
                  <th className="p-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-12 bg-surface-soft">Día</th>
                  
                  {/* Common Columns */}
                  {fixedColumns.map(col => (
                    <th key={col.key} className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 transition-colors hover:text-white w-[35px] h-[70px]" title={`Actividades tipo ${col.label}`}>
                      <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">
                        {col.label.split('').map((char, i) => (
                          <span key={i}>{char}</span>
                        ))}
                      </div>
                    </th>
                  ))}

                  {/* Dynamic Columns */}
                  {dynamicActivities.map(act => (
                    <th key={act.id} className="p-0 text-[16px] font-black text-amber-500/80 uppercase tracking-tighter text-center border-l border-surface-edge/30 bg-amber-500/5 w-[35px] h-[70px]" title={act.name}>
                      <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">
                        {(act.acronym || act.name).split('').slice(0, 8).map((char, i) => (
                          <span key={i}>{char}</span>
                        ))}
                      </div>
                    </th>
                  ))}

                  <th className="p-0 text-[16px] font-black text-cyan-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-[35px] bg-cyan-500/5 h-[70px]">
                    <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">
                      {'ASS'.split('').map((char, i) => <span key={i}>{char}</span>)}
                    </div>
                  </th>
                  <th className="p-1 text-[16px] font-black text-brand uppercase tracking-widest text-center border-l border-surface-edge/30 w-16 bg-brand/5 min-w-[64px]">Extra</th>
                  <th className="p-4 text-[12px] font-black text-indigo-400 uppercase tracking-widest text-center w-12 border-l border-surface-edge/30 bg-indigo-500/5 min-w-[48px]">OFF</th>
                  <th className="p-4 text-[16px] font-black text-white uppercase tracking-widest text-right bg-surface-edge/30 w-auto">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-edge/40">
                {Object.keys(matrixData).map(day => (
                  <tr key={day} className="group hover:bg-white/5 transition-colors h-11">
                    <td className="p-2 text-center font-black text-gray-600 text-base">{day}</td>
                    
                    {/* Common Activity Cells */}
                    {fixedColumns.map(col => {
                       const count = matrixData[day].items[col.key] || 0;
                       return (
                         <td key={col.key} className="p-0 border-l border-surface-edge/10 text-center w-[35px] min-w-[35px]">
                           <span className={`text-[17px] font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>
                             {count || ''}
                           </span>
                         </td>
                       );
                    })}

                    {/* Dynamic Activity Cells */}
                    {dynamicActivities.map(act => {
                        const count = matrixData[day].items[`dyn_${act.id}`] || 0;
                        return (
                          <td key={act.id} className="p-0 border-l border-surface-edge/10 text-center bg-amber-500/5 w-[35px] min-w-[35px]">
                            <span className={`text-[17px] font-black ${count > 0 ? 'text-amber-400' : 'text-gray-800'}`}>
                              {count || ''}
                            </span>
                          </td>
                        );
                    })}

                    {/* Assistance Column (Manual) */}
                    <td className="p-1 border-l border-surface-edge/10 bg-cyan-500/5">
                      <input 
                        type="number" 
                        value={assists[day] || ''}
                        onChange={(e) => handleAssChange(day, e.target.value)}
                        className="w-full bg-transparent text-center text-cyan-400 font-black text-base outline-none focus:bg-cyan-500/10 rounded py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Extra / Manual Adjustment Cell */}
                    <td className="p-1 border-l border-surface-edge/10 bg-brand/5">
                      <input 
                        type="number" 
                        value={manualAdj[day] || ''}
                        onChange={(e) => handleAdjChange(day, e.target.value)}
                        className="w-full bg-transparent text-center text-brand font-black text-sm outline-none focus:bg-brand/10 rounded py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Attendance / OFF Column */}
                    <td 
                      className={`p-1 border-l border-surface-edge/10 text-center cursor-pointer transition-all ${
                        attendanceData.grid[day] === 'OFF' ? 'bg-emerald-500/20' : 
                        attendanceData.grid[day] === 'HALF' ? 'bg-amber-500/20' : ''
                      }`}
                      onClick={() => handleAttendanceToggle(day)}
                    >
                      <span className={`text-[12px] font-black ${
                        attendanceData.grid[day] === 'OFF' ? 'text-emerald-400' : 
                        attendanceData.grid[day] === 'HALF' ? 'text-amber-400' : 'text-gray-800'
                      }`}>
                        {attendanceData.grid[day] === 'OFF' ? 'OFF' : 
                         attendanceData.grid[day] === 'HALF' ? 'HALF' : 'WORK'}
                      </span>
                    </td>

                    {/* Daily Total */}
                    <td className="p-2 text-right border-l border-surface-edge/20 bg-surface-edge/10 pr-4 w-auto">
                      <span className={`text-base font-black ${matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000) > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                        {(matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000)).toLocaleString()} ฿
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Table Footer (Matrix Totals) */}
              <tfoot className="bg-surface-edge/30">
                <tr className="h-14 font-black">
                  <td className="p-4 text-center text-gray-400 text-[12px] uppercase">TOT</td>
                  {fixedColumns.map(col => (
                    <td key={col.key} className="p-2 text-center border-l border-surface-edge/10 text-sm text-gray-300">
                      {Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}
                    </td>
                  ))}
                  {dynamicActivities.map(act => (
                    <td key={act.id} className="p-2 text-center border-l border-surface-edge/10 text-[13px] text-amber-500/60 bg-amber-500/5">
                      {Object.values(matrixData).reduce((acc, d) => acc + (d.items[`dyn_${act.id}`] || 0), 0)}
                    </td>
                  ))}
                  <td className="p-2 text-center border-l border-surface-edge/10 text-cyan-400 text-sm bg-cyan-500/5">
                    {Object.values(assists).reduce((acc, val) => acc + val, 0)}
                  </td>
                  <td className="p-2 text-center border-l border-surface-edge/10 text-brand text-sm bg-brand/5">
                    {totalAdj.toLocaleString()} ฿
                  </td>
                  <td className="p-2 text-center border-l border-surface-edge/10 bg-indigo-500/5">
                     <div className="flex flex-col items-center leading-none">
                        <span className="text-[12px] font-black text-emerald-400">{attendanceData.summary.fullOff}F</span>
                        <span className="text-[12px] font-black text-amber-400 mt-1">{attendanceData.summary.halfOff}H</span>
                     </div>
                  </td>
                  <td className="p-4 text-right border-l border-surface-edge/20 text-emerald-400 text-xl bg-surface-edge/30">
                    {(totalComm + totalAssists + totalAdj).toLocaleString()} ฿
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Summary & Payouts */}
        <div className="w-[380px] bg-surface-soft border-l border-surface-edge flex flex-col p-8 space-y-10 overflow-auto shadow-2xl z-10">
          
          {/* Main Card: Green Summary */}
          <div className="bg-emerald-500 rounded-[32px] p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-2 opacity-80">Saldo Acumulado</p>
            <h3 className="text-5xl font-black text-white tracking-tighter leading-none mb-1">
              {finalBalance.toLocaleString()}<span className="text-xl ml-1 opacity-60 italic">฿</span>
            </h3>
            <div className="flex items-center gap-3 mt-4">
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-emerald-950/40 uppercase tracking-widest">Días Libres</span>
                  <span className="text-base font-black text-white leading-none">{attendanceData.summary.totalOff}</span>
               </div>
               <div className="w-px h-6 bg-emerald-950/20" />
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-emerald-950/40 uppercase tracking-widest">Asistencias</span>
                  <span className="text-base font-black text-white leading-none">{Object.values(assists).reduce((acc, v) => acc + v, 0)}</span>
               </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-950/40 text-[10px] font-black uppercase tracking-wider mt-4">
              <TrendingUp className="w-3 h-3" />
              <span>Actualizado al {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Breakdown Section */}
          <section className="space-y-4">
            <h4 className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Desglose Económico
            </h4>
            <div className="bg-surface p-6 rounded-2xl border border-surface-edge space-y-4">
              <div className="flex justify-between items-center group/item">
                <span className="text-sm font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Sueldo Base</span>
                <span className="text-base font-black text-white">{baseSalary.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between items-center group/item">
                <span className="text-sm font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Comisiones Cursos</span>
                <span className="text-base font-black text-white">{totalComm.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between items-center group/item">
                <span className="text-sm font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Extras y Ajustes</span>
                <span className={`text-base font-black ${totalAdj >= 0 ? 'text-brand' : 'text-rose-400'}`}>
                  {totalAdj >= 0 ? '+' : ''}{totalAdj.toLocaleString()} ฿
                </span>
              </div>
              <div className="h-px bg-surface-edge/50 my-2" />
              <div className="flex justify-between items-center text-rose-400">
                <span className="text-sm font-bold">Total Adelantos</span>
                <span className="text-base font-black">-{totalAdvances.toLocaleString()} ฿</span>
              </div>
            </div>
          </section>

          {/* Advances Section */}
          <section className="space-y-4 flex-1">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> Adelantos y Pagos
                </h4>
                <button 
                  onClick={() => setShowAdvForm(!showAdvForm)}
                  className={`p-1.5 rounded-lg transition-all ${showAdvForm ? 'bg-rose-500 text-white' : 'bg-brand/10 text-brand hover:bg-brand hover:text-white'}`}
                >
                  {showAdvForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
             </div>

             {showAdvForm && (
               <div className="bg-surface p-4 rounded-xl border border-brand/30 animate-in slide-in-from-top-2 duration-300 space-y-3">
                 <input 
                   type="number" 
                   placeholder="Cantidad (฿)"
                   value={newAdv.amount}
                   onChange={e => setNewAdv({...newAdv, amount: e.target.value})}
                   className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white font-black outline-none focus:border-brand"
                 />
                 <input 
                   type="text" 
                   placeholder="Concepto (ej: Adelanto)"
                   value={newAdv.concept}
                   onChange={e => setNewAdv({...newAdv, concept: e.target.value})}
                   className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand"
                 />
                 <button 
                   onClick={() => {
                     if (newAdv.amount) {
                       addAdvance(newAdv.amount, newAdv.concept);
                       setNewAdv({ amount: '', concept: 'Adelanto' });
                       setShowAdvForm(false);
                     }
                   }}
                   className="w-full bg-brand py-2 rounded-lg text-white font-black text-xs shadow-lg shadow-brand/20"
                 >
                   Confirmar Pago
                 </button>
               </div>
             )}
             
             <div className="space-y-2">
               {advances.length === 0 ? (
                 <div className="p-8 border-2 border-dashed border-surface-edge rounded-2xl flex flex-col items-center text-center">
                   <div className="p-3 bg-surface rounded-full mb-3">
                     <AlertCircle className="w-5 h-5 text-gray-600" />
                   </div>
                   <p className="text-[10px] font-bold text-gray-600 uppercase">Sin pagos este mes</p>
                 </div>
               ) : (
                 advances.map((adv, idx) => (
                   <div key={idx} className="bg-surface border border-surface-edge p-4 rounded-xl flex items-center justify-between group/adv hover:border-brand/30 transition-all">
                     <div className="flex flex-col">
                       <span className="text-xs font-black text-white">{adv.amount.toLocaleString()} ฿</span>
                       <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">
                         {new Date(adv.date).toLocaleDateString()} • {adv.concept}
                       </span>
                     </div>
                     <button onClick={() => removeAdvance(idx)} className="opacity-0 group-hover/adv:opacity-100 p-1.5 text-gray-500 hover:text-rose-500 transition-all">
                       <Plus className="w-3.5 h-3.5 rotate-45" />
                     </button>
                   </div>
                 ))
               )}
             </div>
          </section>

          {/* Final Action */}
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <Briefcase className="w-5 h-5" /> Generar Liquidación
          </button>

        </div>
      </div>
    </div>
  );
}
