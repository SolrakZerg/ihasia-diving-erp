import { 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import useWisePaymentsData from './useWisePaymentsData';
import WisePayments_Header from './WisePayments_Header';
import WisePayments_Row from './WisePayments_Row';
import WisePayments_RetentionModal from './WisePayments_RetentionModal';
import WisePayments_EditModal from './WisePayments_EditModal';
import WisePayments_ProcessModal from './WisePayments_ProcessModal';

export default function WisePayments_Table() {
  const {
    payments,
    loading,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    handleSearchChange,
    activeTab,
    handleTabChange,
    toggleProcessed,
    toggleRetained,
    toggleSettled,
    retentionModalPayment,
    setRetentionModalPayment,
    selectedRetainedPax,
    setSelectedRetainedPax,
    confirmRetentionModal,
    editingPayment,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,
    handleDelete,
    processModalPayment,
    isProcessModalOpen,
    setIsProcessModalOpen,
    fetchPayments
  } = useWisePaymentsData();

  const renderTableHeader = () => (
    <thead>
      <tr className="bg-surface-soft border-b border-surface-edge text-gray-400 font-semibold tracking-wider uppercase text-[10px]">
        <th className="py-2.5 px-4 text-center">Registrado</th>
        <th className="py-2.5 px-4">Remitente</th>
        <th className="py-2.5 px-4 text-center">Pax</th>
        <th className="py-2.5 px-4 text-right">Importe Recibido</th>
        {activeTab !== 'retained' ? (
          <>
            <th className="py-2.5 px-4 text-center">Procesado</th>
            <th className="py-2.5 px-4 text-center">Retenido</th>
          </>
        ) : (
          <th className="py-2.5 px-4 text-center">Repartido</th>
        )}
        <th className="py-2.5 px-4">Referencia</th>
        <th className="py-2.5 px-4">ID Transferencia</th>
        <th className="py-2.5 px-4 text-center">ACC.</th>
      </tr>
    </thead>
  );

  const renderRows = (list, emptyMsg) => {
    if (loading) {
      return (
        <tr>
          <td colSpan="9" className="py-8 text-center text-gray-400 font-medium text-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              Cargando transferencias de Wise...
            </div>
          </td>
        </tr>
      );
    }

    if (list.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="py-8 text-center text-gray-400 font-medium text-xs">
            {emptyMsg}
          </td>
        </tr>
      );
    }

    return list.map((payment) => (
      <WisePayments_Row
        key={payment.id}
        payment={payment}
        activeTab={activeTab}
        onToggleProcessed={toggleProcessed}
        onToggleRetained={toggleRetained}
        onToggleSettled={toggleSettled}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Cabecera */}
      <WisePayments_Header
        totalCount={totalCount}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Tabla según la pestaña activa */}
      {activeTab === 'retained' ? (
        <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
          {/* SECCIÓN 1: PENDIENTES DE REPARTIR ENTRE SOCIOS */}
          <div className="bg-surface-soft/40 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    Pendientes de Repartir entre Socios
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {payments.filter(p => !p.is_settled).length} registros
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">
                Depósito retenido en Wise. Haz el reparto entre socios y marca "REPARTIDO"
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[290px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                {renderTableHeader()}
                <tbody className="divide-y divide-surface-edge/60 text-sm">
                  {renderRows(payments.filter(p => !p.is_settled), '🎉 ¡Genial! No hay depósitos retenidos pendientes de repartir entre socios.')}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 2: HISTORIAL DE REPARTIDOS */}
          <div className="flex-1 flex flex-col min-h-0 bg-surface-soft/40 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                    Historial de Repartidos (Liquidado)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {payments.filter(p => p.is_settled).length} registros
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-medium hidden sm:inline">
                Cuentas saldadas. Depósitos liquidados entre los socios.
              </span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                {renderTableHeader()}
                <tbody className="divide-y divide-surface-edge/60 text-sm">
                  {renderRows(payments.filter(p => p.is_settled), 'No hay depósitos liquidados en el historial.')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto min-h-0 rounded-xl border border-surface-edge bg-surface-soft/20">
          <table className="w-full border-collapse text-left border-surface-edge/60">
            {renderTableHeader()}
            <tbody className="divide-y divide-surface-edge/60 text-sm">
              {renderRows(payments, activeTab === 'pending' ? 'No hay pagos pendientes de Wise.' : 'No hay pagos procesados en el historial.')}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-edge">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-edge text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-gray-400 font-bold">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-edge text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de Procesamiento de Reserva */}
      <WisePayments_ProcessModal
        payment={processModalPayment}
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onProcessedSuccess={fetchPayments}
      />

      {/* Modal de Retención Parcial/Total */}
      <WisePayments_RetentionModal
        payment={retentionModalPayment}
        selectedPax={selectedRetainedPax}
        onSelectPax={setSelectedRetainedPax}
        onConfirm={confirmRetentionModal}
        onClose={() => setRetentionModalPayment(null)}
      />

      {/* Modal de Edición Completo */}
      <WisePayments_EditModal
        payment={editingPayment}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={fetchPayments}
      />
    </div>
  );
}
