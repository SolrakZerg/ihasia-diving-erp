import { Loader2, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import useBoteData, { MONTHS } from './useBoteData';
import Bote_Stats from './Bote_Stats';
import Bote_ExpenseTable from './Bote_ExpenseTable';
import Bote_ExpenseForm from './Bote_ExpenseForm';
import ConfirmModal from '../../../common/ConfirmModal';

/**
 * Bote_View — Orquestador del módulo Gestión de Bote.
 * Consume useBoteData y ensambla todos los subcomponentes.
 * No contiene lógica de negocio propia.
 */
export default function Bote_View() {
  const {
    year, month, setMonth, setYear, handlePrevMonth, handleNextMonth,
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
        <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
              ))}
            </select>

            <div className="w-px h-4 bg-surface-edge/30 mx-1" />

            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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
