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
  Waves,
  Zap,
  Info,
  Settings,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight
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
  const adjustmentsTotal = (adjNext * FIXED_ADJ_PRICE) - (adjPrev * FIXED_ADJ_PRICE);

  const [settlementId, setSettlementId] = useState(null);
  const [totalSsi, setTotalSsi] = useState(0);
  const [finalPaid, setFinalPaid] = useState(0);
  const [finalPending, setFinalPending] = useState(0);

  useEffect(() => {
    fetchInitialData();
    fetchSettlement(); // Load money snapshot immediately
  }, []);

  useEffect(() => {
    fetchSettlement();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeActivityIds !== null) {
      fetchData();
    }
  }, [selectedMonth, selectedYear, activeActivityIds]);

  const fetchSettlement = async () => {
    // 1. Get current month settlement
    const { data: current } = await supabase
      .from('supplier_settlements')
      .select('*')
      .eq('year', selectedYear)
      .eq('month', selectedMonth + 1)
      .ilike('supplier_name', '%SSI%')
      .maybeSingle();

    if (current) {
      setSettlementId(current.id);
      setManualPaid(current.paid_amount || 0);
      
      const config = current.invoice_config || {};
      setAdjNext(config.adjNext || 0);
    } else {
      setSettlementId(null);
      setManualPaid(0);
      setTotalSsi(0);
      setFinalPaid(0);
      setFinalPending(0);
      setAdjNext(0);
    }

    // 2. Get previous month for adjPrev
    const prevDate = new Date(selectedYear, selectedMonth - 1, 1);
    const { data: prev } = await supabase
      .from('supplier_settlements')
      .select('invoice_config')
      .eq('year', prevDate.getFullYear())
      .eq('month', prevDate.getMonth() + 1)
      .ilike('supplier_name', '%SSI%')
      .maybeSingle();
    
    setAdjPrev(prev?.invoice_config?.adjNext || 0);
  };

  const saveSettlement = async (next, manual, total) => {
    const payload = {
      supplier_name: 'SSI',
      year: selectedYear,
      month: selectedMonth + 1,
      paid_amount: manual,
      total_amount: total,
      invoice_config: { adjNext: next },
      updated_at: new Date().toISOString()
    };

    if (settlementId) {
      await supabase.from('supplier_settlements').update(payload).eq('id', settlementId);
    } else {
      const { data } = await supabase.from('supplier_settlements').insert(payload).select().single();
      if (data) setSettlementId(data.id);
    }
  };

  const fetchInitialData = async () => {
    // 1. Fetch all activities for config
    const { data: activities } = await supabase.from('activities').select('*').order('name');
    if (activities) {
      setAllActivities(activities);
      // PERSISTENCIA: Leemos el estado guardado en 'is_ssi_active'
      const activeIds = activities.filter(a => a.is_ssi_active).map(a => a.id);
      setActiveActivityIds(activeIds);
    }

    // Fetch category colors from new table
    const { data: catRes } = await supabase.from('activity_categories').select('*').order('sort_order');
    if (catRes) setCategorySettings(catRes);
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

  // Sync calculated values to state for stable UI
  useEffect(() => {
    if (!loading && activeActivityIds !== null) {
      const calculatedTotal = data.reduce((sum, item) => sum + item.total, 0);
      const newTotal = calculatedTotal + adjustmentsTotal;
      const newPaid = manualPaid > 0 ? manualPaid : ssiPaid;
      
      setTotalSsi(newTotal);
      setFinalPaid(newPaid);
      setFinalPending(newTotal - newPaid);
    }
  }, [data, ssiPaid, manualPaid, adjustmentsTotal, loading, activeActivityIds]);

  // AUTO-SAVE LOGIC: Sincroniza el total calculado con la BD para el Dashboard
  useEffect(() => {
    if (activeActivityIds && activeActivityIds.length > 0 && !loading) {
      const timer = setTimeout(() => {
        saveSettlement(adjNext, manualPaid, totalSsi);
      }, 1500); // Debounce de 1.5s
      return () => clearTimeout(timer);
    }
  }, [totalSsi, manualPaid, adjNext]);

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
    // Now we update the activities table directly
    // 1. Reset all ssi_active flags
    await supabase.from('activities').update({ is_ssi_active: false }).is('is_ssi_active', true);

    // 2. Set only the selected ones
    if (newIds.length > 0) {
      await supabase.from('activities').update({ is_ssi_active: true }).in('id', newIds);
    }

    // Update local state to reflect changes immediately
    setAllActivities(prev => prev.map(a => ({
      ...a,
      is_ssi_active: newIds.includes(a.id)
    })));
    setActiveActivityIds(newIds);
  };
  
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
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
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] h-[200px]">
        <div className="max-w-[1700px] mx-auto px-8 h-full flex items-center justify-center gap-24">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-brand/20 p-3 rounded-2xl ring-1 ring-brand/30">
                <Waves className="w-8 h-8 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Pagos SSI</h1>
                <p className="text-gray-400 text-sm font-bold mt-1">Certificaciones Mensuales</p>
              </div>
            </div>

            {/* HYBRID DATE SELECTOR */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
                {/* PREV BUTTON */}
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                  <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
                  >
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                      <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                    ))}
                  </select>
                  
                  <div className="w-px h-4 bg-surface-edge/30 mx-1" />

                  <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                    ))}
                  </select>
                </div>

                {/* NEXT BUTTON */}
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={() => setShowConfigModal(true)} 
                className="p-2.5 rounded-2xl bg-surface-edge/10 border border-surface-edge/30 text-gray-500 hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
                title="Configuración"
              >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>
           {/* STATS WIDGETS - LARGER & CENTERED */}
           <div className="flex gap-4">
               <div className="bg-amber-500/5 border border-amber-400/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-amber-500/10 transition-all">
                  <div className="p-2 rounded-2xl bg-amber-500/10 mb-2 text-amber-400 group-hover:scale-110 transition-transform">
                     <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em] leading-none mb-2">TOTAL SSI</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {totalSsi.toLocaleString()} <span className="text-sm font-black text-amber-400/40 ml-1 italic font-mono">฿</span>
                  </span>
               </div>

               <div className="bg-emerald-500/5 border border-emerald-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-emerald-500/10 transition-all">
                  <div className="p-2 rounded-2xl bg-emerald-500/10 mb-2 text-emerald-400 group-hover:scale-110 transition-transform">
                     <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.2em] leading-none mb-2">PAGADO</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {finalPaid.toLocaleString()} <span className="text-sm font-black text-emerald-500/40 ml-1 italic font-mono">฿</span>
                  </span>
               </div>
               
               <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-rose-500/10 transition-all">
                  <div className="p-2 rounded-2xl bg-rose-500/10 mb-2 text-rose-400 group-hover:scale-110 transition-transform">
                     <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] leading-none mb-2">POR PAGAR</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {finalPending.toLocaleString()} <span className="text-sm font-black text-rose-400/40 ml-1 italic font-mono">฿</span>
                  </span>
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
                        <span className="text-[15px] text-gray-300 font-bold tracking-tight whitespace-nowrap">
                          {act.name}
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 text-center">
                        <span className="inline-flex items-center justify-center bg-surface-edge/60 min-w-[34px] h-9 rounded-lg text-[15px] font-black text-white border border-surface-edge shadow-sm font-mono">
                           {act.count}
                        </span>
                      </td>
                      <td className="px-[10px] py-2.5 text-right">
                        <span className="text-[14px] font-bold text-gray-400 font-mono italic">{act.ssi_cost.toLocaleString()}</span>
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
                <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Settings className="w-4 h-4 text-zinc-500" /> AJUSTES SSI

                </h4>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                                             <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">

                                                 <PlusCircle className="w-4 h-4 text-indigo-400" /> ADELANTO (PRÓX. MES)

                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/20 p-3 rounded-[2rem] border border-surface-edge/30 shadow-inner">
                        <input
                          type="number"
                          value={adjNext || ''}
                          placeholder="0"
                          onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setAdjNext(val);
                             saveSettlement(val, manualPaid, totalSsi + (val - adjNext) * FIXED_ADJ_PRICE);
                          }}
                                                     className="w-full bg-transparent text-3xl font-black text-indigo-400 font-mono text-center tracking-tighter outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

                        />
                      </div>
                  </div>

                  <div className="h-px bg-surface-edge/20 mx-2" />

                  <div className="flex flex-col opacity-90">
                                             <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">

                                                 <Trash2 className="w-4 h-4 text-cyan-400" /> AJUSTE (MES ANTERIOR)

                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/10 p-3 rounded-[2rem] border border-surface-edge/10">
                                                 <span className="text-3xl font-black text-cyan-400/50 font-mono flex-1 text-center tracking-tighter">{adjPrev}</span>

                      </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-edge/20 mt-2">
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                             <span className="text-[13px] font-black text-zinc-400 uppercase tracking-wider">Impacto Total</span>

                                             <span className={`text-lg font-black ${adjustmentsTotal >= 0 ? 'text-indigo-400' : 'text-cyan-400'} font-mono`}>

                        {adjustmentsTotal > 0 ? '+' : ''}{adjustmentsTotal.toLocaleString()} ฿
                      </span>
                   </div>
                </div>
             </div>

              {/* LIQUIDACIÓN MENSUAL UNIFICADA - CENTRADO Y ALINEADO */}
              <div className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                 
                 {/* BLOQUE ÚNICO DE DATOS - Centrado por fuera, alineado por dentro */}
                 <div className="w-fit mx-auto flex flex-col gap-6 w-full max-w-[240px]">
                    
                    {/* 1. PAGADO */}
                    <div className="flex flex-col gap-4 items-center">
                       <h4 className="text-[13px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <CreditCard className="w-4 h-4 text-emerald-400" /> PAGADO
                       </h4>
                       <div className="w-full bg-surface-edge/20 border-2 border-surface-edge/30 rounded-2xl py-3 px-2 focus-within:border-emerald-500/50 focus-within:bg-emerald-500/5 transition-all">
                          <div className="flex justify-center items-baseline gap-2">
                             <input
                               type="number"
                               value={manualPaid || ''}
                               placeholder="0"
                               onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setManualPaid(val);
                                  saveSettlement(adjNext, val, totalSsi);
                               }}
                               className="bg-transparent border-none p-0 !outline-none !ring-0 text-2xl font-black text-emerald-400 font-mono text-right w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                             />
                             <span className="text-emerald-400/50 font-black text-2xl font-mono w-4">฿</span>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-surface-edge/20" />

                    {/* 2. POR PAGAR */}
                    <div className="flex flex-col gap-2 items-center">
                       <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" /> POR PAGAR
                       </span>
                       <div className="flex justify-center items-baseline gap-2">
                          <span className={`text-2xl font-black font-mono text-right w-24 ${(totalSsi - manualPaid) === 0 ? 'text-emerald-500/50' : 'text-rose-400'}`}>
                             {(totalSsi - manualPaid).toLocaleString()}
                          </span>
                          <span className="text-rose-400/50 font-black text-2xl font-mono w-4">฿</span>
                       </div>
                    </div>

                    <div className="h-px bg-surface-edge/20" />

                    {/* 3. TOTAL */}
                    <div className="flex flex-col gap-2 items-center">
                       <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-amber-400" /> TOTAL
                       </span>
                       <div className="flex justify-center items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono text-right w-24">
                             {totalSsi.toLocaleString()}
                          </span>
                          <span className="text-amber-400/50 font-black text-2xl font-mono w-4">฿</span>
                       </div>
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
