import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function useBoteData() {
  // ── Fecha ────────────────────────────────────────────────────────────────
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // ── Datos ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialBote, setInitialBote] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ tshirts: 0, insurances: 0 });

  // ── Formulario de nuevo gasto ─────────────────────────────────────────────
  const [newExpense, setNewExpense] = useState({
    day: new Date().getDate(),
    amount: '',
    concept: '',
    category: 'Material'
  });

  // ── Edición inline de gasto (fila completa) ───────────────────────────────
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ day: '', amount: '', concept: '', category: '' });

  // ── Edición del fondo inicial ─────────────────────────────────────────────
  const [isEditingInitial, setIsEditingInitial] = useState(false);

  // ── Modal de confirmación ─────────────────────────────────────────────────
  const [confirmConfig, setConfirmConfig] = useState({
    show: false, title: '', message: '', type: 'danger', onConfirm: null
  });

  // ── Efectos ───────────────────────────────────────────────────────────────
  useEffect(() => { fetchBoteData(); }, [month, year]);

  // AUTO-SAVE: Sincroniza el saldo final con la BD cuando cambian los stats
  useEffect(() => {
    if (!loading && (stats.tshirts > 0 || stats.insurances > 0)) {
      const timer = setTimeout(() => { saveFinalBalance(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stats, loading]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBoteData = async () => {
    setLoading(true);
    try {
      const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

      // 1. Saldo inicial del mes actual
      const { data: boteData } = await supabase
        .from('bote_monthly')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();

      if (boteData) {
        setInitialBote(Number(boteData.initial_balance || 0));
      } else {
        // Intentar recuperar saldo final del mes anterior
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear  = month === 1 ? year - 1 : year;
        const { data: prevData } = await supabase
          .from('bote_monthly')
          .select('final_balance')
          .eq('year', prevYear)
          .eq('month', prevMonth)
          .maybeSingle();
        setInitialBote(prevData ? Number(prevData.final_balance) : 0);
      }

      // 2. Ingresos por camisetas
      const { data: items } = await supabase
        .from('invoice_items')
        .select('quantity, activities!inner(tshirt_included)')
        .eq('activities.tshirt_included', true)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);
      const tshirtsCount = items?.reduce((acc, item) => acc + Number(item.quantity ?? 1), 0) || 0;

      // 3. Ingresos por seguros
      const { data: batches } = await supabase
        .from('insurance_batches')
        .select('total_pax')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
      const insurancesCount = batches?.reduce((acc, b) => acc + (b.total_pax || 0), 0) || 0;

      setStats({ tshirts: tshirtsCount, insurances: insurancesCount });

      // 4. Gastos del mes
      const { data: expenseData } = await supabase
        .from('bote_expenses')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });
      setExpenses(expenseData || []);

    } catch (error) {
      console.error('Error fetching bote data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Sincronización BD ─────────────────────────────────────────────────────
  const saveFinalBalance = async () => {
    const incomeValue = (stats.tshirts * 160) + (stats.insurances * 75);
    const totalExp    = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const final       = initialBote + incomeValue - totalExp;

    await supabase.from('bote_monthly').upsert({
      year, month,
      initial_balance: initialBote,
      apartar_amount: incomeValue,
      expenses_total: totalExp,
      final_balance: final,
      updated_at: new Date().toISOString()
    }, { onConflict: 'year, month' });
  };

  // ── Actualizar fondo inicial ──────────────────────────────────────────────
  const updateInitialBote = async (val) => {
    const num = Number(val);
    setInitialBote(num);
    await supabase.from('bote_monthly').upsert({
      year, month,
      initial_balance: num,
      updated_at: new Date().toISOString()
    }, { onConflict: 'year, month' });
    saveFinalBalance();
  };

  // ── CRUD Gastos ───────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.concept) return;
    setSaving(true);
    try {
      const fullDate = `${year}-${month.toString().padStart(2, '0')}-${newExpense.day.toString().padStart(2, '0')}`;
      const payload = { date: fullDate, amount: newExpense.amount, concept: newExpense.concept, category: newExpense.category };
      const { data, error } = await supabase.from('bote_expenses').insert([payload]).select().single();
      if (error) throw error;
      setExpenses([data, ...expenses]);
      setNewExpense({ day: new Date().getDate(), amount: '', concept: '', category: 'Material' });
      saveFinalBalance();
    } catch (error) {
      alert('Error al añadir gasto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = (id) => {
    setConfirmConfig({
      show: true,
      title: 'Borrar Gasto',
      message: '¿Seguro que quieres borrar este gasto? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        const { error } = await supabase.from('bote_expenses').delete().eq('id', id);
        if (error) { alert('Error al borrar: ' + error.message); return; }
        setExpenses(expenses.filter(e => e.id !== id));
        saveFinalBalance();
      }
    });
  };

  // ── Edición inline de gasto ───────────────────────────────────────────────
  const startInlineEdit = (e) => {
    setInlineEditId(e.id);
    setInlineForm({ ...e, day: e.date.split('-')[2] });
  };

  const cancelInlineEdit = () => setInlineEditId(null);

  const handleSaveInline = async (id) => {
    setSaving(true);
    try {
      const fullDate = `${year}-${month.toString().padStart(2, '0')}-${inlineForm.day.toString().padStart(2, '0')}`;
      const payload = { date: fullDate, amount: inlineForm.amount, concept: inlineForm.concept, category: inlineForm.category };
      const { error } = await supabase.from('bote_expenses').update(payload).eq('id', id);
      if (error) throw error;
      setExpenses(expenses.map(e => e.id === id ? { ...e, ...payload } : e));
      setInlineEditId(null);
      saveFinalBalance();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Navegación de mes ─────────────────────────────────────────────────────
  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  };

  // ── Valores calculados ────────────────────────────────────────────────────
  const incomeTshirts    = stats.tshirts * 160;
  const incomeInsurances = stats.insurances * 75;
  const totalExpenses    = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const currentBalance   = initialBote + incomeTshirts + incomeInsurances - totalExpenses;

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Fecha
    year, month, setMonth, setYear, handlePrevMonth, handleNextMonth,

    // Datos
    loading, saving, initialBote, expenses, stats,

    // Fondo inicial
    isEditingInitial, setIsEditingInitial, updateInitialBote,

    // Formulario nuevo gasto
    newExpense, setNewExpense, handleAddExpense,

    // Edición inline gasto
    inlineEditId, setInlineEditId, inlineForm, setInlineForm,
    startInlineEdit, cancelInlineEdit, handleSaveInline,

    // Borrado con modal
    handleDeleteExpense,
    confirmConfig, setConfirmConfig,

    // Valores calculados
    incomeTshirts, incomeInsurances, totalExpenses, currentBalance,
  };
}
