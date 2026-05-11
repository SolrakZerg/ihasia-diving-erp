import { ShieldCheck, Send, CreditCard, Loader2, X } from 'lucide-react';

export default function Customers_ActionBar({
  selectedCount,
  onClear,
  onSend,
  onBilling,
  isProcessing,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-surface/90 border border-brand/30 shadow-2xl shadow-brand/10 backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-4">

        {/* Count */}
        <div className="flex items-center gap-2 text-brand">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold">
            {selectedCount} <span className="font-medium text-gray-300">seleccionados</span>
          </span>
        </div>

        <div className="w-px h-6 bg-surface-edge mx-2" />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSend}
            className="bg-brand/10 text-brand border border-brand/20 text-sm font-bold px-4 py-2 rounded-full hover:bg-brand/20 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            A Seguros
          </button>

          <button
            onClick={onBilling}
            disabled={isProcessing}
            className="bg-cyan-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-900/20 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            A Facturación
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
