import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function useCashReservationsData() {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'imported' | 'all'

  // --- Data State ---
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // --- Search & Pagination ---
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const PAGE_SIZE = 50;

  // --- Sorting ---
  const [sortConfig, setSortConfig] = useState({ key: 'booking_date', direction: 'desc' });

  // --- Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- Toast & Confirm ---
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({
    show: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: null,
  });

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const dismissConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, show: false }));
  };

  // --- Fetching ---
  const fetchReservations = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      let q = supabase
        .from('cash_reservations')
        .select('*, invoices(id, status, created_at)', { count: 'exact' });

      if (activeTab === 'pending') {
        q = q.eq('imported_to_invoice', false);
      } else if (activeTab === 'imported') {
        q = q.eq('imported_to_invoice', true);
      }
      // 'all' doesn't filter imported_to_invoice

      if (debouncedSearch.trim()) {
        const query = `%${debouncedSearch.trim()}%`;
        q = q.or(`first_name.ilike.${query},last_name.ilike.${query},phone.ilike.${query},activity_code.ilike.${query}`);
      }

      q = q.order(sortConfig.key, { ascending: sortConfig.direction === 'asc', nullsFirst: false });
      q = q.range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      setReservations(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching cash reservations:', err.message);
      triggerToast('Error cargando reservas: ' + err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [activeTab, currentPage, debouncedSearch, sortConfig]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // --- Realtime Subscription ---
  useEffect(() => {
    const channel = supabase
      .channel('cash-reservations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_reservations' },
        (payload) => {
          fetchReservations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations]);

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(0);
    }, 350);
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
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- Pagination Navigation ---
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const goToPage = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // --- Delete Handler ---
  const handleDelete = (reservation) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Reserva en Efectivo',
      message: `¿Estás seguro de que deseas eliminar la reserva de "${reservation.customer_name}" del ${reservation.booking_date}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('cash_reservations')
            .delete()
            .eq('id', reservation.id);

          if (error) throw error;

          triggerToast('Reserva eliminada con éxito');
          fetchReservations();
        } catch (err) {
          console.error('Error al eliminar reserva:', err);
          triggerToast('Error al eliminar: ' + err.message);
        } finally {
          dismissConfirm();
        }
      }
    });
  };

  return {
    reservations,
    loading,
    totalCount,
    totalPages,
    PAGE_SIZE,
    currentPage,
    goToPage,
    getPageNumbers,

    activeTab,
    handleTabChange,

    searchTerm,
    handleSearchChange,

    sortConfig,
    handleSort,

    handleDelete,
    fetchReservations,

    isCreateModalOpen,
    setIsCreateModalOpen,

    showToast,
    toastMsg,
    confirmConfig,
    dismissConfirm,
  };
}
