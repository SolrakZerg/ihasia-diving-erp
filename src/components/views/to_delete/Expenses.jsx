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
  Database,
  Check,
  CheckCircle2,
  X,
  PlusCircle,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ChevronLeft,
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
  
  const [monthlyTotal, setMonthlyTotal] = useState(0); // Daily expenses only
  const [commissionsPaid, setCommissionsPaid] = useState(0);
  const [commissionsPending, setCommissionsPending] = useState(0);
  const [oxygenPending, setOxygenPending] = useState(0);
  const [oxygenTotal, setOxygenTotal] = useState(0);

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
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', color: 'text-brand-light' });
  const [promoterForm, setPromoterForm] = useState({ name: '', phone: '' });

  const colorPresets = [
    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'bg-green-500/10 text-green-400 border border-green-500/20',
    'bg-lime-500/10 text-lime-400 border border-lime-500/20',
    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    'bg-red-500/10 text-red-400 border border-red-500/20',
    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
    'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  ];

  // Inline Controls
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newDataExp, setNewDataExp] = useState({ date: now.toISOString().split('T')[0], category: 'Comidas', amount: '', description: '' });
  const [notification, setNotification] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', type: 'danger', onConfirm: null });

  // Commission Edit
  const [editingCommId, setEditingCommId] = useState(null);
  const [editCommVal, setEditCommVal] = useState('');

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
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

  useEffect(() => {
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const syncDate = isCurrentMonth ? now.toISOString().split('T')[0] : `${selectedYear}-${mm}-01`;
    
    setDateFilter(syncDate);
    setNewDataExp(prev => ({ 
      ...prev, 
      date: prev.date && prev.date.startsWith(`${selectedYear}-${mm}`) ? prev.date : syncDate 
    }));
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const firstDay = `${selectedYear}-${mm}-01`;
    const lastDayNum = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const lastDay = `${selectedYear}-${mm}-${String(lastDayNum).padStart(2, '0')}`;

    const [expRes, commRes, oxyRes, staffRes, promoRes, actRes, setRes, metricsRes] = await Promise.all([
      supabase.from('daily_expenses').select('*').gte('date', firstDay).lte('date', lastDay).order('date', { ascending: true }).order('id', { ascending: true }),
      supabase.from('invoice_items')
        .select(`*, customers(id, first_name, last_name, email), activities!inner(id, name, color, category, price_thb)`)
        .eq('is_comm', true)
        .gte('date', firstDay).lte('date', lastDay)
        .order('date', { ascending: true })
        .order('id', { ascending: true }),
      supabase.from('invoice_items')
        .select(`*, customers(id, first_name, last_name, email), activities!inner(id, name, color, category, ssi_cost_thb)`)
        .eq('activities.category', 'Snorkeling')
        .gte('date', firstDay).lte('date', lastDay)
        .order('date', { ascending: true })
        .order('id', { ascending: true }),
      supabase.from('staff').select('id, first_name, last_name').eq('active', true),
      supabase.from('external_promoters').select('*').order('name'),
      supabase.from('activities').select('*').order('name'),
      supabase.from('expense_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('monthly_expenses').select('*').eq('year', selectedYear).eq('month', selectedMonth + 1).maybeSingle()
    ]);

    if (expRes.data) setExpenses(expRes.data);
    if (commRes.data) setCommissions(commRes.data);
    if (oxyRes.data) setOxygenTours(oxyRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    if (promoRes.data) setPromoters(promoRes.data);
    if (actRes.data) setAllActivities(actRes.data);
    if (setRes.data) setCategories(setRes.data);

    // Prioridad a las métricas pre-calculadas en DB
    if (metricsRes.data) {
        const m = metricsRes.data;
        setMonthlyTotal(Number(m.total_expenses || 0));
        setCommissionsPaid(Number(m.comm_paid || 0));
        setCommissionsPending(Number(m.comm_pending || 0));
        setOxygenTotal(Number(m.snorkel_paid || 0) + Number(m.snorkel_pending || 0));
        setOxygenPending(Number(m.snorkel_pending || 0));
    } else {
        // Fallback manual si no hay métricas en la tabla (meses antiguos o recién creados)
        if (expRes.data) setMonthlyTotal(expRes.data.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0));
        
        if (commRes.data) {
          setCommissionsPaid(commRes.data.filter(c => c.is_comm_paid).reduce((sum, i) => sum + (i.comm_amount_thb != null ? parseFloat(i.comm_amount_thb) : parseFloat(i.activities?.price_thb || 0) * 0.1), 0));
          setCommissionsPending(commRes.data.filter(c => !c.is_comm_paid).reduce((sum, i) => sum + (i.comm_amount_thb != null ? parseFloat(i.comm_amount_thb) : parseFloat(i.activities?.price_thb || 0) * 0.1), 0));
        }
        
        if (oxyRes.data) {
          const pending = oxyRes.data.filter(o => !o.is_prov_paid).reduce((sum, o) => sum + (Number(o.quantity ?? 1) * Number(o.activities?.ssi_cost_thb || 0)), 0);
          const total = oxyRes.data.reduce((sum, o) => sum + (Number(o.quantity ?? 1) * Number(o.activities?.ssi_cost_thb || 0)), 0);
          setOxygenPending(pending);
          setOxygenTotal(total);
        }
    }

    setNewDataExp(prev => ({ ...prev, date: dateFilter }));
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!catForm.name.trim()) return;
    
    if (editingCat) {
      const { error } = await supabase.from('expense_categories').update({
        name: catForm.name.trim(),
        color: catForm.color
      }).eq('id', editingCat.id);
      
      if (!error) {
        fetchData(false);
        setCatForm({ name: '', color: colorPresets[0] });
        setEditingCat(null);
      }
    } else {
      const { error } = await supabase.from('expense_categories').insert({
        name: catForm.name.trim(),
        color: catForm.color,
        sort_order: (categories.length + 1) * 10
      });
      
      if (!error) {
        fetchData(false);
        setCatForm({ name: '', color: colorPresets[0] });
      }
    }
  };

  const handleDeleteCategory = async (id, catName) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Categoría',
      message: `¿Eliminar categoría '${catName}'? Esto NO borrará los gastos asociados, pero perderán su color.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('expense_categories').delete().eq('id', id);
        fetchData(false);
      }
    });
  };

  const startEditingCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, color: cat.color });
  };

  const cancelEditingCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', color: colorPresets[0] });
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
      setNewDataExp(prev => ({ description: '', amount: '', category: 'Comidas', date: prev.date }));
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

  const handleExpenseUpdate = async (id, field, value) => {
    if (!value) return;
    try {
      const { error } = await supabase.from('daily_expenses').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      fetchData(false);
    } catch (err) {
      console.error(err);
      showNotify(`Error al actualizar gasto: ${err.message}`, 'error');
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
      const amt = (c.comm_amount_thb != null ? parseFloat(c.comm_amount_thb) : parseFloat(c.activities?.price_thb || 0) * 0.1);
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

      {/* CONFIRMATION MODAL */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-soft border border-surface-edge w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${confirmConfig.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">{confirmConfig.title}</h3>
              </div>
              <p className="text-gray-400 font-bold ml-16">{confirmConfig.message}</p>
            </div>
            <div className="bg-surface-edge/20 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}
                className="px-4 py-2 rounded-xl text-sm font-black text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className={`px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
                  confirmConfig.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-brand hover:bg-brand-light shadow-brand/20'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
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

            {/* HYBRID DATE SELECTOR */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
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
                    className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
                  >
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                      <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                    ))}
                  </select>
                  
                  <div className="w-px h-4 bg-surface-edge/30 mx-1" />

                  <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                    ))}
                  </select>
                </div>

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

          {/* DIVIDER & WIDGETS 2x2 SECTION */}
          <div className="hidden md:flex flex-1 items-center gap-8 self-stretch py-0">
            <div className="w-px h-full bg-surface-edge/40" />
            
            <div className="grid grid-cols-2 gap-x-4">
              <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-rose-500/10 transition-all">
                 <div className="p-2 rounded-2xl bg-rose-500/10 mb-2 text-rose-400 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-4 h-4" />
                 </div>
                 <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] leading-none mb-2">GASTO MES</span>
                 <span className="text-3xl font-black text-white tracking-tighter">
                    -{(monthlyTotal + commissionsPaid + commissionsPending + oxygenTotal).toLocaleString()} 
                    <span className="text-sm font-black text-rose-500/40 ml-1 italic font-mono">฿</span>
                 </span>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-amber-500/10 transition-all">
                 <div className="p-2 rounded-2xl bg-amber-500/10 mb-2 text-amber-400 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-4 h-4" />
                 </div>
                 <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em] leading-none mb-2">PENDIENTE</span>
                 <span className="text-3xl font-black text-white tracking-tighter">
                    {(commissionsPending + oxygenPending).toLocaleString()} 
                    <span className="text-sm font-black text-amber-500/40 ml-1 italic font-mono">฿</span>
                 </span>
              </div>
            </div>

            <div className="w-px h-full bg-surface-edge/40" />

            {/* PENDING COMMISSIONS BY INDIVIDUAL - RESTORED */}
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
               <div className="py-2 px-4 border-b border-surface-edge flex items-center justify-between bg-surface-soft/50 flex-none h-[58px] gap-4">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">Libro de Gastos</h3>
                   <div className="flex items-center gap-3">
                     <button onClick={() => setIsAddingExpense(true)} className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-[11px] uppercase tracking-wider shrink-0">
                       <PlusCircle className="w-3.5 h-3.5" />
                       Nuevo Gasto
                     </button>
                     <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Total:</span>
                        <span className="text-xl font-black text-white leading-none tracking-tighter">
                          -{monthlyTotal.toLocaleString()} <span className="text-xs font-black text-rose-500/40 ml-0.5">฿</span>
                        </span>
                     </div>
                   </div>
                </div>
               <div className="overflow-auto flex-1 relative custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                      <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest align-middle w-[60px] text-center">Día</th>
                      <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest align-middle">Descripción</th>
                      <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center align-middle w-[100px]">Cat.</th>
                      <th className="px-3 py-0 text-xs font-black text-slate-300 uppercase tracking-widest text-[11px] text-right align-middle w-[100px]">Importe</th>
                      <th className="px-3 py-0 w-10 align-middle"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-edge/10">
                    {loading ? (
                      <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto opacity-20" /></td></tr>
                    ) : expenses.length === 0 && !isAddingExpense ? (
                      <tr><td colSpan="5" className="py-20 text-center text-gray-600 italic text-xs">Sin movimientos registrados.</td></tr>
                    ) : (
                      <>
                        {expenses.map(e => (
                        <tr key={e.id} className="hover:bg-brand/5 transition-colors group">
                           <td className="px-3 py-1.5 text-center">
                               <input 
                                 type="number" 
                                 min="1" max="31"
                                 defaultValue={e.date ? parseInt(e.date.split('-')[2], 10) : ''} 
                                 onBlur={(ev) => { 
                                   const d = parseInt(ev.target.value);
                                   if(!isNaN(d)) {
                                     const validD = Math.min(31, Math.max(1, d));
                                     const mm = String(selectedMonth + 1).padStart(2, '0');
                                     const newDate = `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}`;
                                     if(newDate !== e.date) handleExpenseUpdate(e.id, 'date', newDate);
                                   }
                                 }} 
                                 className="text-sm font-black text-white bg-surface-soft/70 px-1 py-1 rounded-lg border border-transparent hover:border-surface-edge/40 focus:border-brand shadow-sm w-10 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                               />
                           </td>
                           <td className="px-3 py-1.5">
                               <input 
                                 type="text" 
                                 defaultValue={e.description} 
                                 onBlur={(ev) => { if(ev.target.value !== e.description) handleExpenseUpdate(e.id, 'description', ev.target.value) }} 
                                 className="text-sm font-bold text-white/90 truncate w-full bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-2 py-1 outline-none transition-colors"
                               />
                           </td>
                          <td className="px-3 py-1.5 text-center">
                             <select 
                               value={e.category} 
                               onChange={(ev) => handleExpenseUpdate(e.id, 'category', ev.target.value)} 
                               className={`appearance-none text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-surface border border-transparent hover:border-surface-edge/50 focus:border-brand shadow-sm outline-none cursor-pointer transition-colors text-center w-full ${categories.find(c => c.name === e.category)?.color || 'text-gray-400'}`}
                             >
                               {categories.map(c => <option key={c.id} value={c.name} className="bg-surface text-white">{c.name}</option>)}
                             </select>
                          </td>
                          <td className="px-3 py-1.5 text-right flex items-center justify-end h-full">
                            <input 
                              type="number" 
                              defaultValue={e.amount} 
                              onBlur={(ev) => { if(ev.target.value != e.amount) handleExpenseUpdate(e.id, 'amount', ev.target.value) }} 
                              className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded text-right font-bold text-rose-400 text-base w-24 outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-rose-400 font-bold ml-1">฿</span>
                          </td>
                          <td className="px-3 py-1.5 text-right">
                             <button onClick={() => { 
                               setConfirmConfig({
                                 show: true,
                                 title: 'Borrar Gasto',
                                 message: `¿Estás seguro de que quieres eliminar este gasto por valor de ${e.amount} ฿?`,
                                 type: 'danger',
                                 onConfirm: () => {
                                   supabase.from('daily_expenses').delete().eq('id', e.id).then(()=>fetchData(false));
                                   setConfirmConfig(prev => ({ ...prev, show: false }));
                                 }
                               });
                             }} className="p-1.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                      {isAddingExpense && (
                        <tr className="bg-rose-500/5 animate-in slide-in-from-bottom-2 duration-300">
                          <td className="px-2 py-3 text-center">
                             <input type="number" min="1" max="31" value={newDataExp.date ? parseInt(newDataExp.date.split('-')[2], 10) : ''} onChange={e => {
                                const d = parseInt(e.target.value) || 1;
                                const validD = Math.min(31, Math.max(1, d));
                                const mm = String(selectedMonth + 1).padStart(2, '0');
                                setNewDataExp({...newDataExp, date: `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}`})
                             }} className="w-10 bg-surface border border-surface-edge rounded px-1 py-1 text-xs text-center text-white font-black outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          </td>
                          <td className="px-2 py-3">
                             <input autoFocus placeholder="Descripción..." value={newDataExp.description} onChange={e=>setNewDataExp({...newDataExp, description: e.target.value})} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-rose-500/50" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <select value={newDataExp.category} onChange={e=>setNewDataExp({...newDataExp, category: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-rose-500/50">
                              {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-3 text-right"><input type="number" placeholder="0.00" value={newDataExp.amount} onChange={e=>setNewDataExp({...newDataExp, amount: e.target.value})} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-rose-400 text-right font-black outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                          <td className="px-2 py-3 text-right flex items-center justify-end gap-1">
                            <button onClick={handleAddExpense} className="p-1.5 bg-rose-500 text-white rounded-lg hover:scale-110 shadow-lg shadow-rose-500/20"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setIsAddingExpense(false)} className="p-1.5 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

           {/* TABLA DE COMISIONES (COL-8) */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-260px)] gap-6 max-w-[900px]">
            <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px] gap-4">
                   <div className="flex items-center gap-4 shrink-0">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Gestión de Comisiones</h3>
                      <div className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand/20">
                         Sinc. Facturas
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Pagado:</span>
                        <span className="text-xl font-black text-white leading-none tracking-tighter">
                           {commissionsPaid.toLocaleString()} <span className="text-xs font-black text-emerald-500/40 ml-0.5">฿</span>
                        </span>
                     </div>
                     <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Por Pagar:</span>
                        <span className="text-xl font-black text-white leading-none tracking-tighter">
                           {commissionsPending.toLocaleString()} <span className="text-xs font-black text-amber-500/40 ml-0.5">฿</span>
                        </span>
                     </div>
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
                       <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right align-middle w-[120px]">Comisión</th>
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
                          <td className="px-3 py-1.5 text-right w-[120px]">
                             <div className="flex flex-col items-end group/edit">
                                {editingCommId === c.id ? (
                                   <div className="flex items-center gap-1">
                                      <input 
                                         type="number"
                                         value={editCommVal}
                                         onChange={e => setEditCommVal(e.target.value)}
                                         className="w-16 bg-surface border border-brand/50 rounded px-1.5 py-0.5 text-white font-black text-right outline-none text-sm"
                                         autoFocus
                                      />
                                      <button onClick={async () => {
                                         await updateItem(c.id, 'comm_amount_thb', editCommVal ? parseFloat(editCommVal) : null);
                                         setEditingCommId(null);
                                      }} className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setEditingCommId(null)} className="p-0.5 text-gray-400 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-2">
                                      <button 
                                         onClick={() => {
                                            setEditingCommId(c.id);
                                            setEditCommVal(c.comm_amount_thb != null ? c.comm_amount_thb : (parseFloat(c.total_thb || 0) * 0.1));
                                         }}
                                         className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-0.5 text-gray-500 hover:text-brand"
                                      >
                                         <Pencil className="w-3 h-3" />
                                      </button>
                                      <span className={`text-base font-bold transition-colors ${c.is_comm_paid ? 'text-emerald-500' : 'text-amber-500'} ${c.comm_amount_thb != null ? 'text-brand' : ''}`}>
                                        {(c.comm_amount_thb != null ? parseFloat(c.comm_amount_thb) : parseFloat(c.activities?.price_thb || 0) * 0.1).toLocaleString()}
                                      </span>
                                   </div>
                                )}
                                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Base: {c.activities?.price_thb?.toLocaleString()}</span>
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
                <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px] gap-4">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">Oxygen Tour Snorkell</h3>
                   <div className="flex items-center gap-4">
                     <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Pagado:</span>
                        <span className="text-lg font-black text-emerald-400 font-mono leading-none">{(oxygenTotal - oxygenPending).toLocaleString()} ฿</span>
                     </div>
                     <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Por Pagar:</span>
                        <span className="text-lg font-black text-amber-400 font-mono leading-none">{oxygenPending.toLocaleString()} ฿</span>
                     </div>
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
                               <span className={`text-base font-bold transition-colors ${o.is_prov_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {(Number(o.quantity ?? 1) * Number(o.activities?.ssi_cost_thb || 0)).toLocaleString()}
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
                       {/* Categories List */}
                       <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {categories.length === 0 ? <p className="text-xs text-gray-500 italic text-center py-4">No hay categorías configuradas.</p> : null}
                          {categories.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-surface-edge group hover:border-surface-edge/80 transition-colors">
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${c.color}`}>
                                 {c.name}
                               </span>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => startEditingCat(c)} className="p-2 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-xl transition-all">
                                     <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteCategory(c.id, c.name)} className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                     <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>

                       {/* Add/Edit Form */}
                       <div className={`p-6 rounded-[32px] border transition-all ${editingCat ? 'bg-brand/5 border-brand/30 ring-1 ring-brand/20' : 'bg-surface border-surface-edge'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] text-brand uppercase font-black tracking-widest">
                              {editingCat ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
                            </h4>
                            {editingCat && (
                              <button onClick={cancelEditingCat} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Cancelar</button>
                            )}
                          </div>
                          
                          <div className="space-y-5">
                             <input 
                                value={catForm.name} 
                                onChange={e=>setCatForm({...catForm, name: e.target.value})}
                                placeholder="Nombre (Ej: Alquiler, Barcos...)" 
                                className="w-full bg-surface-soft border border-surface-edge rounded-2xl px-4 py-2.5 text-sm text-white focus:border-brand focus:outline-none transition-all"
                             />
                             
                             <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                                {colorPresets.map((colorClass, idx) => (
                                  <button 
                                    key={idx} onClick={() => setCatForm({...catForm, color: colorClass})}
                                    className={`w-7 h-7 rounded-full ${colorClass.split(' ')[0]} border transition-transform ${catForm.color === colorClass ? 'scale-125 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110'}`}
                                  />
                                ))}
                             </div>

                             <button 
                                onClick={handleAddCategory} 
                                disabled={!catForm.name.trim()}
                                className={`w-full text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all ${editingCat ? 'bg-brand hover:bg-brand-light shadow-xl shadow-brand/20' : 'bg-surface-edge hover:bg-surface-edge/80'}`}
                             >
                                {editingCat ? 'Actualizar Cambios' : 'Crear Categoría'}
                             </button>
                          </div>
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
                               <button onClick={() => { 
                                 setConfirmConfig({
                                   show: true,
                                   title: 'Borrar Promotor',
                                   message: `¿Seguro que quieres borrar al promotor "${p.name}"?`,
                                   type: 'danger',
                                   onConfirm: async () => {
                                     await supabase.from('external_promoters').delete().eq('id', p.id); 
                                     fetchData(false);
                                     setConfirmConfig(prev => ({ ...prev, show: false }));
                                   }
                                 });
                               }} className="p-2 text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
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
