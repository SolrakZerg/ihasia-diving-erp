import React from 'react';
import { ShieldCheck, Send, CreditCard, Loader2, X, Trash2, Calendar } from 'lucide-react';

export default function Customers_ActionBar({
  selectedCount,
  onClear,
  onSend,
  onRoster,
  onBilling,
  onDelete,
  isProcessing,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-auto max-w-[95vw]">
      <div className="bg-surface/95 border border-brand/40 shadow-2xl shadow-brand/15 backdrop-blur-xl rounded-full px-4 py-2.5 sm:px-7 sm:py-3.5 flex items-center gap-3 sm:gap-5 whitespace-nowrap">

        {/* Count */}
        <div className="flex items-center gap-2 text-brand pl-1 sm:pl-0 shrink-0">
          <ShieldCheck className="w-5 h-5 text-brand" />
          <span className="font-bold text-sm sm:text-base whitespace-nowrap">
            {selectedCount} <span className="font-medium text-gray-300 hidden sm:inline">seleccionados</span>
          </span>
        </div>

        <div className="w-px h-6 bg-surface-edge mx-1 shrink-0" />

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar">
          
          {/* A Seguros */}
          <button
            onClick={onSend}
            className="bg-brand/10 text-brand border border-brand/20 text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-brand/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            title="Enviar a Seguros"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>A Seguros</span>
          </button>

          {/* A Roster */}
          <button
            onClick={onRoster}
            className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-sky-500/25 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
            title="Enviar a Roster Diario"
          >
            <Calendar className="w-4 h-4 shrink-0 text-sky-400" />
            <span>A Roster</span>
          </button>

          {/* A Facturación */}
          <button
            onClick={onBilling}
            disabled={isProcessing}
            className="bg-cyan-600 text-white text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-cyan-500 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-lg shadow-cyan-900/30 disabled:opacity-50"
            title="Enviar a Facturación"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <CreditCard className="w-4 h-4 shrink-0" />
            )}
            <span>A Facturación</span>
          </button>

          {/* Eliminar */}
          <button
            onClick={onDelete}
            className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs sm:text-sm font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-rose-500/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            title="Eliminar seleccionados"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Eliminar</span>
          </button>
        </div>

        {/* Descartar Selección */}
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-rose-400 p-2 rounded-full hover:bg-surface-edge transition-colors shrink-0 ml-1"
          title="Descartar selección"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
