import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function useWisePaymentsData() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tab State: 'pending' | 'processed' | 'retained'
  const [activeTab, setActiveTab] = useState('pending');

  // Edit Modal State
  const [editingPayment, setEditingPayment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Retention Modal State
  const [retentionModalPayment, setRetentionModalPayment] = useState(null);
  const [selectedRetainedPax, setSelectedRetainedPax] = useState(1);

  // Process Modal State (Procesado estilo Addtocalendar 5.1 -> Acciones Bizum)
  const [processModalPayment, setProcessModalPayment] = useState(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('wise_payments')
        .select('*', { count: 'exact' });

      // Search filter
      if (searchTerm.trim()) {
        query = query.or(`sender_name.ilike.%${searchTerm.trim()}%,reference.ilike.%${searchTerm.trim()}%,id.ilike.%${searchTerm.trim()}%`);
      }

      // Tab filters
      if (activeTab === 'pending') {
        query = query.eq('is_processed', false).eq('is_retained', false);
      } else if (activeTab === 'processed') {
        query = query.eq('is_processed', true).eq('is_retained', false);
      } else if (activeTab === 'retained') {
        query = query.eq('is_retained', true);
      }

      // Order by newest first
      query = query.order('created_at', { ascending: false });

      // Pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setPayments(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE) || 1);
    } catch (err) {
      console.error('Error fetching Wise payments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Search Handler
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Tab Handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Edit Modal Handlers
  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  // Delete Payment
  const handleDelete = async (id, senderName) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la transferencia de "${senderName}"?`)) return;
    try {
      const { error } = await supabase
        .from('wise_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPayments();
    } catch (err) {
      console.error('Error deleting Wise payment:', err);
    }
  };

  // Toggle Processed Status (Abre Modal de Procesamiento si pasa a procesado)
  const toggleProcessed = async (payment) => {
    const isCurrentlyProcessed = payment.is_processed;

    if (!isCurrentlyProcessed) {
      // Abrir modal de procesamiento estilo Addtocalendar 5.1
      setProcessModalPayment(payment);
      setIsProcessModalOpen(true);
    } else {
      // Si se desmarca, cambiar a false directo
      try {
        const { error } = await supabase
          .from('wise_payments')
          .update({ is_processed: false })
          .eq('id', payment.id);

        if (error) throw error;
        fetchPayments();
      } catch (err) {
        console.error('Error unmarking processed status:', err);
      }
    }
  };

  // Toggle Retained Status
  const toggleRetained = async (payment) => {
    const isCurrentlyRetained = payment.is_retained;

    if (!isCurrentlyRetained) {
      if (payment.num_people > 1) {
        setRetentionModalPayment(payment);
        setSelectedRetainedPax(payment.num_people);
        return;
      }

      try {
        const { error } = await supabase
          .from('wise_payments')
          .update({ 
            is_retained: true, 
            retained_people: 1, 
            is_settled: false 
          })
          .eq('id', payment.id);

        if (error) throw error;
        fetchPayments();
      } catch (err) {
        console.error('Error marking as retained:', err);
      }
    } else {
      try {
        const { error } = await supabase
          .from('wise_payments')
          .update({ 
            is_retained: false, 
            retained_people: null, 
            is_settled: false 
          })
          .eq('id', payment.id);

        if (error) throw error;
        fetchPayments();
      } catch (err) {
        console.error('Error unmarking retained:', err);
      }
    }
  };

  // Confirm Retention Modal
  const confirmRetentionModal = async () => {
    if (!retentionModalPayment) return;
    try {
      const { error } = await supabase
        .from('wise_payments')
        .update({ 
          is_retained: true, 
          retained_people: selectedRetainedPax, 
          is_settled: false 
        })
        .eq('id', retentionModalPayment.id);

      if (error) throw error;
      setRetentionModalPayment(null);
      fetchPayments();
    } catch (err) {
      console.error('Error setting partial retention:', err);
    }
  };

  // Toggle Settled Status (Repartido)
  const toggleSettled = async (id, currentVal) => {
    try {
      const { error } = await supabase
        .from('wise_payments')
        .update({ is_settled: !currentVal })
        .eq('id', id);

      if (error) throw error;
      fetchPayments();
    } catch (err) {
      console.error('Error updating settlement status:', err);
    }
  };

  return {
    payments,
    loading,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    handleSearchChange,
    activeTab,
    handleTabChange,
    toggleProcessed,
    toggleRetained,
    toggleSettled,
    retentionModalPayment,
    setRetentionModalPayment,
    selectedRetainedPax,
    setSelectedRetainedPax,
    confirmRetentionModal,
    editingPayment,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,
    handleDelete,
    processModalPayment,
    setProcessModalPayment,
    isProcessModalOpen,
    setIsProcessModalOpen,
    fetchPayments
  };
}
