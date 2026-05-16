import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carabao_Invoice_Sidebar({
  showRightSidebar,
  setShowRightSidebar,
  tanksToRemove,
  updateTanksToRemove,
  remainingBalance = 0,
  paidAmount = 0,
  grandTotal = 0
}) {
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowRightSidebar(!showRightSidebar)}
        className={`absolute top-4 right-0 z-50 p-2 bg-surface-edge border border-surface-edge text-white rounded-l-xl shadow-2xl hover:bg-brand transition-all duration-300 print:hidden`}
        title={showRightSidebar ? "Cerrar Ajustes" : "Abrir Ajustes"}
      >
        {showRightSidebar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`bg-surface-soft border-l border-surface-edge flex flex-col overflow-hidden transition-all duration-500 ease-in-out shadow-2xl z-10 print:hidden ${showRightSidebar ? 'w-64 p-6 opacity-100' : 'w-0 p-0 opacity-0'}`}>
        <div className="flex-1 flex flex-col gap-6 min-w-[208px] mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Ajustes Factura</h3>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-surface-edge shadow-inner">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Tankes a Quitar</p>
            <div className="relative">
              <input
                type="number"
                value={tanksToRemove || ''}
                onChange={(e) => updateTanksToRemove(parseInt(e.target.value) || 0)}
                className="w-full bg-transparent text-3xl font-black text-white outline-none focus:ring-0 no-spinner tracking-tighter"
                placeholder="0"
              />
              <span className="absolute right-0 bottom-1.5 text-rose-400/40 font-black text-sm">unidades</span>
            </div>
            <div className="h-0.5 w-full bg-rose-400/20 rounded-full mt-1" />

            {/* Impacto en el total */}
            <div className="mt-7 pt-2 border-t border-surface-edge/50">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-0.5">Impacto en Total</p>
              <div className="relative flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-400">
                  -{(tanksToRemove * 500).toLocaleString()}
                </span>
                <span className="text-sm font-black text-text-muted">baht</span>
              </div>
            </div>
          </div>

          {/* Nuevo contenedor de Saldos */}
          <div className="bg-surface rounded-2xl p-4 border border-surface-edge shadow-inner flex flex-col gap-3">
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-0.5">Total Factura</p>
              <p className="text-2xl font-black text-white">{grandTotal.toLocaleString()} <span className="text-xs text-text-muted">฿</span></p>
            </div>

            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-0.5">Ya Pagado</p>
              <p className="text-2xl font-black text-emerald-400">{paidAmount.toLocaleString()} <span className="text-xs text-text-muted">฿</span></p>
            </div>

            <div className="pt-2 border-t border-surface-edge/50">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-0.5">Por Pagar</p>
              <div className="relative flex items-baseline justify-between">
                <span className={`text-4xl font-black tracking-tighter ${remainingBalance >= 0 ? 'text-rose-400' : 'text-rose-400'}`}>
                  {remainingBalance.toLocaleString()}
                </span>
                <span className="text-sm font-black text-text-muted">baht</span>
              </div>
              <div className={`h-0.5 w-full rounded-full mt-1 ${remainingBalance >= 0 ? 'bg-rose-400/20' : 'bg-rose-400/20'}`} />
            </div>
          </div>

          <div className="mt-auto pb-10">
            <p className="text-[11px] text-text-muted font-bold leading-relaxed italic">
              Estos ajustes solo afectan a la factura visual y no cambian los datos reales.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
