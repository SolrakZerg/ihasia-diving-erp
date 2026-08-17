import React from 'react';
import { Calendar, Filter, X, Loader2, Download } from 'lucide-react';

export default function InsuranceLoadModal({
  isOpen,
  onClose,
  targetLoadDate,
  setTargetLoadDate,
  targetLoadActivity,
  setTargetLoadActivity,
  loadCustomersByDate,
  processing,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-surface-edge shadow-brand/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-surface-edge pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Cargar Reservas por Fecha
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Fecha de Reserva
            </label>
            <input
              type="date"
              value={targetLoadDate}
              onChange={(e) => setTargetLoadDate(e.target.value)}
              className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Actividad Reservada
            </label>
            <select
              value={targetLoadActivity}
              onChange={(e) => setTargetLoadActivity(e.target.value)}
              className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors shadow-inner cursor-pointer"
            >
              <option value="Fun Dive">🌊 Fun Dives (Por defecto)</option>
              <option value="ALL">🤿 Todas las Actividades</option>
              <option value="Open Water">🟢 Open Water</option>
              <option value="Advanced">🔵 Advanced</option>
              <option value="Try Dive">🔴 Try Dive / Bautizo</option>
              <option value="Refresh">🟡 Refresher</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-edge">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:bg-surface-edge hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (targetLoadDate) {
                loadCustomersByDate(targetLoadDate, targetLoadActivity);
                onClose();
              }
            }}
            disabled={processing || loading || !targetLoadDate}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 cursor-pointer"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Cargar Reservas
          </button>
        </div>
      </div>
    </div>
  );
}
