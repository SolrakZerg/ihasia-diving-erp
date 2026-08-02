import { AlertTriangle, X } from 'lucide-react';

export default function WisePayments_RetentionModal({
  payment,
  selectedPax,
  onSelectPax,
  onConfirm,
  onClose,
}) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface-soft border border-surface-edge rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-edge pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Marcar Depósito como Retenido</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-xs text-gray-300">
            La transferencia de <strong className="text-white">{payment.sender_name}</strong> tiene un total de <strong className="text-brand">{payment.num_people} Pax</strong>.
          </p>
          <p className="text-xs text-gray-400">
            Selecciona cuántas personas no se presentaron o no recibieron reembolso (Pax retenidos):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {Array.from({ length: payment.num_people }).map((_, idx) => {
              const paxVal = idx + 1;
              const isSelected = selectedPax === paxVal;
              return (
                <button
                  key={paxVal}
                  type="button"
                  onClick={() => onSelectPax(paxVal)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'bg-surface border-surface-edge text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base font-black">{paxVal} PAX</span>
                  <span className="text-[10px] opacity-80">
                    {paxVal === payment.num_people ? '(Retención Total)' : '(Retención Parcial)'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-edge">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Confirmar Retención
          </button>
        </div>
      </div>
    </div>
  );
}
