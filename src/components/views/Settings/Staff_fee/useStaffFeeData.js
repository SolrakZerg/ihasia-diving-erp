import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function useStaffFeeData() {
  // ── Vista ────────────────────────────────────────────────────────────────
  const [view, setView] = useState('list'); // 'list' | 'add'

  // ── Datos ────────────────────────────────────────────────────────────────
  const [payouts, setPayouts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Modal de confirmación ────────────────────────────────────────────────
  const [confirmConfig, setConfirmConfig] = useState({
    show: false, title: '', message: '', type: 'danger', onConfirm: null
  });

  // ── Edición inline (solo el importe) ─────────────────────────────────────

  // ── Ordenación ───────────────────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // ── Formulario de alta ───────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    activity_id: '',
    concept_name: '',
    amount_thb: '',
    type: 'catalog' // 'catalog' | 'custom'
  });

  // ── Efecto inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const [payoutsRes, activitiesRes] = await Promise.all([
      supabase.from('instructor_payouts').select('*, activities(name, category, acronym, color)').order('created_at'),
      supabase.from('activities').select('id, name, category').order('name')
    ]);
    if (payoutsRes.data) setPayouts(payoutsRes.data);
    if (activitiesRes.data) setActivities(activitiesRes.data);
    setLoading(false);
  };

  // ── Ordenación ───────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPayouts = [...payouts].sort((a, b) => {
    let aVal, bVal;
    if (sortConfig.key === 'name') {
      aVal = a.activities?.name || a.concept_name || '';
      bVal = b.activities?.name || b.concept_name || '';
    } else if (sortConfig.key === 'acronym') {
      aVal = a.activities?.acronym || '';
      bVal = b.activities?.acronym || '';
    } else if (sortConfig.key === 'type') {
      aVal = a.activity_id ? 'catalog' : 'manual';
      bVal = b.activity_id ? 'catalog' : 'manual';
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const savePayout = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      amount_thb: parseFloat(formData.amount_thb) || 0,
      activity_id: formData.type === 'catalog' ? formData.activity_id : null,
      concept_name: formData.type === 'custom' ? formData.concept_name : null
    };
    const { error } = await supabase.from('instructor_payouts').insert([payload]);
    if (!error) {
      setView('list');
      setFormData({ activity_id: '', concept_name: '', amount_thb: '', type: 'catalog' });
      fetchData();
    } else {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  const deletePayout = (id) => {
    setConfirmConfig({
      show: true,
      title: 'Borrar Regla de Pago',
      message: '¿Estás seguro de que deseas borrar esta regla de pago? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('instructor_payouts').delete().eq('id', id);
        fetchData();
      }
    });
  };

  // ── Edición inline ───────────────────────────────────────────────────────
  const saveEdit = async (id, value) => {
    const { error } = await supabase
      .from('instructor_payouts')
      .update({ amount_thb: parseFloat(value) || 0 })
      .eq('id', id);

    if (!error) {
      setPayouts(payouts.map(p => p.id === id ? { ...p, amount_thb: parseFloat(value) || 0 } : p));
    } else {
      alert('Error: ' + error.message);
    }
  };

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    // Vista
    view, setView,

    // Datos
    payouts, activities, loading, saving, sortedPayouts,

    // Ordenación
    sortConfig, handleSort,

    // CRUD
    savePayout, deletePayout,

    // Edición inline
    saveEdit,

    // Formulario de alta
    formData, setFormData,

    // Modal confirmación
    confirmConfig, setConfirmConfig,
  };
}
