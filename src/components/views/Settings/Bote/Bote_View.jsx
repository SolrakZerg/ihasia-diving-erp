import { Loader2, PiggyBank } from 'lucide-react';
import useBoteData, { MONTHS } from './useBoteData';
import Bote_Stats from './Bote_Stats';
import Bote_ExpenseTable from './Bote_ExpenseTable';
import Bote_ExpenseForm from './Bote_ExpenseForm';
import ConfirmModal from '../../../common/ConfirmModal';
import MonthYearSelector from '../../../common/MonthYearSelector';

/**
 * Bote_View — Orquestador del módulo Gestión de Bote.
 * Consume useBoteData y ensambla todos los subcomponentes.
 * No contiene lógica de negocio propia.
 */
export default function Bote_View() {
  const {
    year, month, setMonth, setYear,
    loading, saving, initialBote, expenses, stats,
    isEditingInitial, setIsEditingInitial, updateInitialBote,
    newExpense, setNewExpense, handleAddExpense,
    inlineEditId, setInlineEditId, inlineForm, setInlineForm,
    startInlineEdit, cancelInlineEdit, handleSaveInline,
    handleDeleteExpense,
    confirmConfig, setConfirmConfig,
    incomeTshirts, incomeInsurances, totalExpenses, currentBalance,
    pendingAmount, apartarReal,
  } = useBoteData();

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* ── Header & Date Selector ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-soft/30 p-6 rounded-[2.5rem] border border-surface-edge">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-brand" />
            Gestión de Bote
          </h1>
        </div>

        {/* Selector de mes/año */}
        <MonthYearSelector
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          shortNames={true}
        />
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <Bote_Stats
        initialBote={initialBote}
        isEditingInitial={isEditingInitial}
        setIsEditingInitial={setIsEditingInitial}
        updateInitialBote={updateInitialBote}
        incomeTshirts={incomeTshirts}
        incomeInsurances={incomeInsurances}
        totalExpenses={totalExpenses}
        currentBalance={currentBalance}
        stats={stats}
        month={month}
        months={MONTHS}
        pendingAmount={pendingAmount}
        apartarReal={apartarReal}
      />

      <div className="pt-4" />

      {/* ── Tabla + Formulario ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Bote_ExpenseTable
          expenses={expenses}
          inlineEditId={inlineEditId}
          inlineForm={inlineForm}
          setInlineForm={setInlineForm}
          startInlineEdit={startInlineEdit}
          handleSaveInline={handleSaveInline}
          cancelInlineEdit={cancelInlineEdit}
          handleDeleteExpense={handleDeleteExpense}
        />
        <Bote_ExpenseForm
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          handleAddExpense={handleAddExpense}
          saving={saving}
        />
      </div>

      {/* ── Modal de confirmación ────────────────────────────────────────────── */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
