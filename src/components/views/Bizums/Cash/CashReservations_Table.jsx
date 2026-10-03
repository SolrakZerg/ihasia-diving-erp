import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import useCashReservationsData from './useCashReservationsData';
import CashReservations_Header from './CashReservations_Header';
import CashReservations_Row from './CashReservations_Row';
import CashReservationModal from './CashReservationModal';
import ConfirmModal from '../../../common/ConfirmModal';

export default function CashReservations_Table() {
  const {
    reservations,
    loading,
    totalCount,
    totalPages,
    currentPage,
    goToPage,
    activeTab,
    handleTabChange,
    searchTerm,
    handleSearchChange,
    handleDelete,
    fetchReservations,
    isCreateModalOpen,
    setIsCreateModalOpen,
    showToast,
    toastMsg,
    confirmConfig,
    dismissConfirm,
  } = useCashReservationsData();

  const renderTableHeader = () => (
    <thead>
      <tr className="bg-surface-soft/80 border-b border-surface-edge text-gray-400 font-bold text-[11px] uppercase tracking-wider select-none">
        <th className="py-3 px-3 text-center">Fecha Reserva</th>
        <th className="py-3 px-3 text-left min-w-[220px]">Remitente / Cliente</th>
        <th className="py-3 px-2 text-center">Pax</th>
        <th className="py-3 px-3 text-center border-r border-surface-edge/10 min-w-[100px]">Actividad</th>
        <th className="py-3 px-2 text-center">WhatsApp</th>
        <th className="py-3 px-3 text-right">Importe</th>
        <th className="py-3 px-3 text-center">Facturación</th>
        <th className="py-3 px-2 text-center">Calendar</th>
        <th className="py-3 px-3 text-right">ACC.</th>
      </tr>
    </thead>
  );

  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="9" className="py-12 text-center text-gray-400 font-medium text-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              Cargando reservas en efectivo...
            </div>
          </td>
        </tr>
      );
    }

    if (reservations.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="py-12 text-center text-gray-400 font-medium text-xs">
            {searchTerm.trim()
              ? 'No se encontraron reservas con ese criterio de búsqueda.'
              : activeTab === 'pending'
              ? 'No hay reservas pendientes de facturar. ¡Todo al día!'
              : activeTab === 'imported'
              ? 'No hay reservas facturadas registradas.'
              : 'No hay reservas en efectivo registradas aún.'}
          </td>
        </tr>
      );
    }

    return reservations.map((row) => (
      <CashReservations_Row
        key={row.id}
        row={row}
        onDelete={handleDelete}
      />
    ));
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Header */}
      <CashReservations_Header
        totalCount={totalCount}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onNewReservationClick={() => setIsCreateModalOpen(true)}
      />

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto min-h-0 rounded-xl border border-surface-edge bg-surface-soft/20">
        <table className="w-full border-collapse text-left border-surface-edge/60">
          {renderTableHeader()}
          <tbody className="divide-y divide-surface-edge/60 text-sm">
            {renderRows()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-edge">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-edge text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-gray-400 font-bold">
            Página {currentPage + 1} de {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-edge text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Nueva Reserva Cash */}
      <CashReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onReservationCreated={() => {
          fetchReservations();
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmConfig.show}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={dismissConfirm}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-8 z-[150] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/50">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-xs tracking-wide">{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
