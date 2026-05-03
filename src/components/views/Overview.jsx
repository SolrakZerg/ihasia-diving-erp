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
        metricsRes
      ] = await Promise.all([
        supabase.from('monthly_reports').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('monthly_activity_summary').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('staff_settlements').select('*, staff(initials)').eq('year', year).eq('month', month),
        supabase.from('partner_settlements').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('bote_expenses').select('*').gte('date', firstDay).lte('date', lastDayStr),
        supabase.from('bote_monthly').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('fixed_expenses').select('*').order('name'),
        supabase.from('supplier_settlements').select('*').eq('year', year).eq('month', month),
        supabase.from('monthly_metrics').select('metric_key, value').eq('year', year).eq('month', month)
      ]);

      const mObj = (metricsRes.data || []).reduce((acc, m) => ({ ...acc, [m.metric_key]: Number(m.value) }), {});

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
      const ssiTotal = Number(monthlyReport?.ssi_estimated || 0);
      const ssiTotalFinal = ssiSettlement ? Number(ssiSettlement.total_amount) : ssiTotal;
      const ssiPendingFinal = ssiSettlement ? Number(ssiSettlement.pending_amount) : ssiTotal;

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
        { name: 'SUELDOS', value: totalStaffCost, pending: totalStaffPending, color: 'text-white' },
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

      setCourseStats({ count: Number(monthlyActivities?.total_courses || 0), target: 20 });
      
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_activity_summary' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_expenses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_settlements' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_metrics' }, () => fetchDashboardData())
      .subscribe();

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
                <BarChart data={expenseData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  {commonTooltip}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {expenseData.map((entry, index) => {
                      const colors = ['#3b82f6', '#ef4444', '#a855f7', '#6366f1', '#f59e0b'];
                      const isHovered = activeExpense === index;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          onMouseEnter={() => setActiveExpense(index)}
                          onMouseLeave={() => setActiveExpense(null)}
                          fill={colors[index % colors.length]} 
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

        <div className="lg:col-span-3 bg-black border border-surface-edge rounded-2xl p-4 shadow-2xl flex flex-col items-center justify-center min-h-[240px]">
           <img src={logoFull} alt="iHasia" className="w-28 h-28 object-contain brightness-0 invert opacity-90" />
           <h2 className="text-lg font-black text-white tracking-widest uppercase italic mt-2 text-center">IHASIA</h2>
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

         <div className="lg:col-span-3 bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center h-[480px]">
             <span className="text-[13px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center leading-tight">Cursos<br/>este Mes</span>
             <span className="text-8xl font-black text-white tracking-tighter leading-none">{courseStats.count}</span>
             <div className="mt-8 p-3 bg-brand/10 rounded-2xl border border-brand/20"><TrendingUp className="w-6 h-6 text-brand" /></div>
          </div>

         <div className="lg:col-span-6 bg-surface-soft border border-surface-edge rounded-2xl p-2 shadow-xl h-[480px] flex flex-col">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Gastos X Pagar</h3>
            <div className="flex-1 overflow-auto custom-scrollbar pr-1">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-soft z-10">
                     <tr className="border-b border-surface-edge/50">
                        <th className="text-[11px] font-black text-gray-500 uppercase py-1 w-20">Categoría</th>
                        <th className="text-[11px] font-black text-gray-500 uppercase py-1 text-right w-24">Gastos</th>
                        <th className="text-[11px] font-black text-gray-500 uppercase py-1 text-center w-8">Pag.</th>
                        <th className="text-[11px] font-black text-gray-500 uppercase py-1 text-right w-28">X Pagar</th>
                        <th className="text-[11px] font-black text-gray-500 uppercase py-1 text-right w-10">%</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-edge/10">
                     {expenseData.map((e, idx) => {
                        const totalExp = expenseData.reduce((acc, curr) => acc + curr.value, 0);
                        const perc = totalExp > 0 ? ((e.value / totalExp) * 100).toFixed(1) : 0;
                        const isPaid = e.pending === 0 || e.pending === '0';

                        return (
                           <tr key={idx} className="group hover:bg-white/5 transition-colors">
                               <td className="py-1"><span className={`text-[12px] font-black uppercase tracking-tighter ${e.color || 'text-gray-300'}`}>{e.name}</span></td>
                               <td className="py-1 text-right font-mono text-[18px] text-gray-400 bg-white/5 px-1 rounded-lg">{Math.round(e.value).toLocaleString()}</td>
                               <td className="py-1 text-center">
                                 {e.isEditable || e.isGeneric ? (
                                   <button 
                                     onClick={() => updateGenericPending(e.col, isPaid ? '' : '0')}
                                     className={`p-0.5 rounded-lg transition-all ${isPaid ? 'text-emerald-500 bg-emerald-500/10' : 'text-gray-600 hover:text-gray-400 bg-white/5'}`}
                                   >
                                     <CheckCircle2 className={`w-4 h-4 ${isPaid ? 'fill-emerald-500/20' : ''}`} />
                                   </button>
                                 ) : null}
                               </td>
                               <td className="py-1 text-right font-mono text-[18px] text-white font-bold bg-white/5 px-1 rounded-lg">
                                 {e.isEditable || e.isGeneric ? (
                                   <input 
                                     type="text"
                                     inputMode="decimal"
                                     value={e.pending} 
                                     onChange={(evt) => updateGenericPending(e.col, evt.target.value)}
                                     onBlur={() => fetchDashboardData()}
                                     className="bg-transparent border-none text-right font-mono text-[18px] font-black w-20 outline-none focus:text-brand transition-colors no-spinner"
                                   />
                                 ) : (
                                   Math.round(e.pending || 0).toLocaleString()
                                 )}
                               </td>
                               <td className="py-1 text-right font-mono text-[10px] text-gray-600">{perc}%</td>
                           </tr>
                        );
                     })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-surface-soft border-t border-surface-edge shadow-xl">
                     <tr className="h-8">
                        <td className="text-[12px] font-black text-white uppercase italic">Total</td>
                         <td className="text-[20px] font-black text-white text-right font-mono tracking-tighter">
                            {Math.round(expenseData.reduce((acc, e) => acc + e.value, 0)).toLocaleString()} ฿
                         </td>
                         <td></td>
                         <td className="text-[20px] font-black text-rose-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                            {Math.round(expenseData.reduce((acc, e) => acc + (Number(e.pending) || 0), 0)).toLocaleString()} ฿
                         </td>
                        <td className="text-[12px] font-black text-gray-500 text-right font-mono">100%</td>
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
                  <input type="number" value={incomeData.openingCash || 0} onChange={(e) => updateOpeningCash(e.target.value)} className="bg-transparent border-none text-right font-mono text-sm font-black w-24 outline-none focus:text-white transition-colors no-spinner" />
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
                    {Math.round(monthlyReport?.total_auditoria || 0).toLocaleString()}
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
