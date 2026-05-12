import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle,
  Loader2,
  Save,
  Shirt,
  ShieldCheck,
  Package,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X
} from 'lucide-react';

export default function BoteManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  
  const [initialBote, setInitialBote] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ tshirts: 0, insurances: 0 });
  
  const [newExpense, setNewExpense] = useState({
    day: new Date().getDate(),
    amount: '',
    concept: '',
    category: 'Material'
  });

  const [isEditingInitial, setIsEditingInitial] = useState(false);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ day: '', amount: '', concept: '', category: '' });

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    fetchBoteData();
  }, [month, year]);

  // AUTO-SAVE: Sincroniza el total a apartar con la BD para el Dashboard
  useEffect(() => {
    if (!loading && (stats.tshirts > 0 || stats.insurances > 0)) {
      const timer = setTimeout(() => {
        saveFinalBalance();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  const fetchBoteData = async () => {
    setLoading(true);
    try {
      const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

      // 1. Fetch Bote Stats for this month from NEW TABLE
      const { data: boteData } = await supabase
        .from('bote_monthly')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (boteData) {
        setInitialBote(Number(boteData.initial_balance || 0));
      } else {
        // Try to find previous month's final bote from the new table
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        
        const { data: prevData } = await supabase
          .from('bote_monthly')
          .select('final_balance')
          .eq('year', prevYear)
          .eq('month', prevMonth)
          .maybeSingle();
          
        setInitialBote(prevData ? Number(prevData.final_balance) : 0);
      }

      // 2. Fetch T-shirt Income (from invoice_items where activity has tshirt_included)
      const { data: items } = await supabase
        .from('invoice_items')
        .select(`
          quantity,
          activities!inner (tshirt_included)
        `)
        .eq('activities.tshirt_included', true)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
      
      const tshirtsCount = items?.reduce((acc, item) => acc + Number(item.quantity ?? 1), 0) || 0;

      // 3. Fetch Insurance Income (from insurance_batches total_pax)
      const { data: batches } = await supabase
        .from('insurance_batches')
        .select('total_pax')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
      
      const insurancesCount = batches?.reduce((acc, b) => acc + (b.total_pax || 0), 0) || 0;

      setStats({ tshirts: tshirtsCount, insurances: insurancesCount });

      // 4. Fetch Expenses
      const { data: expenseData } = await supabase
        .from('bote_expenses')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });
      
      setExpenses(expenseData || []);

    } catch (error) {
      console.error('Error fetching bote data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFinalBalance = async () => {
    const incomeValue = (stats.tshirts * 160) + (stats.insurances * 75);
    const totalExp = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const final = initialBote + incomeValue - totalExp;
    
    await supabase.from('bote_monthly').upsert({ 
      year, 
      month, 
      initial_balance: initialBote,
      apartar_amount: incomeValue,
      expenses_total: totalExp,
      final_balance: final,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'year, month' });
  };

  const updateInitialBote = async (val) => {
    const num = Number(val);
    setInitialBote(num);
    await supabase.from('bote_monthly').upsert({ 
      year, 
      month, 
      initial_balance: num,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'year, month' });
    saveFinalBalance();
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.concept) return;
    setSaving(true);
    try {
      const fullDate = `${year}-${month.toString().padStart(2, '0')}-${newExpense.day.toString().padStart(2, '0')}`;
      const payload = {
        date: fullDate,
        amount: newExpense.amount,
        concept: newExpense.concept,
        category: newExpense.category
      };

      const { data, error } = await supabase
        .from('bote_expenses')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      setExpenses([data, ...expenses]);
      setNewExpense({
        day: new Date().getDate(),
        amount: '',
        concept: '',
        category: 'Material'
      });
      saveFinalBalance();
    } catch (error) {
      alert('Error al añadir gasto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Seguro que quieres borrar este gasto?')) return;
    try {
      const { error } = await supabase.from('bote_expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(expenses.filter(e => e.id !== id));
      saveFinalBalance(); // Update snapshot
    } catch (error) {
      alert('Error al borrar: ' + error.message);
    }
  };

  const startInlineEdit = (e) => {
    setInlineEditId(e.id);
    setInlineForm({ 
      ...e,
      day: e.date.split('-')[2] // Extract day from YYYY-MM-DD
    });
  };

  const handleSaveInline = async (id) => {
    setSaving(true);
    try {
      const fullDate = `${year}-${month.toString().padStart(2, '0')}-${inlineForm.day.toString().padStart(2, '0')}`;
      const payload = {
        date: fullDate,
        amount: inlineForm.amount,
        concept: inlineForm.concept,
        category: inlineForm.category
      };

      const { error } = await supabase
        .from('bote_expenses')
        .update(payload)
        .eq('id', id);
      
      if (error) throw error;
      setExpenses(expenses.map(e => e.id === id ? { ...e, ...payload } : e));
      setInlineEditId(null);
      saveFinalBalance();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const incomeTshirts = stats.tshirts * 160;
  const incomeInsurances = stats.insurances * 75;
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const currentBalance = initialBote + incomeTshirts + incomeInsurances - totalExpenses;

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-soft/30 p-6 rounded-[2.5rem] border border-surface-edge">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-brand/10 rounded-2xl text-brand">
              <Coins className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Bote</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Fondo de Material y Seguros</p>
           </div>
        </div>

        {/* HYBRID DATE SELECTOR */}
        <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
          <button 
            onClick={handlePrevMonth}
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
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* 1. Fondo Inicial (Amarillo) */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-amber-500 transition-all shadow-lg shadow-amber-500/5">
           <div>
             <p className="text-[13px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Package className="w-4 h-4" /> Fondo Inicial
             </p>
             <div className="mt-4 flex items-center justify-between group/val">
               {isEditingInitial ? (
                 <div className="flex items-center gap-2 w-full">
                    <input 
                      autoFocus
                      type="number"
                      value={initialBote}
                      onBlur={() => setIsEditingInitial(false)}
                      onChange={(e) => updateInitialBote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingInitial(false)}
                      className="text-3xl font-black text-white bg-white/5 border border-white/10 rounded-xl outline-none w-full px-3 py-1 no-spinner animate-in zoom-in-95 duration-200"
                    />
                 </div>
               ) : (
                 <div 
                   onClick={() => setIsEditingInitial(true)}
                   className="flex items-baseline gap-1 cursor-pointer group-hover:scale-105 transition-transform duration-300"
                 >
                   <h4 className="text-3xl font-black text-white">{Number(initialBote).toLocaleString()}</h4>
                   <span className="text-sm font-black text-amber-500/80">฿</span>
                   <Edit2 className="w-3 h-3 text-amber-500 opacity-0 group-hover/val:opacity-100 ml-2 transition-opacity" />
                 </div>
               )}
             </div>
           </div>
           <p className="text-[9px] text-amber-500/60 mt-2 font-bold uppercase italic">
              Arrastrado de {months[month === 1 ? 11 : month - 2]}
           </p>
        </div>

        {/* 2. Bote Mensual (Ingresos Generados) */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2.5rem] shadow-lg shadow-emerald-500/5 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
           <div>
             <p className="text-[13px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
               <TrendingUp className="w-4 h-4" /> BOTE {months[month-1].toUpperCase()}
             </p>
             <div className="mt-4">
                <h4 className="text-3xl font-black text-white">{(incomeTshirts + incomeInsurances).toLocaleString()} <span className="text-sm font-black text-emerald-500/50 ml-1">฿</span></h4>
                <p className="text-[12px] text-emerald-500/60 mt-1 font-bold uppercase tracking-widest">Total a retirar de caja</p>
             </div>
           </div>
           
           <div className="space-y-2 mt-4 pt-4 border-t border-emerald-500/10">
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-black text-gray-500 uppercase flex items-center gap-2"><Shirt className="w-3 h-3" /> Camisetas</span>
                 <span className="text-[11px] font-black text-white/80">{(stats.tshirts * 160).toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[11px] font-black text-gray-500 uppercase flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Seguros</span>
                 <span className="text-[11px] font-black text-white/80">{(stats.insurances * 75).toLocaleString()} ฿</span>
              </div>
           </div>
        </div>

        {/* 3. Gastos Material (Rojo) */}
        <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2.5rem] shadow-lg shadow-rose-500/5 flex flex-col justify-between group hover:border-rose-500/30 transition-all">
           <div>
             <p className="text-[13px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
               <TrendingDown className="w-4 h-4" /> Gastos Material
             </p>
             <div className="mt-4">
                <h4 className="text-3xl font-black text-white">{totalExpenses.toLocaleString()} <span className="text-sm font-black text-rose-400/50 ml-1">฿</span></h4>
                <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                   {expenses.length} facturas este mes
                </p>
             </div>
           </div>
        </div>

        {/* 4. Saldo Total Final (Azul/Brand - High Contrast) */}
        <div className="bg-brand rounded-[2.5rem] p-8 shadow-2xl shadow-brand/30 relative overflow-hidden group border border-white/10">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-700"></div>
          <p className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-1 opacity-90 relative z-10">Saldo Total Final</p>
          <h2 className="text-4xl font-black text-white tracking-tighter relative z-10 drop-shadow-md">
            {currentBalance.toLocaleString()} <span className="text-lg font-black text-white/40 ml-1">฿</span>
          </h2>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-[12px] font-black text-white uppercase relative z-10">
             <span className="opacity-80">Progreso Mes</span>
             <span className="bg-white/20 px-2 py-0.5 rounded-lg">{(incomeTshirts + incomeInsurances - totalExpenses).toLocaleString()} ฿</span>
          </div>
        </div>
      </div>

      <div className="pt-4"></div> {/* Separator */}

      {/* Expenses Table & Add Form (Reordered) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* List (Left, 2/3) */}
         <div className="lg:col-span-2 bg-surface-soft border border-surface-edge rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[550px]">
            <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex justify-between items-center">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand" /> Registro de Movimientos
               </h3>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{expenses.length} movimientos</span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
               {expenses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                     <AlertCircle className="w-12 h-12 opacity-10 mb-4" />
                     <p className="text-sm font-bold uppercase tracking-widest opacity-30">No hay gastos registrados este mes</p>
                  </div>
               ) : (
                  <table className="w-full border-collapse">
                     <thead className="sticky top-0 bg-surface-soft z-10">
                        <tr className="border-b border-surface-edge">
                           <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Fecha</th>
                           <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Concepto</th>
                           <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Categoría</th>
                           <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Cantidad</th>
                           <th className="px-6 py-4 w-16"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-surface-edge/10">
                        {expenses.map((expense) => (
                           <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                              {inlineEditId === expense.id ? (
                                 <>
                                    <td className="px-6 py-4">
                                       <input 
                                         type="number" 
                                         value={inlineForm.day} 
                                         onChange={e => setInlineForm({...inlineForm, day: e.target.value})}
                                         className="w-16 bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none font-black text-center no-spinner"
                                         min="1"
                                         max="31"
                                       />
                                    </td>
                                    <td className="px-6 py-4">
                                       <input 
                                         type="text" 
                                         value={inlineForm.concept} 
                                         onChange={e => setInlineForm({...inlineForm, concept: e.target.value})}
                                         className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none font-black"
                                       />
                                    </td>
                                    <td className="px-6 py-4">
                                       <select 
                                         value={inlineForm.category}
                                         onChange={e => setInlineForm({...inlineForm, category: e.target.value})}
                                         className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                       >
                                         <option value="Material">Material</option>
                                         <option value="Camisetas">Camisetas</option>
                                         <option value="Seguros">Seguros</option>
                                         <option value="Otros">Otros</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4">
                                       <input 
                                         type="number" 
                                         value={inlineForm.amount} 
                                         onChange={e => setInlineForm({...inlineForm, amount: e.target.value})}
                                         className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white text-right outline-none font-black no-spinner"
                                       />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => handleSaveInline(expense.id)}
                                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                          >
                                             <Check className="w-4 h-4" />
                                          </button>
                                          <button 
                                            onClick={() => setInlineEditId(null)}
                                            className="p-2 text-gray-500 hover:bg-white/10 rounded-lg transition-colors"
                                          >
                                             <X className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </td>
                                 </>
                              ) : (
                                 <>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-400">
                                       {new Date(expense.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-white capitalize">
                                       {expense.concept}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <span className="text-[10px] font-black px-3 py-1 rounded-full bg-surface-edge text-gray-400 uppercase tracking-widest">
                                          {expense.category}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-rose-400">
                                       - {Number(expense.amount).toLocaleString()} ฿
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => startInlineEdit(expense)}
                                            className="p-2 text-gray-600 hover:text-brand transition-colors opacity-0 group-hover:opacity-100"
                                          >
                                             <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteExpense(expense.id)}
                                            className="p-2 text-gray-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </td>
                                 </>
                              )}
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
            </div>
         </div>

         {/* Form (Right, 1/3) */}
         <div className="bg-surface-soft border border-surface-edge p-8 rounded-[2.5rem] shadow-xl h-fit">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
               <Plus className="w-5 h-5 text-brand" /> Nuevo Gasto de Bote
            </h3>
            <div className="space-y-4">
               <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 text-center">Día</label>
                     <input 
                       type="number"
                       placeholder="0"
                       value={newExpense.day}
                       onChange={(e) => setNewExpense({...newExpense, day: e.target.value})}
                       className="text-center w-full bg-surface border border-surface-edge rounded-xl px-2 py-3 text-white focus:border-brand outline-none transition-all no-spinner font-black"
                       min="1"
                       max="31"
                     />
                  </div>
                  <div className="col-span-3">
                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Concepto</label>
                     <input 
                       placeholder="Ej: Compra 50 Camisetas"
                       value={newExpense.concept}
                       onChange={(e) => setNewExpense({...newExpense, concept: e.target.value})}
                       className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Cantidad (฿)</label>
                    <input 
                      type="number"
                      placeholder="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="text-center w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all no-spinner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Categoría</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all"
                    >
                      <option value="Material">Material</option>
                      <option value="Camisetas">Camisetas</option>
                      <option value="Seguros">Seguros</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
               </div>
               <button 
                 onClick={handleAddExpense}
                 disabled={saving || !newExpense.amount || !newExpense.concept}
                 className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 mt-4"
               >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Registrar Gasto
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
