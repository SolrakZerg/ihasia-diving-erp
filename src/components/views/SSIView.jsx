/** 
 * SSIView.jsx - v2.1 
 * Updated: 2026-04-22
 * Fixes: Header height, Date positioning, Config modal, Table scroll
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  Trash2, 
  Receipt, 
  Loader2, 
  Calendar,
  AlertCircle,
  TrendingDown,
  Tag,
  CheckCircle2,
  X,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Users,
  ShieldCheck,
  Zap,
  Info,
  Settings,
  Filter,
  Check
} from 'lucide-react';

export default function SSIView() {
  const [data, setData] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [activeActivityIds, setActiveActivityIds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
  const [categorySettings, setCategorySettings] = useState([]);
  
  // Date states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [ssiPaid, setSsiPaid] = useState(0);
  const [manualPaid, setManualPaid] = useState(0);
  const [adjNext, setAdjNext] = useState(0); // Adelanto: Empiezan este mes, pagan ahora (se facturan el que viene)
  const [adjPrev, setAdjPrev] = useState(0); // Ajuste: Empezaron el anterior, ya se pagaron (se facturan este)
  const FIXED_ADJ_PRICE = 1067;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeActivityIds !== null) {
      fetchData();
      fetchAdjustments();
    }
  }, [selectedMonth, selectedYear, activeActivityIds]);

  const fetchAdjustments = async () => {
    // 1. Get adjNext for current month
    const currentKey = `ssi_adj_${selectedYear}_${selectedMonth}`;
    const { data: current } = await supabase.from('settings').select('*').eq('key', currentKey).maybeSingle();
    if (current?.value) {
       const parsed = JSON.parse(current.value);
       setAdjNext(parsed.next || 0);
       setManualPaid(parsed.manual || 0);
    } else {
       setAdjNext(0);
       setManualPaid(0);
    }

    // 2. Get adjNext for previous month (which is current month's adjPrev)
    const prevDate = new Date(selectedYear, selectedMonth - 1, 1);
    const prevKey = `ssi_adj_${prevDate.getFullYear()}_${prevDate.getMonth()}`;
    const { data: prev } = await supabase.from('settings').select('*').eq('key', prevKey).maybeSingle();
    setAdjPrev(prev?.value ? JSON.parse(prev.value).next || 0 : 0);
  };

  const saveAdjustments = async (next, manual) => {
    const key = `ssi_adj_${selectedYear}_${selectedMonth}`;
    await supabase.from('settings').upsert({ 
      key: key, 
      value: JSON.stringify({ next, manual }) 
    });
  };

  const fetchInitialData = async () => {
    // 1. Fetch all activities for config
    const { data: activities } = await supabase.from('activities').select('*').order('name');
    if (activities) setAllActivities(activities);

    // Fetch category colors from settings
    const { data: catRes } = await supabase.from('settings').select('*').eq('key', 'catalog_categories').maybeSingle();
    if (catRes && catRes.value) setCategorySettings(JSON.parse(catRes.value));

    // 2. Fetch active activities from settings
    const { data: settings } = await supabase.from('settings').select('*').eq('key', 'ssi_active_activities').maybeSingle();
    
    if (settings && settings.value) {
      try {
        const parsed = JSON.parse(settings.value);
        setActiveActivityIds(parsed);
      } catch (e) {
        setActiveActivityIds([]);
      }
    } else {
      // Default: ONLY activities with category 'Course'
      const defaultIds = activities
        ?.filter(a => (a.category || '').toLowerCase() === 'course')
        .map(a => a.id) || [];
      
      setActiveActivityIds(defaultIds);
      // Save defaults
      await supabase.from('settings').upsert({ key: 'ssi_active_activities', value: JSON.stringify(defaultIds) });
    }
  };

  const fetchData = async (isUpdate = false) => {
    if (!isUpdate) setLoading(true);
    if (!activeActivityIds || activeActivityIds.length === 0) {
      setData([]);
      setSsiPaid(0);
      setLoading(false);
      return;
    }

    const mm = String(selectedMonth + 1).padStart(2, '0');
    const firstDay = `${selectedYear}-${mm}-01`;
    const lastDayNum = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const lastDay = `${selectedYear}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

    try {
      const { data: items } = await supabase.from('invoice_items')
        .select(`*, activities!inner(id, name, acronym, ssi_cost_thb, color)`)
        .gte('date', firstDay).lte('date', lastDay)
        .in('activity_id', activeActivityIds);

      // 2. Aggregate data by activity
      const agg = {};
      
      // Initialize with all active activities from config to show 0s
      activeActivityIds.forEach(id => {
        const act = allActivities.find(a => a.id === id);
        if (act) {
          agg[id] = {
            id: id,
            name: act.name,
            acronym: act.acronym,
            color: act.color,
            ssi_cost: parseFloat(act.ssi_cost_thb) || 0,
            count: 0,
            total: 0,
            items: []
          };
        }
      });

      // Populate with actual sales data
      if (items) {
        items.forEach(item => {
          const actId = item.activity_id;
          if (agg[actId]) {
            agg[actId].count += Number(item.quantity ?? 1);
            agg[actId].items.push(item);
          }
        });
      }

      const result = Object.values(agg)
        .map(a => ({
          ...a,
          total: a.count * a.ssi_cost,
          isPaid: a.count > 0 ? a.items.every(i => i.is_ssi_paid) : false
        }))
        .sort((a, b) => b.total - a.total);

      setData(result);
      const totalPaid = items ? items.filter(i => i.is_ssi_paid).reduce((sum, i) => sum + (parseFloat(i.activities?.ssi_cost_thb || 0) * (Number(i.quantity ?? 1))), 0) : 0;
      setSsiPaid(totalPaid);

    } catch (error) {
      console.error('Error fetching SSI data:', error);
    }
    setLoading(false);
  };

  const calculatedTotal = data.reduce((sum, item) => sum + item.total, 0);
  const adjustmentsTotal = (adjNext * FIXED_ADJ_PRICE) - (adjPrev * FIXED_ADJ_PRICE);
  const totalSsi = calculatedTotal + adjustmentsTotal;
  
  const finalPaid = manualPaid > 0 ? manualPaid : ssiPaid;
  const finalPending = totalSsi - finalPaid;

  const togglePaid = async (activity) => {
    const newValue = !activity.isPaid;
    const itemIds = activity.items.map(i => i.id);
    if (itemIds.length === 0) return;

    const { error } = await supabase
      .from('invoice_items')
      .update({ is_ssi_paid: newValue })
      .in('id', itemIds);

    if (!error) {
      fetchData(true);
    }
  };

  const saveConfig = async (newIds) => {
    setActiveActivityIds(newIds);
    await supabase.from('settings').upsert({ key: 'ssi_active_activities', value: JSON.stringify(newIds) });
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'name') {
      aVal = (a.acronym || a.name).toLowerCase();
      bVal = (b.acronym || b.name).toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(act => act.count > 0);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden relative">
      {/* COMPACT HEADER - Height reduced to 140px */}
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] h-[140px]">
        <div className="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between gap-8">
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase">Pagos SSI</h1>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none">Certificaciones Mensuales</p>
              </div>
            </div>

            {/* DATE & CONFIG SELECTOR - BELOW TITLE */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-soft/50 p-1 rounded-xl border border-surface-edge/30">
                <Calendar className="w-3 h-3 text-gray-500 ml-2" />
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-0.5 cursor-pointer hover:text-indigo-400"
                >
                  {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                    <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                  ))}
                </select>
                <div className="w-px h-3 bg-surface-edge/30 mx-1" />
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-0.5 cursor-pointer hover:text-indigo-400"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={() => setShowConfigModal(true)} 
                className="p-1.5 rounded-xl bg-surface-edge/10 border border-surface-edge/30 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>

           {/* STATS WIDGETS */}
           <div className="flex gap-4">
              <div className="bg-surface-soft/40 border border-surface-edge/20 px-4 py-2.5 rounded-2xl flex flex-col min-w-[130px]">
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Total SSI</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-white font-mono">{totalSsi.toLocaleString()} ฿</span>
                    {adjustmentsTotal !== 0 && (
                      <span className={`text-[10px] font-bold ${adjustmentsTotal > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        ({adjustmentsTotal > 0 ? '+' : ''}{adjustmentsTotal.toLocaleString()})
                      </span>
                    )}
                 </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 px-4 py-2.5 rounded-2xl flex flex-col min-w-[130px]">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Pagado</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{finalPaid.toLocaleString()} ฿</span>
               </div>
               <div className="bg-amber-500/5 border border-amber-500/15 px-4 py-2.5 rounded-2xl flex flex-col min-w-[130px]">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1.5">Debemos</span>
                  <span className="text-lg font-black text-amber-500 font-mono">{finalPending.toLocaleString()} ฿</span>
               </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8 flex justify-center">
        <div className="flex gap-6 max-w-[1050px] w-full h-full max-h-[calc(100vh-250px)]">
          {/* Table Container */}
          <div className="flex-1 bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <div className="py-2.5 px-6 border-b border-surface-edge bg-surface-soft/50 flex justify-between items-center flex-none">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-indigo-400" /> Desglose de Certificaciones
             </h3>
             <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold bg-surface-edge/20 px-3 py-1 rounded-full border border-surface-edge/30">
               <Info className="w-3 h-3" /> Datos automáticos por facturación
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#1a1c2d]/98 backdrop-blur-xl border-b border-surface-edge/50 h-[40px]">
                  <th 
                    onClick={() => handleSort('acronym')} 
                    className="pl-8 pr-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest align-middle cursor-pointer hover:bg-white/5 transition-colors group w-20"
                  >
                    <div className="flex items-center gap-2">
                       Acr.
                       {sortConfig.key === 'acronym' && (sortConfig.direction === 'asc' ? <TrendingUp className="w-3 h-3 text-indigo-400" /> : <TrendingDown className="w-3 h-3 text-indigo-400" />)}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')} 
                    className="px-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest align-middle cursor-pointer hover:bg-white/5 transition-colors group max-w-[150px]"
                  >
                    <div className="flex items-center gap-2">
                       Curso
                       {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <TrendingUp className="w-3 h-3 text-indigo-400" /> : <TrendingDown className="w-3 h-3 text-indigo-400" />)}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('count')} 
                    className="px-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center align-middle w-16 cursor-pointer hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center justify-center gap-1">
                       Cant.
                       {sortConfig.key === 'count' && <div className="w-1.5 h-1.5 rounded-full bg-brand" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('ssi_cost')} 
                    className="px-[10px] py-0 text-[11px] font-black text-white/50 uppercase tracking-[0.2em] text-right align-middle w-24 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    P. Unit.
                  </th>
                  <th 
                    onClick={() => handleSort('total')} 
                    className="px-[10px] py-0 text-[11px] font-black text-brand uppercase tracking-[0.2em] text-right align-middle w-32 cursor-pointer hover:bg-brand/5 transition-colors"
                  >
                    Total ฿
                  </th>
                  <th className="px-[10px] py-0 text-[11px] font-black text-white/50 uppercase tracking-[0.2em] text-center align-middle w-24">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-edge/10">
                {loading ? (
                  <tr><td colSpan="6" className="py-32 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto opacity-30" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan="6" className="py-32 text-center text-gray-500 italic text-sm">No hay certificaciones con cantidad registrada este mes.</td></tr>
                ) : (
                  filteredData.map(act => (
                    <tr key={act.id} className="hover:bg-brand/5 border-b border-surface-edge/30 transition-colors group">
                      <td className="pl-8 pr-[10px] py-2.5 relative">
                        {/* Indicador de color vertical */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: act.color || '#334155' }}
                        />
                        <span 
                          className="text-[16px] font-black tracking-tight leading-none transition-colors"
                          style={{ color: act.color || '#ffffff' }}
                        >
                          {act.acronym || '-'}
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 max-w-[150px] overflow-hidden text-ellipsis">
                        <span className="text-[12px] text-gray-300 font-bold tracking-tight whitespace-nowrap">
                          {act.name}
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 text-center">
                        <span className="inline-flex items-center justify-center bg-surface-edge/60 min-w-[28px] h-7 rounded-lg text-xs font-black text-white border border-surface-edge shadow-sm font-mono">
                           {act.count}
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 text-right">
                        <span className="text-[13px] font-bold text-gray-400 font-mono italic">{act.ssi_cost.toLocaleString()}</span>
                      </td>
                      <td className="px-[10px] py-2.5 text-right">
                        <span className={`text-[16px] font-black font-mono tracking-tighter ${act.isPaid ? 'text-emerald-400' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.1)]'}`}>
                           {act.total.toLocaleString()} ฿
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 text-center">
                        <button 
                          onClick={() => act.count > 0 && togglePaid(act)}
                          disabled={act.count === 0}
                          className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center border-2 transition-all ${
                            act.count === 0 
                              ? 'opacity-10 cursor-not-allowed border-gray-700 text-gray-700' 
                              : act.isPaid 
                                ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' 
                                : 'bg-surface-edge/20 border-surface-edge/40 text-gray-500 hover:border-brand hover:text-brand hover:bg-brand/5'
                          }`}
                          title={act.count === 0 ? 'Sin facturas' : act.isPaid ? 'Pagado' : 'Marcar como pagado'}
                        >
                          <Check className={`w-6 h-6 ${act.isPaid ? 'stroke-[4]' : 'opacity-40'}`} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

          {/* Sidebar Adjustments */}
          <div className="w-64 flex flex-col gap-4">
             {/* AJUSTES MANUALES */}
             <div className="bg-surface-soft border border-surface-edge rounded-3xl p-5 shadow-xl flex flex-col gap-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-indigo-400" /> Ajustes SSI
                </h4>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <PlusCircle className="w-3.5 h-3.5" /> Adelanto (Próx. Mes)
                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/20 p-3 rounded-[2rem] border border-surface-edge/30 shadow-inner">
                        <input
                          type="number"
                          value={adjNext || ''}
                          placeholder="0"
                          onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setAdjNext(val);
                             saveAdjustments(val, manualPaid);
                          }}
                          className="w-full bg-transparent text-3xl font-black text-white font-mono text-center tracking-tighter outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                  </div>

                  <div className="h-px bg-surface-edge/20 mx-2" />

                  <div className="flex flex-col opacity-90">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Ajuste (Mes Anterior)
                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/10 p-3 rounded-[2rem] border border-surface-edge/10">
                        <span className="text-3xl font-black text-gray-500 font-mono flex-1 text-center tracking-tighter">{adjPrev}</span>
                      </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-edge/20 mt-2">
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Impacto Total</span>
                      <span className={`text-lg font-black ${adjustmentsTotal >= 0 ? 'text-indigo-400' : 'text-rose-400'} font-mono`}>
                        {adjustmentsTotal > 0 ? '+' : ''}{adjustmentsTotal.toLocaleString()} ฿
                      </span>
                   </div>
                </div>
             </div>

             {/* PAGO MANUAL */}
             <div className="bg-surface-soft border border-surface-edge rounded-3xl p-5 shadow-xl flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Registro de Pago
                </h4>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <span className="text-emerald-400/50 font-black text-sm">฿</span>
                   </div>
                   <input
                     type="number"
                     value={manualPaid || ''}
                     placeholder="0"
                     onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setManualPaid(val);
                        saveAdjustments(adjNext, val);
                     }}
                     className="w-full bg-surface-edge/20 border-2 border-surface-edge/30 rounded-2xl py-3.5 pl-10 pr-4 text-xl font-black text-emerald-400 placeholder:text-gray-700 focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all outline-none font-mono"
                   />
                </div>
             </div>

             {/* RECAP CARD */}
             <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Calculado</span>
                   <div className="flex justify-between items-baseline">
                     <span className="text-xl font-black text-white font-mono">{totalSsi.toLocaleString()} ฿</span>
                     <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                   </div>
                </div>

                <div className="h-px bg-indigo-500/20" />

                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Diferencia / Pendiente</span>
                   <div className="flex justify-between items-baseline">
                     <span className={`text-lg font-black font-mono ${(totalSsi - manualPaid) === 0 ? 'text-emerald-500/50' : 'text-amber-400'}`}>
                        {(totalSsi - manualPaid).toLocaleString()} ฿
                     </span>
                     <div className={`w-2 h-2 rounded-full ${(totalSsi - manualPaid) === 0 ? 'bg-emerald-500/30' : 'bg-amber-500 animate-pulse'}`} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#1a1c2d] border border-indigo-500/30 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-surface-edge/50 flex justify-between items-center bg-indigo-500/5">
                 <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    <div>
                       <h3 className="text-lg font-black text-white tracking-tight uppercase">Configurar Filtro SSI</h3>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Selecciona los cursos activos</p>
                    </div>
                 </div>
                 <button onClick={() => setShowConfigModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#1a1c2d]">
                 <div className="grid grid-cols-1 gap-2">
                    {allActivities.filter(act => ['course', 'pro'].includes((act.category || '').toLowerCase())).map(act => {
                       const isSelected = activeActivityIds?.includes(act.id);
                       const catColorInfo = categorySettings.find(c => c.name.toLowerCase() === (act.category || '').toLowerCase());
                       
                       // Extract text color from category color string (e.g. "text-blue-400")
                       const textColorClass = catColorInfo?.color?.split(' ').find(c => c.startsWith('text-')) || 'text-brand';
                       const bgColorClass = textColorClass.replace('text-', 'bg-');
                       const borderColorClass = textColorClass.replace('text-', 'border-');

                       return (
                          <button
                             key={act.id}
                             onClick={() => {
                                const newIds = isSelected 
                                   ? activeActivityIds.filter(id => id !== act.id)
                                   : [...(activeActivityIds || []), act.id];
                                saveConfig(newIds);
                             }}
                             className={`flex items-center gap-4 py-2 px-6 rounded-2xl border-2 transition-all text-left ${
                               isSelected 
                                 ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                                 : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10'
                             }`}
                          >
                             <div className="flex-1 grid grid-cols-2 gap-4 items-center">
                                <span className={`text-[15px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                  {act.name}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] truncate ${isSelected ? textColorClass : 'text-white/20'}`}>
                                  {act.category}
                                </span>
                             </div>
                             
                             <div className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
                               isSelected ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' : 'border-white/10 bg-black/20 text-transparent'
                             }`}>
                               <Check className={`w-4 h-4 stroke-[4] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                             </div>
                          </button>
                       );
                    })}
                 </div>
              </div>

              <div className="p-6 bg-brand/5 flex justify-center border-t border-white/5">
                 <button 
                    onClick={() => setShowConfigModal(false)}
                    className="w-full py-5 bg-brand hover:bg-brand-light text-[#1a1c2d] font-black rounded-2xl transition-all shadow-xl shadow-brand/20 uppercase tracking-[0.2em] text-sm"
                 >
                    Guardar y Aplicar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
