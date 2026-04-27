/* Dashboard Overview - Ultra Compact Version */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart3, 
  ChevronLeft, 
  ChevronRight
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
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    try {
      const { data: allInvoices, error: invErr } = await supabase.from('invoices').select(`
        *, 
        invoice_items(id, quantity, total_thb, unit_price_thb, date, status, payment_method, activity_id, instructor_id,
          activities(id, name, category, acronym, ssi_cost_thb))
      `);

      if (invErr) throw invErr;

      const monthInvoices = (allInvoices || []).filter(inv => {
        const items = inv.invoice_items || [];
        if (!items.length) return false;
        return items.some(it => { 
          if (!it.date) return true; 
          const [y, m] = it.date.split('-').map(Number); 
          return y === year && m === month; 
        });
      });

      const { data: staffList } = await supabase.from('staff').select('id, first_name, last_name, base_salary, initials');
      const { data: rules } = await supabase.from('instructor_payouts').select('*');
      const { data: bExpenses } = await supabase.from('bote_expenses').select('*').gte('date', firstDay).lte('date', lastDay);

      let facturado = 0, pendiente = 0, wiseBT = 0, wiseCR = 0, eurBT = 0, eurCR = 0, balanceCash = 0;
      let ssiTotal = 0;
      const staffMap = {};
      const courseAcronyms = ['OW', 'AOW', 'SD', 'S&R'];
      let currentMonthCourses = 0;

      monthInvoices.forEach(inv => {
        inv.invoice_items?.forEach(item => {
          let isThisMonth = false;
          if (!item.date) {
            isThisMonth = true; 
          } else {
            const [y, m] = item.date.split('-').map(Number);
            if (y === year && m === month) isThisMonth = true;
          }

          if (!isThisMonth) return;

          const total = Number(item.total_thb || 0);
          facturado += total;
          
          if (item.status === 'Pending') {
            pendiente += total;
          } else {
            const method = (item.payment_method || 'CASH').toUpperCase();
            if (method === 'WISE BT') wiseBT += total;
            else if (method === 'WISE CR') wiseCR += total;
            else if (method === 'EUR BT') eurBT += total;
            else if (method === 'EUR CR') eurCR += total;
            else if (method === 'CASH' || method === '') balanceCash += total;
          }

          ssiTotal += (Number(item.activities?.ssi_cost_thb || 0) * Number(item.quantity || 1));

          if (courseAcronyms.includes(item.activities?.acronym) && Number(item.quantity ?? 1) > 0) {
            currentMonthCourses += Number(item.quantity || 1);
          }

          if (item.instructor_id) {
            if (!staffMap[item.instructor_id]) staffMap[item.instructor_id] = { total: 0, pending: 0 };
            const rule = rules?.find(r => r.activity_id === item.activity_id);
            const comm = Number(item.quantity || 1) * (rule?.amount_thb || 0);
            staffMap[item.instructor_id].total += comm;
            if (item.status === 'Pending') staffMap[item.instructor_id].pending += comm;
          }
        });
      });

      const partnerKey = `partner_payout_CRBT_${year}_${month}`;
      const { data: partnerSetting } = await supabase.from('settings').select('value').eq('key', partnerKey).maybeSingle();
      const partnerAdvances = partnerSetting?.value?.advances || [];
      const totalCRAdvances = partnerAdvances.filter(a => a.partner === 'CR').reduce((acc, a) => acc + (Number(a.amount) || 0), 0);
      const totalBTAdvances = partnerAdvances.filter(a => a.partner === 'BT').reduce((acc, a) => acc + (Number(a.amount) || 0), 0);

      const crData = [
        { name: 'CASH', value: totalCRAdvances, color: '#3b82f6' },
        { name: 'WISE', value: wiseCR, color: '#2563eb' },
        { name: 'EUR', value: eurCR, color: '#1d4ed8' }
      ].filter(d => d.value > 0);

      const btData = [
        { name: 'CASH', value: totalBTAdvances, color: '#f472b6' },
        { name: 'WISE', value: wiseBT, color: '#db2777' },
        { name: 'EUR', value: eurBT, color: '#9d174d' }
      ].filter(d => d.value > 0);

      setIncomeData({ 
        total: facturado, 
        collected: facturado - pendiente + totalCRAdvances + totalBTAdvances,
        botes: totalCRAdvances + totalBTAdvances,
        crData,
        btData,
        breakdown: {
          'POR COBRAR': pendiente,
          'CASH': balanceCash,
          'CR EUR': eurCR,
          'CR Wise': wiseCR,
          'CR Cash': totalCRAdvances,
          'BT Cash': totalBTAdvances,
          'BT Wise': wiseBT,
          'BT EUR': eurBT
        }
      });

      setCourseStats(prev => ({ ...prev, count: currentMonthCourses }));

      const expMap = { 'Bote': 0, 'Otros': 0 };
      bExpenses?.forEach(e => {
        const cat = e.category === 'Bote' ? 'Bote' : 'Otros';
        expMap[cat] += Number(e.amount);
      });

      const { data: fixedSettings } = await supabase.from('settings').select('*').in('key', ['fixed_expense_office', 'fixed_expense_infinity', 'fixed_expense_pae', 'fixed_expense_polimigra']);
      const getFixed = (key, def) => Number(fixedSettings?.find(s => s.key === key)?.value || def);

      const detailedExpenses = [
        { name: 'Carabao', value: 270000, pending: 120000, color: 'text-blue-400' },
        { name: 'SSI', value: ssiTotal, pending: ssiTotal, color: 'text-rose-500' },
        { name: 'Sueldos', value: Object.values(staffMap).reduce((sum, s) => sum + s.total, 0), pending: Object.values(staffMap).reduce((sum, s) => sum + s.pending, 0), color: 'text-white' },
        { name: 'Office', value: getFixed('fixed_expense_office', 13500), pending: 0, color: 'text-blue-300' },
        { name: 'Infinity', value: getFixed('fixed_expense_infinity', 6367), pending: 6367, color: 'text-fuchsia-500' },
        { name: 'Bote', value: expMap['Bote'], pending: expMap['Bote'], color: 'text-orange-400' },
        { name: 'Gastos', value: expMap['Otros'], pending: expMap['Otros'] * 0.4, color: 'text-white' },
        { name: 'Ruk', value: 0, pending: 0, color: 'text-yellow-500' },
        { name: 'P Ae', value: getFixed('fixed_expense_pae', 5000), pending: 0, color: 'text-emerald-500' },
        { name: 'Poli migra', value: getFixed('fixed_expense_polimigra', 5000), pending: 0, color: 'text-purple-500' }
      ];
      setExpenseData(detailedExpenses);

      const finalStaff = staffList.map(s => ({
        name: s.initials,
        totalEarned: (s.base_salary || 0) + (staffMap[s.id]?.total || 0),
        pending: (staffMap[s.id]?.pending || 0)
      })).filter(s => s.totalEarned > 0);
      setStaffData(finalStaff);

    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bote_expenses' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => fetchDashboardData())
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

  if (loading && !staffData.length) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-black text-xs uppercase tracking-[0.3em]">Cargando Dashboard...</p>
      </div>
    );
  }

  const commonTooltip = (
    <Tooltip 
      contentStyle={{backgroundColor: '#1a1c2d', borderRadius: '12px', border: '1px solid #2d2f3d', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'}}
      itemStyle={{color: '#ffffff', fontSize: '10px', fontWeight: 800}}
    />
  );

  return (
    <div className="p-2 md:p-3 space-y-3 w-full animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-soft/30 p-4 rounded-2xl border border-surface-edge shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-emerald-400/10 rounded-xl text-emerald-400 border border-emerald-400/20">
              <BarChart3 className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-white tracking-tighter">Financial Dashboard</h1>
              <p className="text-gray-500 text-[14px] font-black uppercase tracking-widest mt-0.5">iHasia Diving Center ERP v2.0</p>
           </div>
        </div>

        <div className="flex items-center bg-surface-soft/50 p-2 rounded-xl border border-surface-edge">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-surface-edge rounded-lg text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-white font-black text-sm min-w-[140px] text-center uppercase tracking-widest italic">{months[month - 1]} {year}</span>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-surface-edge rounded-lg text-gray-400"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* TOP ROW: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[260px]">
        <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col min-h-[240px]">
           <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Sueldos Staff</h3>
           <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={staffData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  {commonTooltip}
                  <Bar dataKey="totalEarned" radius={[4, 4, 0, 0]}>
                    {staffData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(260, 80%, ${70 - (index * 5)}%)`} />
                    ))}
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
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
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

      {/* BOTTOM SECTION - 24 COLUMN GRID FOR PRECISION */}
      <div className="grid grid-cols-1 lg:grid-cols-24 gap-4">
         {/* 1. Staff Table */}
         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl h-[480px] flex flex-col">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Staff</h3>
            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-surface-edge/50">
                        <th className="text-[14px] font-black text-gray-500 uppercase py-2">Nombre</th>
                        <th className="text-[14px] font-black text-gray-500 uppercase py-2 text-right">Sueldo</th>
                        <th className="text-[14px] font-black text-gray-500 uppercase py-2 text-right">Pend.</th>
                     </tr>
                  </thead>
                  <tbody>
                     {staffData.map((s, idx) => (
                        <tr key={idx} className="border-b border-surface-edge/10">
                           <td className="py-2 text-sm font-black text-white uppercase">{s.name}</td>
                           <td className="py-2 text-right text-sm font-mono text-white">{Math.round(s.totalEarned).toLocaleString()}</td>
                           <td className={`py-2 text-right text-sm font-mono ${s.pending > 0 ? 'text-amber-500' : 'text-emerald-500 opacity-30'}`}>{Math.round(s.pending).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* 2. Cursos */}
         <div className="lg:col-span-3 bg-[#0f111a] border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col justify-center items-center h-[480px]">
            <span className="text-6xl font-black text-white tracking-tighter leading-none">{courseStats.count}</span>
            <span className="text-[14px] font-black text-gray-600 uppercase tracking-widest mt-2 text-center leading-tight">Cursos<br/>Mes</span>
         </div>

         {/* 3. Gastos X Pagar */}
         <div className="lg:col-span-6 bg-surface-soft border border-surface-edge rounded-2xl p-2 shadow-xl h-[480px] flex flex-col">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Gastos X Pagar</h3>
            <div className="flex-1 overflow-auto custom-scrollbar pr-1">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-soft z-10">
                     <tr className="border-b border-surface-edge/50">
                        <th className="text-[12px] font-black text-gray-500 uppercase py-1">Categoría</th>
                        <th className="text-[12px] font-black text-gray-500 uppercase py-1 text-right">Gastos</th>
                        <th className="text-[12px] font-black text-gray-500 uppercase py-1 text-right">X Pagar</th>
                        <th className="text-[12px] font-black text-gray-500 uppercase py-1 text-right">%</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-edge/10">
                     {expenseData.map((e, idx) => {
                        const totalExp = expenseData.reduce((acc, curr) => acc + curr.value, 0);
                        const perc = totalExp > 0 ? ((e.value / totalExp) * 100).toFixed(1) : 0;
                        return (
                           <tr key={idx} className="group hover:bg-white/5 transition-colors">
                              <td className="py-1">
                                 <span className={`text-sm font-black uppercase tracking-tighter ${e.color || 'text-gray-300'}`}>{e.name}</span>
                              </td>
                              <td className="py-1 text-right font-mono text-sm text-gray-400 bg-white/5 px-1 rounded-lg">{Math.round(e.value).toLocaleString()}</td>
                              <td className="py-1 text-right font-mono text-sm text-white font-bold bg-white/5 px-1 rounded-lg">{Math.round(e.pending).toLocaleString()}</td>
                              <td className="py-1 text-right font-mono text-[10px] text-gray-600">{perc}%</td>
                           </tr>
                        );
                     })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-surface-soft border-t border-surface-edge shadow-xl">
                     <tr className="h-8">
                        <td className="text-[12px] font-black text-white uppercase italic">Total</td>
                        <td className="text-sm font-black text-white text-right font-mono">
                           {Math.round(expenseData.reduce((acc, e) => acc + e.value, 0)).toLocaleString()}
                        </td>
                        <td className="text-[16px] font-black text-rose-500 text-right font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                           {Math.round(expenseData.reduce((acc, e) => acc + e.pending, 0)).toLocaleString()}
                        </td>
                        <td className="text-[12px] font-black text-gray-500 text-right font-mono">100%</td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>

         {/* 4. Cuentas (Nuevo Panel) */}
         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 text-center text-emerald-400">Cuentas</h3>
            <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-emerald-950 shadow-md">
                  <span className="text-[12px] font-black uppercase tracking-wider">Facturado</span>
                  <span className="text-sm font-black font-mono">{Math.round(incomeData.total || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-gray-400">
                  <span className="text-[12px] font-black uppercase tracking-wider">Mes Anterior</span>
                  <span className="text-sm font-black font-mono">0</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500 text-indigo-950 shadow-md">
                  <span className="text-[12px] font-black uppercase tracking-wider">Cobrado</span>
                  <span className="text-sm font-black font-mono">{Math.round(incomeData.collected || 0).toLocaleString()}</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-rose-500/70">
                  <span className="text-[12px] font-black uppercase tracking-wider">Falta o Sobra</span>
                  <span className="text-sm font-black font-mono">0</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-emerald-400/70">
                  <span className="text-[12px] font-black uppercase tracking-wider text-center leading-tight">Cobrado +<br/>Mes Ant.</span>
                  <span className="text-sm font-black font-mono">0</span>
               </div>
               <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-white/50">
                  <span className="text-[12px] font-black uppercase tracking-wider text-center leading-tight">Facturado +<br/>Mes Ant.</span>
                  <span className="text-sm font-black font-mono">0</span>
               </div>
               <div className="mt-4 flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Hay o Habrá + Pagado</span>
                  <span className="text-2xl font-black font-mono tracking-tighter">0</span>
               </div>
            </div>
         </div>

         {/* 5. Ingresos */}
         <div className="lg:col-span-4 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
            <h3 className="text-[14px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 text-center">Ingresos</h3>
            <div className="space-y-2 flex-1 overflow-auto custom-scrollbar">
               {Object.entries(incomeData.breakdown || {}).map(([label, value], idx) => (
                  <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-1.5 transition-all ${
                     label.startsWith('CR') ? 'bg-blue-600 text-white shadow-md' : 
                     label.startsWith('BT') ? 'bg-pink-600 text-white shadow-md' : 
                     label === 'POR COBRAR' ? 'bg-white/5 text-white/40' : 'bg-white/5 text-gray-400'
                  }`}>
                     <span className="text-[14px] font-black uppercase tracking-wider">{label}</span>
                     <span className="text-sm font-black font-mono">{Math.round(value).toLocaleString()}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* 6. Donuts */}
         <div className="lg:col-span-3 flex flex-col gap-4 h-[480px]">
            <div className="flex-1 bg-surface-soft border border-surface-edge rounded-2xl p-3 shadow-xl flex flex-col">
               <h3 className="text-[14px] font-black text-gray-500 uppercase text-center mb-2">CR Cobrado</h3>
               <div className="flex-1 w-full h-[120px]">
                  <ResponsiveContainer width="100%" height={120}>
                     <PieChart>
                        <Pie data={incomeData.crData} innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value">
                           {incomeData.crData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                        </Pie>
                        {commonTooltip}
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="flex-1 bg-surface-soft border border-surface-edge rounded-2xl p-3 shadow-xl flex flex-col">
               <h3 className="text-[14px] font-black text-gray-500 uppercase text-center mb-2">BT Cobrado</h3>
               <div className="flex-1 w-full h-[120px]">
                  <ResponsiveContainer width="100%" height={120}>
                     <PieChart>
                        <Pie data={incomeData.btData} innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value">
                           {incomeData.btData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                        </Pie>
                        {commonTooltip}
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      </div>


    </div>
  );
}
