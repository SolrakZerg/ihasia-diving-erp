import { useEffect } from 'react';
import { Banknote, X } from 'lucide-react';
import useCashReservationModal from './useCashReservationModal';
import CashReservation_Form from './CashReservation_Form';
import CashReservation_Success from './CashReservation_Success';

export default function CashReservationModal({
  isOpen,
  onClose,
  onReservationCreated,
  modalState
}) {
  const internalState = useCashReservationModal(onReservationCreated);
  const state = modalState || internalState;

  const isModalOpen = isOpen !== undefined ? isOpen : state.isOpen;

  const handleClose = () => {
    state.closeModal();
    if (onClose) {
      onClose();
    }
  };

  // Reset form whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      state.openModal();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-surface border border-surface-edge rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[96vh] sm:max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-surface-soft border-b border-surface-edge px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Nueva Reserva Cash</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                  Alt + B
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-400">
                Add to Calendar • Depósito en Efectivo Koh Tao
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Éxito o Formulario */}
        {state.successResult ? (
          <CashReservation_Success
            result={state.successResult}
            onReset={state.resetForm}
            onClose={handleClose}
          />
        ) : (
          <CashReservation_Form
            selectedDate={state.selectedDate}
            onSelectDate={state.setSelectedDate}
            currentMonth={state.currentMonth}
            onChangeMonth={state.setCurrentMonth}
            customerName={state.customerName}
            onChangeCustomerName={state.setCustomerName}
            phone={state.phone}
            onChangePhone={state.setPhone}
            onPasteClipboard={state.handlePasteClipboard}
            activities={state.activities}
            onAddActivity={state.handleAddActivity}
            onRemoveActivity={state.handleRemoveActivity}
            onUpdateActivity={state.handleUpdateActivity}
            reservaPax={state.reservaPax}
            onChangeReservaPax={state.setReservaPax}
            paymentMethod={state.paymentMethod}
            onChangePaymentMethod={state.setPaymentMethod}
            isEnglish={state.isEnglish}
            onToggleEnglish={state.setIsEnglish}
            previewWaText={state.previewWaText}
            onSubmit={state.handleSubmit}
            isSubmitting={state.isSubmitting}
            errorMessage={state.errorMessage}
          />
        )}
      </div>
    </div>
  );
}
