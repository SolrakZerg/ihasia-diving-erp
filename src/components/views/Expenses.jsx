import { useState, useEffect, useRef, useMemo } from 'react';
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
  Settings,
  Pencil,
  Check,
  CheckCircle2,
  X,
  PlusCircle,
  TrendingUp,
  CreditCard,
  ChevronRight,
  User,
  Search,
  Wallet,
  Coins,
  Edit3,
  Activity,
  Users
} from 'lucide-react';

// --- SMART SELECT COMPONENT ---
const SmartSelect = ({ value, options, onChange, placeholder = "Seleccionar...", type = 'activity' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.id === value);
  
  const filtered = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.subtext && o.subtext.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface border border-surface-edge rounded px-2 py-1.5 text-left text-xs flex items-center justify-between group"
      >
        <span className={selectedOption ? 'text-white font-bold' : 'text-gray-500 italic'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-64 bg-[#1a1c2d] border border-brand/30 rounded-xl mt-1 shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="p-2 border-b border-surface-edge/30">
            <input 
              autoFocus
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface-edge/20 border border-brand/20 rounded px-2 py-1 text-[11px] text-white outline-none"
            />
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 italic">No hay resultados</div>
            ) : (
              filtered.map(o => (
                <button 
                  key={o.id} 
                  onClick={() => { onChange(o); setIsOpen(false); setSearchTerm(''); }}
                  className="w-full text-left p-2.5 hover:bg-brand/10 border-b border-surface-edge/10 flex flex-col transition-colors"
                >
                  <span className="text-xs font-bold text-white">{o.name}</span>
                  {o.subtext && <span className="text-[11px] text-gray-500 uppercase font-black tracking-widest">{o.subtext}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- ROBUST CUSTOMER SEARCH (REPLICA OF BILLING V3) ---
const CustomerSearchInput = ({ onSelect, onCancel }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const search = async (q) => {
    if (q.length < 2) return;
    setIsLoading(true);
    try {
      // Intentar RPC v3
      const { data: rpcData, error: rpcErr } = await supabase.rpc('search_customers_v3', { query_text: q });
      if (!rpcErr && rpcData) {
        setResults(rpcData);
      } else {
        // Fallback directo
        const { data: dirData } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(5);
        if (dirData) setResults(dirData);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative z-[120]" ref={containerRef}>
      <div className="flex gap-1">
        <input 
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nombre o email..."
          className="w-full bg-blue-500/10 border border-blue-400/40 rounded px-2 py-1 text-xs text-blue-100 font-bold outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3 text-gray-500" /></button>
      </div>
      {query.length >= 2 && (
        <div className="absolute top-full left-0 w-80 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 z-[130]">
          {isLoading ? (
            <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin text-brand mx-auto" /></div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 italic">No hay resultados</div>
          ) : (
            results.map(c => (
              <button 
                key={c.id} 
                onClick={() => onSelect(c)}
                className="w-full text-left p-3 hover:bg-brand/5 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-start gap-3 group/res"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm text-gray-900 group-hover/res:text-brand truncate">
                    {c.first_name || c.name} {c.last_name || ''}
                  </span>
                  <span className="text-xs text-slate-600 font-bold truncate">{c.email || 'Sin contacto'}</span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                   <span className="text-[11px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                     {c.booked_activity || 'General'}
                   </span>
                   {c.booking_date && (
                     <span className="text-[11px] text-slate-800 font-black bg-slate-100 px-1.5 py-0.5 rounded">
                       {new Date(c.booking_date).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'})}
                     </span>
                   )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [oxygenTours, setOxygenTours] = useState([]);
  const [promoters, setPromoters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [commissionsPaid, setCommissionsPaid] = useState(0);
  const [commissionsPending, setCommissionsPending] = useState(0);
  const [oxygenPending, setOxygenPending] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Date states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [dateFilter, setDateFilter] = useState(now.toISOString().split('T')[0]);

  // Categories & Promoters & Course Config
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTab, setConfigTab] = useState('categories'); // 'categories' | 'promoters' | 'courses'
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ name: '', color: 'text-brand-light' });
  const [promoterForm, setPromoterForm] = useState({ name: '', phone: '' });

  // Inline Controls
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newDataExp, setNewDataExp] = useState({ date: dateFilter, category: 'Otros', amount: '', description: '' });
  const [notification, setNotification] = useState(null);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const syncDate = `${selectedYear}-${mm}-01`;
    setDateFilter(syncDate);
    setNewDataExp(prev => ({ ...prev, date: syncDate }));
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const firstDay = `${selectedYear}-${mm}-01`;
    const lastDayNum = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const lastDay = `${selectedYear}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

    const [expRes, commRes, oxyRes, staffRes, promoRes, actRes, setRes] = await Promise.all([
      supabase.from('daily_expenses').select('*').gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }),
      supabase.from('invoice_items')
        .select(`*, customers(id, first_name, last_name, email), activities!inner(id, name, color, category)`)
        .eq('is_comm', true)
        .gte('date', firstDay).lte('date', lastDay)
        .order('date', { ascending: false })
        .order('id', { ascending: false }),
      supabase.from('invoice_items')
        .select(`*, customers(id, first_name, last_name, email), activities!inner(id, name, color, category, ssi_cost_thb)`)
        .eq('activities.category', 'Snorkeling')
        .gte('date', firstDay).lte('date', lastDay)
        .order('date', { ascending: false })
        .order('id', { ascending: false }),
      supabase.from('staff').select('id, first_name, last_name').eq('active', true),
      supabase.from('external_promoters').select('*').order('name'),
      supabase.from('activities').select('*').order('name'),
      supabase.from('settings').select('*').eq('key', 'expense_categories')
    ]);

    if (expRes.data) setExpenses(expRes.data);
    if (commRes.data) setCommissions(commRes.data);
    if (oxyRes.data) setOxygenTours(oxyRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    if (promoRes.data) setPromoters(promoRes.data);
    if (actRes.data) setAllActivities(actRes.data);

    const { data: mExp } = await supabase.from('daily_expenses').select('amount').gte('date', firstDay).lte('date', lastDay);
    
    if (mExp) setMonthlyTotal(mExp.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0));
    
    if (commRes.data) {
      setCommissionsPaid(commRes.data.filter(c => c.is_comm_paid).reduce((sum, i) => sum + (parseFloat(i.total_thb || 0) * 0.1), 0));
      setCommissionsPending(commRes.data.filter(c => !c.is_comm_paid).reduce((sum, i) => sum + (parseFloat(i.total_thb || 0) * 0.1), 0));
    }

    if (oxyRes.data) {
      setOxygenPending(oxyRes.data.filter(o => !o.is_prov_paid).reduce((sum, o) => sum + (Number(o.quantity) * Number(o.activities?.ssi_cost_thb || 0)), 0));
    }

    const catSet = setRes.data?.find(s => s.key === 'expense_categories');
    if (catSet) setCategories(JSON.parse(catSet.value));

    setNewDataExp(prev => ({ ...prev, date: dateFilter }));
    setLoading(false);
  };

  const handleAddExpense = async () => {
    if (!newDataExp.description || !newDataExp.amount) {
      alert("Por favor, rellena descripción e importe.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('daily_expenses').insert([{ ...newDataExp, amount: parseFloat(newDataExp.amount) }]);
    
    if (error) {
      console.error("Error saving expense:", error);
      showNotify(`Error al guardar gasto: ${error.message}`, 'error');
    } else {
      showNotify("¡Gasto guardado correctamente!");
      setIsAddingExpense(false);
      setNewDataExp({ description: '', amount: '', category: categories[0]?.name || 'Comidas', date: dateFilter });
      fetchData(false);
    }
    setSaving(false);
  };

  const updateItem = async (itemId, field, value) => {
    const { error } = await supabase.from('invoice_items').update({ [field]: value }).eq('id', itemId);
    if (error) {
      showNotify(`Error al actualizar: ${error.message}`, 'error');
    } else {
      fetchData(false);
    }
  };

  const recipientOptions = useMemo(() => {
    const s = staff.map(x => ({ id: x.id, name: `${x.first_name} ${x.last_name}`, type: 'staff', subtext: 'Staff Interno' }));
    const p = promoters.map(x => ({ id: x.id, name: x.name, type: 'external', subtext: 'Externo / Promotor' }));
    return [...s, ...p];
  }, [staff, promoters]);

  const getRecipientName = (id) => {
    const opt = recipientOptions.find(o => o.id === id);
    return opt ? opt.name : 'Sin asignar';
  };

  const getRecipientType = (id) => {
    const opt = recipientOptions.find(o => o.id === id);
    return opt ? opt.type : 'staff';
  };

  const pendingByRecipient = useMemo(() => {
    const map = {};
    commissions.filter(c => !c.is_comm_paid && c.comm_recipient_id).forEach(c => {
      const rid = c.comm_recipient_id;
      const amt = (parseFloat(c.total_thb || 0) * 0.1);
      if (!map[rid]) map[rid] = 0;
      map[rid] += amt;
    });
    return Object.entries(map).map(([id, amount]) => ({
      id,
      name: getRecipientName(id),
      amount
    })).sort((a, b) => b.amount - a.amount);
  }, [commissions, recipientOptions]);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden relative">
      
      {/* FLOAT NOTIFICATION */}
      {notification && (
        <div className={`fixed top-6 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-3xl border shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right-10 duration-500 ${
          notification.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          <span className="text-sm font-black tracking-tight">{notification.msg}</span>
        </div>
      )}
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] sticky top-0 h-[200px]">
        <div className="max-w-[1700px] mx-auto px-8 h-full flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex flex-col gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-brand/20 p-3 rounded-2xl ring-1 ring-brand/30">
                <Receipt className="w-8 h-8 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Finanzas & Comisiones</h1>
                <p className="text-gray-400 text-sm font-bold mt-1">Control mensual de gastos e instructores</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* MONTH / YEAR SELECTOR */}
              <div className="flex items-center gap-2 bg-surface-soft/50 p-1.5 rounded-2xl border border-surface-edge/30 w-fit">
                <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-bold text-white outline-none px-2 py-1 cursor-pointer"
                >
                  {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                    <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-bold text-white outline-none px-2 py-1 cursor-pointer border-l border-surface-edge/30"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                  ))}
                </select>
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

          {/* DIVIDER & WIDGETS 2x2 SECTION */}
          <div className="hidden md:flex flex-1 items-center gap-8 self-stretch py-0">
            <div className="w-px h-full bg-surface-edge/40" />
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {/* GASTOS WIDGET */}
              <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl flex items-center justify-between gap-4 shadow-lg shadow-rose-500/5 min-w-[170px]">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest leading-none">Gastos Mes</span>
                      <span className="text-base font-black text-white mt-0.5">-{monthlyTotal.toLocaleString()} ฿</span>
                  </div>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>

              {/* COMISIONES PAGADAS WIDGET */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center justify-between gap-4 text-emerald-400 min-w-[170px]">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none">Com. Pagadas</span>
                      <span className="text-base font-black text-white mt-0.5 font-mono tracking-tighter">{commissionsPaid.toLocaleString()} ฿</span>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
              </div>

              {/* POR PAGAR WIDGET (OXYGEN) */}
              <div className="bg-amber-500/10 border border-amber-500/25 px-4 py-2 rounded-2xl flex items-center justify-between gap-4 group relative min-w-[170px]">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest leading-none">OXYGEN PEND.</span>
                      <span className="text-base font-black text-white mt-0.5 font-mono tracking-tighter">{oxygenPending.toLocaleString()} ฿</span>
                  </div>
                  <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>

              {/* FUTURE WIDGET PLACEHOLDER */}
              <div className="bg-surface-edge/10 border border-surface-edge/20 px-4 py-2 rounded-2xl flex items-center justify-between gap-4 opacity-40 min-w-[170px]">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none">PRÓXIMAMENTE</span>
                      <span className="text-base font-black text-gray-600 mt-0.5 italic">--- ฿</span>
                  </div>
                  <Coins className="w-4 h-4 text-gray-600" />
              </div>
            </div>

            <div className="w-px h-full bg-surface-edge/40" />

            {/* PENDING COMMISSIONS BY INDIVIDUAL - TWO COLUMN LAYOUT */}
            <div className="flex flex-col gap-3 min-w-[420px] max-w-[600px]">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-indigo-500/40" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                  <Users className="w-3 h-3" /> Comisiones Pendientes
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-indigo-500/20 to-indigo-500/40" />
              </div>
              
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                {pendingByRecipient.length === 0 ? (
                  <div className="col-span-2 py-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] text-emerald-500/70 font-bold italic text-center">
                    Todos los pagos están al día
                  </div>
                ) : (
                  pendingByRecipient.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-4 py-0.5 px-3 bg-surface-edge/5 hover:bg-indigo-500/10 rounded-xl border border-surface-edge/10 hover:border-indigo-500/20 transition-all group/row">
                      <span className="text-[12px] font-bold text-white/70 group-hover/row:text-white truncate max-w-[100px]">{p.name}</span>
                      <span className="text-[12px] font-black text-amber-500 font-mono tracking-tighter whitespace-nowrap">{p.amount.toLocaleString()} ฿</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="w-px h-full bg-surface-edge/40" />
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {/* Espacio libre a la derecha */}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-5">
        <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* TABLA DE GASTOS (COL-4) */}
          <div className="lg:col-span-4 flex flex-col h-[calc(100vh-260px)]">
            <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
               <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px]">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Libro de Gastos</h3>
                  <button onClick={() => setIsAddingExpense(true)} className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-[11px] uppercase tracking-wider">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Nuevo Gasto
                  </button>
               </div>
               <div className="overflow-auto flex-1 relative custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                      <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest align-middle">Descripción</th>
                      <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center align-middle">Cat.</th>
                      <th className="px-3 py-0 text-xs font-black text-slate-300 uppercase tracking-widest text-[11px] text-right align-middle">Importe</th>
                      <th className="px-3 py-0 w-10 align-middle"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-edge/10">
                    {isAddingExpense && (
                      <tr className="bg-rose-500/5 animate-in slide-in-from-top-2 duration-300">
                        <td className="px-2 py-3"><input autoFocus placeholder="Descripción..." value={newDataExp.description} onChange={e=>setNewDataExp({...newDataExp, description: e.target.value})} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-rose-500/50" /></td>
                        <td className="px-2 py-3 text-center">
                          <select value={newDataExp.category} onChange={e=>setNewDataExp({...newDataExp, category: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white outline-none">
                            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-3 text-right"><input type="number" value={newDataExp.amount} onChange={e=>setNewDataExp({...newDataExp, amount: e.target.value})} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-rose-400 text-right font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                        <td className="px-2 py-3 text-right flex items-center justify-end gap-1">
                          <button onClick={handleAddExpense} className="p-1.5 bg-rose-500 text-white rounded-lg hover:scale-110 shadow-lg shadow-rose-500/20"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setIsAddingExpense(false)} className="p-1.5 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    )}
                    {loading ? (
                      <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto opacity-20" /></td></tr>
                    ) : expenses.length === 0 && !isAddingExpense ? (
                      <tr><td colSpan="4" className="py-20 text-center text-gray-600 italic text-xs">Sin movimientos registrados.</td></tr>
                    ) : (
                      expenses.map(e => (
                        <tr key={e.id} className="hover:bg-brand/5 transition-colors group">
                           <td className="px-3 py-1.5">
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black text-white bg-surface-soft/70 px-2 py-1 rounded-lg border border-surface-edge/40 shadow-sm flex-shrink-0">
                                   {new Date(e.date).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'})}
                                 </span>
                                 <span className="text-sm font-bold text-white/90 truncate max-w-[200px]">{e.description}</span>
                              </div>
                           </td>
                          <td className="px-3 py-1.5 text-center">
                             <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-surface border border-surface-edge/50 shadow-sm ${categories.find(c => c.name === e.category)?.color || 'text-gray-400'}`}>
                                {e.category}
                             </span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-black text-rose-400 text-base">-{parseFloat(e.amount).toLocaleString()} ฿</td>
                          <td className="px-3 py-1.5 text-right">
                             <button onClick={() => { if(confirm('¿Borrar?')) supabase.from('daily_expenses').delete().eq('id', e.id).then(()=>fetchData(false)) }} className="p-1.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

           {/* TABLA DE COMISIONES (COL-8) */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-260px)] gap-6 max-w-[900px]">
            <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
               <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px]">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Gestión de Comisiones</h3>
                  <div className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border border-brand/20">
                     Sincronizado con Facturas
                  </div>
               </div>

              <div className="overflow-auto flex-1 relative custom-scrollbar overflow-x-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest w-[80px] align-middle">Fecha</th>
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle">
                          <div className="flex flex-row flex-wrap gap-4">
                             <span className="w-[200px] shrink-0">Cliente</span>
                             <span className="w-[160px] shrink-0">Actividad</span>
                          </div>
                       </th>
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle">Quién recibe</th>
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right align-middle w-[100px]">Comisión (10%)</th>
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center align-middle">Pagado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-edge/10">
                    {commissions.length === 0 ? (
                      <tr><td colSpan="5" className="py-24 text-center text-gray-600 italic text-xs">No hay facturas marcadas como comisionables este mes.</td></tr>
                    ) : (
                      commissions.map(c => (
                        <tr key={c.id} className="hover:bg-brand/5 transition-colors group">
                          <td className="px-3 py-1.5">
                             <span className="text-xs font-black text-white bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/30 whitespace-nowrap">
                               {c.date ? new Date(c.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : 'Sin fecha'}
                             </span>
                          </td>
                           <td className="px-3 py-1.5">
                              <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                                 <div className="w-[200px] shrink-0">
                                    <span className="text-sm font-black text-white whitespace-nowrap truncate block">
                                      {c.customers ? `${c.customers.first_name || ''} ${c.customers.last_name || ''}` : 'Sin cliente'}
                                    </span>
                                 </div>
                                 <div className="w-[160px] shrink-0">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.activities?.color || '#4f4f4f' }} />
                                       <span className="text-sm font-bold text-slate-400 truncate">
                                         {c.activities?.name}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </td>
                          <td className="px-3 py-1.5 w-[200px]">
                             <SmartSelect 
                                options={recipientOptions} 
                                value={c.comm_recipient_id} 
                                onChange={o => updateItem(c.id, 'comm_recipient_id', o.id)} 
                             />
                          </td>
                          <td className="px-3 py-1.5 text-right w-[100px]">
                             <div className="flex flex-col items-end">
                                <span className={`text-base font-black transition-colors ${c.is_comm_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {(parseFloat(c.total_thb || 0) * 0.1).toLocaleString()}
                                </span>
                                <span className="text-[12px] text-slate-400 font-bold">{c.total_thb?.toLocaleString()}</span>
                             </div>
                          </td>
                          <td className="px-3 py-1.5 text-center">
                             <button 
                               onClick={() => updateItem(c.id, 'is_comm_paid', !c.is_comm_paid)}
                               className={`w-9 h-9 mx-auto rounded-2xl flex items-center justify-center border transition-all ${c.is_comm_paid ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' : 'bg-surface-edge/20 border-surface-edge/30 text-gray-500 hover:border-amber-400 hover:bg-amber-400/5'}`}
                             >
                               <Check className={`w-5 h-5 ${c.is_comm_paid ? 'stroke-[4]' : 'opacity-40'}`} />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OXYGEN TOUR BOX */}
            <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col h-[350px] overflow-hidden">
               <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px]">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Oxygen Tour Snorkell</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-gray-500 uppercase">Pendiente total:</span>
                    <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-sm font-black border border-amber-500/20">
                       {oxygenPending.toLocaleString()} ฿
                    </span>
                  </div>
               </div>
               <div className="overflow-auto flex-1 relative custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                        <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest w-[80px] align-middle">Fecha</th>
                        <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle">
                           <div className="flex flex-row flex-wrap gap-4">
                              <span className="w-[200px] shrink-0">Cliente</span>
                              <span className="w-[160px] shrink-0">Actividad</span>
                           </div>
                        </th>
                        <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-center">Num</th>
                        <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-right w-[100px]">X Pagar</th>
                        <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-center">Pagado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-edge/5">
                      {oxygenTours.length === 0 ? (
                        <tr><td colSpan="5" className="py-20 text-center text-gray-600 italic text-xs">Sin tours registrados para este mes.</td></tr>
                      ) : (
                        oxygenTours.map(o => (
                          <tr key={o.id} className="hover:bg-brand/5 transition-colors group">
                            <td className="px-3 py-1.5">
                               <span className="text-xs font-black text-white bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/30">
                                 {o.date ? new Date(o.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : '-'}
                               </span>
                            </td>
                            <td className="px-3 py-1.5">
                               <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                                  <div className="w-[200px] shrink-0">
                                     <span className="text-sm font-black text-white truncate block">
                                       {o.customers?.first_name || 'Sin nombre'}
                                     </span>
                                  </div>
                                  <div className="w-[160px] shrink-0">
                                     <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o.activities?.color || '#4f4f4f' }} />
                                        <span className="text-sm font-bold text-slate-400 truncate">
                                          {o.activities?.name}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-3 py-1.5 text-center text-sm font-black text-white">{o.quantity}</td>
                            <td className="px-3 py-1.5 text-right w-[100px]">
                               <span className={`text-base font-black transition-colors ${o.is_prov_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {(Number(o.quantity) * Number(o.activities?.ssi_cost_thb || 0)).toLocaleString()}
                               </span>
                            </td>
                            <td className="px-3 py-1.5 text-center">
                               <button 
                                 onClick={() => updateItem(o.id, 'is_prov_paid', !o.is_prov_paid)}
                                 className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center border transition-all ${o.is_prov_paid ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' : 'bg-surface-edge/20 border-surface-edge/30 text-gray-500 hover:border-amber-400 hover:bg-amber-400/5'}`}
                               >
                                 <Check className={`w-4 h-4 ${o.is_prov_paid ? 'stroke-[4]' : 'opacity-40'}`} />
                               </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>

  {/* REFINED CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-soft border border-surface-edge w-full max-w-2xl rounded-[40px] overflow-hidden shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex h-[500px]">
               {/* Sidebar Tabs */}
               <div className="w-48 bg-surface border-r border-surface-edge flex flex-col p-4 gap-2">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-4 mt-2">Ajustes</h3>
                  {[
                    { id: 'categories', label: 'Gastos', icon: Tag },
                    { id: 'promoters', label: 'Promotores', icon: User }
                  ].map(tab => (
                    <button key={tab.id} onClick={()=>setConfigTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all ${configTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-gray-300 hover:bg-surface-edge/30'}`}>
                       <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                  <button onClick={()=>setShowConfigModal(false)} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-400 hover:bg-rose-500/10 transition-all">
                    <X className="w-4 h-4" /> Cerrar
                  </button>
               </div>

               {/* Content Area */}
               <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                  {configTab === 'categories' && (
                    <div className="space-y-6">
                       <div className="flex gap-2">
                          <input required placeholder="Nueva categoría..." value={catForm.name} onChange={e=>setCatForm({...catForm, name: e.target.value})} className="flex-1 bg-surface border border-surface-edge rounded-2xl px-4 py-2.5 text-sm text-white" />
                          <button onClick={() => { if(catForm.name){ const up = [...categories, {...catForm}]; setCategories(up); supabase.from('settings').upsert({key: 'expense_categories', value: JSON.stringify(up)}).then(()=>setCatForm({name:'', color:'text-brand-light'})); } }} className="bg-brand hover:bg-brand-light px-5 rounded-2xl text-white"><Plus className="w-5 h-5" /></button>
                       </div>
                       <div className="grid grid-cols-1 gap-2">
                          {categories.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-surface-edge group">
                               <span className={`text-sm font-black ${c.color}`}>{c.name}</span>
                               <button onClick={() => { const up = categories.filter((_, i) => i !== idx); setCategories(up); supabase.from('settings').upsert({key: 'expense_categories', value: JSON.stringify(up)}); }} className="p-2 text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {configTab === 'promoters' && (
                    <div className="space-y-6">
                       <div className="flex gap-2">
                          <div className="flex-1 flex flex-col gap-2">
                             <input placeholder="Nombre del promotor (Ej: Taxi 42, Hotel X)..." value={promoterForm.name} onChange={e=>setPromoterForm({...promoterForm, name: e.target.value})} className="bg-surface border border-surface-edge rounded-2xl px-4 py-2 text-sm text-white" />
                             <input placeholder="Teléfono..." value={promoterForm.phone} onChange={e=>setPromoterForm({...promoterForm, phone: e.target.value})} className="bg-surface border border-surface-edge rounded-2xl px-4 py-2 text-sm text-white" />
                          </div>
                          <button onClick={async () => { if(promoterForm.name){ await supabase.from('external_promoters').insert([promoterForm]); setPromoterForm({name:'', phone:''}); fetchData(false); } }} className="bg-brand hover:bg-brand-light px-5 rounded-3xl text-white"><Plus className="w-6 h-6" /></button>
                       </div>
                       <div className="grid grid-cols-1 gap-2">
                          {promoters.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-surface-edge group">
                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-white">{p.name}</span>
                                  <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{p.phone || 'Sin teléfono'}</span>
                               </div>
                               <button onClick={async () => { if(confirm('¿Borrar?')){ await supabase.from('external_promoters').delete().eq('id', p.id); fetchData(false); } }} className="p-2 text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

               </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  </div>
);
}
