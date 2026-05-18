import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";

export const useGastosFijosData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [toast, setToast] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', icon: 'Euro', color: 'text-gray-400' });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await supabase.from('fixed_expenses').select('*').order('name');
      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateExpense = async (id, field, value) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update({ [field]: field === 'amount' ? Number(value) : value, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      showToast('Gasto actualizado correctamente');
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      showToast('Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('fixed_expenses').insert([{
        ...newExpense,
        amount: Number(newExpense.amount)
      }]);
      if (error) throw error;
      showToast('Nuevo gasto añadido');
      setIsAdding(false);
      setNewExpense({ name: '', amount: '', icon: 'Euro', color: 'text-gray-400' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      showToast('Error al añadir', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (error) throw error;
      showToast('Gasto eliminado');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Error al eliminar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    expenses,
    toast,
    isAdding,
    setIsAdding,
    newExpense,
    setNewExpense,
    updateExpense,
    addExpense,
    deleteExpense
  };
};
