import React from 'react';
import { Download, Calendar, Loader2, CreditCard, Send } from 'lucide-react';

export default function InsuranceFooterActions({
  customers = [],
  selectedIds = new Set(),
  sendToBilling,
  setSendToBilling,
  sendToRoster,
  setSendToRoster,
  setConfirmSend,
  loadTodayCustomers,
  setShowLoadModal,
  onSendSelectedToRoster,
  processing,
  loading
}) {
  return (
    <div className="p-4 border-t border-surface-edge bg-surface/50 flex justify-between items-center flex-none gap-3 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          onClick={loadTodayCustomers}
          disabled={processing || loading}
          title="Añadir a la lista todos los registrados para hoy"
          className="flex items-center gap-1.5 bg-surface border border-emerald-500/50 text-emerald-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/10 transition-colors cursor-pointer"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Reservas Hoy
        </button>

        <button
          type="button"
          onClick={() => setShowLoadModal(true)}
          disabled={processing || loading}
          title="Añadir reservas de una fecha y actividad personalizada"
          className="flex items-center gap-1.5 bg-surface border border-cyan-500/50 text-cyan-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-cyan-500/10 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          <span>Cargar por Fecha</span>
        </button>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => {
              const selectedCusts = customers.filter(c => selectedIds.has(c.id));
              if (onSendSelectedToRoster) onSendSelectedToRoster(selectedCusts);
            }}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-sky-900/30 cursor-pointer animate-in fade-in"
            title="Mandar solo los clientes seleccionados al Roster"
          >
            <Calendar className="w-4 h-4" />
            <span>Mandar a Roster ({selectedIds.size})</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
        <label className="flex items-center gap-1.5 text-xs font-black text-gray-300 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={sendToBilling}
            onChange={(e) => setSendToBilling(e.target.checked)}
            className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-brand focus:ring-brand accent-brand cursor-pointer"
          />
          <span>Facturación</span>
        </label>

        <label className="flex items-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wider cursor-pointer select-none hover:text-sky-300 transition-colors">
          <input
            type="checkbox"
            checked={sendToRoster}
            onChange={(e) => setSendToRoster(e.target.checked)}
            className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
          />
          <span>Roster</span>
        </label>

        <button
          disabled={customers.length === 0 || processing}
          onClick={() => setConfirmSend({ show: true, sendToBilling, sendToRoster })}
          className={`font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-xs cursor-pointer ${
            sendToRoster
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/20'
              : sendToBilling
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'
              : 'bg-brand hover:bg-brand-light text-white shadow-brand/20'
          }`}
        >
          {processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : sendToRoster ? (
            <Calendar className="w-4 h-4" />
          ) : sendToBilling ? (
            <CreditCard className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sendToRoster && sendToBilling
            ? 'Enviar, Facturación y Roster'
            : sendToRoster
            ? 'Enviar y Roster'
            : sendToBilling
            ? 'Enviar y Facturación'
            : 'Enviar Seguros'}
        </button>
      </div>
    </div>
  );
}
