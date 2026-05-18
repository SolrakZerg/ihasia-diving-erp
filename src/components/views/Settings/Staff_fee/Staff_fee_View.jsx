import { Loader2, Plus, PlusCircle } from 'lucide-react';
import useStaffFeeData from './useStaffFeeData';
import Staff_fee_AddForm from './Staff_fee_AddForm';
import Staff_fee_Table from './Staff_fee_Table';
import ConfirmModal from '../../../common/ConfirmModal';

/**
 * Staff_fee_View — Orquestador del módulo de Tarifas de Staff.
 *
 * Consume useStaffFeeData y ensambla los subcomponentes.
 * No contiene lógica de negocio propia.
 */
export default function Staff_fee_View() {
  const {
    view, setView,
    payouts, activities, loading, saving, sortedPayouts,
    sortConfig, handleSort,
    savePayout, deletePayout,
    saveEdit,
    formData, setFormData,
    confirmConfig, setConfirmConfig,
    categories,
  } = useStaffFeeData();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand animate-spin" />
    </div>
  );

  // ── Vista: Añadir regla ───────────────────────────────────────────────────
  if (view === 'add') return (
    <Staff_fee_AddForm
      formData={formData}
      setFormData={setFormData}
      savePayout={savePayout}
      saving={saving}
      activities={activities}
      payouts={payouts}
      onCancel={() => setView('list')}
    />
  );

  // ── Vista: Listado ────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-brand" /> Sueldos por Actividad
          </h2>
        </div>
        <button
          onClick={() => setView('add')}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/20"
        >
          <Plus className="w-4 h-4" /> Nueva Regla
        </button>
      </div>

      {/* Tabla */}
      <Staff_fee_Table
        sortedPayouts={sortedPayouts}
        sortConfig={sortConfig}
        handleSort={handleSort}
        saveEdit={saveEdit}
        deletePayout={deletePayout}
        categories={categories}
      />

      {/* Modal confirmación */}
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
