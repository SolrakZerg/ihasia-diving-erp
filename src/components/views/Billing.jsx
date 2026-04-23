import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Users, Search, Download, Trash2, ChevronDown, ChevronLeft,
  ChevronRight, ArrowDownRight, Link, Copy, Filter,
  CheckCircle2, X, Calculator, Loader2, Target, Calendar, Briefcase, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import BillingGridRow from './BillingGridRow';

// Elegant Toast Component
const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
    <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-emerald-400">
      <CheckCircle2 className="w-5 h-5" />
      <span className="font-bold text-sm tracking-wide">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function Billing() {
  const [todayArrivals, setTodayArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('date'); 

  // Catalogs
  const [activities, setActivities] = useState([]);
  const [staff, setStaff] = useState([]);

  // Cash Flow State
  const [bills50000, setBills50000] = useState('');
  const [bills1000, setBills1000] = useState('');
  const [bills500, setBills500] = useState('');
  const [bills100, setBills100] = useState('');
  const [bills50, setBills50] = useState('');
  const [bills20, setBills20] = useState('');

  const [selectedArrivalIds, setSelectedArrivalIds] = useState(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  
  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [arrivalsDate, setArrivalsDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOnlyToday, setShowOnlyToday] = useState(false); // Default to ALL (of the month)
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  
  // Pending Bulk States
  const [bulkDate, setBulkDate] = useState('');
  const [bulkInstructor, setBulkInstructor] = useState('');
  const [bulkGroupAction, setBulkGroupAction] = useState(null); // 'group' | 'ungroup' | null

  const [isSavingCash, setIsSavingCash] = useState(false);
  const dateInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const actualCash = 
    (Number(bills50000 || 0) * 50000) + 
    (Number(bills1000 || 0) * 1000) + 
    (Number(bills500 || 0) * 500) + 
    (Number(bills100 || 0) * 100) + 
    (Number(bills50 || 0) * 50) + 
    (Number(bills20 || 0) * 20);

  // Financial Summary Calculations
  const stats = useMemo(() => {
    let facturado = 0;
    let pendiente = 0;
    let wiseBT = 0;
    let wiseCR = 0;
    let eurBT = 0;
    let eurCR = 0;
    let balanceCash = 0;

    let dailyBalanceCash = 0;

    invoices.forEach(inv => {
      inv.invoice_items?.forEach(item => {
        const total = Number(item.total_thb || 0);
        facturado += total;
        
        if (item.status === 'Pending') {
          pendiente += total;
        }

        const method = (item.payment_method || 'CASH').toUpperCase();
        if (item.status === 'Paid') {
          if (method === 'WISE BT') wiseBT += total;
          else if (method === 'WISE CR') wiseCR += total;
          else if (method === 'EUR BT') eurBT += total;
          else if (method === 'EUR CR') eurCR += total;
          else if (method === 'CASH' || method === '') {
            balanceCash += total;
            
            // Daily check specifically for cash control
            if (item.date === arrivalsDate) {
              dailyBalanceCash += total;
            }
          }
        }
      });
    });

    return { facturado, pendiente, wiseBT, wiseCR, eurBT, eurCR, balanceCash, dailyBalanceCash };
  }, [invoices, arrivalsDate]);

  // UI Filtering & Sorting logic (Memoized for peak stability)
  const displayedInvoices = useMemo(() => {
    return [...invoices]
      .filter(inv => {
        if (!showOnlyUnpaid) return true;
        return inv.invoice_items?.some(i => i.status !== 'Paid');
      })
      .map(inv => {
        const originalCount = inv.invoice_items?.length || 0;
        if (!showOnlyUnpaid) return { ...inv, _wasGroup: originalCount > 1 };
        
        return {
          ...inv,
          _wasGroup: originalCount > 1,
          invoice_items: (inv.invoice_items || []).filter(i => i.status !== 'Paid')
        };
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const getMinDateStr = (inv) => {
            const dates = (inv.invoice_items || []).map(i => i.date).filter(Boolean);
            if (dates.length === 0) return null;
            return dates.sort()[0]; 
          };
          const dateA = getMinDateStr(a);
          const dateB = getMinDateStr(b);

          if (!dateA && dateB) return 1;  
          if (dateA && !dateB) return -1; 
          if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
          
          return String(a.id).localeCompare(String(b.id));
        }
        if (sortBy === 'status') {
          const unpaidA = a.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          const unpaidB = b.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          if (unpaidB !== unpaidA) return unpaidB - unpaidA;
          return String(a.id).localeCompare(String(b.id));
        }
        // Alphabetical by Customer Name (Official or Temporary)
        const nameA = a.customers?.first_name || a.invoice_items?.[0]?.temporary_name || '';
        const nameB = b.customers?.first_name || b.invoice_items?.[0]?.temporary_name || '';
        if (nameA.localeCompare(nameB) !== 0) return nameA.localeCompare(nameB);
        return String(a.id).localeCompare(String(b.id));
      });
  }, [invoices, sortBy, showOnlyUnpaid]);

  // --- RECUENTO DE ACTIVIDADES & TANQUES ---
  const activityStats = useMemo(() => {
    const stats = {
      // Col 1: Core
      ow: 0, sd: 0, aa: 0, dsd1: 0, dsd2: 0, sr1: 0, sr2: 0,
      // Col 2: Specs/Salidas
      fd1: 0, fd25: 0, fdAlum: 0, cancel: 0, deepAdv: 0, deepEsp: 0, ean: 0,
      // Sumas
      totalTanks: 0
    };

    displayedInvoices.forEach(inv => {
      inv.invoice_items?.forEach(item => {
        const qty = item.quantity || 1;
        const name = (item.activities?.name || '').trim();
        const lowerName = name.toLowerCase();

        // Lógica de conteo por Cantidad (Sumatorio de qty)
        if (lowerName.startsWith('cancel')) {
          stats.cancel += qty;
          // Si la cancelación especifica la actividad, sumamos los tanques * cantidad
          if (lowerName.includes('bautizo (1 dive)') || lowerName.includes('refresh (1)')) {
            stats.totalTanks += (1 * qty);
          } else if (lowerName.includes('bautizo (2 dives)') || lowerName.includes('refresh (2')) {
            stats.totalTanks += (2 * qty);
          }
        }
        else if (lowerName.startsWith('open water')) stats.ow += qty;
        else if (lowerName.startsWith('scuba diver')) stats.sd += qty;
        else if (lowerName === 'advanced') stats.aa += qty;
        else if (lowerName === 'bautizo (1 dive)') {
          stats.dsd1 += qty;
          stats.totalTanks += (1 * qty);
        }
        else if (lowerName === 'bautizo (2 dives)') {
          stats.dsd2 += qty;
          stats.totalTanks += (2 * qty);
        }
        else if (lowerName === 'refresh (1)') {
          stats.sr1 += qty;
          stats.totalTanks += (1 * qty);
        }
        else if (lowerName.startsWith('refresh (2')) {
          stats.sr2 += qty;
          stats.totalTanks += (2 * qty);
        }
        else if (lowerName === 'fd 1') stats.fd1 += qty;
        else if (lowerName === 'fd 2 a 5') stats.fd25 += qty;
        else if (lowerName === 'fd alumno') stats.fdAlum += qty;
        else if (lowerName.startsWith('deep adv')) stats.deepAdv += qty;
        else if (lowerName.startsWith('deep (')) stats.deepEsp += qty;
        else if (lowerName.startsWith('nitrox')) stats.ean += qty;
      });
    });

    return stats;
  }, [displayedInvoices]);

  const expectedCash = stats.balanceCash; 
  const diffCash = actualCash - expectedCash;

  useEffect(() => {
    fetchCatalogs();
    fetchTodayArrivals();
    fetchInvoices(true); 
  }, []);

  useEffect(() => {
    fetchTodayArrivals();
    fetchCashControl();
  }, [arrivalsDate]);

  // Handle auto-save with debounce
  useEffect(() => {
    if (loadingArrivals) return; // Wait for initial load to finish to avoid overwriting with empties
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      saveCashControl();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [bills50000, bills1000, bills500, bills100, bills50, bills20]);

  const fetchCashControl = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_cash_control')
        .select('*')
        .eq('date', arrivalsDate)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBills50000(data.bills_50000 ?? '');
        setBills1000(data.bills_1000 ?? '');
        setBills500(data.bills_500 ?? '');
        setBills100(data.bills_100 ?? '');
        setBills50(data.bills_50 ?? '');
        setBills20(data.bills_20 ?? '');
      } else {
        // Reset if no data for that day
        setBills50000('');
        setBills1000('');
        setBills500('');
        setBills100('');
        setBills50('');
        setBills20('');
      }
    } catch (err) {
      console.error('Error fetching cash control:', err);
    }
  };

  const saveCashControl = async () => {
    try {
      setIsSavingCash(true);
      const { error } = await supabase
        .from('daily_cash_control')
        .upsert({
          date: arrivalsDate,
          bills_50000: bills50000 === '' ? 0 : Number(bills50000),
          bills_1000: bills1000 === '' ? 0 : Number(bills1000),
          bills_500: bills500 === '' ? 0 : Number(bills500),
          bills_100: bills100 === '' ? 0 : Number(bills100),
          bills_50: bills50 === '' ? 0 : Number(bills50),
          bills_20: bills20 === '' ? 0 : Number(bills20),
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving cash control:', err);
    } finally {
      setTimeout(() => setIsSavingCash(false), 800);
    }
  };

  const fetchCatalogs = async () => {
    const [actRes, stfRes] = await Promise.all([
      supabase.from('activities').select('id, name, price_thb, color, category'),
      supabase.from('staff').select('id, first_name, initials').eq('active', true).order('first_name')
    ]);
    
    if (actRes.data) {
      // Custom category priority
      const categoryPriority = {
        'Course': 1,
        'Fun Dive': 2,
        'Fee': 3,
        'Pro': 4,
        'Snorkeling': 5,
        'Retail': 6
      };

      const sortedActivities = [...actRes.data].sort((a, b) => {
        const catA = a.category || '';
        const catB = b.category || '';
        
        const priorityA = categoryPriority[catA] || 99;
        const priorityB = categoryPriority[catB] || 99;

        // 1. Sort by custom priority
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // 2. Sort by name alphabetical within same category
        return a.name.localeCompare(b.name);
      });
      setActivities(sortedActivities);
    }
    
    if (stfRes.data) setStaff(stfRes.data);
  };

  const fetchInvoices = async (showLoader = false, overrideToday = null, overrideUnpaid = null, overrideMonth = null, overrideYear = null) => {
    try {
      if (showLoader) setLoadingInvoices(true);
      
      const effectiveToday = overrideToday !== null ? overrideToday : showOnlyToday;
      const effectiveUnpaid = overrideUnpaid !== null ? overrideUnpaid : showOnlyUnpaid;
      const effectiveMonth = overrideMonth !== null ? overrideMonth : selectedMonth;
      const effectiveYear = overrideYear !== null ? overrideYear : selectedYear;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers!invoices_customer_id_fkey(first_name, last_name, email),
          invoice_items(
            id, quantity, total_thb, unit_price_thb, date, status, payment_method, notes, activity_id, instructor_id, bizum_deposit_eur, customer_id, temporary_name, is_comm,
            activities(name, category, color),
            staff(first_name, initials),
            customers!invoice_items_customer_id_fkey(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false }); 
        
      if (error) throw error;
      
      // Advanced Sorting:
      const sortedInvoices = (data || []).map(inv => ({
        ...inv,
        invoice_items: [...(inv.invoice_items || [])].sort((a, b) => {
          const nameA = a.customers?.first_name || a.temporary_name || '';
          const nameB = b.customers?.first_name || b.temporary_name || '';
          if (nameA !== nameB) return nameA.localeCompare(nameB);
          if (!a.date && b.date) return 1;
          if (a.date && !b.date) return -1;
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return String(a.id).localeCompare(String(b.id));
        })
      })).sort((a, b) => {
        // Global Sort: Reference Date (ASC)
        const getRefDate = (inv) => {
          const dates = inv.invoice_items?.map(it => it.date).filter(Boolean);
          if (!dates || dates.length === 0) return '9999-99-99'; // Nulls at end
          return dates.sort()[0].substring(0, 10); // Normalizar a YYYY-MM-DD
        };
        const refA = getRefDate(a);
        const refB = getRefDate(b);

        if (refA !== refB) return refA.localeCompare(refB);
        
        // TIE-BREAK 1: Instructor (By Initials)
        const getInstructor = (inv) => {
          const firstItem = (inv.invoice_items || [])[0];
          return firstItem?.staff?.initials || firstItem?.instructor_id || 'ZZZ';
        };
        const instrA = getInstructor(a);
        const instrB = getInstructor(b);
        if (instrA !== instrB) return String(instrA).localeCompare(String(instrB));

        // TIE-BREAK 2: Activity
        const getActivity = (inv) => {
          const firstItem = (inv.invoice_items || [])[0];
          return firstItem?.activities?.name || 'ZZZ';
        };
        const actA = getActivity(a);
        const actB = getActivity(b);
        if (actA !== actB) return String(actA).localeCompare(String(actB));

        // FINAL TIE-BREAK: Creation order
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      // Filter: Handle Month, "Only Today" and "Hide Empty Invoices"
      const targetDate = new Date().toLocaleDateString('en-CA');
      const filtered = sortedInvoices.filter(inv => {
        const hasItems = (inv.invoice_items || []).length > 0;
        
        // IF EMPTY: Show it always (to avoid losing "Add Row" rows)
        if (!hasItems) return true;

        // Filter by SELECTED MONTH/YEAR
        const hasItemsInMonth = inv.invoice_items?.some(it => {
          if (!it.date) return true; // If an item has no date, keep it
          const [y, m] = it.date.split('-').map(Number);
          return y === effectiveYear && (m - 1) === effectiveMonth;
        });

        if (!hasItemsInMonth) return false;

        if (effectiveToday) {
          const hasTodayItems = inv.invoice_items?.some(it => it.date === targetDate);
          if (effectiveUnpaid) {
             const hasUnpaid = inv.invoice_items?.some(it => it.status !== 'Paid');
             return (hasTodayItems && hasUnpaid);
          }
          return hasTodayItems;
        }

        if (effectiveUnpaid) {
           const hasUnpaid = inv.invoice_items?.some(it => it.status !== 'Paid');
           return hasUnpaid;
        }

        return true;
      });

      setInvoices(filtered);
      if (showLoader) setSelectedItemIds(new Set());
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const changeArrivalsDate = (days) => {
    const d = new Date(arrivalsDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setArrivalsDate(d.toLocaleDateString('en-CA'));
  };

  const fetchTodayArrivals = async () => {
    try {
      setLoadingArrivals(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, booked_activity')
        .eq('booking_date', arrivalsDate)
        .order('first_name');
        
      if (error) throw error;
      setTodayArrivals(data || []);
    } catch (error) {
      console.error('Error fetching arrivals:', error);
    } finally {
      setLoadingArrivals(false);
    }
  };

  // ARRIVALS ACTIONS
  const handleAddArrivalsToTable = async () => {
    if(selectedArrivalIds.size === 0) return;
    
    try {
      for (const arrId of selectedArrivalIds) {
        const cust = todayArrivals.find(a => a.id === arrId);
        
        // 1. Check for existing 'Open' invoice for this customer
        const { data: existingInvoices, error: checkErr } = await supabase
          .from('invoices')
          .select('id')
          .eq('customer_id', cust.id)
          .eq('status', 'Open')
          .limit(1);

        if (checkErr) throw checkErr;

        let invoiceId;
        if (existingInvoices && existingInvoices.length > 0) {
          // Use existing invoice
          invoiceId = existingInvoices[0].id;
        } else {
          // Create new individual invoice
          const { data: invData, error: invErr } = await supabase.from('invoices').insert({
            customer_id: cust.id,
            status: 'Open'
          }).select().single();

          if (invErr) throw invErr;
          invoiceId = invData.id;
        }

        // 2. Create invoice item
        const { error: itemErr } = await supabase.from('invoice_items').insert({
          invoice_id: invoiceId,
          customer_id: cust.id,
          date: null, // Keep null by default as per existing logic
          quantity: 1,
          unit_price_thb: 0,
          total_thb: 0,
          status: 'Pending'
        });

        if (itemErr) throw itemErr;
      }
    } catch (err) {
      console.error('Error adding arrivals to billing:', err);
      alert('Error: ' + err.message);
    }

    setSelectedArrivalIds(new Set());
    fetchInvoices(false); 
  };

  // GRID TABLE ACTIONS
  const handleApplyBulkChanges = async () => {
    if (selectedItemIds.size === 0) return;
    
    const itemIds = Array.from(selectedItemIds);
    setLoadingInvoices(true);

    try {
      const updates = {};
      
      // 1. Handle Grouping
      if (bulkGroupAction === 'group') {
        const { data: newInv, error: invErr } = await supabase
          .from('invoices')
          .insert({ status: 'Open' })
          .select()
          .single();
        if (invErr) throw invErr;
        updates.invoice_id = newInv.id;
      }

      // 2. Prepare other updates
      if (bulkDate) updates.date = bulkDate;
      if (bulkInstructor) updates.instructor_id = bulkInstructor;

      // 3. APPLY UPDATES (General)
      if (Object.keys(updates).length > 0) {
        // Optimistic Local Update
        setInvoices(prev => prev.map(inv => {
          const updatedItems = (inv.invoice_items || []).map(it => {
            if (selectedItemIds.has(it.id)) {
              return { ...it, ...updates };
            }
            return it;
          });
          return { ...inv, invoice_items: updatedItems };
        }));

        const { error } = await supabase
          .from('invoice_items')
          .update(updates)
          .in('id', itemIds);
        if (error) throw error;
      }

      // 4. SPECIAL CASE: UNGROUP (Separar)
      // We do this AFTER general updates so date/instructor are already set
      if (bulkGroupAction === 'ungroup') {
        // To avoid orphans, we move each item to a fresh individual invoice
        for (const itemId of itemIds) {
          const { data: newInv, error: invErr } = await supabase
            .from('invoices')
            .insert({ status: 'Open' })
            .select()
            .single();
          
          if (!invErr) {
            await supabase
              .from('invoice_items')
              .update({ invoice_id: newInv.id })
              .eq('id', itemId);
          }
        }
      }

      // --- CLEANUP EMPTY INVOICES ---
      // When we move items, we need to make sure the old invoices don't stay as ghosts
      try {
        // Get unique invoice IDs that were involved in the selection
        const oldInvoiceIds = [...new Set(invoices
          .filter(inv => inv.invoice_items?.some(it => selectedItemIds.has(it.id)))
          .map(inv => inv.id))];

        if (oldInvoiceIds.length > 0) {
          // Check which of these are now truly empty in the DB
          for (const invId of oldInvoiceIds) {
            const { data: items } = await supabase.from('invoice_items').select('id').eq('invoice_id', invId).limit(1);
            if (!items || items.length === 0) {
              await supabase.from('invoices').delete().eq('id', invId);
            }
          }
        }
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }

      setToast("Cambios aplicados correctamente");
      setSelectedItemIds(new Set());
      setBulkDate('');
      setBulkInstructor('');
      setBulkGroupAction(null);
      
      // Quiet refresh to sync with DB (e.g. to handle groupings UI regrouping)
      fetchInvoices(false);
    } catch (err) {
      console.error('Error applying bulk changes:', err);
      alert('Error al aplicar cambios: ' + err.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleGroupInvoices = async () => {
    const itemIds = Array.from(selectedItemIds);
    if (itemIds.length <= 1) return;
    
    try {
      setLoadingInvoices(true);
      const { data: newInv, error: invErr } = await supabase
        .from('invoices')
        .insert({ status: 'Open' })
        .select()
        .single();
        
      if (invErr) throw invErr;

      const { error: updErr } = await supabase
        .from('invoice_items')
        .update({ invoice_id: newInv.id })
        .in('id', itemIds);
        
      if (updErr) throw updErr;

      setToast("Items agrupados correctamente");
      setSelectedItemIds(new Set());
      fetchInvoices(false);
    } catch (err) {
      console.error('Error grouping items:', err);
      alert('Error al agrupar: ' + err.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleCopyEmails = () => {
    const selectedItems = invoices.flatMap(inv => inv.invoice_items || [])
      .filter(it => selectedItemIds.has(it.id));
      
    const emails = [...new Set(selectedItems.map(it => it.customers?.email).filter(Boolean))];
    if (emails.length > 0) {
      navigator.clipboard.writeText(emails.join(', '));
      setToast(`${emails.length} emails copiados`);
    } else {
      alert("No hay emails en los registros seleccionados");
    }
  };

  const handleDeleteItems = async () => {
    // Filtramos para asegurar que solo enviamos UUIDs válidos a Supabase
    const ids = Array.from(selectedItemIds).filter(id => 
      id && typeof id === 'string' && id.length > 20
    );

    if (ids.length === 0) {
      setSelectedItemIds(new Set());
      setToast("No hay registros válidos seleccionados");
      return;
    }

    setConfirmConfig({
      show: true,
      title: 'Eliminar Registros',
      message: `¿Estás seguro de que deseas eliminar ${ids.length} registros? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoadingInvoices(true);
          const { error } = await supabase.from('invoice_items').delete().in('id', ids);
          if (error) throw error;
          
          setToast(`${ids.length} eliminados`);
          setSelectedItemIds(new Set());
          fetchInvoices(false);
        } catch (err) {
          console.error('Error deleting items:', err);
          alert('Error al eliminar: ' + err.message);
        } finally {
          setLoadingInvoices(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const hasItems = (inv?.invoice_items || []).length > 0;

    setConfirmConfig({
      show: true,
      title: hasItems ? '¿Eliminar Factura?' : 'Fila Vacía',
      message: hasItems 
        ? 'Estás a punto de eliminar esta factura y todos sus registros. ¿Deseas continuar?' 
        : 'Esta fila no tiene registros. ¿Deseas eliminarla?',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoadingInvoices(true);
          const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
          if (error) throw error;
          setToast("Factura eliminada");
          fetchInvoices(false);
        } catch (err) {
          console.error('Error deleting invoice:', err);
        } finally {
          setLoadingInvoices(false);
          setConfirmConfig(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleExtractItem = async (itemId, customerId) => {
    // --- OPTIMISTIC UI ---
    let extractedItem = null;
    setInvoices(prev => {
      const next = prev.map(inv => {
        const itemIdx = inv.invoice_items?.findIndex(i => i.id === itemId);
        if (itemIdx !== -1) {
          extractedItem = { ...inv.invoice_items[itemIdx] };
          const newItems = [...inv.invoice_items];
          newItems.splice(itemIdx, 1);
          return { ...inv, invoice_items: newItems };
        }
        return inv;
      });
      
      if (extractedItem) {
        next.push({
          id: `temp-${Date.now()}`,
          customer_id: customerId,
          status: 'Open',
          invoice_items: [{ ...extractedItem, invoice_id: 'temp-id' }],
          customers: extractedItem.customers
        });
      }
      return next;
    });
    // ---------------------

    try {
      const { data: invData, error: invErr } = await supabase.from('invoices').insert({
        customer_id: customerId,
        status: 'Open'
      }).select().single();

      if (invErr) throw invErr;

      const { error: moveErr } = await supabase
        .from('invoice_items')
        .update({ invoice_id: invData.id })
        .eq('id', itemId);

      if (moveErr) throw moveErr;

      setToast("Registro extraído correctamente.");
      fetchInvoices(false);
    } catch (err) {
      console.error('Error extracting item:', err);
      fetchInvoices(true);
    }
  };

  const handleDissolveGroup = async (invoiceId) => {
    if (!window.confirm("¿Desagrupar todos los registros de esta factura? Se crearán facturas individuales para cada uno.")) return;
    
    // --- OPTIMISTIC UI ---
    const targetInv = invoices.find(inv => inv.id === invoiceId);
    if (!targetInv) return;
    const itemsToMove = [...(targetInv.invoice_items || [])];

    setInvoices(prev => {
      const filtered = prev.filter(inv => inv.id !== invoiceId);
      const newStubs = itemsToMove.map((item, idx) => ({
        id: `temp-dissolve-${idx}-${Date.now()}`,
        customer_id: item.customer_id,
        status: 'Open',
        invoice_items: [{ ...item, invoice_id: 'temp' }],
        customers: item.customers
      }));
      return [...filtered, ...newStubs];
    });
    // ---------------------

    try {
      // 1. Batch create all invoices at once
      const { data: newInvoices, error: invErr } = await supabase.from('invoices').insert(
        itemsToMove.map(item => ({ customer_id: item.customer_id, status: 'Open' }))
      ).select();

      if (invErr) throw invErr;

      // 2. Parallel move all items to their respective new invoices
      const movePromises = itemsToMove.map((item, idx) => 
        supabase.from('invoice_items').update({ invoice_id: newInvoices[idx].id }).eq('id', item.id)
      );
      await Promise.all(movePromises);

      // 3. Delete the empty original invoice
      await supabase.from('invoices').delete().eq('id', invoiceId);

      setToast("Grupo disuelto correctamente.");
      fetchInvoices(false);
    } catch (err) {
      console.error('Error dissolving group:', err);
      fetchInvoices(true);
    }
  };

  // Helper component for activity stats (Accessible & High Contrast)
  const StatItem = ({ label, value, color = "text-white", noBorder = false, first = false }) => (
    <div className={`flex items-center justify-between gap-3 ${first ? 'pb-1 pt-0' : 'py-1'} w-full ${noBorder ? '' : 'border-b border-white/[0.04]'}`}>
      <span className={`text-[10px] font-bold tracking-wide uppercase truncate ${value === 0 ? 'text-gray-400/60' : 'text-gray-300'}`}>
        {label}
      </span>
      <span className={`text-[12px] font-black tabular-nums transition-colors ${value === 0 ? 'text-gray-500' : color}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-surface">
      {/* STICKY HEADER SUPERIOR */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-edge py-1.5 px-4 shadow-xl flex gap-4 items-stretch h-[290px] overflow-x-auto custom-scrollbar">
        
        {/* Widget 1: LLEGADAS DEL DÍA */}
        <div className="flex-none w-full max-w-[380px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
          <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
            <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold whitespace-nowrap"><Users className="w-3.5 h-3.5" /> Llegadas</span>
            
            <div className="flex-none ml-auto flex items-center bg-brand/10 rounded-lg border border-brand/30 overflow-hidden h-[19px]">
              <button 
                onClick={(e) => { e.stopPropagation(); changeArrivalsDate(-1); }}
                className="flex-none px-2 h-full hover:bg-brand/20 text-brand transition-colors border-r border-brand/20 flex items-center justify-center font-bold"
                aria-label="Ver día anterior"
                title="Día Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div 
                className="relative cursor-pointer group/date flex items-center justify-center px-3 h-full hover:bg-brand/5 border-x border-brand/20"
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <input 
                  ref={dateInputRef}
                  type="date" 
                  value={arrivalsDate}
                  onChange={(e) => setArrivalsDate(e.target.value)}
                  className="absolute w-0 h-0 opacity-0 border-0 p-0 m-0 pointer-events-none"
                  style={{ visibility: 'hidden' }}
                />
                <span className="text-[11px] text-brand font-bold whitespace-nowrap">
                  {new Date(arrivalsDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); changeArrivalsDate(1); }}
                className="flex-none px-2 h-full hover:bg-brand/20 text-brand transition-colors border-l border-brand/20 flex items-center justify-center font-bold"
                aria-label="Ver día siguiente"
                title="Día Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
             {loadingArrivals ? (
               <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div>
            ) : todayArrivals.length === 0 ? (
               <div className="text-sm text-center text-gray-400 py-2">No hay llegadas programadas.</div>
            ) : (
               <table className="w-full text-sm leading-tight text-left">
                 <tbody>
                   {todayArrivals.map((c, i) => (
                     <tr key={c.id} className="hover:bg-surface rounded group transition-colors cursor-pointer" onClick={() => {
                        const newSet = new Set(selectedArrivalIds);
                        if (newSet.has(c.id)) newSet.delete(c.id);
                        else newSet.add(c.id);
                        setSelectedArrivalIds(newSet);
                     }}>
                        <td className="py-0.5 px-1.5 w-6 text-center text-gray-500 text-[10px] font-mono">{i + 1}</td>
                        <td className="py-0.5 px-1.5 w-6 text-center">
                          <input type="checkbox" checked={selectedArrivalIds.has(c.id)} readOnly className="w-3.5 h-3.5 rounded text-brand bg-surface border-surface-edge cursor-pointer pointer-events-none" />
                        </td>
                        <td className="py-0.5 px-1.5 text-white font-medium truncate max-w-[180px]">{c.first_name} {c.last_name}</td>
                        <td className="py-0.5 px-1.5 text-brand text-[10px] truncate max-w-[110px] font-bold uppercase opacity-80 pl-2">
                          {c.booked_activity || 'Genérico'}
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
            )}
          </div>
          <div className="p-1 px-1.5 border-t border-surface-edge bg-surface/50 mt-auto">
            <button 
              onClick={handleAddArrivalsToTable}
              disabled={selectedArrivalIds.size === 0}
              className="w-full py-0.5 bg-brand/10 text-brand hover:bg-brand hover:text-white disabled:opacity-50 border border-brand/30 rounded text-[13px] font-semibold transition-colors shadow-sm"
            >
              AÑADIR A LA MESA {selectedArrivalIds.size > 0 && `(${selectedArrivalIds.size})`}
            </button>
          </div>
        </div>

        {/* Widget 2: RECUENTO DE ACTIVIDADES (UNIFIED STYLE) */}
        <div className="flex-none w-[250px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-2xl overflow-hidden hidden lg:flex shrink-0">
          <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
            <span className="flex items-center gap-1.5 text-brand text-xs font-bold"><Target className="w-3.5 h-3.5" /> Actividades</span>
          </div>
          
          <div className="flex-1 grid grid-cols-2 divide-x divide-white/10 p-3">
            {/* Columna 1: Cursos & Intro */}
            <div className="pr-3 flex flex-col justify-between">
              <div className="flex flex-col gap-0">
                <StatItem label="OW" value={activityStats.ow} first />
                <StatItem label="SD" value={activityStats.sd} />
                <StatItem label="AA" value={activityStats.aa} />
                <StatItem label="DSD1" value={activityStats.dsd1} />
                <StatItem label="DSD2" value={activityStats.dsd2} />
                <StatItem label="SR1" value={activityStats.sr1} />
                <StatItem label="SR2" value={activityStats.sr2} noBorder />
              </div>
              
              {/* Sección de Tanques */}
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">TANQUES</span>
                <span className="text-sm font-black text-brand-light leading-none">{activityStats.totalTanks}</span>
              </div>
            </div>

            {/* Columna 2: Salidas & Especialidades */}
            <div className="pl-3 flex flex-col gap-0">
              <StatItem label="FD 1" value={activityStats.fd1} first />
              <StatItem label="FD 2-5" value={activityStats.fd25} />
              <StatItem label="FD AL" value={activityStats.fdAlum} />
              <StatItem label="DEEP A" value={activityStats.deepAdv} />
              <StatItem label="DEEP E" value={activityStats.deepEsp} />
              <StatItem label="EAN" value={activityStats.ean} />
              <StatItem label="CANCEL" value={activityStats.cancel} color="text-red-500" noBorder />
            </div>
          </div>
        </div>

        {/* Widget 3: ARQUEO DE CAJA */}
        <div className="flex-none w-fit flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden min-w-[140px] shrink-0">
          <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
             <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold"><Calculator className="w-3.5 h-3.5" /> Caja</span>
             {isSavingCash ? (
               <Loader2 className="w-3 h-3 animate-spin text-emerald-500/50" />
             ) : (
               <CheckCircle2 className="w-3 h-3 text-emerald-500/30" />
             )}
          </div>
          <div className="flex-1 flex flex-col p-2 px-2.5">
             <div className="space-y-[3px]">
               {[ 
                 {label: '50.000', value: 50000, state: bills50000, setState: setBills50000}, 
                 {label: '1.000', value: 1000, state: bills1000, setState: setBills1000}, 
                 {label: '500', value: 500, state: bills500, setState: setBills500}, 
                 {label: '100', value: 100, state: bills100, setState: setBills100}, 
                 {label: '50', value: 50, state: bills50, setState: setBills50}, 
                 {label: '20', value: 20, state: bills20, setState: setBills20} 
               ].map((b) => (
                 <div key={b.label} className="flex items-center gap-4 group">
                   <div className="w-16 text-emerald-400/90 font-mono text-[12px] group-hover:text-emerald-400 transition-colors">
                     {b.label} <span className="text-gray-600 text-[9px]">฿</span>
                   </div>
                   <input 
                     type="number" 
                     min="0" 
                     max="999"
                     value={b.state} 
                     onChange={e => b.setState(e.target.value)} 
                     className="w-12 h-[20px] bg-surface text-white border border-surface-edge hover:border-emerald-500/50 rounded text-center outline-none focus:border-emerald-500 py-0 text-xs font-bold transition-all shadow-inner" 
                   />
                 </div>
               ))}
             </div>
             {/* TOTALES CAJA */}
             <div className="mt-2 pt-2 border-t border-surface-edge/50 space-y-1">
               <div className="flex flex-col gap-0.5">
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400 text-[10px] uppercase font-black">Total:</span>
                   <span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">{actualCash.toLocaleString()} ฿</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-400 text-[10px] uppercase font-black tracking-tighter">Debería:</span>
                   <span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">{expectedCash.toLocaleString()} ฿</span>
                 </div>
                 <div className={`flex flex-col items-center pt-2 mt-1 border-t border-surface-edge/30`}>
                   <span className={`text-[20px] font-black leading-none drop-shadow-sm ${diffCash === 0 ? 'text-emerald-400' : diffCash > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                     {diffCash > 0 ? '+' : ''}{diffCash.toLocaleString()} ฿
                   </span>
                   <span className="text-[9px] uppercase text-gray-400 font-black mt-0.5">{diffCash === 0 ? 'DIFERENCIA OK' : diffCash > 0 ? 'SOBRA DINERO' : 'FALTA DINERO'}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Widget 4: RESUMEN FINANCIERO */}
        <div className="flex-none w-full max-w-[280px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
          <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
            <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold"><Target className="w-3.5 h-3.5" /> Finanzas</span>
            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Global</span>
          </div>
          <div className="flex-1 flex flex-col p-2 px-3 justify-between bg-surface-soft/30">
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-surface-edge/30">
                <span className="text-gray-400 text-[12px] uppercase font-bold tracking-tight">Facturado:</span>
                <span className="text-white font-black text-[18px] drop-shadow-md">{stats.facturado.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between items-center bg-amber-500/10 px-2 py-1.5 rounded border border-amber-500/20 shadow-sm">
                <span className="text-amber-500 text-[12px] uppercase font-black">Pendiente:</span>
                <span className="text-amber-400 font-bold text-[14px]">{stats.pendiente.toLocaleString()} ฿</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 py-2">
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 uppercase font-black leading-tight">Wise BT</span>
                  <span className="text-blue-400 text-[12px] font-mono font-bold">{stats.wiseBT.toLocaleString()} ฿</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-gray-500 uppercase font-black leading-tight">Wise CR</span>
                  <span className="text-blue-400 text-[12px] font-mono font-bold">{stats.wiseCR.toLocaleString()} ฿</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 uppercase font-black leading-tight">EUR BT</span>
                  <span className="text-indigo-400 text-[12px] font-mono font-bold">{stats.eurBT.toLocaleString()} ฿</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-gray-500 uppercase font-black leading-tight">EUR CR</span>
                  <span className="text-indigo-400 text-[12px] font-mono font-bold">{stats.eurCR.toLocaleString()} ฿</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/25 shadow-inner">
              <span className="text-emerald-500 text-[12px] uppercase font-black">Balance Cash:</span>
              <span className="text-emerald-400 font-black text-[16px] font-mono">{stats.balanceCash.toLocaleString()} ฿</span>
            </div>
          </div>
        </div>

        {/* MONTH SELECTOR (IZQUIERDA) */}
        <div className="flex items-center gap-2 bg-surface border border-surface-edge p-1 rounded-2xl shadow-sm h-11 shrink-0">
          <select 
            value={selectedMonth}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedMonth(val);
              fetchInvoices(false, showOnlyToday, showOnlyUnpaid, val, selectedYear);
            }}
            className="bg-transparent text-gray-300 text-[11px] font-black px-3 focus:outline-none cursor-pointer hover:text-white transition-colors"
          >
            {['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'].map((m, i) => (
              <option key={i} value={i} className="bg-slate-900 text-white">{m}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-white/10" />
          <select 
            value={selectedYear}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedYear(val);
              fetchInvoices(false, showOnlyToday, showOnlyUnpaid, selectedMonth, val);
            }}
            className="bg-transparent text-gray-300 text-[11px] font-black px-3 focus:outline-none cursor-pointer hover:text-white transition-colors"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
            ))}
          </select>
        </div>

        {/* ACCIONES GLOBALES (EXTREMA DERECHA - RESPONSIVO DINÁMICO) */}
        <div className="flex flex-wrap items-end justify-end content-end gap-3 ml-auto pb-2 shrink min-w-[140px]">
            <button 
              onClick={() => {
                const newVal = !showOnlyToday;
                setShowOnlyToday(newVal);
                fetchInvoices(false, newVal, showOnlyUnpaid);
              }}
              className={`flex-none shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border shadow-sm h-11 ${
                showOnlyToday 
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
              } whitespace-nowrap`}
            >
              <Calendar className={`w-3.5 h-3.5 ${showOnlyToday ? 'text-blue-400' : ''}`} />
              {showOnlyToday ? 'MOSTRANDO: HOY' : 'MOSTRANDO: TODO'}
            </button>

           <button 
              onClick={() => {
                const newVal = !showOnlyUnpaid;
                setShowOnlyUnpaid(newVal);
                fetchInvoices(false, showOnlyToday, newVal);
              }}
              className={`flex-none shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border shadow-sm h-11 ${
                showOnlyUnpaid 
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' 
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
              } whitespace-nowrap`}
            >
              <Search className={`w-3.5 h-3.5 ${showOnlyUnpaid ? 'text-amber-500' : ''}`} />
              {showOnlyUnpaid ? 'FILTRO: PENDIENTES' : 'FILTRO: TODOS'}
            </button>

           <button 
            onClick={async () => {
              // Atomically create invoice + initial item to avoid "id=undefined" errors
              const { data: inv, error: invErr } = await supabase.from('invoices').insert({ status: 'Open' }).select().single();
              if (inv && !invErr) {
                await supabase.from('invoice_items').insert({
                  invoice_id: inv.id,
                  quantity: 1,
                  unit_price_thb: 0,
                  total_thb: 0,
                  status: 'Pending',
                  date: null // Force null so it doesn't default to today
                });
                fetchInvoices(false);
              }
            }}
            className="flex-none shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl transition-all shadow-lg active:scale-95 group h-11 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> AÑADIR FILA
          </button>
        </div>
      </div>
      
      {/* SPREADSHEET PRINCIPAL */}
      <div className="flex-1 p-2 lg:p-4 min-h-0">
         <div className="bg-surface border border-surface-edge rounded-lg flex flex-col overflow-hidden max-w-[1900px] mx-auto shadow-2xl">
            {/* GRID TABLE */}
            <div className="flex-1 overflow-auto bg-surface custom-scrollbar relative min-h-[600px]" style={{ maxHeight: 'calc(100vh - 380px)' }}>
               {loadingInvoices ? (
                  <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
                 ) : invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>No hay facturas para este periodo</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-30 bg-slate-900 shadow-sm">
                       <tr className="border-b border-white/5">
                          <th className="p-3 text-left w-10"><input type="checkbox" className="rounded bg-slate-800 border-slate-700" /></th>
                          <th className="p-3 text-left w-10"></th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider"><div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> FECHA</div></th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">NOMBRE</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">APELLIDOS</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">EMAIL</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">ACTIVIDAD</th>
                          <th className="p-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">PRECIO</th>
                          <th className="p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Q.</th>
                          <th className="p-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">TOTAL</th>
                          <th className="p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">ESTADO</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">MEDIO</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">INSTR.</th>
                          <th className="p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">BIZUM</th>
                          <th className="p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">COM.</th>
                          <th className="p-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {invoices.map((inv) => (
                        <BillingGridRow 
                          key={inv.id}
                          invoice={inv}
                          staff={staff}
                          activities={activities}
                          onUpdate={() => fetchInvoices(false)} 
                          onDeleteInvoice={handleDeleteInvoice}
                          onExtractItem={handleExtractItem}
                          handleDissolveGroup={handleDissolveGroup}
                        />
                      ))}
                    </tbody>
                  </table>
               )}
            </div>
         </div>
         {/* NOTIFICACIÓN TOAST */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm">{toast}</span>
              <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/10 rounded-lg p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRMATION MODAL */}
        {confirmConfig.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
            />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  confirmConfig.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                  {confirmConfig.title}
                </h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  {confirmConfig.message}
                </p>
              </div>
              <div className="flex gap-3 p-6 bg-white/5 border-t border-white/5">
                <button 
                  onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmConfig.onConfirm}
                  className={`flex-1 px-6 py-3 font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                    confirmConfig.type === 'danger' 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* BARRA DE ACCIONES FLOTANTE (SELECCIÓN MÚLTIPLE) */}
      {selectedItemIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
           <div className="bg-[#0B1121]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 flex items-center gap-1">
              <div className="px-4 py-2 flex items-center gap-3 border-r border-white/5 mr-1">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner shadow-blue-400/50">
                  {selectedItemIds.size}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter leading-none mb-0.5">Items</span>
                  <span className="text-white text-[13px] font-black leading-none">Seleccionados</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-1 ml-2">
                {/* 1. Group / Ungroup Toggle */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 border border-white/5">
                  <button 
                    onClick={() => setBulkGroupAction(bulkGroupAction === 'group' ? null : 'group')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-tight ${
                      bulkGroupAction === 'group' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                        : 'hover:bg-white/5 text-blue-400/60 hover:text-blue-400'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    Agrupar
                  </button>
                  
                  <button 
                    onClick={() => setBulkGroupAction(bulkGroupAction === 'ungroup' ? null : 'ungroup')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-tight ${
                      bulkGroupAction === 'ungroup' 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' 
                        : 'hover:bg-white/5 text-orange-400/60 hover:text-orange-400'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Separar
                  </button>
                </div>
                
                {/* 2. Bulk Date */}
                <div className="relative h-10">
                   <button 
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-xs group border h-full ${
                      bulkDate 
                        ? 'bg-brand/20 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(var(--brand-rgb),0.4)]' 
                        : 'hover:bg-white/5 border-transparent text-gray-400'
                    }`}
                    onClick={() => document.getElementById('bulk-date-input').showPicker()}
                  >
                    <Calendar className="w-4 h-4" />
                    {bulkDate ? bulkDate : 'FECHA?'}
                  </button>
                  <input 
                    id="bulk-date-input"
                    type="date" 
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    onChange={(e) => setBulkDate(e.target.value)}
                  />
                </div>

                {/* 3. Bulk Instructor */}
                <div className={`flex items-center gap-2 rounded-xl px-3 border transition-all h-10 ${
                   bulkInstructor 
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]' 
                    : 'bg-white/5 border-transparent'
                }`}>
                   <Briefcase className={`w-4 h-4 ${bulkInstructor ? 'text-amber-400' : 'text-gray-500'}`} />
                   <select 
                    className="bg-transparent text-white text-xs font-black outline-none cursor-pointer pr-2 py-1.5"
                    value={bulkInstructor}
                    onChange={(e) => setBulkInstructor(e.target.value)}
                   >
                     <option value="" className="bg-slate-900 uppercase">¿INSTRUCTOR?</option>
                     {staff.map(s => (
                       <option key={s.id} value={s.id} className="bg-slate-900">{s.first_name}</option>
                     ))}
                   </select>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* 4. APPLY BUTTON */}
                <button 
                  onClick={handleApplyBulkChanges}
                  disabled={loadingInvoices || (!bulkGroupAction && !bulkDate && !bulkInstructor)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-xl transition-all font-black text-xs shadow-lg shadow-emerald-900/20 active:scale-95 h-10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRMAR ACCIÓN
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* 5. EMAIL & TOOLS */}
                <div className="flex items-center gap-0.5">
                   <button 
                    onClick={handleCopyEmails}
                    className="p-2.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                    title="Copiar emails de seleccionados"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={handleDeleteItems}
                    className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                    title="Eliminar registros seleccionados"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedItemIds(new Set());
                      setBulkDate('');
                      setBulkInstructor('');
                      setBulkGroupAction(null);
                    }}
                    className="p-2.5 hover:bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all"
                    title="Cancelar Selección"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
