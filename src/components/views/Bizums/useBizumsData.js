import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function useBizumsData() {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'returned' | 'retained'

  // --- Data State ---
  const [bizums, setBizums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // --- Search & Pagination ---
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);

  // --- Sorting ---
  const [sortConfig, setSortConfig] = useState({ key: 'booking_date', direction: 'asc' });

  // --- Modals ---
  const [editingBizum, setEditingBizum] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [actionsModalData, setActionsModalData] = useState(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

  // --- Toast & Confirm ---
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({
    show: false, title: '', message: '', type: 'danger', onConfirm: null,
  });

  const pageSize = activeTab === 'active' ? 200 : 50;

  // --- Fetching ---
  const fetchBizums = useCallback(async () => {
    try {
      setLoading(true);
      const limit = activeTab === 'active' ? 200 : 50;

      let q = supabase
        .from('bizums')
        .select('*', { count: 'exact' });

      if (activeTab === 'active') {
        q = q.eq('is_returned', false).eq('is_retained', false);
      } else if (activeTab === 'returned') {
        q = q.eq('is_returned', true);
      } else if (activeTab === 'retained') {
        q = q.eq('has_retention', true);
      }

      if (debouncedSearch.trim()) {
        const query = `%${debouncedSearch.trim()}%`;
        q = q.or(`customer_name.ilike.${query},bizum_phone.ilike.${query},whatsapp_phone.ilike.${query},activity.ilike.${query}`);
      }

      q = q.order(sortConfig.key, { ascending: sortConfig.direction === 'asc', nullsFirst: false });
      q = q.range(currentPage * limit, currentPage * limit + limit - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      setBizums(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching bizums:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, debouncedSearch, sortConfig]);

  useEffect(() => {
    fetchBizums();
  }, [fetchBizums]);

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(0);
    }, 400);
  };

  // --- Tab Change ---
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  // --- Sort Handler ---
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(0);
  };

  // --- Toggle Paid ---
  const handleTogglePaid = async (bizumRow) => {
    const newPaidStatus = !bizumRow.is_paid;
    try {
      const { error } = await supabase
        .from('bizums')
        .update({ is_paid: newPaidStatus })
        .eq('id', bizumRow.id);

      if (error) throw error;

      // Update local state
      setBizums(prev => prev.map(b => b.id === bizumRow.id ? { ...b, is_paid: newPaidStatus } : b));

      if (newPaidStatus) {
        // Trigger actions modal
        setActionsModalData({ ...bizumRow, is_paid: true });
        setIsActionsModalOpen(true);
      } else {
        setToastMsg('Reserva marcada como pendiente de pago.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      alert('Error al actualizar estado de pago: ' + err.message);
    }
  };

  // --- Toggle Returned ---
  const handleToggleReturned = async (bizumRow) => {
    const newReturnedStatus = !bizumRow.is_returned;
    try {
      const { error } = await supabase
        .from('bizums')
        .update({ is_returned: newReturnedStatus })
        .eq('id', bizumRow.id);

      if (error) throw error;

      fetchBizums();
      setToastMsg(newReturnedStatus ? 'Reserva movida a Devueltas.' : 'Reserva movida a Activas.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Error al actualizar estado de devolución: ' + err.message);
    }
  };

  // --- Toggle Retained ---
  const handleToggleRetained = async (bizumRow) => {
    const newRetainedStatus = !bizumRow.is_retained;
    try {
      const { error } = await supabase
        .from('bizums')
        .update({ is_retained: newRetainedStatus })
        .eq('id', bizumRow.id);

      if (error) throw error;

      fetchBizums();
      setToastMsg(newRetainedStatus ? 'Reserva movida a Retenidos.' : 'Reserva movida a Activas.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Error al actualizar estado de retención: ' + err.message);
    }
  };

  // --- Toggle Settled ---
  const handleToggleSettled = async (bizumRow) => {
    const newSettledStatus = !bizumRow.is_settled;
    try {
      const { error } = await supabase
        .from('bizums')
        .update({ is_settled: newSettledStatus })
        .eq('id', bizumRow.id);

      if (error) throw error;

      fetchBizums();
      setToastMsg(newSettledStatus ? 'Depósito marcado como repartido.' : 'Depósito marcado como pendiente de repartir.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Error al actualizar estado de liquidación: ' + err.message);
    }
  };

  // --- Delete ---
  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    setConfirmConfig({
      show: true,
      title: 'Eliminar Reserva Bizum',
      message: `¿Estás seguro de que quieres eliminar la reserva a nombre de "${name}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('bizums').delete().eq('id', id);
          if (error) throw error;
          fetchBizums();
          setToastMsg('Reserva eliminada correctamente.');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
          alert('Error eliminando reserva: ' + err.message);
        }
      },
    });
  };

  const dismissConfirm = () => setConfirmConfig(prev => ({ ...prev, show: false }));

  // --- Add / Edit Modals ---
  const handleAdd = () => {
    setEditingBizum(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (e, bizumRow) => {
    e.stopPropagation();
    setEditingBizum(bizumRow);
    setIsEditModalOpen(true);
  };

  // --- Pagination ---
  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = (page) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const half = 2;
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, currentPage + half);
    if (end - start < 4) {
      if (start === 0) end = Math.min(totalPages - 1, 4);
      else start = Math.max(0, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return {
    // Data
    bizums,
    loading,
    totalCount,
    totalPages,
    pageSize,

    // Tabs
    activeTab,
    handleTabChange,

    // Search
    searchTerm,
    handleSearchChange,

    // Sorting
    sortConfig,
    handleSort,

    // Pagination
    currentPage,
    goToPage,
    getPageNumbers,

    // Handlers
    handleTogglePaid,
    handleToggleReturned,
    handleToggleRetained,
    handleToggleSettled,
    handleDelete,
    handleAdd,
    handleEdit,
    fetchBizums,

    // Edit Modal State
    editingBizum,
    isEditModalOpen,
    setIsEditModalOpen,

    // Actions Modal State
    actionsModalData,
    isActionsModalOpen,
    setIsActionsModalOpen,

    // Toast & Confirm
    showToast,
    toastMsg,
    confirmConfig,
    dismissConfirm,
  };
}
