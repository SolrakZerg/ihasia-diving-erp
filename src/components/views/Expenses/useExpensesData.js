import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';
import {
  buildUpdateItemAction,
  buildExpenseUpdateAction,
  buildAddExpenseAction,
  buildRemoveExpenseAction
} from './expensesUndoActions';

export const useExpensesData = () => {
  const { pushAction } = useUndo();
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
  const [catForm, setCatForm] = useState({ name: '', color: 'rgba(59, 130, 246, 1)' });
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
  const [tableError, setTableError] = useState(null);

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

    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const syncDate = isCurrentMonth ? now.toISOString().split('T')[0] : `${selectedYear}-${mm}-01`;

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
          const pending = oxyRes.data.filter(o => !o.is_prov_paid).reduce((sum, o) => sum + ((Number(o.quantity) || 0) * Number(o.activities?.ssi_cost_thb || 0)), 0);
          const total = oxyRes.data.reduce((sum, o) => sum + ((Number(o.quantity) || 0) * Number(o.activities?.ssi_cost_thb || 0)), 0);
          setOxygenPending(pending);
          setOxygenTotal(total);
        }
    }

    setNewDataExp(prev => ({ ...prev, date: syncDate }));
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
        setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)' });
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
        setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)' });
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
    setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)' });
  };

  const handleDeleteExpense = async (id) => {
    const expenseItem = expenses.find(e => e.id === id);
    if (!expenseItem) return;
    const { error } = await supabase.from('daily_expenses').delete().eq('id', id);
    if (!error) {
      pushAction(buildRemoveExpenseAction(expenseItem, fetchData));
      fetchData(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newDataExp.description || !newDataExp.amount) {
      showNotify("Por favor, rellena descripción e importe.", 'error');
      return;
    }
    setSaving(true);
    const { data: newExpense, error } = await supabase
      .from('daily_expenses')
      .insert([{ ...newDataExp, amount: parseFloat(newDataExp.amount) }])
      .select()
      .single();
    
    if (error) {
      console.error("Error saving expense:", error);
      showNotify(`Error al guardar gasto: ${error.message}`, 'error');
    } else {
      showNotify("¡Gasto guardado correctamente!");
      setIsAddingExpense(false);
      if (newExpense) {
        pushAction(buildAddExpenseAction(newExpense, fetchData));
      }
      setNewDataExp(prev => ({ description: '', amount: '', category: 'Comidas', date: prev.date }));
      fetchData(false);
    }
    setSaving(false);
  };

  const updateItem = async (itemId, field, value) => {
    const commissionItem = commissions.find(c => c.id === itemId) || oxygenTours.find(o => o.id === itemId);
    if (!commissionItem) return;
    const oldValue = commissionItem[field];

    const { error } = await supabase.from('invoice_items').update({ [field]: value }).eq('id', itemId);
    if (error) {
      showNotify(`Error al actualizar: ${error.message}`, 'error');
    } else {
      pushAction(buildUpdateItemAction(itemId, field, value, oldValue, commissionItem, recipientOptions, fetchData));
      fetchData(false);
    }
  };

  const handleExpenseUpdate = async (id, field, value) => {
    if (!value) return;
    try {
      const expenseItem = expenses.find(e => e.id === id);
      if (!expenseItem) return;
      const oldValue = expenseItem[field];

      const { error } = await supabase.from('daily_expenses').update({ [field]: value }).eq('id', id);
      if (error) throw error;

      pushAction(buildExpenseUpdateAction(id, field, value, oldValue, expenseItem.description, fetchData));
      fetchData(false);
      showNotify("¡Gasto actualizado correctamente!");
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

  return {
    expenses, setExpenses,
    commissions, setCommissions,
    oxygenTours, setOxygenTours,
    promoters, setPromoters,
    staff, setStaff,
    allActivities, setAllActivities,
    monthlyTotal, setMonthlyTotal,
    commissionsPaid, setCommissionsPaid,
    commissionsPending, setCommissionsPending,
    oxygenPending, setOxygenPending,
    oxygenTotal, setOxygenTotal,
    loading, setLoading,
    saving, setSaving,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    dateFilter, setDateFilter,
    showConfigModal, setShowConfigModal,
    configTab, setConfigTab,
    categories, setCategories,
    editingCat, setEditingCat,
    catForm, setCatForm,
    promoterForm, setPromoterForm,
    colorPresets,
    isAddingExpense, setIsAddingExpense,
    newDataExp, setNewDataExp,
    notification, setNotification,
    confirmConfig, setConfirmConfig,
    editingCommId, setEditingCommId,
    editCommVal, setEditCommVal,
    showNotify,
    handlePrevMonth,
    handleNextMonth,
    fetchData,
    handleAddCategory,
    handleDeleteCategory,
    startEditingCat,
    cancelEditingCat,
    handleAddExpense,
    handleDeleteExpense,
    tableError,
    updateItem,
    handleExpenseUpdate,
    recipientOptions,
    getRecipientName,
    getRecipientType,
    pendingByRecipient
  };
};
