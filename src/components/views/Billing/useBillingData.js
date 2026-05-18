import { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';
import { useBillingState } from './useBillingState';
import { useBillingStats } from './useBillingStats';
import { useBillingFilters } from './useBillingFilters';
import { useBillingMutations } from './useBillingMutations';

export function useBillingData() {
  const { refreshTrigger } = useUndo();

  // 1. Instanciamos el Estado base
  const state = useBillingState();

  // Cálculo rápido del efectivo real ingresado en caja
  const actualCash = (
    (state.bills50000 === '' ? 0 : Number(state.bills50000) * 50000) +
    (state.bills1000 === '' ? 0 : Number(state.bills1000) * 1000) +
    (state.bills500 === '' ? 0 : Number(state.bills500) * 500) +
    (state.bills100 === '' ? 0 : Number(state.bills100) * 100) +
    (state.bills50 === '' ? 0 : Number(state.bills50) * 50) +
    (state.bills20 === '' ? 0 : Number(state.bills20) * 20)
  );

  // 2. Instanciamos el Sub-Hook de Estadísticas Financieras
  const stats = useBillingStats({
    allMonthInvoices: state.allMonthInvoices,
    arrivalsDate: state.arrivalsDate,
    activities: state.activities,
    actualCash,
    selectedMonth: state.selectedMonth,
    selectedYear: state.selectedYear,
    monthlyDbData: state.monthlyDbData,
    setMonthlyDbData: state.setMonthlyDbData,
    dbExpectedCash: state.dbExpectedCash,
  });

  // 3. Instanciamos el Sub-Hook de Filtrado y Ordenamiento
  const filters = useBillingFilters({
    invoices: state.invoices,
    sortBy: state.sortBy,
    showOnlyUnpaid: state.showOnlyUnpaid,
    selectedDay: state.selectedDay,
    searchTerm: state.searchTerm,
    activitySearch: state.activitySearch,
    instructorSearch: state.instructorSearch,
    paymentMethodSearch: state.paymentMethodSearch,
    showOnlyCommissionable: state.showOnlyCommissionable,
    selectedMonth: state.selectedMonth,
    selectedYear: state.selectedYear,
    arrivalsDate: state.arrivalsDate,
  });

  // 4. Instanciamos el Sub-Hook de Mutaciones CRUD
  const mutations = useBillingMutations({
    ...state,
    stats: stats.stats,
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. EFECTOS DE CICLO DE VIDA Y REALTIME
  // ══════════════════════════════════════════════════════════════════════════

  // Limpieza automática del Toast temporal
  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => state.setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast]);

  // Carga inicial al montar el componente
  useEffect(() => {
    mutations.fetchCatalogs();
    mutations.fetchTodayArrivals();
    mutations.fetchInvoices(true);
    mutations.fetchUIConfig();
  }, []);

  // Recargar llegadas de hoy al cambiar la fecha en el calendario
  useEffect(() => {
    mutations.fetchTodayArrivals();
  }, [state.arrivalsDate]);

  // Recargar control de caja mensual al cambiar de periodo (mes/año)
  useEffect(() => {
    mutations.fetchCashControl();
  }, [state.selectedMonth, state.selectedYear]);

  // Manejo de refreshTrigger desde la pila de Deshacer modularizada
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("🔄 [useBillingData] refreshTrigger detectado. Recargando facturas...");
      mutations.fetchInvoices(false);
    }
  }, [refreshTrigger]);

  // Suscripción Realtime a cambios en Supabase (Facturas e Ítems)
  useEffect(() => {
    console.log("⚡ [Realtime Billing] Inicializando canal de suscripción...");
    const channel = supabase
      .channel('billing-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
        console.log("⚡ [Realtime Billing] Cambio recibido en 'invoices':", payload.eventType);
        mutations.fetchInvoices(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, (payload) => {
        console.log("⚡ [Realtime Billing] Cambio recibido en 'invoice_items':", payload.eventType);
        mutations.fetchInvoices(false);
      })
      .subscribe((status, err) => {
        console.log(`⚡ [Realtime Billing] Estado de suscripción: ${status}`);
        if (err) {
          console.error("⚡ [Realtime Billing] Error en suscripción:", err);
        }
        if (status === 'SUBSCRIBED') {
          mutations.fetchInvoices(false);
        }
      });

    return () => {
      console.log("⚡ [Realtime Billing] Limpiando suscripción de Realtime.");
      supabase.removeChannel(channel);
    };
  }, [state.selectedMonth, state.selectedYear]);

  // Autoguardado diferido (Debounce) del control de caja (billetes)
  useEffect(() => {
    if (state.loadingCash) return;
    if (state.saveTimeoutRef.current) clearTimeout(state.saveTimeoutRef.current);
    state.saveTimeoutRef.current = setTimeout(() => mutations.saveCashControl(), 1500);
    return () => { if (state.saveTimeoutRef.current) clearTimeout(state.saveTimeoutRef.current); };
  }, [state.bills50000, state.bills1000, state.bills500, state.bills100, state.bills50, state.bills20]);

  // Sincronización automática de reportes mensuales en monthly_reports
  useEffect(() => {
    if (state.loadingInvoices || state.allMonthInvoices.length === 0) return;

    // PROTECCIÓN: No sincronizar meses bloqueados históricos
    if (state.selectedYear === 2026 && state.selectedMonth < 3) return;
    
    const syncReports = async () => {
      try {
        const { error: repError } = await supabase.from('monthly_reports').upsert({
          year: state.selectedYear,
          month: state.selectedMonth + 1,
          facturado: stats.stats.facturado,
          pendiente: stats.stats.pendiente,
          cobrado: stats.stats.cobrado,
          cr_eur: stats.stats.eurCR,
          cr_wise: stats.stats.wiseCR,
          bt_eur: stats.stats.eurBT,
          bt_wise: stats.stats.wiseBT,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year, month' });

        if (repError) throw repError;
        mutations.fetchCashControl();
      } catch (err) {
        console.error("[useBillingData] ❌ Error sincronizando informe:", err);
      }
    };

    const t = setTimeout(syncReports, 1000);
    return () => clearTimeout(t);
  }, [stats.stats, state.selectedMonth, state.selectedYear, state.loadingInvoices]);

  // Manejo de la selección por grupo / híbrida (soporte para Shift+Click)
  const handleToggleSelection = (invoice, index, shiftKey) => {
    const itemIds = invoice.invoice_items?.map(it => it.id) || [];
    if (itemIds.length === 0) return;

    const prevIdx = state.lastClickedIndex.current;
    state.setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      const isCurrentlySelected = itemIds.every(id => prev.has(id));
      const shouldSelect = !isCurrentlySelected;

      if (shiftKey && prevIdx !== null) {
        const start = Math.min(prevIdx, index);
        const end = Math.max(prevIdx, index);
        for (let i = start; i <= end; i++) {
          const inv = filters.displayedInvoices[i];
          if (!inv) continue;
          (inv.invoice_items?.map(it => it.id) || []).forEach(id => {
            if (shouldSelect) newSet.add(id);
            else newSet.delete(id);
          });
        }
      } else {
        itemIds.forEach(id => {
          if (isCurrentlySelected) newSet.delete(id);
          else newSet.add(id);
        });
      }
      return newSet;
    });

    state.lastClickedIndex.current = index;
    if (shiftKey) window.getSelection()?.removeAllRanges();
  };

  // Obtener la lista plana de todos los items visibles en el orden actual de la pantalla
  const getVisibleItemIds = () => {
    const visibleIds = [];
    filters.displayedInvoices.forEach(inv => {
      const items = inv.invoice_items || [];
      if (items.length === 1) {
        visibleIds.push(items[0].id);
      } else if (items.length > 1) {
        const saved = localStorage.getItem(`billing-group-expanded-${inv.id}`);
        const isExpanded = saved !== 'false'; // por defecto true
        if (isExpanded) {
          items.forEach(it => {
            visibleIds.push(it.id);
          });
        }
      }
    });
    return visibleIds;
  };

  // Manejo de la selección de items individuales (soporte para Shift+Click)
  const handleSelectItemSelection = (itemId, shiftKey) => {
    const prevId = state.lastClickedItemId.current;
    state.setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      const isCurrentlySelected = prev.has(itemId);
      const shouldSelect = !isCurrentlySelected;

      if (shiftKey && prevId !== null) {
        const visibleIds = getVisibleItemIds();
        const startIdx = visibleIds.indexOf(prevId);
        const endIdx = visibleIds.indexOf(itemId);

        if (startIdx !== -1 && endIdx !== -1) {
          const start = Math.min(startIdx, endIdx);
          const end = Math.max(startIdx, endIdx);
          for (let i = start; i <= end; i++) {
            const id = visibleIds[i];
            if (shouldSelect) newSet.add(id);
            else newSet.delete(id);
          }
        }
      } else {
        if (isCurrentlySelected) newSet.delete(itemId);
        else newSet.add(itemId);
      }
      return newSet;
    });

    state.lastClickedItemId.current = itemId;
    if (shiftKey) window.getSelection()?.removeAllRanges();
  };

  // Retornamos la API pública unificada
  return {
    ...state,
    ...stats,
    ...filters,
    ...mutations,
    actualCash,
    handleToggleSelection,
    handleSelectItemSelection,
  };
}

