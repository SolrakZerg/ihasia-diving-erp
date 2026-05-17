import { useMemo, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useBillingStats({
  allMonthInvoices,
  arrivalsDate,
  activities,
  actualCash,
  selectedMonth,
  selectedYear,
  monthlyDbData,
  setMonthlyDbData,
  dbExpectedCash,
}) {
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
        const qty = Number(item.quantity) || 0;
        
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

  const activityStats = useMemo(() => {
    return stats.activityBreakdown;
  }, [stats.activityBreakdown]);

  const expectedCash = dbExpectedCash || stats.balanceCash;
  const diffCash = actualCash - expectedCash;

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

    const { error } = await supabase.rpc('sync_monthly_activity_logs', {
      p_year: selectedYear,
      p_month: selectedMonth + 1,
      p_data: syncData
    });

    if (error) {
      console.error("[useBillingStats] Error syncing monthly_activity_logs:", error);
    } else {
      fetchDbTotals();
    }
  };

  useEffect(() => {
    if (stats.activityBreakdown) {
      syncMonthlyStats(stats.activityBreakdown);
    }
  }, [stats.activityBreakdown]);

  useEffect(() => {
    fetchDbTotals();
  }, [selectedMonth, selectedYear]);

  return {
    stats,
    activityStats,
    expectedCash,
    diffCash,
    fetchDbTotals,
    syncMonthlyStats,
  };
}
