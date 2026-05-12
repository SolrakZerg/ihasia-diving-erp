import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { addCustomersToBilling } from '../../common/billingHelpers';
import { ACTIVITY_COLORS, getActivityColor, shortenLastDive, normalizeLevel } from './Customers_Utils';

const PAGE_SIZE = 50;

// Re-export para compatibilidad con importadores existentes
export { ACTIVITY_COLORS, getActivityColor, shortenLastDive, normalizeLevel } from './Customers_Utils';


// ─── Hook principal ───────────────────────────────────────────────────────────

export default function useCustomersData() {
  // --- Estado de datos ---
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [totalCount, setTotalCount]     = useState(0);

  // --- Estado de paginación y búsqueda ---
  const [currentPage, setCurrentPage]   = useState(0);
  const [searchTerm, setSearchTerm]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef               = useRef(null);

  // --- Estado de filtros y ordenación ---
  const [sortConfig, setSortConfig]     = useState({ key: 'created_at', direction: 'desc' });
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [showDuplicates, setShowDuplicates]     = useState(false);
  const [isFilterOpen, setIsFilterOpen]         = useState(false);

  // --- Estado de UI ---
  const [isExtendedView, setIsExtendedView]     = useState(false);

  // --- Estado de drawer de detalle ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen]         = useState(false);

  // --- Estado de modal de edición ---
  const [editingCustomer, setEditingCustomer]   = useState(null);
  const [isEditModalOpen, setIsEditModalOpen]   = useState(false);

  // --- Estado de selección múltiple ---
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [isProcessingBilling, setIsProcessingBilling] = useState(false);

  // --- Estado de toast y confirmación ---
  const [showToast, setShowToast]       = useState(false);
  const [toastMsg, setToastMsg]         = useState('');
  const [confirmConfig, setConfirmConfig] = useState({
    show: false, title: '', message: '', type: 'danger', onConfirm: null,
  });

  // ─── Utilidades internas ─────────────────────────────────────────────────

  const getThailandDate = (offset = 0) => {
    const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  // ─── Fetching ────────────────────────────────────────────────────────────

  // Estado separado para la búsqueda (evita el parpadeo de pantalla completa)
  const [isSearching, setIsSearching] = useState(false);

  const fetchCustomers = useCallback(async () => {
    const isSearch = !!debouncedSearch.trim();
    try {
      // Usa setLoading solo en la carga inicial (sin término de búsqueda y página 0)
      if (!isSearch) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }

      let data, count, error;

      if (showDuplicates) {
        const res = await supabase.rpc('get_duplicate_customers', {}, { count: 'exact' });
        data = res.data; error = res.error; count = res.count;
      } else if (isSearch) {
        // ── Búsqueda inteligente por tokens via RPC ──
        // search_customers_v3 divide la query en tokens y busca en nombre+apellido+email
        // así "carlos n" encuentra "Carlos Nunez" correctamente
        const from = currentPage * PAGE_SIZE;
        const to   = from + PAGE_SIZE - 1;
        const res = await supabase.rpc('search_customers_v3', {
          query_text: debouncedSearch.trim(),
        });
        if (res.error) throw res.error;
        const allResults = res.data || [];
        count = allResults.length;
        data  = allResults.slice(from, to + 1);
      } else {
        // ── Query normal con filtros ──
        let q = supabase.from('customers').select('*', { count: 'exact' });

        if (activeDateFilter !== 'all') {
          const today = getThailandDate(0);
          if (activeDateFilter === 'today') {
            q = q.eq('booking_date', today);
          } else if (activeDateFilter === '3days') {
            q = q.gte('booking_date', getThailandDate(-1)).lte('booking_date', getThailandDate(1));
          } else if (activeDateFilter === 'week') {
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            q = q.gte('booking_date', startOfWeek.toISOString().split('T')[0])
                 .lte('booking_date', endOfWeek.toISOString().split('T')[0]);
          }
        }

        q = q.order(sortConfig.key, { ascending: sortConfig.direction === 'asc', nullsFirst: false });
        q = q.range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

        const res = await q;
        data = res.data; error = res.error; count = res.count;
      }

      if (error) throw error;
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching customers:', err.message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, sortConfig, debouncedSearch, activeDateFilter, showDuplicates]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ─── Handlers de búsqueda ────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(0);
    }, 400);
  };

  // ─── Handlers de filtros y ordenación ────────────────────────────────────

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(0);
  };

  const handleDateFilterChange = (filter) => {
    setActiveDateFilter(filter);
    setShowDuplicates(false);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const toggleDuplicates = () => {
    const newVal = !showDuplicates;
    setShowDuplicates(newVal);
    if (newVal) {
      setActiveDateFilter('all');
      setSearchTerm('');
      setDebouncedSearch('');
    }
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  // ─── Handlers de selección múltiple ──────────────────────────────────────

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ─── Handlers CRUD ───────────────────────────────────────────────────────

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    setConfirmConfig({
      show: true,
      title: 'Eliminar Registro',
      message: `¿Estás seguro de que quieres eliminar a ${name}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        try {
          const { error } = await supabase.from('customers').delete().eq('id', id);
          if (error) throw error;
          fetchCustomers();
        } catch (err) {
          alert('Error eliminando: ' + err.message);
        }
      },
    });
  };

  const handleEdit = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleRowClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
  };

  const dismissConfirm = () => setConfirmConfig(prev => ({ ...prev, show: false }));

  // ─── Handlers de facturación ──────────────────────────────────────────────

  const handleSendToBilling = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessingBilling(true);
    try {
      const { data: selectedCustomers, error: fetchErr } = await supabase
        .from('customers')
        .select('*')
        .in('id', Array.from(selectedIds));

      if (fetchErr) throw fetchErr;
      if (!selectedCustomers) return;

      await addCustomersToBilling(selectedCustomers);

      setToastMsg(`${selectedIds.size} buceadores enviados a facturación.`);
      setShowToast(true);
      setSelectedIds(new Set());
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error('Error in bulk billing:', err);
      alert('Error al enviar a facturación: ' + err.message);
    } finally {
      setIsProcessingBilling(false);
    }
  };

  // ─── Lógica de paginación ─────────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const goToPage = (page) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const half = 2;
    let start = Math.max(0, currentPage - half);
    let end   = Math.min(totalPages - 1, currentPage + half);
    if (end - start < 4) {
      if (start === 0) end = Math.min(totalPages - 1, 4);
      else start = Math.max(0, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    // Datos
    customers,
    loading,
    totalCount,
    totalPages,
    PAGE_SIZE,

    // Búsqueda
    searchTerm,
    handleSearchChange,
    isSearching,

    // Filtros
    isFilterOpen,
    setIsFilterOpen,
    activeDateFilter,
    showDuplicates,
    handleDateFilterChange,
    toggleDuplicates,

    // Ordenación
    sortConfig,
    handleSort,

    // Paginación
    currentPage,
    goToPage,
    getPageNumbers,

    // UI
    isExtendedView,
    setIsExtendedView,

    // Drawer de detalle
    selectedCustomer,
    isDrawerOpen,
    setIsDrawerOpen,
    handleRowClick,

    // Modal de edición
    editingCustomer,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,

    // Selección múltiple
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,

    // Facturación
    isProcessingBilling,
    handleSendToBilling,

    // Toast
    showToast,
    toastMsg,

    // Confirmación de borrado
    confirmConfig,
    dismissConfirm,
    handleDelete,

    // Refresh manual
    fetchCustomers,
  };
}
