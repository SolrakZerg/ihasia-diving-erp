import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';
import { buildDashboardOpeningCashAction, buildDashboardPendingAction } from './dashboardUndoActions';

export default function useDashboardData() {
  const { pushAction } = useUndo();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Data states
  const [staffData, setStaffData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [incomeData, setIncomeData] = useState({ 
    total: 0, 
    breakdown: {}, 
    collected: 0, 
    botes: 0,
    crData: [],
    btData: []
  });
  const [courseStats, setCourseStats] = useState({ count: 0, growth: 0 });

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDayNum}`;

    try {
      const [ 
        { data: monthlyReport }, 
        { data: monthlyActivities },
        { data: staffSettlements },
        { data: boteMonthly }, 
        { data: fixedSettings },
        { data: sSettlements },
        metricsRes,
        { data: prevYearReport },
        { data: prev2YearReport },
        { data: prev3YearReport }
      ] = await Promise.all([
        supabase.from('monthly_reports').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('monthly_activity_summary').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('staff_settlements').select('*, staff(initials)').eq('year', year).eq('month', month),
        supabase.from('bote_monthly').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('fixed_expenses').select('*').order('name'),
        supabase.from('supplier_settlements').select('*').eq('year', year).eq('month', month),
        supabase.from('monthly_expenses').select('*').eq('year', year).eq('month', month).maybeSingle(),
        supabase.from('monthly_reports').select('total_courses, facturado').eq('year', year - 1).eq('month', month).maybeSingle(),
        supabase.from('monthly_reports').select('total_courses, facturado').eq('year', year - 2).eq('month', month).maybeSingle(),
        supabase.from('monthly_reports').select('total_courses, facturado').eq('year', year - 3).eq('month', month).maybeSingle()
      ]);

      const mObj = metricsRes.data || {};

      // 2. Process Invoices
      const facturado = Number(monthlyReport?.facturado || 0);
      const pendiente = Number(monthlyReport?.pendiente || 0);
      const cobrado = Number(monthlyReport?.cobrado || 0);
      
      const wiseBT = Number(monthlyReport?.bt_wise || 0);
      const wiseCR = Number(monthlyReport?.cr_wise || 0);
      const eurBT = Number(monthlyReport?.bt_eur || 0);
      const eurCR = Number(monthlyReport?.cr_eur || 0);
      
      const totalCRAdvances = Number(monthlyReport?.cr_cash || 0);
      const totalBTAdvances = Number(monthlyReport?.bt_cash || 0);

      const openingCash = monthlyReport?.mes_anterior || 0;
      const boteTotal = Number(boteMonthly?.apartar_amount || 0);
      const botePending = monthlyReport?.bote_xpagar ?? boteTotal;

      const dbFacturado = facturado;
      const dbPendiente = pendiente;
      const dbCobrado = cobrado;

      const dbWiseBT = wiseBT;
      const dbWiseCR = wiseCR;
      const dbEurBT = eurBT;
      const dbEurCR = eurCR;

      const crData = [
        { name: 'CASH', value: totalCRAdvances, color: '#3b82f6' },
        { name: 'WISE', value: dbWiseCR, color: '#2563eb' },
        { name: 'EUR', value: dbEurCR, color: '#1d4ed8' }
      ].filter(d => d.value > 0);

      const btData = [
        { name: 'CASH', value: totalBTAdvances, color: '#f472b6' },
        { name: 'WISE', value: dbWiseBT, color: '#db2777' },
        { name: 'EUR', value: dbEurBT, color: '#9d174d' }
      ].filter(d => d.value > 0);

      // 4. Process Expenses
      const totalStaffCost = (staffSettlements || []).reduce((sum, s) => sum + (Number(s.total_commissions) || 0) + (Number(s.total_bonus) || 0), 0);
      const totalStaffPending = (staffSettlements || []).reduce((sum, s) => sum + (Number(s.total_payout) || 0), 0);

      const carabaoSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('carabao'));
      const carabaoTotal = Number(carabaoSettlement?.total_amount || 0);
      const carabaoPending = Number(carabaoSettlement?.pending_amount || 0);

      const ssiSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('ssi'));
      const ssiTotalFinal = ssiSettlement ? Number(ssiSettlement.total_amount) : 0;
      const ssiPendingFinal = ssiSettlement ? Number(ssiSettlement.pending_amount) : 0;

      const dynamicFixed = (fixedSettings || []).map(f => {
        let col = null;
        let displayName = f.name;
        if (f.name.toLowerCase().includes('office')) { col = 'office_xpagar'; displayName = 'OFFICE'; }
        else if (f.name.toLowerCase().includes('infinity')) { 
          col = 'infinity_xpagar'; 
          displayName = 'INFINITY';
          f.color = 'text-fuchsia-400';
        }
        else if (f.name.toLowerCase().includes('pae') || f.name.toLowerCase().includes('p ae')) { 
          col = 'pae_xpagar'; 
          displayName = 'P AE'; 
          f.color = 'text-emerald-400';
        }
        else if (f.name.toLowerCase().includes('poli')) { 
          col = 'polimigra_xpagar'; 
          displayName = 'POLI MIGRA'; 
          f.color = 'text-purple-400';
        }

        return {
          name: displayName,
          value: Number(f.amount) || 0,
          pending: col ? (monthlyReport?.[col] ?? Number(f.amount)) : Number(f.amount),
          color: f.color || 'text-white',
          isGeneric: !!col,
          col: col,
          isEditable: !!col
        };
      });

      const fixedOrder = ['OFFICE', 'INFINITY', 'P AE', 'POLI MIGRA'];
      const sortedDynamic = [...dynamicFixed].sort((a, b) => {
        const idxA = fixedOrder.indexOf(a.name);
        const idxB = fixedOrder.indexOf(b.name);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });

      const realFinanceTotal = Number(mObj.grand_total_expenses || 0);
      const realFinancePending = Number(mObj.grand_total_pending || 0);

      const rukSettlement = (sSettlements || []).find(s => s.supplier_name?.toLowerCase().includes('ruk'));
      const rukTotal = Number(rukSettlement?.total_amount || 0);
      const rukPending = rukSettlement ? Number(rukSettlement.pending_amount) : 0;

      const detailedExpenses = [
        { name: 'CARABAO', value: carabaoTotal, pending: carabaoPending, color: 'text-blue-400' },
        { name: 'SSI', value: ssiTotalFinal, pending: ssiPendingFinal, color: 'text-rose-400' },
        { 
          name: 'SUELDOS', 
          value: Number(monthlyReport?.sueldos_total || 0), 
          pending: Number(monthlyReport?.sueldos_pendiente || 0), 
          color: 'text-white' 
        },
        { name: 'GASTOS', value: realFinanceTotal, pending: realFinancePending, color: 'text-violet-300' },
        { name: 'BOTE', value: boteTotal, pending: botePending, color: 'text-orange-400', isEditable: true, col: 'bote_xpagar' },
        ...sortedDynamic,
        { name: 'RUK', value: rukTotal, pending: rukPending, color: 'text-amber-400' }
      ];

      setIncomeData({ 
        total: dbFacturado, 
        collected: dbCobrado,
        pending: dbPendiente,
        openingCash,
        boteTotal,
        botePending,
        expectedCash: monthlyReport?.deberia || 0,
        diff: monthlyReport?.falta_o_sobra || 0,
        bills_1000: monthlyReport?.bills_1000 || 0,
        bills_500: monthlyReport?.bills_500 || 0,
        bills_100: monthlyReport?.bills_100 || 0,
        bills_50: monthlyReport?.bills_50 || 0,
        bills_20: monthlyReport?.bills_20 || 0,
        crData,
        btData,
        breakdown: {
          'CASH REAL': monthlyReport?.cash || 0,
          'CR EUR': dbEurCR,
          'CR Wise': dbWiseCR,
          'CR Cash': totalCRAdvances,
          'BT Cash': totalBTAdvances,
          'BT Wise': dbWiseBT,
          'BT EUR': dbEurBT,
          '---': 'separator',
          'DEBERÍA': monthlyReport?.deberia || 0,
          'FALTA O SOBRA': monthlyReport?.falta_o_sobra || 0
        }
      });
      setExpenseData(detailedExpenses);

      setCourseStats({ 
        count: Number(monthlyReport?.total_courses || 0), 
        target: Number(prevYearReport?.total_courses || 0),
        prevTarget: Number(prev2YearReport?.total_courses || 0),
        prev3YearTarget: Number(prev3YearReport?.total_courses || 0),
        facturado: dbFacturado,
        prevFacturado: Number(prevYearReport?.facturado || 0)
      });
      
      const finalStaff = (staffSettlements || []).map(s => {
        const realComms = Number(s.total_commissions) || 0;
        const totalBonus = Number(s.total_bonus) || 0;
        
        return {
          name: s.staff?.initials || '??',
          totalEarned: realComms + totalBonus,
          pending: Number(s.total_payout) || 0
        };
      }).filter(s => s.totalEarned > 0).sort((a, b) => b.totalEarned - a.totalEarned);
      
      setStaffData(finalStaff);
      setMetrics(mObj);
      setMonthlyReport(monthlyReport);

      const shouldSync = (year > 2026) || (year === 2026 && month > 3);
      if (monthlyReport && shouldSync && (Number(monthlyReport.sueldos_total) !== totalStaffCost || Number(monthlyReport.sueldos_pendiente) !== totalStaffPending)) {
        console.log("[Dashboard] Sincronizando totales de sueldos...");
        await supabase.from('monthly_reports').update({
          sueldos_total: totalStaffCost,
          sueldos_pendiente: totalStaffPending
        }).eq('year', year).eq('month', month);
      }

    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
    setLoading(false);
  }, [month, year]);

  const updateOpeningCash = async (val) => {
    if (year === 2026 && month <= 3) {
      console.warn("[Dashboard] 🛡️ Edición bloqueada para meses protegidos.");
      return;
    }
    const isBlank = val === '';
    const num = isBlank ? 0 : Number(val);

    const oldVal = incomeData.openingCash === undefined || incomeData.openingCash === null ? '' : incomeData.openingCash;
    if (oldVal === val) return;

    // Registrar acción de deshacer
    const action = buildDashboardOpeningCashAction(
      year,
      month,
      oldVal,
      val,
      fetchDashboardData
    );
    pushAction(action);

    setIncomeData(prev => ({ ...prev, openingCash: isBlank ? '' : num }));

    await supabase.from('monthly_reports').upsert({ 
      year, 
      month, 
      mes_anterior: num,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'year, month' });
    
    // Recargamos los datos DESPUÉS de guardar
    await fetchDashboardData();
  };

  const updateGenericPending = async (col, val) => {
    if (year === 2026 && month <= 3) {
      console.warn("[Dashboard] 🛡️ Edición bloqueada para meses protegidos.");
      return;
    }
    const isBlank = val === '';
    const num = isBlank ? null : Number(val);
    
    const targetExpense = expenseData.find(e => e.col === col);
    const oldVal = targetExpense ? targetExpense.pending : '';
    const name = targetExpense ? targetExpense.name : col;

    if (oldVal === val) return;

    // Registrar acción de deshacer
    const action = buildDashboardPendingAction(
      year,
      month,
      col,
      name,
      oldVal,
      val,
      fetchDashboardData
    );
    pushAction(action);

    setExpenseData(prev => prev.map(e => {
      if (e.col === col) {
        return { ...e, pending: val }; 
      }
      return e;
    }));

    await supabase.from('monthly_reports').upsert({ 
      year, 
      month, 
      [col]: num,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'year, month' });

    if (col === 'bote_xpagar') {
      await supabase.from('bote_monthly').upsert({
        year,
        month,
        pending_amount: num,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year, month' });
    }

    // Recargamos los datos DESPUÉS de guardar (tanto si es vacío como si no)
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'invoice_items'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_settlements' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'staff_settlements'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bote_monthly' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'bote_monthly'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_reports' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'monthly_reports'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_expenses' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'fixed_expenses'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_settlements' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'supplier_settlements'. Recargando...");
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_expenses' }, () => {
        console.log("📊 [Realtime Dashboard] Cambio detectado en 'monthly_expenses'. Recargando...");
        fetchDashboardData();
      })
      .subscribe((status, err) => {
        console.log(`📊 [Realtime Dashboard] Estado de suscripción: ${status}`);
        if (err) {
          console.error("📊 [Realtime Dashboard] Error en la suscripción:", err);
        }
        if (status === 'SUBSCRIBED') {
          // Nos aseguramos de sincronizar los datos al conectar/reconectar
          fetchDashboardData();
        }
      });

    return () => {
      console.log("📊 [Realtime Dashboard] Limpiando suscripción de Realtime.");
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return {
    loading,
    year,
    setYear,
    month,
    setMonth,
    months,
    staffData,
    expenseData,
    metrics,
    monthlyReport,
    incomeData,
    courseStats,
    handlePrevMonth,
    handleNextMonth,
    updateOpeningCash,
    updateGenericPending,
    fetchDashboardData
  };
}
