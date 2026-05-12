import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function useStaffData() {
  // ── Vista ────────────────────────────────────────────────────────────────
  const [view, setView] = useState('list'); // 'list' | 'add'

  // ── Datos ────────────────────────────────────────────────────────────────
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Ordenación ───────────────────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });

  // ── Selección múltiple ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Edición inline ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // ── Modal de confirmación ────────────────────────────────────────────────
  const [confirmConfig, setConfirmConfig] = useState({
    show: false, title: '', message: '', type: 'danger', onConfirm: null
  });

  // ── Formulario de alta ───────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    initials: '',
    email: '',
    phone: '',
    instructor_number: '',
    role: 'Instructor',
    active: true
  });

  // ── Efecto inicial ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('active', { ascending: false });

    if (!error) setStaff(data);
    setLoading(false);
  };

  // ── Ordenación ───────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedStaff = [...staff].sort((a, b) => {
    let aVal = (a[sortConfig.key] || '').toString().toLowerCase();
    let bVal = (b[sortConfig.key] || '').toString().toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // ── Utilidades ───────────────────────────────────────────────────────────
  const generateInitials = (first, last) => {
    if (!first || !last) return '';
    return (first[0] + last[0]).toUpperCase();
  };

  const resetForm = () => setFormData({
    first_name: '', last_name: '', initials: '', email: '',
    phone: '', instructor_number: '', role: 'Instructor', active: true
  });

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const saveNewStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('staff').insert([formData]);

    if (!error) {
      setView('list');
      resetForm();
      fetchData();
    } else {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  const startEditing = (member) => {
    setEditingId(member.id);
    setEditData({ ...member });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('staff')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        initials: editData.initials,
        email: editData.email,
        phone: editData.phone,
        instructor_number: editData.instructor_number,
        role: editData.role,
        active: editData.active
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchData(false);
    } else {
      alert('Error: ' + error.message);
    }
  };

  const toggleActive = async (member) => {
    const { error } = await supabase
      .from('staff')
      .update({ active: !member.active })
      .eq('id', member.id);

    if (!error) fetchData(false);
  };

  const deleteStaff = (id) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Personal',
      message: '¿Estás seguro de que quieres eliminar permanentemente a este miembro del staff? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('staff').delete().eq('id', id);
        fetchData(false);
      }
    });
  };

  const handleBulkDelete = () => {
    setConfirmConfig({
      show: true,
      title: 'Borrado Masivo',
      message: `¿Estás seguro de que deseas eliminar a los ${selectedIds.size} miembros seleccionados? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('staff').delete().in('id', Array.from(selectedIds));
        setSelectedIds(new Set());
        fetchData(false);
      }
    });
  };

  // ── Selección ────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedStaff.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedStaff.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    // Vista
    view, setView,

    // Datos
    staff, loading, saving, sortedStaff,

    // Ordenación
    sortConfig, handleSort,

    // Selección
    selectedIds, toggleSelectAll, toggleSelectOne,

    // Edición inline
    editingId, editData, setEditData,
    startEditing, cancelEdit, saveEdit,

    // CRUD
    saveNewStaff, toggleActive, deleteStaff, handleBulkDelete,

    // Formulario de alta
    formData, setFormData, generateInitials,

    // Modal confirmación
    confirmConfig, setConfirmConfig,
  };
}
