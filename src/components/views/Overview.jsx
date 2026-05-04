/* Dashboard Overview - Relational & Optimized Version */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  TrendingDown,
  TrendingUp,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import logoFull from '../../assets/Logo_Ihasia.svg';

const tailwindToHex = (twClass) => {
  if (!twClass) return '#94a3b8';
  if (twClass.includes('blue-400')) return '#60a5fa';
  if (twClass.includes('rose-400')) return '#fb7185';
  if (twClass.includes('white')) return '#ffffff';
  if (twClass.includes('violet-300')) return '#c4b5fd';
  if (twClass.includes('orange-400')) return '#fb923c';
  if (twClass.includes('amber-400')) return '#fbbf24';
  if (twClass.includes('emerald-400')) return '#34d399';
  if (twClass.includes('fuchsia-400')) return '#e879f9';
  if (twClass.includes('purple-400')) return '#c084fc';
  
  if (twClass.includes('#00A3FF')) return '#00A3FF';
  if (twClass.includes('#a855f7')) return '#a855f7';
  if (twClass.includes('#f97316')) return '#f97316';
  if (twClass.includes('#d946ef')) return '#d946ef';
  if (twClass.includes('#ec4899')) return '#ec4899';
  if (twClass.includes('#eab308')) return '#eab308';
  return '#94a3b8';
};

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Data states
  const [staffData, setStaffData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [incomeData, setIncomeData] = useState({ 
    total: 0, 
    breakdown: {}, 
    collected: 0, 
    botes: 0,
    crData: [],
    btData: []
  });
  const [courseStats, setCourseStats] = useState({ count: 0, growth: 0 });

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDayNum}`;

    try {
      const [ 
        { data: monthlyReport }, 
        { data: monthlyActivities },
        { data: staffSettlements },
        { data: partnerSettlement },
        { data: bExpenses },
        { data: boteMonthly }, 
        { data: fixedSettings },
        { data: sSettlements },
        metricsRes,
        { data: prevYearReport },
        { data: prev2YearReport }
      ] = await Promise.all([
        supabase.from('monthly_reports').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('monthly_activity_summary').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('staff_settlements').select('*, staff(initials)').eq('year', year).eq('month', month),
        supabase.from('partner_settlements').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('bote_expenses').select('*').gte('date', firstDay).lte('date', lastDayStr),
        supabase.from('bote_monthly').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('fixed_expenses').select('*').order('name'),
        supabase.from('supplier_settlements').select('*').eq('year', year).eq('month', month),
        supabase.from('monthly_expenses').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('monthly_reports').select('total_courses, facturado').eq('year', year - 1).eq('month', month).maybeSingle(),
        supabase.from('monthly_reports').select('total_courses, facturado').eq('year', year - 2).eq('month', month).maybeSingle()
      ]);

      const mObj = metricsRes.data || {};

      // 2. Process Invoices (Ya no se calculan aquí, se leen de monthlyReport)
      const facturado = Number(monthlyReport?.facturado || 0);
      const pendiente = Number(monthlyReport?.pendiente || 0);
      const cobrado = Number(monthlyReport?.cobrado || 0);
      
      const wiseBT = Number(monthlyReport?.bt_wise || 0);
      const wiseCR = Number(monthlyReport?.cr_wise || 0);
      const eurBT = Number(monthlyReport?.bt_eur || 0);
      const eurCR = Number(monthlyReport?.cr_eur || 0);
      
      const totalCRAdvances = Number(monthlyReport?.cr_cash || 0);
      const totalBTAdvances = Number(monthlyReport?.bt_cash || 0);

      const openingCash = monthlyReport?.mes_anterior || 0;
      const boteTotal = Number(boteMonthly?.apartar_amount || 0);
      const botePending = monthlyReport?.bote_xpagar ?? boteTotal;

      const dbFacturado = facturado;
      const dbPendiente = pendiente;
      const dbCobrado = cobrado;

      const dbWiseBT = wiseBT;
      const dbWiseCR = wiseCR;
      const dbEurBT = eurBT;
      const dbEurCR = eurCR;

      const crData = [
        { name: 'CASH', value: totalCRAdvances, color: '#3b82f6' },
        { name: 'WISE', value: dbWiseCR, color: '#2563eb' },
        { name: 'EUR', value: dbEurCR, color: '#1d4ed8' }
      ].filter(d => d.value > 0);

      const btData = [
        { name: 'CASH', value: totalBTAdvances, color: '#f472b6' },
        { name: 'WISE', value: dbWiseBT, color: '#db2777' },
        { name: 'EUR', value: dbEurBT, color: '#9d174d' }
      ].filter(d => d.value > 0);

      // 4. Process Expenses
      const totalStaffCost = (staffSettlements || []).reduce((sum, s) => sum + (Number(s.total_commissions) || 0) + (Number(s.total_bonus) || 0), 0);
      const totalStaffPending = (staffSettlements || []).reduce((sum, s) => sum + (Number(s.total_payout) || 0), 0);

      const carabaoSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('carabao'));
      const carabaoTotal = Number(carabaoSettlement?.total_amount || 0);
      const carabaoPending = Number(carabaoSettlement?.pending_amount || 0);

      const ssiSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('ssi'));
      const ssiTotalFinal = ssiSettlement ? Number(ssiSettlement.total_amount) : 0;
      const ssiPendingFinal = ssiSettlement ? Number(ssiSettlement.pending_amount) : 0;

      const dynamicFixed = (fixedSettings || []).map(f => {
        let col = null;
        let displayName = f.name;
        if (f.name.toLowerCase().includes('office')) { col = 'office_xpagar'; displayName = 'OFFICE'; }
        else if (f.name.toLowerCase().includes('infinity')) { 
          col = 'infinity_xpagar'; 
          displayName = 'INFINITY';
          f.color = 'text-fuchsia-400';
        }
        else if (f.name.toLowerCase().includes('pae') || f.name.toLowerCase().includes('p ae')) { 
          col = 'pae_xpagar'; 
          displayName = 'P AE'; 
          f.color = 'text-emerald-400';
        }
        else if (f.name.toLowerCase().includes('poli')) { 
          col = 'polimigra_xpagar'; 
          displayName = 'POLI MIGRA'; 
          f.color = 'text-purple-400';
        }

        return {
          name: displayName,
          value: Number(f.amount) || 0,
          pending: col ? (monthlyReport?.[col] ?? Number(f.amount)) : Number(f.amount),
          color: f.color || 'text-white',
          isGeneric: !!col,
          col: col,
          isEditable: !!col
        };
      });

      const fixedOrder = ['OFFICE', 'INFINITY', 'P AE', 'POLI MIGRA'];
      const sortedDynamic = [...dynamicFixed].sort((a, b) => {
        const idxA = fixedOrder.indexOf(a.name);
        const idxB = fixedOrder.indexOf(b.name);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      const realFinanceTotal = (mObj.total_expenses || 0) + (mObj.comm_paid || 0) + (mObj.comm_pending || 0) + (mObj.snorkel_paid || 0) + (mObj.snorkel_pending || 0);
      const realFinancePending = (mObj.comm_pending || 0) + (mObj.snorkel_pending || 0);

      const rukSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('ruk'));
      const rukTotal = Number(rukSettlement?.total_amount || 0);
      const rukPending = rukSettlement ? Number(rukSettlement.pending_amount) : 0;

      const detailedExpenses = [
        { name: 'CARABAO', value: carabaoTotal, pending: carabaoPending, color: 'text-blue-400' },
        { name: 'SSI', value: ssiTotalFinal, pending: ssiPendingFinal, color: 'text-rose-400' },
        { 
          name: 'SUELDOS', 
          value: Number(monthlyReport?.sueldos_total || 0), 
          pending: Number(monthlyReport?.sueldos_pendiente || 0), 
          color: 'text-white' 
        },
        { name: 'GASTOS', value: realFinanceTotal, pending: realFinancePending, color: 'text-violet-300' },
        { name: 'BOTE', value: boteTotal, pending: botePending, color: 'text-orange-400', isEditable: true, col: 'bote_xpagar' },
        ...sortedDynamic,
        { name: 'RUK', value: rukTotal, pending: rukPending, color: 'text-amber-400' }
      ];

      // Los totales se calculan ahora automáticamente en la BD vía Triggers.
      // El Dashboard es ahora de solo lectura para los informes mensuales.

      setIncomeData({ 
        total: dbFacturado, 
        collected: dbCobrado,
        pending: dbPendiente,
        openingCash,
        boteTotal,
        botePending,
        expectedCash: monthlyReport?.deberia || 0,
        diff: monthlyReport?.falta_o_sobra || 0,
        bills_1000: monthlyReport?.bills_1000 || 0,
        bills_500: monthlyReport?.bills_500 || 0,
        bills_100: monthlyReport?.bills_100 || 0,
        bills_50: monthlyReport?.bills_50 || 0,
        bills_20: monthlyReport?.bills_20 || 0,
        crData,
        btData,
        breakdown: {
          'CASH REAL': monthlyReport?.cash || 0,
          'CR EUR': dbEurCR,
          'CR Wise': dbWiseCR,
          'CR Cash': totalCRAdvances,
          'BT Cash': totalBTAdvances,
          'BT Wise': dbWiseBT,
          'BT EUR': dbEurBT,
          '---': 'separator',
          'DEBERÍA': monthlyReport?.deberia || 0,
          'FALTA O SOBRA': monthlyReport?.falta_o_sobra || 0
        }
      });
      setExpenseData(detailedExpenses);

      setCourseStats({ 
        count: Number(monthlyActivities?.total_courses || 0), 
        target: Number(prevYearReport?.total_courses || 0),
        prevTarget: Number(prev2YearReport?.total_courses || 0),
        facturado: dbFacturado,
        prevFacturado: Number(prevYearReport?.facturado || 0)
      });
      
      // 5. Process Staff (Leemos directamente de staffSettlements ya sincronizado)

      const finalStaff = (staffSettlements || []).map(s => {
        const realComms = Number(s.total_commissions) || 0;
        const totalBonus = Number(s.total_bonus) || 0;
        
        return {
          name: s.staff?.initials || '??',
          totalEarned: realComms + totalBonus,
          pending: Number(s.total_payout) || 0
        };
      }).filter(s => s.totalEarned > 0).sort((a, b) => b.totalEarned - a.totalEarned);
      
      setStaffData(finalStaff);
      setMetrics(mObj);
      setMonthlyReport(monthlyReport);

      // 6. Sincronizar totales de sueldos con monthly_reports para persistencia
      // SEGURIDAD: Solo sincronizar automáticamente si estamos en el año en curso
      const currentYear = new Date().getFullYear();
      if (monthlyReport && year === currentYear && (Number(monthlyReport.sueldos_total) !== totalStaffCost || Number(monthlyReport.sueldos_pendiente) !== totalStaffPending)) {
        console.log("[Dashboard] Sincronizando totales de sueldos del año actual...");
        await supabase.from('monthly_reports').update({
          sueldos_total: totalStaffCost,
          sueldos_pendiente: totalStaffPending
        }).eq('year', year).eq('month', month);
      }

    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
    setLoading(false);
  }, [month, year]);

  const updateOpeningCash = async (val) => {
    const isBlank = val === '';
    const num = isBlank ? 0 : Number(val);
    setIncomeData(prev => ({ ...prev, openingCash: isBlank ? '' : num }));
    
    if (!isBlank) {
      await supabase.from('monthly_reports').upsert({ 
        year, 
        month, 
        mes_anterior: num,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'year, month' });
    }
  };

  const updateGenericPending = async (col, val) => {
    const isBlank = val === '';
    const num = isBlank ? null : Number(val);
    
    setExpenseData(prev => prev.map(e => {
      if (e.col === col) {
        return { ...e, pending: val }; 
      }
      return e;
    }));

    await supabase.from('monthly_reports').upsert({ 
      year, 
      month, 
      [col]: num,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'year, month' });

    // Si es un reseteo (vacío), forzamos la recarga para que aparezca el valor original
    if (isBlank) {
      fetchDashboardData();
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_settlements' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_settlements' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bote_expenses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bote_monthly' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_reports' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_expenses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_settlements' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_metrics' }, () => fetchDashboardData())
      .subscribe((status, err) => {
        if (err) console.error("Realtime subscription error:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const [activeStaff, setActiveStaff] = useState(null);
  const [activeExpense, setActiveExpense] = useState(null);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1c2d] border border-surface-edge p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[120px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-xl font-black text-white font-mono tracking-tighter">
            {Math.round(payload[0].value).toLocaleString()} <span className="text-xs opacity-50 ml-0.5">฿</span>
          </p>
          {payload[0].payload.perc && (
            <p className="text-[12px] font-black text-emerald-400/80 font-mono tracking-widest mt-1">
              {payload[0].payload.perc}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const commonTooltip = <Tooltip content={<CustomTooltip />} cursor={false} />;

  if (loading && !staffData.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-3 space-y-3 w-full animate-in fade-in duration-700 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-soft/30 py-8 px-6 rounded-2xl border border-surface-edge shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-8">
           <img src={logoFull} alt="Logo" className="w-28 h-28 object-contain brightness-0 invert opacity-100" />
           <img 
             src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-secondary.webp" 
             alt="iHasia Financial" 
             className="h-16 w-auto object-contain brightness-0 invert" 
           />
        </div>

        <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none text-center uppercase tracking-tighter">
              {months.map((m, i) => (<option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>))}
            </select>
            <div className="w-px h-4 bg-surface-edge/30 mx-1" />
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none text-center">
              {[2024, 2025, 2026, 2027].map(y => (<option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>))}
            </select>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Espacio reservado para futuros widgets de cabecera */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[260px]">
        <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col min-h-[240px]">
           <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Generado Staff</h3>
           <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={staffData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  {commonTooltip}
                  <Bar dataKey="totalEarned" radius={[4, 4, 0, 0]}>
                    {staffData.map((entry, index) => {
                      const isHovered = activeStaff === index;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          onMouseEnter={() => setActiveStaff(index)}
                          onMouseLeave={() => setActiveStaff(null)}
                          fill={`hsl(260, 80%, ${70 - (index * 5)}%)`} 
                          fillOpacity={isHovered ? 1 : 0.6}
                          stroke={isHovered ? 'white' : 'transparent'}
                          strokeWidth={isHovered ? 1 : 0}
                          className="transition-all duration-300 cursor-pointer" 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-5 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col min-h-[240px]">
           <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 text-center">Gastos</h3>
           <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ name: 'CRBT', value: (monthlyReport?.partner_split || 0) * 2, isProfit: true }, ...expenseData].map(item => ({ ...item, perc: incomeData.total > 0 ? ((item.value / incomeData.total) * 100).toFixed(1) : 0 }))}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  {commonTooltip}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[{ name: 'CRBT', value: (monthlyReport?.partner_split || 0) * 2, isProfit: true }, ...expenseData].map((entry, index) => {
                      const isHovered = activeExpense === index;
                      const fillCol = entry.isProfit ? '#10b981' : tailwindToHex(entry.color);
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          onMouseEnter={() => setActiveExpense(index)}
                          onMouseLeave={() => setActiveExpense(null)}
                          fill={fillCol} 
                          fillOpacity={isHovered ? 1 : 0.6}
                          stroke={isHovered ? 'white' : 'transparent'}
                          strokeWidth={isHovered ? 1 : 0}
                          className="transition-all duration-300 cursor-pointer" 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-3 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col justify-center min-h-[240px]">
           <h3 className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0 text-center">CRBT</h3>
           
           <div className="flex-1 flex flex-col justify-center gap-4">
             <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 border border-emerald-400/30 shadow-[0_8px_30px_rgba(16,185,129,0.3)] relative overflow-hidden flex items-center justify-between">
               {(() => {
                 const profit = (monthlyReport?.partner_split || 0) * 2;
                 const facturado = monthlyReport?.facturado || 0;
                 const margin = facturado > 0 ? ((profit / facturado) * 100).toFixed(1) : 0;
                 return (
                   <>
                     <div className="absolute -right-2 -bottom-4 text-[80px] font-black text-emerald-900/10 pointer-events-none select-none tracking-tighter">
                       {margin}<span className="text-[60px] ml-3 opacity-60">%</span>
                     </div>
                     
                     <div className="flex flex-col relative z-10">
                        <span className="text-[10px] text-emerald-100/80 uppercase font-black tracking-[0.2em] mb-1">Corte x Socio</span>
                        <span className="text-[36px] font-black text-white font-mono tracking-tighter drop-shadow-md leading-none">
                          {Math.round(monthlyReport?.partner_split || 0).toLocaleString()} <span className="text-xl text-emerald-200/80 ml-0.5">฿</span>
                        </span>
                     </div>
                     
                     <div className="flex flex-col items-end relative z-10">
                        <span className="text-[10px] text-emerald-100/80 uppercase font-black tracking-[0.2em] mb-1">Margen Total</span>
                        <div className="bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                          <span className="text-[24px] font-black text-white tracking-tighter font-mono leading-none">
                            {margin}<span className="ml-1 opacity-80">%</span>
                          </span>
                        </div>
                     </div>
                   </>
                 );
               })()}
             </div>

             <div className="grid grid-cols-2 gap-2">
               <div className="flex flex-col gap-1.5">
                 <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest text-center">CR (x cobrar)</span>
                 <div className="bg-blue-600 rounded-xl p-3 text-center border border-blue-500 shadow-lg">
                   <span className="text-[24px] font-black text-white font-mono tracking-tighter drop-shadow-md">
                     {Math.round(monthlyReport?.pending_cr || 0).toLocaleString()}
                   </span>
                 </div>
               </div>
               <div className="flex flex-col gap-1.5">
                 <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest text-center">BT (x cobrar)</span>
                 <div className="bg-pink-600 rounded-xl p-3 text-center border border-pink-500 shadow-lg">
                   <span className="text-[24px] font-black text-white font-mono tracking-tighter drop-shadow-md">
                     {Math.round(monthlyReport?.pending_bt || 0).toLocaleString()}
                   </span>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-24 gap-4">
         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl h-[480px] flex flex-col">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 px-2">Staff</h3>
            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-surface-edge/50">
                        <th className="text-[14px] font-black text-gray-500 uppercase py-0.5">Nombre</th>
                        <th className="text-[14px] font-black text-gray-500 uppercase py-0.5 text-right">Sueldo</th>
                        <th className="text-[14px] font-black text-gray-500 uppercase py-0.5 text-right">Pend.</th>
                     </tr>
                  </thead>
                  <tbody>
                     {staffData.map((s, idx) => (
                        <tr key={idx} className="border-b border-surface-edge/10">
                           <td className="py-0.5 text-sm font-black text-white uppercase">{s.name}</td>
                           <td className="py-0.5 text-right text-sm font-mono text-white">{Math.round(s.totalEarned).toLocaleString()}</td>
                           <td className={`py-0.5 text-right text-sm font-mono ${s.pending > 0 ? 'text-amber-500' : 'text-emerald-500 opacity-30'}`}>{Math.round(s.pending).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-surface-soft border-t-2 border-surface-edge/80 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                     <tr className="h-10">
                        <td className="text-[13px] font-black text-gray-400 uppercase italic pl-2">Total</td>
                        <td className="text-[18px] font-black text-cyan-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                           {Math.round(staffData.reduce((acc, s) => acc + s.totalEarned, 0)).toLocaleString()} <span className="text-[10px] ml-0.5 opacity-60">฿</span>
                        </td>
                        <td className="text-[18px] font-black text-orange-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(251,146,60,0.2)] pr-2">
                           {Math.round(staffData.reduce((acc, s) => acc + s.pending, 0)).toLocaleString()} <span className="text-[10px] ml-0.5 opacity-60">฿</span>
                        </td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>

         {(() => {
            const current = courseStats.count || 0;
            const target = courseStats.target || 0; // Year-1
            const progress = target > 0 ? Math.min(current / target, 1) : 0;
            const r = 80;
            const circ = 2 * Math.PI * r;
            const offset = circ - progress * circ;
            
            // Porcentajes de crecimiento de Cursos
            const yoyGrowth = target > 0 ? Math.round(((current - target) / target) * 100) : 0;
            const yoyGrowthText = yoyGrowth > 0 ? `+${yoyGrowth}%` : `${yoyGrowth}%`;
            const isPositive = yoyGrowth >= 0;
            
            // Comparativa Facturado
            const factCurrent = courseStats.facturado || 0;
            const factTarget = courseStats.prevFacturado || 0;
            const factGrowth = factTarget > 0 ? Math.round(((factCurrent - factTarget) / factTarget) * 100) : 0;
            const factGrowthText = factGrowth > 0 ? `+${factGrowth}%` : `${factGrowth}%`;
            const isFactPositive = factGrowth >= 0;

            return (
              <div className="lg:col-span-3 bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden h-[480px]">
                 <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-brand/10 rounded-full blur-[100px] pointer-events-none"></div>
                 
                 <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-auto text-center z-10 pt-2">Cursos<br/>Este Mes</h3>
                 
                 <div className="flex flex-col items-center justify-center flex-1 z-10">
                    <div className="relative flex items-center justify-center mb-6 mt-2">
                      <div className="absolute inset-0 bg-brand/10 blur-[40px] rounded-full"></div>
                      <svg className="w-48 h-48 transform -rotate-90 drop-shadow-[0_0_10px_rgba(0,163,255,0.1)]">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-edge/40" />
                        <circle 
                          cx="96" cy="96" r="80" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray={circ} 
                          strokeDashoffset={offset} 
                          className="text-brand transition-all duration-1000 ease-out" 
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,163,255,0.4)]">{current}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full px-2">
                       {/* Objetivo del año pasado */}
                       <div className="flex items-center justify-between bg-surface-edge/10 border border-surface-edge/20 px-4 py-2.5 rounded-xl">
                          <div className="flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-gray-400" />
                             <span className="text-xs font-bold text-gray-400 uppercase">Obj. {year - 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-white">{target}</span>
                             {target > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                   {yoyGrowthText}
                                </span>
                             )}
                          </div>
                       </div>

                       {/* Comparativa Facturado */}
                       <div className="flex items-center justify-between bg-surface-edge/10 border border-surface-edge/20 px-4 py-2.5 rounded-xl">
                          <div className="flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-gray-400" />
                             <span className="text-xs font-bold text-gray-400 uppercase">Fact. {year - 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-surface-edge/30 text-gray-300">
                                {Math.round(factTarget / 1000)}k
                             </span>
                             {factTarget > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isFactPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                   {factGrowthText}
                                </span>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            );
         })()}

         <div className="lg:col-span-6 bg-surface-soft border border-surface-edge rounded-3xl p-4 shadow-xl h-[480px] flex flex-col relative overflow-hidden">
            {/* Glow Ambient */}
            <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center z-10">Gastos X Pagar</h3>
            <div className="flex-1 overflow-auto custom-scrollbar z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-soft/95 backdrop-blur-md z-20">
                     <tr className="border-b border-surface-edge/40">
                        <th className="text-[10px] font-black text-gray-400 uppercase py-1 text-center w-20 tracking-widest">Categoría</th>
                        <th className="text-[10px] font-black text-gray-400 uppercase py-1 text-center w-24 tracking-widest">Gastos</th>
                        <th className="text-[10px] font-black text-gray-400 uppercase py-1 text-center w-10 tracking-widest">Pag.</th>
                        <th className="text-[10px] font-black text-rose-400/80 uppercase py-1 text-center w-28 tracking-widest">X Pagar</th>
                        <th className="text-[10px] font-black text-gray-400 uppercase py-1 text-center w-10 tracking-widest">%</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {expenseData.map((e, idx) => {
                        const facturado = incomeData.total || 0;
                        const perc = facturado > 0 ? ((e.value / facturado) * 100).toFixed(1) : 0;
                        const isPaid = e.pending === 0 || e.pending === '0';
                        
                        return (
                           <tr key={idx} className="group hover:bg-white-[0.02] transition-colors">
                               <td className="py-0.5 text-left pl-2"><span className={`text-[12px] font-black uppercase tracking-widest whitespace-nowrap ${e.color || 'text-gray-300'}`}>{e.name}</span></td>
                               <td className="py-0.5 text-right font-mono text-[16px] text-gray-400 pr-2">{Math.round(e.value).toLocaleString()}</td>
                               <td className="py-0.5 text-center">
                                 {e.isEditable || e.isGeneric ? (
                                   <div className="flex justify-center">
                                     <button 
                                       onClick={() => updateGenericPending(e.col, isPaid ? '' : '0')}
                                       className={`p-1 rounded-lg transition-all ${isPaid ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'text-gray-600 hover:text-gray-300 bg-surface-edge/20 hover:bg-surface-edge/40'}`}
                                     >
                                       <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'fill-emerald-500/20' : ''}`} />
                                     </button>
                                   </div>
                                 ) : <div className="text-gray-700/50 text-center">-</div>}
                               </td>
                               <td className="py-0.5 px-1">
                                 <div className={`w-full rounded-lg px-2 transition-all ${
                                    isPaid 
                                      ? 'bg-transparent text-emerald-400/40' 
                                      : 'bg-rose-500/10 border border-rose-500/20 shadow-inner text-white'
                                 }`}>
                                   {e.isEditable || e.isGeneric ? (
                                     <input 
                                       type="text"
                                       inputMode="decimal"
                                       value={e.pending} 
                                       onChange={(evt) => updateGenericPending(e.col, evt.target.value)}
                                       onBlur={() => fetchDashboardData()}
                                       className={`bg-transparent border-none text-right font-mono text-[18px] font-black w-full outline-none focus:text-brand transition-colors no-spinner ${isPaid ? 'text-emerald-400/40' : 'text-white'}`}
                                     />
                                   ) : (
                                     <div className="text-right font-mono text-[18px] font-black">{Math.round(e.pending || 0).toLocaleString()}</div>
                                   )}
                                 </div>
                               </td>
                               <td className="py-0.5 text-center font-mono text-[12px] text-gray-500 font-bold">
                                 {perc}<span className="ml-1 opacity-60">%</span>
                               </td>
                           </tr>
                        );
                     })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-surface-soft/95 backdrop-blur-md border-t border-surface-edge/50 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-20">
                     <tr className="h-10">
                        <td className="text-[12px] font-black text-gray-400 uppercase tracking-widest text-center">Total</td>
                         <td className="text-[18px] font-black text-gray-300 text-right font-mono tracking-tighter pr-2">
                            {Math.round(expenseData.reduce((acc, e) => acc + e.value, 0)).toLocaleString()}
                         </td>
                         <td className="text-center text-gray-700/50">-</td>
                         <td className="text-[20px] font-black text-rose-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] pr-3">
                            {Math.round(expenseData.reduce((acc, e) => acc + (Number(e.pending) || 0), 0)).toLocaleString()} <span className="text-[14px] text-rose-500/50">฿</span>
                         </td>
                        <td className="text-[12px] font-black text-gray-500 text-center font-mono">
                          {incomeData.total > 0 ? ((expenseData.reduce((acc, e) => acc + e.value, 0) / incomeData.total) * 100).toFixed(1) : 0}<span className="ml-1 opacity-60">%</span>
                        </td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>

         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center text-emerald-400">Cuentas</h3>
            <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-gray-400 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Mes Anterior</span>
                  <input 
                    type="number" 
                    value={incomeData.openingCash === 0 ? 0 : (incomeData.openingCash || '')} 
                    onChange={(e) => updateOpeningCash(e.target.value)} 
                    onBlur={() => fetchDashboardData()}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    className="bg-transparent border-none text-right font-mono text-sm font-black w-24 outline-none focus:text-white transition-colors no-spinner" 
                  />
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 text-emerald-400 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado</span>
                  <span className="text-sm font-black font-mono">{Math.round(incomeData.total || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-emerald-400 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado</span>
                  <span className="text-sm font-black font-mono">{Math.round(incomeData.collected || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-rose-400 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Por Cobrar</span>
                  <span className="text-sm font-black font-mono">{Math.round(incomeData.pending || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-rose-400 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Pagado</span>
                  <span className="text-sm font-black font-mono">
                    {Math.round(monthlyReport?.total_pagado || 0).toLocaleString()}
                  </span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-emerald-400/50 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado + Mes Ant.</span>
                  <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_disponible || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-white/30 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado + Mes Ant.</span>
                  <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_facturado_mes_ant || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-white/30 mb-1.5">
                  <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Hay o Habrá + Pagado</span>
                  <span className="text-sm font-black font-mono">
                    {Math.round(monthlyReport?.hay_o_habra_mas_pagado || 0).toLocaleString()}
                  </span>
               </div>
            </div>
          </div>

         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Ingresos</h3>
            <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
                {Object.entries(incomeData.breakdown || {}).map(([label, value], idx) => {
                  if (label === '---') return <div key={idx} className="h-px bg-surface-edge/30 my-3 mx-2" />;
                  
                  const diff = incomeData.diff || 0;
                   const diffColor = diff === 0 ? 'text-blue-400' : diff > 0 ? 'text-emerald-400' : 'text-rose-400';

                  return (
                    <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-1.5 transition-all ${
                       label.startsWith('CR') ? 'bg-blue-600 text-white' : 
                       label.startsWith('BT') ? 'bg-pink-600 text-white' : 
                       label === 'CASH REAL' ? 'bg-white/10 text-emerald-400 border border-emerald-500/20' :
                       label === 'FALTA O SOBRA' ? `bg-white/5 ${diffColor} font-bold` :
                       label === 'DEBERÍA' ? 'bg-white/5 text-white/60 italic' : 'bg-white/5 text-gray-400'
                    }`}>
                       <span className="text-[12px] font-black uppercase tracking-wider">{label}</span>
                       <span className="text-sm font-black font-mono">{Math.round(value).toLocaleString()}</span>
                    </div>
                  );
                })}
            </div>
         </div>

         <div className="lg:col-span-3 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Saldos CR</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
               <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                     <Pie data={incomeData.crData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {incomeData.crData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-edge/30 flex-1 flex flex-col items-center justify-center">
               <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Saldos BT</h3>
               <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                     <Pie data={incomeData.btData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {incomeData.btData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
