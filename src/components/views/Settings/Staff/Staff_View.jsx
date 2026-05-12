import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import useStaffData from './useStaffData';
import Staff_Header from './Staff_Header';
import Staff_AddForm from './Staff_AddForm';
import Staff_Table from './Staff_Table';
import Staff_Details from './Staff_Details';
import ConfirmModal from '../../../common/ConfirmModal';

/**
 * Staff_View — Orquestador del módulo de Personal.
 *
 * Responsabilidades:
 *  - Instancia el hook useStaffData (lógica y datos).
 *  - Gestiona el estado puramente UI: vista extendida, drawer de detalle.
 *  - Ensambla Staff_Header, Staff_AddForm, Staff_Table, ConfirmModal y StaffDetailDrawer.
 *
 * Props:
 *  - isNested {boolean}  Si se renderiza dentro de Settings (sin cabecera propia).
 */
export default function Staff_View({ isNested = false }) {
  // ── Estado puramente UI ───────────────────────────────────────────────────
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Datos y lógica ────────────────────────────────────────────────────────
  const {
    view, setView,
    staff, loading, saving, sortedStaff,
    sortConfig, handleSort,
    selectedIds, toggleSelectAll, toggleSelectOne,
    editingId, editData, setEditData,
    startEditing, cancelEdit, saveEdit,
    saveNewStaff, toggleActive, deleteStaff, handleBulkDelete,
    formData, setFormData, generateInitials,
    confirmConfig, setConfirmConfig,
  } = useStaffData();

  // ── Apertura del drawer (solo si no estamos editando inline) ──────────────
  const handleRowClick = (member) => {
    if (editingId) return;
    setSelectedStaff(member);
    setIsDrawerOpen(true);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && staff.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  // ── Vista de formulario de alta ───────────────────────────────────────────
  if (view === 'add') {
    return (
      <Staff_AddForm
        formData={formData}
        setFormData={setFormData}
        saveNewStaff={saveNewStaff}
        saving={saving}
        generateInitials={generateInitials}
        onCancel={() => setView('list')}
      />
    );
  }

  // ── Vista principal (listado) ─────────────────────────────────────────────
  return (
    <div className={`${isNested ? 'p-0' : 'p-6 lg:p-10'} mx-auto w-full flex flex-col h-full overflow-hidden transition-all duration-500 ${isExtendedView ? 'max-w-none' : 'max-w-7xl'}`}>

      <Staff_Header
        isNested={isNested}
        isExtendedView={isExtendedView}
        setIsExtendedView={setIsExtendedView}
        selectedIds={selectedIds}
        handleBulkDelete={handleBulkDelete}
        onAddNew={() => setView('add')}
      />

      <Staff_Table
        isNested={isNested}
        isExtendedView={isExtendedView}
        sortedStaff={sortedStaff}
        staff={staff}
        sortConfig={sortConfig}
        handleSort={handleSort}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        toggleSelectOne={toggleSelectOne}
        editingId={editingId}
        editData={editData}
        setEditData={setEditData}
        saveEdit={saveEdit}
        cancelEdit={cancelEdit}
        toggleActive={toggleActive}
        startEditing={startEditing}
        deleteStaff={deleteStaff}
        onRowClick={handleRowClick}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
      />

      {/* Drawer de detalle */}
      <Staff_Details
        member={selectedStaff}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
