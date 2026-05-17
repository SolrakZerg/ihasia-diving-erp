import { supabase } from '../../../lib/supabaseClient';
import { addCustomersToBilling } from '../../common/billingHelpers';
import { useUndo } from '../../../context/UndoContext';
import { buildDeleteItemsAction, buildDeleteInvoiceAction } from './billingUndoActions';

export function useBillingMutations({
  invoices,
  setInvoices,
  selectedItemIds,
  setSelectedItemIds,
  bulkDate,
  setBulkDate,
  bulkInstructor,
  setBulkInstructor,
  bulkActivity,
  setBulkActivity,
  bulkGroupAction,
  setBulkGroupAction,
  todayArrivals,
  setTodayArrivals,
  selectedArrivalIds,
  setSelectedArrivalIds,
  arrivalsDate,
  setArrivalsDate,
  selectedMonth,
  selectedYear,
  bills50000,
  setBills50000,
  bills1000,
  setBills1000,
  bills500,
  setBills500,
  bills100,
  setBills100,
  bills50,
  setBills50,
  bills20,
  setBills20,
  loadingCash,
  setLoadingCash,
  dbExpectedCash,
  setDbExpectedCash,
  uiConfig,
  setUiConfig,
  setToast,
  confirmConfig,
  setConfirmConfig,
  setLoadingInvoices,
  setAllMonthInvoices,
  activities,
  setActivities,
  categories,
  setCategories,
  staff,
  setStaff,
  saveTimeoutRef,
  setIsSavingCash,
  loadingInvoices,
  allMonthInvoices,
  stats,
}) {
  const { pushAction } = useUndo();

  const fetchInvoices = async (showLoader = false, overrideToday = null, overrideUnpaid = null, overrideMonth = null, overrideYear = null) => {
    try {
      if (showLoader) setLoadingInvoices(true);
      const eMonth = overrideMonth !== null ? overrideMonth : selectedMonth;
      const eYear = overrideYear !== null ? overrideYear : selectedYear;

      const { data, error } = await supabase.from('invoices').select(`
        *, customers!invoices_customer_id_fkey(first_name, last_name, email),
        invoice_items(id, invoice_id, quantity, total_thb, unit_price_thb, date, status, payment_method, notes, activity_id, instructor_id, bizum_deposit_eur, customer_id, temporary_name, is_comm,
          activities(name, category, color, acronym), staff(first_name, initials),
          customers!invoice_items_customer_id_fkey(first_name, last_name, email))
      `).order('created_at', { ascending: false });
      if (error) throw error;

      const sorted = (data || []).map(inv => ({
        ...inv,
        invoice_items: [...(inv.invoice_items || [])].sort((a, b) => {
          const catP = { 'Course': 1, 'Fun Dive': 2, 'Fee': 3, 'Pro': 4, 'Snorkeling': 5, 'Retail': 6 };
          const cA = catP[a.activities?.category] || 99;
          const cB = catP[b.activities?.category] || 99;
          if (cA !== cB) return cA - cB;
          const actA = a.activities?.name || '', actB = b.activities?.name || '';
          if (actA !== actB) return actA.localeCompare(actB);
          const iA = a.staff?.initials || '', iB = b.staff?.initials || '';
          if (iA !== iB) return iA.localeCompare(iB);
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

      const monthOnly = sorted.filter(inv => {
        const items = inv.invoice_items || [];
        if (!items.length) return true;
        return items.some(it => { if (!it.date) return true; const [y, m] = it.date.split('-').map(Number); return y === eYear && (m - 1) === eMonth; });
      });

      setInvoices(sorted);
      setAllMonthInvoices(monthOnly);
      if (showLoader) setSelectedItemIds(new Set());
    } catch (error) { console.error('Error fetching invoices:', error); }
    finally { setLoadingInvoices(false); }
  };

  const fetchCatalogs = async () => {
    const [actRes, stfRes, catRes] = await Promise.all([
      supabase.from('activities').select('id, name, price_thb, color, category, acronym, widget_column, widget_order, is_commissionable'),
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

  const fetchTodayArrivals = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('id, first_name, last_name, booked_activity').eq('booking_date', arrivalsDate).order('first_name');
      if (error) throw error;
      setTodayArrivals(data || []);
    } catch (error) { console.error('Error fetching arrivals:', error); }
  };

  const fetchUIConfig = async () => {
    try {
      const { data, error } = await supabase.from('ui_config').select('*').single();
      if (error) throw error;
      setUiConfig(data);
    } catch (err) { console.error('Error fetching UI config:', err); }
  };

  const updateUIConfig = async (updates) => {
    try {
      const { error } = await supabase.from('ui_config').update(updates).eq('id', uiConfig.id);
      if (error) throw error;
      setUiConfig(prev => ({ ...prev, ...updates }));
      setToast({ title: 'Configuración guardada', message: 'Los colores se han actualizado correctamente.', type: 'success' });
    } catch (err) {
      console.error('Error updating UI config:', err);
      setToast({ title: 'Error', message: 'No se pudo guardar la configuración.', type: 'error' });
    }
  };

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
        setBills50000(''); setBills1000(''); setBills500('');
        setBills100(''); setBills50(''); setBills20('');
      }
      
      const { data: reportData } = await supabase
        .from('monthly_reports')
        .select('deberia')
        .eq('year', selectedYear)
        .eq('month', selectedMonth + 1)
        .maybeSingle();
      
      if (reportData) setDbExpectedCash(reportData.deberia || 0);
      else setDbExpectedCash(0);
    } catch (err) { console.error('Error fetching cash control:', err); }
    finally { setLoadingCash(false); }
  };

  const saveCashControl = async () => {
    if (selectedYear === 2026 && selectedMonth < 3) {
      console.warn("[useBillingMutations] 🛡️ Bloqueada edición de Cash Control en mes protegido.");
      return;
    }
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
      const allItems = invoices.flatMap(inv => inv.invoice_items || []);
      
      if (bulkDate) updates.date = bulkDate;

      if (bulkActivity) {
        const act = activities.find(a => String(a.id) === String(bulkActivity));
        const cat = categories.find(c => c.name === act?.category);
        const allowsStaff = cat ? cat.requires_staff !== false : true;
        const up = act ? Number(act.price_thb) || 0 : 0;

        const promises = itemIds.map(async (id) => {
          const item = allItems.find(it => it.id === id);
          const q = item ? Number(item.quantity) || 0 : 0;
          
          const itemUpdates = { ...updates };
          itemUpdates.activity_id = bulkActivity;
          itemUpdates.unit_price_thb = up;
          itemUpdates.total_thb = up * q;

          if (act && !act.is_commissionable) {
            itemUpdates.is_comm = false;
          }

          if (!allowsStaff) {
            itemUpdates.instructor_id = null;
          } else if (bulkInstructor) {
            itemUpdates.instructor_id = bulkInstructor;
          }

          const { error } = await supabase.from('invoice_items').update(itemUpdates).eq('id', id);
          if (error) throw error;
        });
        
        await Promise.all(promises);
      } else {
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
      setSelectedItemIds(new Set()); setBulkDate(''); setBulkInstructor(''); setBulkActivity(''); setBulkGroupAction(null);
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
    
    const candidateInvoiceIds = [...new Set(
      invoices
        .filter(inv => inv.invoice_items?.some(it => ids.includes(it.id)))
        .map(inv => inv.id)
    )];

    const itemsToDelete = invoices
      .flatMap(inv => inv.invoice_items || [])
      .filter(it => ids.includes(it.id))
      .map(it => {
        const clean = { ...it };
        delete clean.activities;
        delete clean.staff;
        delete clean.customers;
        return clean;
      });

    const emptyInvoiceIds = [];
    const invoicesToBackup = [];
    for (const invId of candidateInvoiceIds) {
      const inv = invoices.find(i => i.id === invId);
      const remaining = (inv?.invoice_items || []).filter(it => !ids.includes(it.id));
      if (remaining.length === 0) {
        emptyInvoiceIds.push(invId);
        if (inv) {
          const cleanInv = { ...inv };
          delete cleanInv.invoice_items;
          delete cleanInv.customers;
          invoicesToBackup.push(cleanInv);
        }
      }
    }

    setConfirmConfig({
      show: true, title: 'Eliminar Registros',
      message: `¿Estás seguro de que deseas eliminar ${ids.length} registros?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setLoadingInvoices(true);
          const { error } = await supabase.from('invoice_items').delete().in('id', ids);
          if (error) throw error;
          
          for (const invId of emptyInvoiceIds) {
            await supabase.from('invoices').delete().eq('id', invId);
          }

          pushAction(buildDeleteItemsAction(ids, itemsToDelete, emptyInvoiceIds, invoicesToBackup, () => fetchInvoices(false)));

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
    if (!inv) return;
    const hasItems = (inv?.invoice_items || []).length > 0;

    const invoiceBackup = { ...inv };
    delete invoiceBackup.invoice_items;
    delete invoiceBackup.customers;

    const itemsBackup = (inv?.invoice_items || []).map(it => {
      const clean = { ...it };
      delete clean.activities;
      delete clean.staff;
      delete clean.customers;
      return clean;
    });

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

          const customerName = inv.customers?.first_name || inv.temporary_name || 'Sin nombre';

          pushAction(buildDeleteInvoiceAction(invoiceId, customerName, invoiceBackup, itemsBackup, () => fetchInvoices(false)));

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

  const handleAddArrivalsToTable = async () => {
    if (selectedArrivalIds.size === 0) return;
    try {
      const customersToAdd = [];
      for (const arrId of selectedArrivalIds) {
        const cust = todayArrivals.find(a => a.id === arrId);
        if (cust) customersToAdd.push(cust);
      }
      
      await addCustomersToBilling(customersToAdd);
      
      setToast(`Se han añadido ${selectedArrivalIds.size} clientes a la mesa.`);
      sessionStorage.setItem('shouldScrollToBottom', 'true');
    } catch (err) { console.error('Error adding arrivals:', err); alert('Error: ' + err.message); }
    setSelectedArrivalIds(new Set());
    fetchInvoices(false);
  };

  const changeArrivalsDate = (days) => {
    const d = new Date(arrivalsDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setArrivalsDate(d.toLocaleDateString('en-CA'));
  };

  return {
    fetchInvoices,
    fetchCatalogs,
    fetchTodayArrivals,
    fetchUIConfig,
    updateUIConfig,
    fetchCashControl,
    saveCashControl,
    handleApplyBulkChanges,
    handleCopyEmails,
    handleDeleteItems,
    handleDeleteInvoice,
    handleExtractItem,
    handleDissolveGroup,
    patchInvoiceItem,
    handleAddArrivalsToTable,
    changeArrivalsDate,
  };
}
