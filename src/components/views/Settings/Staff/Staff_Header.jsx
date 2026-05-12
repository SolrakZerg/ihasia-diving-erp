import { Plus, Trash2, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Staff_Header — Cabecera de la vista de Personal.
 *
 * Props:
 *  - isNested         {boolean}   Si el componente está embebido dentro de Settings.
 *  - isExtendedView   {boolean}   Si la tabla está en modo extendido.
 *  - setIsExtendedView {function} Alterna el modo extendido.
 *  - selectedIds      {Set}       IDs seleccionados (para mostrar botón bulk delete).
 *  - handleBulkDelete {function}  Callback de borrado masivo.
 *  - onAddNew         {function}  Callback para abrir el formulario de alta.
 */
export default function Staff_Header({
  isNested,
  isExtendedView,
  setIsExtendedView,
  selectedIds,
  handleBulkDelete,
  onAddNew,
}) {
  const actionButtons = (
    <div className="flex items-center gap-3">
      {selectedIds.size > 0 && (
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-sm font-bold"
        >
          <Trash2 className="w-4 h-4" /> Borrar ({selectedIds.size})
        </button>
      )}
      <button
        onClick={() => setIsExtendedView(!isExtendedView)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${
          isExtendedView
            ? 'bg-brand/20 border-brand text-brand'
            : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white'
        }`}
        title={isExtendedView ? 'Vista Compacta' : 'Vista Extendida'}
      >
        {isExtendedView
          ? <ChevronsLeft className="w-4 h-4" />
          : <ChevronsRight className="w-4 h-4" />}
        <span>{isExtendedView ? 'Compacto' : 'Extendido'}</span>
      </button>
      <button
        onClick={onAddNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-all text-sm font-bold shadow-lg shadow-brand/20"
      >
        <Plus className="w-4 h-4" /> Nuevo Miembro
      </button>
    </div>
  );

  // ── Modo standalone (no anidado) ──────────────────────────────────────────
  if (!isNested) {
    return (
      <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Gestión de Personal
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Control de instructores, dive masters y personal de apoyo.
          </p>
        </div>
        {actionButtons}
      </div>
    );
  }

  // ── Modo anidado (dentro de Settings) ────────────────────────────────────
  return (
    <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-end gap-4 p-8 pb-0">
      {actionButtons}
    </div>
  );
}
