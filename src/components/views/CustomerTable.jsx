import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, MapPin, Calendar, Award, Activity, Filter, User, ChevronRight, Phone, ChevronLeft, ChevronsLeft, ChevronsRight, Pencil, Trash2, Copy, LayoutList, LayoutGrid, Globe, Heart, Hash, CreditCard, Send, ShieldCheck, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import CustomerDetailDrawer from './CustomerDetailDrawer';
import CustomerFormModal from './CustomerFormModal';
import { addCustomersToBilling } from './billing/billingHelpers';

const PAGE_SIZE = 50;

const ACTIVITY_COLORS = {
  'try dive': 'text-rose-400/90',
  'bautizo': 'text-rose-400/90',
  'open water': 'text-emerald-400',
  'owd': 'text-emerald-400',
  'advanced': 'text-sky-400',
  'aowd': 'text-sky-400',
  'rescue': 'text-orange-400',
  'fun dive': 'text-purple-400', // Con espacio
  'fundive': 'text-purple-400',
  'ocio': 'text-purple-400',
  'refresh': 'text-amber-400',  // Palabra exacta
  'refresher': 'text-amber-400',
  'ssi course': 'text-fuchsia-400'
};

const getActivityColor = (activity) => {
  if (!activity) return 'text-gray-400';
  const a = activity.toLowerCase();
  for (const [key, color] of Object.entries(ACTIVITY_COLORS)) {
    if (a.includes(key)) return color;
  }
  return 'text-brand';
};

const shortenLastDive = (lastDive) => {
  if (!lastDive) return '---';
  const ld = lastDive.toLowerCase();
  if (ld.includes('ufff') || ld.includes('mucho') || ld.includes('2 años')) return '+2 años';
  if (ld.includes('6 meses') && ld.includes('1 año')) return '6-12 meses';
  if (ld.includes('6 meses')) return '< 6 meses';
  if (ld.includes('1 año') && ld.includes('2 años')) return '1-2 años';
  return lastDive.slice(0, 15); // Fallback to avoid huge strings
};

export default function CustomerTable({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessingBilling, setIsProcessingBilling] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', type: 'danger', onConfirm: null });

  // Debounce search input: wait 400ms after user stops typing
  const searchDebounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(0); // reset to first page on new search
    }, 400);
  };

  // Utility to get Thailand date boundaries
  const getThailandDate = (offset = 0) => {
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  // Build the server-side query with current filters/sort/page
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);

      // --- Data Fetching Logic ---
      let query;
      if (showDuplicates) {
        query = supabase.rpc('get_duplicate_customers', {}, { count: 'exact' });
      } else {
        query = supabase
          .from('customers')
          .select('*', { count: 'exact' });

        // Server-side text search
        if (debouncedSearch.trim()) {
          const s = debouncedSearch.trim();
          query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,passport_number.ilike.%${s}%`);
        }

        // Server-side date filter
        if (activeDateFilter !== 'all') {
          const today = getThailandDate(0);
          if (activeDateFilter === 'today') query = query.eq('booking_date', today);
          else if (activeDateFilter === '3days') {
            const yesterday = getThailandDate(-1);
            const tomorrow = getThailandDate(1);
            query = query.gte('booking_date', yesterday).lte('booking_date', tomorrow);
          } else if (activeDateFilter === 'week') {
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            query = query
              .gte('booking_date', startOfWeek.toISOString().split('T')[0])
              .lte('booking_date', endOfWeek.toISOString().split('T')[0]);
          }
        }
      }

      // Use RPC's internal ordering for duplicates to keep groups together
      if (!showDuplicates) {
        query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc', nullsFirst: false });
      }
      
      query = query.range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching customers:', error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortConfig, debouncedSearch, activeDateFilter, showDuplicates]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
    setIsFilterOpen(false); // <--- Línea añadida para cerrar el menú
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id, e) => {
    e.stopPropagation(); // Don't trigger row click
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (e, id, name) => {
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
      }
    });
  };

  const handleEdit = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSendToBilling = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessingBilling(true);
    try {
      // 1. Cargamos los datos frescos de TODOS los seleccionados por ID
      // Esto evita que se pierdan datos por paginación o filtros de búsqueda
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

  // --- Pagination logic ---
  const goToPage = (page) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  // Build page range to show (max 5 buttons)
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

  const normalizeLevel = (level) => {
    if (!level) return 'Buceador';
    const l = level.trim().toLowerCase();
    if (l === 'advance' || l === 'advanced') return 'Advanced Open Water';
    if (l.includes('instructor') || l.includes('master')) return 'Pro (Inst/DM)';
    return level;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Cargando buceadores...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-10 ${isExtendedView ? 'max-w-none' : 'max-w-7xl'} mx-auto w-full transition-all duration-500`}>
      {/* Header Area */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Buceadores</h1>
          <p className="text-gray-400">
            {totalCount.toLocaleString('es-ES')} registros en total · Página {currentPage + 1} de {totalPages || 1}
          </p>
        </div>
        
        <div className="flex gap-3 relative">
          <div className="relative group flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar buceador..." 
              className="bg-surface-soft border border-surface-edge rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 w-full md:w-64 transition-all shadow-inner"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <button 
            onClick={() => setIsExtendedView(!isExtendedView)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
              isExtendedView
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
              : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white hover:border-brand/30'
            }`}
            title={isExtendedView ? "Vista Compacta" : "Vista Extendida"}
          >
            {isExtendedView ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">
              {isExtendedView ? 'Compacto' : 'Extendido'}
            </span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                activeDateFilter !== 'all' || isFilterOpen
                ? 'bg-brand/10 border-brand/50 text-brand' 
                : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white hover:border-brand/30'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Filtros</span>
              {activeDateFilter !== 'all' && (
                <span className="flex w-2 h-2 rounded-full bg-brand animate-pulse"></span>
              )}
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-surface/95 backdrop-blur-xl border border-surface-edge rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-surface-edge bg-surface-soft/50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtros Avanzados</h3>
                </div>
                <div className="p-2 space-y-1">
                  <FilterButton 
                    label="🔍 Todos los registros" 
                    active={activeDateFilter === 'all' && !showDuplicates} 
                    onClick={() => handleDateFilterChange('all')}
                  />
                  <div className="h-px bg-surface-edge/50 my-1 mx-2" />
                  <FilterButton 
                    label="👯 Ver Duplicados" 
                    active={showDuplicates} 
                    onClick={toggleDuplicates}
                  />
                  <div className="h-px bg-surface-edge/50 my-1 mx-2" />
                  <FilterButton 
                    label="📌 Solo Hoy" 
                    active={activeDateFilter === 'today'} 
                    onClick={() => handleDateFilterChange('today')}
                  />
                  <FilterButton 
                    label="🗓️ Ventana (Ayer, Hoy, Mañana)" 
                    active={activeDateFilter === '3days'} 
                    onClick={() => handleDateFilterChange('3days')}
                  />
                  <FilterButton 
                    label="🌊 Esta Semana" 
                    active={activeDateFilter === 'week'} 
                    onClick={() => handleDateFilterChange('week')}
                  />
                </div>
                {(activeDateFilter !== 'all' || showDuplicates) && (
                  <div className="p-3 bg-brand/5 border-t border-brand/10">
                    <button 
                      onClick={() => {
                        handleDateFilterChange('all');
                        setShowDuplicates(false);
                      }}
                      className="w-full py-2 text-[10px] font-bold text-brand uppercase hover:underline"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div 
        className="bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500" 
        style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
                <th className="px-4 py-2 text-center w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                    checked={customers.length > 0 && selectedIds.size === customers.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <SortableHeader label="Registro" colKey="created_at" sortConfig={sortConfig} onSort={handleSort} center compact={isExtendedView} />
                {isExtendedView && <SortableHeader label="Email" colKey="email" sortConfig={sortConfig} onSort={handleSort} compact />}
                <SortableHeader label="Buceador" colKey="first_name" sortConfig={sortConfig} onSort={handleSort} compact={isExtendedView} />
                {isExtendedView && (
                  <>
                    <SortableHeader label="Gen" colKey="gender" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Passport" colKey="passport_number" sortConfig={sortConfig} onSort={handleSort} compact />
                  </>
                )}
                <SortableHeader label="Actividad" colKey="booked_activity" sortConfig={sortConfig} onSort={handleSort} compact={isExtendedView} />
                <SortableHeader label="Reserva" colKey="booking_date" sortConfig={sortConfig} onSort={handleSort} center compact={isExtendedView} />
                {isExtendedView && <SortableHeader label="Teléfono" colKey="phone" sortConfig={sortConfig} onSort={handleSort} compact />}
                <th className={`${isExtendedView ? 'px-2' : 'px-6'} py-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-center`}>WhatsApp</th>
                {isExtendedView && (
                  <>
                    <SortableHeader label="F. Nac" colKey="birth_date" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Contacto Emergencia" colKey="emergency_contact" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Dirección" colKey="address" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Conocido" colKey="lead_source" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Nivel" colKey="certification_level" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Tot" colKey="total_dives" sortConfig={sortConfig} onSort={handleSort} center compact />
                    <SortableHeader label="Last" colKey="last_dive_date" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Origen" colKey="form_origin" sortConfig={sortConfig} onSort={handleSort} compact />
                    <SortableHeader label="Seguro" colKey="insurance_expiry" sortConfig={sortConfig} onSort={handleSort} compact />
                  </>
                )}
                <th className={`py-2 text-xs font-bold text-gray-400 uppercase tracking-wider text-right ${isExtendedView ? 'px-2 pr-4' : 'px-6 pr-10'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/50">
              {loading ? (
                // Skeleton rows while loading next page
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-2">
                        <div className="h-4 bg-surface-edge/40 rounded-lg w-3/4 mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-brand/5 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <td className="px-4 py-2 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                        checked={selectedIds.has(customer.id)}
                        onChange={(e) => toggleSelectOne(customer.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className={`${isExtendedView ? 'px-2' : 'px-6'} py-2 whitespace-nowrap text-center border-r border-surface-edge/10`}>
                      <div className="flex flex-col items-center">
                        <p className="text-white text-xs font-bold uppercase tracking-tight">
                          {new Date(customer.created_at).toLocaleDateString('es-ES', { 
                            timeZone: 'Asia/Bangkok',
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit'
                          }).replace('.', '')}
                        </p>
                        <p className="text-cyan-500/80 text-[11px] font-bold">
                          {new Date(customer.created_at).toLocaleTimeString('es-ES', { 
                            timeZone: 'Asia/Bangkok',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                    {isExtendedView && (
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-cyan-500/80 font-medium font-mono">
                        {customer.email}
                      </td>
                    )}
                    <td className={`${isExtendedView ? 'px-2' : 'px-6'} py-2 whitespace-nowrap`}>
                      <div className="flex items-center gap-3">
                        {!isExtendedView && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center text-brand font-bold border border-brand/10">
                            {customer.first_name?.[0]}{customer.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-base capitalize">{customer.first_name} {customer.last_name}</p>
                          {!isExtendedView && <p className="text-cyan-500/80 text-sm truncate max-w-[250px]">{customer.email}</p>}
                        </div>
                      </div>
                    </td>
                    {isExtendedView && (
                      <>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-gray-400 capitalize">{customer.gender?.[0] || '---'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-200 font-mono font-semibold tracking-wider">{customer.passport_number || '---'}</td>
                      </>
                    )}
                    <td className={`${isExtendedView ? 'px-2' : 'px-6'} py-2`}>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Activity className={`w-3.5 h-3.5 ${getActivityColor(customer.booked_activity)}`} />
                        <span className={`truncate ${isExtendedView ? 'max-w-[100px] text-xs' : 'max-w-[150px] text-sm'}`}>{customer.booked_activity || '---'}</span>
                      </div>
                    </td>
                    <td className={`${isExtendedView ? 'px-1' : 'px-6'} py-2 whitespace-nowrap text-center`}>
                      <div className="flex flex-col items-center text-gray-400">
                        <div className={`flex items-center gap-1 font-bold text-white ${isExtendedView ? 'text-xs' : 'text-sm'}`}>
                          <Calendar className={`${isExtendedView ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-brand`} />
                          <span>
                            {customer.booking_date 
                              ? new Date(customer.booking_date).toLocaleDateString('es-ES', { 
                                  day: '2-digit', month: 'short', year: '2-digit'
                                }).replace('.', '')
                              : '---'}
                          </span>
                        </div>
                      </div>
                    </td>
                    {isExtendedView && (
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-brand font-bold">
                        {customer.phone || '---'}
                      </td>
                    )}
                    <td className={`${isExtendedView ? 'px-2' : 'px-6'} py-2 text-center`}>
                      <a 
                        href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 shadow-sm"
                        title="Abrir WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </td>
                    {isExtendedView && (
                      <>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400">{customer.birth_date || '---'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-300 max-w-[150px] truncate" title={customer.emergency_contact}>
                          {customer.emergency_contact || '---'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 max-w-[150px] truncate" title={customer.address}>
                          {customer.address || '---'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 max-w-[100px] truncate" title={customer.lead_source}>
                          {customer.lead_source || '---'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-300">{normalizeLevel(customer.certification_level).slice(0, 15)}...</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-amber-500">{customer.total_dives || '0'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 max-w-[80px] truncate" title={customer.last_dive_date}>
                          {shortenLastDive(customer.last_dive_date)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-[10px] text-gray-500 italic uppercase">{customer.form_origin || 'Web'}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-rose-400">{customer.insurance_expiry || '---'}</td>
                      </>
                    )}
                    <td className={`${isExtendedView ? 'px-2 pr-4' : 'px-6 pr-6'} py-2 text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={(e) => handleEdit(e, customer)}
                          className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"
                          title="Editar registros"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, customer.id, `${customer.first_name} ${customer.last_name}`)}
                          className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!isExtendedView && (
                          <button className="p-2 text-gray-500 hover:text-white transition-colors ml-2">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 mb-4 text-surface-edge" />
                      <p className="text-lg font-medium">No se encontraron buceadores</p>
                      <p className="text-sm">Intenta con otro término de búsqueda o cambia los filtros.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer: count + pagination */}
        <div className="px-6 py-2 bg-surface/30 border-t border-surface-edge flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} de {totalCount.toLocaleString('es-ES')} registros
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <PageBtn onClick={() => goToPage(0)} disabled={currentPage === 0} title="Primera página">
                <ChevronsLeft className="w-4 h-4" />
              </PageBtn>
              <PageBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} title="Página anterior">
                <ChevronLeft className="w-4 h-4" />
              </PageBtn>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === currentPage
                      ? 'bg-brand text-white shadow-md shadow-brand/30'
                      : 'text-gray-400 hover:bg-surface-edge hover:text-white'
                  }`}
                >
                  {page + 1}
                </button>
              ))}

              <PageBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} title="Página siguiente">
                <ChevronRight className="w-4 h-4" />
              </PageBtn>
              <PageBtn onClick={() => goToPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} title="Última página">
                <ChevronsRight className="w-4 h-4" />
              </PageBtn>
            </div>
          )}
        </div>
      </div>

      <ActionToolbar 
        selectedCount={selectedIds.size} 
        onClear={() => setSelectedIds(new Set())}
        onSend={() => onNavigate('insurance', Array.from(selectedIds))}
        onBilling={handleSendToBilling}
        isProcessing={isProcessingBilling}
      />

      {showToast && (
        <div className="fixed bottom-6 right-8 z-[150] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/50">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm tracking-wide">{toastMsg}</span>
          </div>
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

      <CustomerDetailDrawer 
        customer={selectedCustomer} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

      <CustomerFormModal 
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => fetchCustomers()}
      />
    </div>
  );
}

function SortableHeader({ label, colKey, sortConfig, onSort, center, compact }) {
  const isActive = sortConfig.key === colKey;
  return (
    <th
      className={`py-2 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-surface-edge/30 transition-colors ${center ? 'text-center' : ''} ${compact ? 'px-2' : 'px-6'}`}
      onClick={() => onSort(colKey)}
    >
      <div className={`flex items-center gap-1 ${center ? 'justify-center' : ''}`}>
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100 text-brand' : 'opacity-0'}`}>
          {isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↑'}
        </span>
      </div>
    </th>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
        active 
        ? 'bg-brand text-white shadow-md shadow-brand/20' 
        : 'text-gray-400 hover:bg-surface-edge hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function PageBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-surface-edge hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

function ActionToolbar({ selectedCount, onClear, onSend, onBilling, isProcessing }) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-surface/90 border border-brand/30 shadow-2xl shadow-brand/10 backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-brand">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold">{selectedCount} <span className="font-medium text-gray-300">seleccionados</span></span>
        </div>
        
        <div className="w-px h-6 bg-surface-edge mx-2"></div>
        
        <div className="flex gap-2">
          <button 
            onClick={onSend}
            className="bg-brand/10 text-brand border border-brand/20 text-sm font-bold px-4 py-2 rounded-full hover:bg-brand/20 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            A Seguros
          </button>

          <button 
            onClick={onBilling}
            disabled={isProcessing}
            className="bg-cyan-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            A Facturación
          </button>
        </div>
        
        <button 
          onClick={onClear}
          className="text-gray-400 hover:text-rose-400 p-2 rounded-full hover:bg-surface-edge transition-colors"
          title="Descartar selección"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
