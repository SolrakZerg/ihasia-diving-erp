import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export const colorPresets = [
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

export const payoutGroups = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

export function useActivitiesData() {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [activities, setActivities] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Selection
  const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(37.5);

  // Categories Engine
  const [showCatModal, setShowCatModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ 
    name: '', 
    color: 'rgba(59, 130, 246, 1)',
    is_commissionable: false,
    requires_staff: true
  });
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', type: 'danger', onConfirm: null });
  const [toast, setToast] = useState(null);

  // Add Form state
  const [formData, setFormData] = useState({
    name: '',
    price_thb: '',
    price_eur: '',
    tanks_weight: '0',
    ssi_cost_thb: '0',
    category: 'Course',
    color: '',
    acronym: '',
    duration_days: '0',
    payout_group: '',
    is_commissionable: false,
    is_ssi_active: false,
    tshirt_included: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [actRes, rateRes, catRes] = await Promise.all([
      supabase.from('activities').select('*').order('category').order('price_thb', { ascending: false }),
      supabase.from('exchange_rates').select('*').limit(1).single(),
      supabase.from('activity_categories').select('*').order('sort_order', { ascending: true })
    ]);
    
    if (actRes.data) setActivities(actRes.data);
    if (rateRes.data) {
      setExchangeRate(parseFloat(rateRes.data.rate));
      setNewRate(parseFloat(rateRes.data.rate));
    }
    
    if (catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data);
      if (formData.category === 'Curso' || formData.category === 'Course') {
        setFormData(prev => ({...prev, category: catRes.data[0].name}));
      }
    }
    
    setLoading(false);
  };

  const updateExchangeRate = async () => {
    try {
      const rateNum = parseFloat(newRate);
      if (isNaN(rateNum) || rateNum <= 0) return;

      const { data: currentRate } = await supabase.from('exchange_rates').select('id').limit(1).single();
      
      if (currentRate) {
        await supabase.from('exchange_rates').update({ rate: rateNum }).eq('id', currentRate.id);
      } else {
        await supabase.from('exchange_rates').insert({ rate: rateNum, from_currency: 'EUR', to_currency: 'THB' });
      }
      
      setExchangeRate(rateNum);
      setIsEditingRate(false);
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleThbChange = (thb, isEdit = false) => {
    const value = parseFloat(thb) || 0;
    const eur = (value / exchangeRate).toFixed(2);
    if (isEdit) {
      setEditData({...editData, price_thb: thb, price_eur: eur});
    } else {
      setFormData({...formData, price_thb: thb, price_eur: eur});
    }
  };

  const saveActivity = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('activities').insert([
      {
        name: formData.name,
        price_thb: parseFloat(formData.price_thb) || 0,
        price_eur: parseFloat(formData.price_eur) || 0,
        tanks_weight: parseFloat(formData.tanks_weight) || 0,
        ssi_cost_thb: parseFloat(formData.ssi_cost_thb) || 0,
        category: formData.category,
        color: formData.color,
        acronym: formData.acronym,
        duration_days: parseFloat(formData.duration_days) || 0,
        is_commissionable: formData.is_commissionable,
        is_ssi_active: formData.is_ssi_active,
        tshirt_included: formData.tshirt_included,
        payout_group: formData.payout_group || null
      }
    ]);

    if (!error) {
      setView('list');
      fetchData();
      setFormData({ name: '', price_thb: '', price_eur: '', tanks_weight: '0', ssi_cost_thb: '0', category: categories[0]?.name || '', color: '', acronym: '', duration_days: '0', is_commissionable: false, is_ssi_active: false, tshirt_included: false, payout_group: '' });
    } else {
      alert('Error guardando: ' + error.message);
    }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Actividad',
      message: '¿Seguro que quieres borrar este elemento permanentemente?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('activities').delete().eq('id', id);
        setSelectedIds(new Set());
        fetchData(false);
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setConfirmConfig({
      show: true,
      title: 'Borrado Masivo',
      message: `¿Seguro que quieres borrar estos ${selectedIds.size} elementos? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        const idsToDelete = Array.from(selectedIds);
        await supabase.from('activities').delete().in('id', idsToDelete);
        setSelectedIds(new Set());
        fetchData(false);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedActivities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedActivities.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const startEditing = (act) => {
    setEditingId(act.id);
    setEditData({
      name: act.name,
      price_thb: act.price_thb?.toString() || '0',
      price_eur: act.price_eur?.toString() || '0',
      tanks_weight: act.tanks_weight?.toString() || '0',
      ssi_cost_thb: act.ssi_cost_thb?.toString() || '0',
      category: act.category || categories[0]?.name || '',
      color: act.color || '',
      acronym: act.acronym || '',
      duration_days: act.duration_days?.toString() || '0',
      is_commissionable: act.is_commissionable || false,
      is_ssi_active: act.is_ssi_active || false,
      tshirt_included: act.tshirt_included || false,
      payout_group: act.payout_group || ''
    });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase.from('activities').update({
      name: editData.name,
      price_thb: parseFloat(editData.price_thb) || 0,
      price_eur: parseFloat(editData.price_eur) || 0,
      tanks_weight: parseFloat(editData.tanks_weight) || 0,
      ssi_cost_thb: parseFloat(editData.ssi_cost_thb) || 0,
      category: editData.category,
      color: editData.color,
      acronym: editData.acronym,
      duration_days: parseFloat(editData.duration_days) || 0,
      is_commissionable: editData.is_commissionable,
      is_ssi_active: editData.is_ssi_active,
      tshirt_included: editData.tshirt_included,
      payout_group: editData.payout_group || null
    }).eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchData(false);
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleAddCategory = async () => {
    if (!catForm.name.trim()) return;
    
    if (editingCat) {
      const { error } = await supabase.from('activity_categories').update({
        name: catForm.name.trim(),
        color: catForm.color,
        is_commissionable: catForm.is_commissionable,
        requires_staff: catForm.requires_staff
      }).eq('id', editingCat.id);
      
      if (!error) {
        fetchData(false);
        setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)', is_commissionable: false, requires_staff: true });
        setEditingCat(null);
        setToast({ message: 'Categoría actualizada correctamente', type: 'success' });
      }
    } else {
      const { error } = await supabase.from('activity_categories').insert({
        name: catForm.name.trim(),
        color: catForm.color,
        is_commissionable: catForm.is_commissionable,
        requires_staff: catForm.requires_staff,
        sort_order: (categories.length + 1) * 10
      });
      
      if (!error) {
        fetchData(false);
        setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)', is_commissionable: false, requires_staff: true });
        setToast({ message: 'Nueva categoría creada', type: 'success' });
      }
    }
  };

  const startEditingCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ 
      name: cat.name, 
      color: cat.color,
      is_commissionable: cat.is_commissionable || false,
      requires_staff: cat.requires_staff !== false
    });
  };

  const cancelEditingCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', color: 'rgba(59, 130, 246, 1)', is_commissionable: false, requires_staff: true });
  };

  const handleDeleteCategory = async (id, catName) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Categoría',
      message: `¿Eliminar categoría '${catName}'? Esto NO borrará los items asociados, pero perderán su color.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('activity_categories').delete().eq('id', id);
        fetchData(false);
      }
    });
  };

  const getCategoryColor = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : 'bg-surface/50 text-gray-400 border border-surface-edge';
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedActivities = [...activities]
    .filter(act => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        act.name?.toLowerCase().includes(s) ||
        act.category?.toLowerCase().includes(s) ||
        act.acronym?.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    if (['price_thb', 'price_eur', 'tanks_weight'].includes(sortConfig.key)) {
       aVal = Number(aVal);
       bVal = Number(bVal);
    } else {
       aVal = aVal.toString().toLowerCase();
       bVal = bVal.toString().toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return {
    view, setView,
    activities, setActivities,
    exchangeRate, setExchangeRate,
    loading, setLoading,
    saving, setSaving,
    editingId, setEditingId,
    editData, setEditData,
    searchTerm, setSearchTerm,
    sortConfig, setSortConfig,
    selectedIds, setSelectedIds,
    isEditingRate, setIsEditingRate,
    newRate, setNewRate,
    showCatModal, setShowCatModal,
    categories, setCategories,
    editingCat, setEditingCat,
    catForm, setCatForm,
    confirmConfig, setConfirmConfig,
    toast, setToast,
    formData, setFormData,
    colorPresets,
    payoutGroups,
    filteredAndSortedActivities,
    updateExchangeRate,
    handleThbChange,
    saveActivity,
    deleteActivity,
    handleBulkDelete,
    toggleSelectAll,
    toggleSelectOne,
    startEditing,
    saveEdit,
    handleAddCategory,
    startEditingCat,
    cancelEditingCat,
    handleDeleteCategory,
    getCategoryColor,
    handleSort
  };
}
