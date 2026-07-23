import { ShieldCheck, Send, CreditCard, Loader2, X, Trash2 } from 'lucide-react';

export default function Customers_ActionBar({
  selectedCount,
  onClear,
  onSend,
  onBilling,
  onDelete,
  isProcessing,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-surface/90 border border-brand/30 shadow-2xl shadow-brand/10 backdrop-blur-xl rounded-full px-3 py-2 sm:px-6 sm:py-3 flex items-center gap-2 sm:gap-4">

        {/* Count */}
        <div className="flex items-center gap-1.5 text-brand pl-1 sm:pl-0">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold text-sm sm:text-base">
            {selectedCount} <span className="font-medium text-gray-300 hidden sm:inline">seleccionados</span>
          </span>
        </div>

        <div className="w-px h-6 bg-surface-edge mx-1 sm:mx-2" />

        {/* Actions */}
        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={onSend}
            className="bg-brand/10 text-brand border border-brand/20 text-sm font-bold p-2 sm:px-4 sm:py-2 rounded-full hover:bg-brand/20 transition-colors flex items-center gap-2"
            title="Enviar a Seguros"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">A Seguros</span>
          </button>

          <button
            onClick={onBilling}
            disabled={isProcessing}
            className="bg-cyan-600 text-white text-sm font-bold p-2 sm:px-4 sm:py-2 rounded-full hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50"
            title="Enviar a Facturación"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">A Facturación</span>
          </button>

          <button
            onClick={onDelete}
            className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-bold p-2 sm:px-4 sm:py-2 rounded-full hover:bg-rose-500/20 transition-colors flex items-center gap-2"
            title="Eliminar seleccionados"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-rose-400 p-2 rounded-full hover:bg-surface-edge transition-colors"
          title="Descartar selección"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
