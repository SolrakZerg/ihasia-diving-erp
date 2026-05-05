import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useBilling() {
  const [todayArrivals, setTodayArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [allMonthInvoices, setAllMonthInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [bills50000, setBills50000] = useState('');
  const [bills1000, setBills1000] = useState('');
  const [bills500, setBills500] = useState('');
  const [bills100, setBills100] = useState('');
  const [bills50, setBills50] = useState('');
  const [bills20, setBills20] = useState('');
  const [selectedArrivalIds, setSelectedArrivalIds] = useState(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const lastClickedIndex = useRef(null);
  const lastClickTime = useRef(0);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [arrivalsDate, setArrivalsDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkInstructor, setBulkInstructor] = useState('');
  const [bulkGroupAction, setBulkGroupAction] = useState(null);
  const [isSavingCash, setIsSavingCash] = useState(false);
  const [loadingCash, setLoadingCash] = useState(true);
  const [dbExpectedCash, setDbExpectedCash] = useState(0);
  const dateInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const actualCash =
    (Number(bills50000 || 0) * 50000) +
    (Number(bills1000 || 0) * 1000) +
    (Number(bills500 || 0) * 500) +
    (Number(bills100 || 0) * 100) +
    (Number(bills50 || 0) * 50) +
    (Number(bills20 || 0) * 20);

  const stats = useMemo(() => {
    let facturado = 0, pendiente = 0, wiseBT = 0, wiseCR = 0, eurBT = 0, eurCR = 0, balanceCash = 0, dailyBalanceCash = 0;
    allMonthInvoices.forEach(inv => {
      inv.invoice_items?.forEach(item => {
        const total = Number(item.total_thb || 0);
        facturado += total;
        if (item.status === 'Pending') pendiente += total;
        const method = (item.payment_method || 'CASH').toUpperCase();
        if (item.status === 'Paid') {
          if (method === 'WISE BT') wiseBT += total;
          else if (method === 'WISE CR') wiseCR += total;
          else if (method === 'EUR BT') eurBT += total;
          else if (method === 'EUR CR') eurCR += total;
          else if (method === 'CASH' || method === '') {
            balanceCash += total;
            if (item.date === arrivalsDate) dailyBalanceCash += total;
          }
        }
      });
    });
    const cobrado = facturado - pendiente;
    const { activityBreakdown } = allMonthInvoices.reduce((acc, inv) => {
      inv.invoice_items?.forEach(item => {
        const qty = Number(item.quantity ?? 1);
        
        // 1. Obtener acrónimo de forma segura
        let acr = (item.activities?.acronym || '').trim();
        if (!acr && item.activity_id) {
          const act = activities.find(a => a.id === item.activity_id);
          acr = act?.acronym || '';
        }

        if (acr) {
          // Normalizamos para comparar (insensible a mayúsculas)
          const targetKey = Object.keys(acc.activityBreakdown).find(k => k.toLowerCase() === acr.toLowerCase());
          if (targetKey) {
            acc.activityBreakdown[targetKey] += qty;
          } else {
            // Si el acrónimo no estaba en la inicialización (caso raro), lo creamos al vuelo
            acc.activityBreakdown[acr] = qty;
          }
        }

        // 2. Lógica de Tanques (Más flexible para acrónimos personalizados)
        const a = (acr || '').toLowerCase();
        
        // CANCELACIONES
        if (a === 'can' || a === 'can2' || a.startsWith('can')) {
          const n = (item.activities?.name || '').toLowerCase();
          if (n.includes('bautizo (1 dive)') || n.includes('refresh (1)')) acc.activityBreakdown.total_tanks += qty;
          else if (n.includes('bautizo (2 dives)') || n.includes('refresh (2')) acc.activityBreakdown.total_tanks += 2 * qty;
        } 
        // 1 TANQUE: DSD1, SR1, FD1
        else if (a.startsWith('dsd1') || a.startsWith('sr1') || a.startsWith('fd1')) {
          acc.activityBreakdown.total_tanks += qty;
        } 
        // 2 TANQUES: DSD2, SR2, FD2
        else if (a.startsWith('dsd2') || a.startsWith('sr2') || a.startsWith('fd2')) {
          acc.activityBreakdown.total_tanks += 2 * qty;
        }
      });
      return acc;
    }, { 
      // Inicializamos con todos los acrónimos actuales del catálogo para que aparezcan aunque estén a 0
      activityBreakdown: (activities || []).reduce((acc, act) => {
        if (act.acronym) acc[act.acronym] = 0;
        return acc;
      }, { total_tanks: 0 })
    });

    return { facturado, pendiente, cobrado, wiseBT, wiseCR, eurBT, eurCR, balanceCash, dailyBalanceCash, activityBreakdown };
  }, [allMonthInvoices, arrivalsDate, activities]);

  // ESTADO PARA LOS TOTALES OFICIALES DE LA BD
  const [monthlyDbData, setMonthlyDbData] = useState({ total_courses: 0, total_tanks: 0, total_spec: 0 });

  // Función para leer los totales de la Vista relacional
  const fetchDbTotals = async (m = selectedMonth, y = selectedYear) => {
    const { data, error } = await supabase
      .from('monthly_activity_summary')
      .select('*')
      .eq('month', m + 1) // +1 para coincidir con el formato 1-indexed de la BD
      .eq('year', y)
      .maybeSingle(); 
    
    if (data) setMonthlyDbData(data);
    else {
      setMonthlyDbData({ total_courses: 0, total_tanks: 0, total_spec: 0 });
    }
  };

  // FUNCIÓN PARA SINCRONIZAR CON EL NUEVO SISTEMA RELACIONAL (monthly_activity_logs)
  const syncMonthlyStats = async (breakdown) => {
    if (!breakdown || !activities || activities.length === 0) return;
    
    const syncData = activities
      .map(act => {
        const count = breakdown[act.acronym] || 0;
        if (count <= 0) return null;
        return {
          activity_id: act.id,
          count: count
        };
      })
      .filter(Boolean);

    // Llamamos a la función RPC atómica (Borrado + Inserción en una sola transacción)
    const { error } = await supabase.rpc('sync_monthly_activity_logs', {
      p_year: selectedYear,
      p_month: selectedMonth + 1,
      p_data: syncData
    });

    if (error) {
      console.error("[useBilling] Error syncing monthly_activity_logs:", error);
    } else {
      // SI EL GUARDADO FUE BIEN, REFRESCAMOS LOS TOTALES DE LA BD
      fetchDbTotals();
    }
  };

  // Sincronizar automáticamente cuando cambien los datos
  useEffect(() => {
    if (stats.activityBreakdown) {
      syncMonthlyStats(stats.activityBreakdown);
    }
  }, [stats.activityBreakdown]);

  // Al cambiar de mes/año, cargamos los totales de la BD
  useEffect(() => {
    fetchDbTotals();
  }, [selectedMonth, selectedYear]);

  const displayedInvoices = useMemo(() => {
    return [...invoices]
      .filter(inv => !showOnlyUnpaid || inv.invoice_items?.some(i => i.status !== 'Paid'))
      .map(inv => {
        const originalCount = inv.invoice_items?.length || 0;
        if (!showOnlyUnpaid) return { ...inv, _wasGroup: originalCount > 1 };
        return { ...inv, _wasGroup: originalCount > 1, invoice_items: (inv.invoice_items || []).filter(i => i.status !== 'Paid') };
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const getMin = (inv) => { const d = (inv.invoice_items || []).map(i => i.date).filter(Boolean); return d.length ? d.sort()[0] : null; };
          const dA = getMin(a), dB = getMin(b);
          if (!dA && dB) return 1;
          if (dA && !dB) return -1;
          if (dA && dB && dA !== dB) return dA.localeCompare(dB);
          return String(a.id).localeCompare(String(b.id));
        }
        if (sortBy === 'status') {
          const uA = a.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          const uB = b.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          if (uB !== uA) return uB - uA;
          return String(a.id).localeCompare(String(b.id));
        }
        const nA = a.customers?.first_name || a.invoice_items?.[0]?.temporary_name || '';
        const nB = b.customers?.first_name || b.invoice_items?.[0]?.temporary_name || '';
        if (nA.localeCompare(nB) !== 0) return nA.localeCompare(nB);
        return String(a.id).localeCompare(String(b.id));
      });
  }, [invoices, sortBy, showOnlyUnpaid]);

  const activityStats = useMemo(() => {
    return stats.activityBreakdown;
  }, [stats.activityBreakdown]);

  const expectedCash = dbExpectedCash || stats.balanceCash;
  const diffCash = actualCash - expectedCash;

  const handleToggleSelection = (invoice, index, shiftKey) => {
    const itemIds = invoice.invoice_items?.map(it => it.id) || [];
    if (itemIds.length === 0) return;
    const prevIdx = lastClickedIndex.current;
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      const isCurrentlySelected = itemIds.every(id => prev.has(id));
      const shouldSelect = !isCurrentlySelected;
      if (shiftKey && prevIdx !== null) {
        const start = Math.min(prevIdx, index);
        const end = Math.max(prevIdx, index);
        for (let i = start; i <= end; i++) {
          const inv = invoices[i];
          if (!inv) continue;
          (inv.invoice_items?.map(it => it.id) || []).forEach(id => { if (shouldSelect) newSet.add(id); else newSet.delete(id); });
        }
      } else {
        itemIds.forEach(id => { if (isCurrentlySelected) newSet.delete(id); else newSet.add(id); });
      }
      return newSet;
    });
    lastClickedIndex.current = index;
    if (shiftKey) window.getSelection()?.removeAllRanges();
  };

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { fetchCatalogs(); fetchTodayArrivals(); fetchInvoices(true); }, []);
  useEffect(() => { fetchTodayArrivals(); }, [arrivalsDate]);
  useEffect(() => { fetchCashControl(); }, [selectedMonth, selectedYear]);
  
  useEffect(() => {
    if (loadingCash) return; // NO GUARDAR hasta que hayamos terminado de CARGAR
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveCashControl(), 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [bills50000, bills1000, bills500, bills100, bills50, bills20]);

  useEffect(() => {
    if (loadingInvoices || allMonthInvoices.length === 0) return;
    
    const syncReports = async () => {
      console.log("[useBilling] Intentando sincronizar informe...", { 
        year: selectedYear, month: selectedMonth + 1, stats 
      });
      try {
        // 1. Informe Mensual
        const { error: repError } = await supabase.from('monthly_reports').upsert({
          year: selectedYear,
          month: selectedMonth + 1,
          facturado: stats.facturado,
          pendiente: stats.pendiente,
          cobrado: stats.cobrado,
          cr_eur: stats.eurCR,
          cr_wise: stats.wiseCR,
          bt_eur: stats.eurBT,
          bt_wise: stats.wiseBT,
          cr_cash: stats.crCash,
          bt_cash: stats.btCash,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' });

        if (repError) throw repError;

        console.log("[useBilling] ✅ Informe sincronizado.");
        
        // Refrescamos el DEBERIA para que el widget de caja se actualice al momento
        fetchCashControl();
      } catch (err) {
        console.error("[useBilling] ❌ Error sincronizando informe:", err);
      }
    };

    const t = setTimeout(syncReports, 1000); // Bajamos a 1 segundo para que sea más rápido
    return () => clearTimeout(t);
  }, [stats, selectedMonth, selectedYear, loadingInvoices]); // Ahora depende de TODO el objeto stats

  const fetchCashControl = async () => {
    try {
      setLoadingCash(true);
      const { data, error } = await supabase
        .from('cash_control_monthly')
        .select('*')
        .eq('year', selectedYear)
        .eq('month', selectedMonth + 1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setBills50000(data.b_50000 ?? ''); setBills1000(data.b_1000 ?? ''); setBills500(data.b_500 ?? '');
        setBills100(data.b_100 ?? ''); setBills50(data.b_50 ?? ''); setBills20(data.b_20 ?? '');
      } else {
        // RESET si no hay datos para el mes seleccionado
        setBills50000(''); setBills1000(''); setBills500('');
        setBills100(''); setBills50(''); setBills20('');
      }
      
      // TAMBIÉN CARGAR EL DEBERÍA DE monthly_reports
      const { data: reportData } = await supabase
        .from('monthly_reports')
        .select('deberia')
        .eq('year', selectedYear)
        .eq('month', selectedMonth + 1)
        .maybeSingle();
      
      if (reportData) {
        setDbExpectedCash(reportData.deberia || 0);
      } else {
        setDbExpectedCash(0);
      }
    } catch (err) { console.error('Error fetching cash control:', err); }
    finally { setLoadingCash(false); }
  };

  const saveCashControl = async () => {
    try {
      setIsSavingCash(true);
      const b50000 = bills50000 === '' ? 0 : Number(bills50000);
      const b1000 = bills1000 === '' ? 0 : Number(bills1000);
      const b500 = bills500 === '' ? 0 : Number(bills500);
      const b100 = bills100 === '' ? 0 : Number(bills100);
      const b50 = bills50 === '' ? 0 : Number(bills50);
      const b20 = bills20 === '' ? 0 : Number(bills20);
      const total = (b50000 * 50000) + (b1000 * 1000) + (b500 * 500) + (b100 * 100) + (b50 * 50) + (b20 * 20);

      const [res1, res2] = await Promise.all([
        supabase.from('cash_control_monthly').upsert({
          year: selectedYear,
          month: selectedMonth + 1,
          b_50000: b50000,
          b_1000: b1000,
          b_500: b500,
          b_100: b100,
          b_50: b50,
          b_20: b20
        }, { onConflict: 'year, month' }),
        supabase.from('monthly_reports').upsert({
          year: selectedYear,
          month: selectedMonth + 1,
          cash: total,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' })
      ]);

      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;
    } catch (err) { console.error('Error saving cash control:', err); }
    finally { setTimeout(() => setIsSavingCash(false), 800); }
  };

  const fetchCatalogs = async () => {
    const [actRes, stfRes, catRes] = await Promise.all([
      supabase.from('activities').select('id, name, price_thb, color, category, acronym, widget_column, widget_order'),
      supabase.from('staff').select('id, first_name, initials, active').order('first_name'),
      supabase.from('activity_categories').select('*')
    ]);
    if (actRes.data) {
      const p = { 'Course': 1, 'Fun Dive': 2, 'Fee': 3, 'Pro': 4, 'Snorkeling': 5, 'Retail': 6 };
      setActivities([...actRes.data].sort((a, b) => { const pa = p[a.category] || 99, pb = p[b.category] || 99; return pa !== pb ? pa - pb : a.name.localeCompare(b.name); }));
    }
    if (stfRes.data) setStaff(stfRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  const fetchInvoices = async (showLoader = false, overrideToday = null, overrideUnpaid = null, overrideMonth = null, overrideYear = null) => {
    try {
      if (showLoader) setLoadingInvoices(true);
      const eToday = overrideToday !== null ? overrideToday : showOnlyToday;
      const eUnpaid = overrideUnpaid !== null ? overrideUnpaid : showOnlyUnpaid;
      const eMonth = overrideMonth !== null ? overrideMonth : selectedMonth;
      const eYear = overrideYear !== null ? overrideYear : selectedYear;

      const { data, error } = await supabase.from('invoices').select(`
        *, customers!invoices_customer_id_fkey(first_name, last_name, email),
        invoice_items(id, quantity, total_thb, unit_price_thb, date, status, payment_method, notes, activity_id, instructor_id, bizum_deposit_eur, customer_id, temporary_name, is_comm,
          activities(name, category, color, acronym), staff(first_name, initials),
          customers!invoice_items_customer_id_fkey(first_name, last_name, email))
      `).order('created_at', { ascending: false });
      if (error) throw error;

      const sorted = (data || []).map(inv => ({
        ...inv,
        invoice_items: [...(inv.invoice_items || [])].sort((a, b) => {
          const nA = a.customers?.first_name || a.temporary_name || '', nB = b.customers?.first_name || b.temporary_name || '';
          if (nA !== nB) return nA.localeCompare(nB);
          if (!a.date && b.date) return 1; if (a.date && !b.date) return -1;
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return String(a.id).localeCompare(String(b.id));
        })
      })).sort((a, b) => {
        const getRef = inv => { const d = inv.invoice_items?.map(it => it.date).filter(Boolean); return d?.length ? d.sort()[0].substring(0, 10) : '9999-99-99'; };
        const rA = getRef(a), rB = getRef(b);
        if (rA !== rB) return rA.localeCompare(rB);
        const getInstr = inv => { const f = (inv.invoice_items || [])[0]; return f?.staff?.initials || f?.instructor_id || 'ZZZ'; };
        const iA = getInstr(a), iB = getInstr(b);
        if (iA !== iB) return String(iA).localeCompare(String(iB));
        const getAct = inv => (inv.invoice_items || [])[0]?.activities?.name || 'ZZZ';
        const aA = getAct(a), aB = getAct(b);
        if (aA !== aB) return String(aA).localeCompare(String(aB));
        return new Date(a.created_at) - new Date(b.created_at);
      });

      // Full month data (for widgets — ignores today/unpaid filters)
      const monthOnly = sorted.filter(inv => {
        const items = inv.invoice_items || [];
        if (!items.length) return true;
        return items.some(it => { if (!it.date) return true; const [y, m] = it.date.split('-').map(Number); return y === eYear && (m - 1) === eMonth; });
      });
      setAllMonthInvoices(monthOnly);

      // Filtered data for the table
      const today = new Date().toLocaleDateString('en-CA');
      const filtered = monthOnly.filter(inv => {
        const items = inv.invoice_items || [];
        if (!items.length) return true;
        if (eToday) { const hasToday = items.some(it => it.date === today); if (eUnpaid) return hasToday && items.some(it => it.status !== 'Paid'); return hasToday; }
        if (eUnpaid) return items.some(it => it.status !== 'Paid');
        return true;
      });

      setInvoices(filtered);
      if (showLoader) setSelectedItemIds(new Set());
    } catch (error) { console.error('Error fetching invoices:', error); }
    finally { setLoadingInvoices(false); }
  };

  const changeArrivalsDate = (days) => {
    const d = new Date(arrivalsDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setArrivalsDate(d.toLocaleDateString('en-CA'));
  };

  const fetchTodayArrivals = async () => {
    try {
      setLoadingArrivals(true);
      const { data, error } = await supabase.from('customers').select('id, first_name, last_name, booked_activity').eq('booking_date', arrivalsDate).order('first_name');
      if (error) throw error;
      setTodayArrivals(data || []);
    } catch (error) { console.error('Error fetching arrivals:', error); }
    finally { setLoadingArrivals(false); }
  };

  const handleAddArrivalsToTable = async () => {
    if (selectedArrivalIds.size === 0) return;
    try {
      for (const arrId of selectedArrivalIds) {
        const cust = todayArrivals.find(a => a.id === arrId);
        const { data: existing, error: checkErr } = await supabase.from('invoices').select('id').eq('customer_id', cust.id).eq('status', 'Open').limit(1);
        if (checkErr) throw checkErr;
        let invoiceId;
        if (existing && existing.length > 0) { invoiceId = existing[0].id; }
        else {
          const { data: inv, error: invErr } = await supabase.from('invoices').insert({ customer_id: cust.id, status: 'Open' }).select().single();
          if (invErr) throw invErr;
          invoiceId = inv.id;
        }
        const { error: itemErr } = await supabase.from('invoice_items').insert({ invoice_id: invoiceId, customer_id: cust.id, date: null, quantity: 1, unit_price_thb: 0, total_thb: 0, status: 'Pending' });
        if (itemErr) throw itemErr;
      }
    } catch (err) { console.error('Error adding arrivals:', err); alert('Error: ' + err.message); }
    setSelectedArrivalIds(new Set());
    fetchInvoices(false);
  };

  const handleApplyBulkChanges = async () => {
    if (selectedItemIds.size === 0) return;
    const itemIds = Array.from(selectedItemIds);
    setLoadingInvoices(true);
    try {
      const updates = {};
      if (bulkGroupAction === 'group') {
        const { data: newInv, error: invErr } = await supabase.from('invoices').insert({ status: 'Open' }).select().single();
        if (invErr) throw invErr;
        updates.invoice_id = newInv.id;
      }
      const itemIds = Array.from(selectedItemIds);
      const allItems = invoices.flatMap(inv => inv.invoice_items || []);
      
      if (bulkDate) updates.date = bulkDate;

      // 1. Clasificamos los registros según si permiten instructor o no
      const idsToClearInstructor = [];
      const idsToApplyNormal = [];

      itemIds.forEach(id => {
        const item = allItems.find(it => it.id === id);
        const act = activities.find(a => a.id === item?.activity_id);
        const cat = categories.find(c => c.name === act?.category);
        const allowsStaff = cat ? cat.requires_staff !== false : true;

        if (!allowsStaff) idsToClearInstructor.push(id);
        else idsToApplyNormal.push(id);
      });

      // 2. Ejecutar actualizaciones en la base de datos
      if (idsToApplyNormal.length > 0) {
        const finalUpdates = { ...updates };
        if (bulkInstructor) finalUpdates.instructor_id = bulkInstructor;
        const { error } = await supabase.from('invoice_items').update(finalUpdates).in('id', idsToApplyNormal);
        if (error) throw error;
      }

      if (idsToClearInstructor.length > 0) {
        const finalUpdates = { ...updates, instructor_id: null };
        const { error } = await supabase.from('invoice_items').update(finalUpdates).in('id', idsToClearInstructor);
        if (error) throw error;
      }

      if (bulkGroupAction === 'ungroup') {
        for (const itemId of itemIds) {
          const { data: newInv, error: invErr } = await supabase.from('invoices').insert({ status: 'Open' }).select().single();
          if (!invErr) await supabase.from('invoice_items').update({ invoice_id: newInv.id }).eq('id', itemId);
        }
      }
      try {
        const oldIds = [...new Set(invoices.filter(inv => inv.invoice_items?.some(it => selectedItemIds.has(it.id))).map(inv => inv.id))];
        for (const invId of oldIds) {
          const { data: items } = await supabase.from('invoice_items').select('id').eq('invoice_id', invId).limit(1);
          if (!items || items.length === 0) await supabase.from('invoices').delete().eq('id', invId);
        }
      } catch (e) { console.warn('Cleanup warning:', e); }
      setToast("Cambios aplicados correctamente");
      setSelectedItemIds(new Set()); setBulkDate(''); setBulkInstructor(''); setBulkGroupAction(null);
      fetchInvoices(false);
    } catch (err) { console.error('Error applying bulk changes:', err); alert('Error al aplicar cambios: ' + err.message); }
    finally { setLoadingInvoices(false); }
  };

  const handleCopyEmails = () => {
    const emails = [...new Set(invoices.flatMap(inv => inv.invoice_items || []).filter(it => selectedItemIds.has(it.id)).map(it => it.customers?.email).filter(Boolean))];
    if (emails.length > 0) { navigator.clipboard.writeText(emails.join(', ')); setToast(`${emails.length} emails copiados`); }
    else alert("No hay emails en los registros seleccionados");
  };

  const handleDeleteItems = async () => {
    const ids = Array.from(selectedItemIds).filter(id => id && typeof id === 'string' && id.length > 20);
    if (ids.length === 0) { setSelectedItemIds(new Set()); setToast("No hay registros válidos seleccionados"); return; }
    
    // 1. Identificar qué facturas podrían quedarse vacías antes de borrar
    const candidateInvoiceIds = [...new Set(
      invoices
        .filter(inv => inv.invoice_items?.some(it => ids.includes(it.id)))
        .map(inv => inv.id)
    )];

    setConfirmConfig({
      show: true, title: 'Eliminar Registros',
      message: `¿Estás seguro de que deseas eliminar ${ids.length} registros? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoadingInvoices(true);
          
          // 2. Borrar los ítems seleccionados
          const { error } = await supabase.from('invoice_items').delete().in('id', ids);
          if (error) throw error;
          
          // 3. LIMPIEZA: Borrar facturas que se hayan quedado sin ítems
          for (const invId of candidateInvoiceIds) {
            const { data: items } = await supabase
              .from('invoice_items')
              .select('id')
              .eq('invoice_id', invId)
              .limit(1);
            
            if (!items || items.length === 0) {
              await supabase.from('invoices').delete().eq('id', invId);
            }
          }

          setToast(`${ids.length} eliminados`); 
          setSelectedItemIds(new Set()); 
          fetchInvoices(false);
        } catch (err) { console.error('Error deleting items:', err); alert('Error al eliminar: ' + err.message); }
        finally { setLoadingInvoices(false); setConfirmConfig(prev => ({ ...prev, show: false })); }
      }
    });
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    const hasItems = (inv?.invoice_items || []).length > 0;
    setConfirmConfig({
      show: true,
      title: hasItems ? '¿Eliminar Factura?' : 'Fila Vacía',
      message: hasItems ? 'Estás a punto de eliminar esta factura y todos sus registros. ¿Deseas continuar?' : 'Esta fila no tiene registros. ¿Deseas eliminarla?',
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoadingInvoices(true);
          const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
          if (error) throw error;
          setToast("Factura eliminada"); fetchInvoices(false);
        } catch (err) { console.error('Error deleting invoice:', err); }
        finally { setLoadingInvoices(false); setConfirmConfig(prev => ({ ...prev, show: false })); }
      }
    });
  };

  const handleExtractItem = async (itemId, customerId) => {
    let extractedItem = null;
    setInvoices(prev => {
      const next = prev.map(inv => {
        const idx = inv.invoice_items?.findIndex(i => i.id === itemId);
        if (idx !== -1) {
          extractedItem = { ...inv.invoice_items[idx] };
          const newItems = [...inv.invoice_items]; newItems.splice(idx, 1);
          return { ...inv, invoice_items: newItems };
        }
        return inv;
      });
      if (extractedItem) next.push({ id: `temp-${Date.now()}`, customer_id: customerId, status: 'Open', invoice_items: [{ ...extractedItem, invoice_id: 'temp-id' }], customers: extractedItem.customers });
      return next;
    });
    try {
      const { data: invData, error: invErr } = await supabase.from('invoices').insert({ customer_id: customerId, status: 'Open' }).select().single();
      if (invErr) throw invErr;
      const { error: moveErr } = await supabase.from('invoice_items').update({ invoice_id: invData.id }).eq('id', itemId);
      if (moveErr) throw moveErr;
      setToast("Registro extraído correctamente."); fetchInvoices(false);
    } catch (err) { console.error('Error extracting item:', err); fetchInvoices(true); }
  };

  const handleDissolveGroup = async (invoiceId) => {
    setConfirmConfig({
      show: true,
      title: 'Desagrupar Registros',
      message: '¿Estás seguro de que deseas desagrupar todos los registros de esta factura?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        const targetInv = invoices.find(inv => inv.id === invoiceId);
        if (!targetInv) return;
        const itemsToMove = [...(targetInv.invoice_items || [])];
        setInvoices(prev => {
          const filtered = prev.filter(inv => inv.id !== invoiceId);
          const newStubs = itemsToMove.map((item, idx) => ({ id: `temp-dissolve-${idx}-${Date.now()}`, customer_id: item.customer_id, status: 'Open', invoice_items: [{ ...item, invoice_id: 'temp' }], customers: item.customers }));
          return [...filtered, ...newStubs];
        });
        try {
          const { data: newInvoices, error: invErr } = await supabase.from('invoices').insert(itemsToMove.map(item => ({ customer_id: item.customer_id, status: 'Open' }))).select();
          if (invErr) throw invErr;
          await Promise.all(itemsToMove.map((item, idx) => supabase.from('invoice_items').update({ invoice_id: newInvoices[idx].id }).eq('id', item.id)));
          await supabase.from('invoices').delete().eq('id', invoiceId);
          setToast("Grupo disuelto correctamente."); fetchInvoices(false);
        } catch (err) { console.error('Error dissolving group:', err); fetchInvoices(true); }
      }
    });
  };

  const patchInvoiceItem = (itemId, field, value) => {
    setInvoices(prev => prev.map(inv => ({
      ...inv,
      invoice_items: inv.invoice_items?.map(item => 
        String(item.id) === String(itemId) ? { ...item, [field]: value } : item
      )
    })));
  };

  return {
    // State
    todayArrivals, loadingArrivals, invoices, loadingInvoices, sortBy, setSortBy,
    activities, categories, staff, bills50000, setBills50000, bills1000, setBills1000,
    bills500, setBills500, bills100, setBills100, bills50, setBills50, bills20, setBills20,
    selectedArrivalIds, setSelectedArrivalIds, selectedItemIds, setSelectedItemIds,
    toast, setToast, confirmConfig, setConfirmConfig,
    arrivalsDate, setArrivalsDate, selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear, showOnlyToday, setShowOnlyToday,
    showOnlyUnpaid, setShowOnlyUnpaid, bulkDate, setBulkDate,
    bulkInstructor, setBulkInstructor, bulkGroupAction, setBulkGroupAction,
    isSavingCash, dateInputRef,
    // Computed
    actualCash, stats, displayedInvoices, activityStats, expectedCash, diffCash,
    // Handlers
    handleToggleSelection, changeArrivalsDate, fetchInvoices,
    handleAddArrivalsToTable, handleApplyBulkChanges, handleCopyEmails,
    handleDeleteItems, handleDeleteInvoice, handleExtractItem, handleDissolveGroup,
    patchInvoiceItem, fetchCatalogs, monthlyDbData,
  };
}
