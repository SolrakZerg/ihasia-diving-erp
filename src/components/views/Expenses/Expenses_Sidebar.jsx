import React, { useState } from 'react';
import { Users, AlertCircle, Clock, CheckCircle2, Filter } from 'lucide-react';

export default function Expenses_Sidebar({
  sidebarOpen,
  pendingByRecipient = [],
  paidByRecipient = [],
  inline = false,
  selectedRecipientIds = [],
  onToggleRecipient,
  onClearRecipient
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'paid'

  const containerClass = inline
    ? 'block lg:hidden w-full bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col overflow-hidden p-6'
    : `hidden lg:flex bg-surface border-t lg:border-t-0 lg:border-l border-surface-edge flex flex-col overflow-hidden transition-all duration-500 ease-in-out shadow-2xl z-10 mx-auto lg:mx-0 w-full max-w-[550px] lg:max-w-none
      ${sidebarOpen ? 'lg:w-[400px] p-4 sm:p-6 opacity-100' : 'lg:w-0 lg:h-full lg:p-0 lg:opacity-0'}`;

  const innerClass = inline
    ? 'flex-grow flex flex-col space-y-6'
    : 'flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 mt-4 lg:mt-10 pb-10';

  const isPending = activeTab === 'pending';
  const currentList = isPending ? pendingByRecipient : paidByRecipient;
  const currentTotal = currentList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className={containerClass}>
      <div className={innerClass}>

        {/* SIDEBAR HEADER & TABS */}
        <div className="flex flex-col gap-3 pb-4 border-b border-surface-edge/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-2xl border transition-all duration-300 ${
                isPending 
                  ? 'bg-amber-500/10 border-amber-500/20 text-warning' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Comisiones</h2>
                <p className="text-[11px] text-text-muted font-medium">
                  {isPending ? 'Pendientes de liquidar' : 'Liquidadas este mes'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total</span>
              <span className={`text-base font-black font-mono tracking-tight ${
                isPending ? 'text-warning' : 'text-emerald-400'
              }`}>
                {currentTotal.toLocaleString()} ฿
              </span>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="grid grid-cols-2 p-1 bg-surface-soft border border-surface-edge/50 rounded-2xl gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                isPending
                  ? 'bg-amber-500/15 text-warning border border-amber-500/30 shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Por Pagar</span>
              {pendingByRecipient.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                  isPending ? 'bg-amber-500/25 text-warning' : 'bg-surface-edge text-text-muted'
                }`}>
                  {pendingByRecipient.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paid')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                !isPending
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagadas</span>
              {paidByRecipient.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                  !isPending ? 'bg-emerald-500/25 text-emerald-400' : 'bg-surface-edge text-text-muted'
                }`}>
                  {paidByRecipient.length}
                </span>
              )}
            </button>
          </div>

          {/* ACTIVE FILTER NOTICE */}
          {selectedRecipientIds.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-indigo-300">
                  {selectedRecipientIds.length === 1 ? '1 persona filtrada en tabla' : `${selectedRecipientIds.length} personas filtradas`}
                </span>
              </div>
              <button
                type="button"
                onClick={onClearRecipient}
                className="text-[11px] font-black text-indigo-400 hover:text-white transition-colors underline"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* RECIPIENTS LIST */}
        <div className="space-y-3">
          {currentList.length === 0 ? (
            isPending ? (
              <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center gap-3 text-center transition-all animate-in zoom-in duration-500">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">¡Todo al día!</p>
                  <p className="text-[11px] text-white/50 mt-1">No hay comisiones pendientes de pago en este mes.</p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[2rem] bg-surface-edge/20 border border-surface-edge/30 flex flex-col items-center justify-center gap-3 text-center transition-all animate-in zoom-in duration-500">
                <div className="p-2 rounded-xl bg-surface-edge/40 text-text-muted">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-wider">Sin pagos registrados</p>
                  <p className="text-[11px] text-white/50 mt-1">Aún no se han marcado comisiones como pagadas este mes.</p>
                </div>
              </div>
            )
          ) : (
            currentList.map(p => {
              const isSelected = selectedRecipientIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => onToggleRecipient && onToggleRecipient(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleRecipient && onToggleRecipient(p.id);
                    }
                  }}
                  title={isSelected ? 'Clic para desmarcar filtro' : 'Clic para filtrar en la tabla'}
                  className={`cursor-pointer flex items-center justify-between gap-4 p-4 rounded-[2rem] transition-all duration-200 select-none group shadow-md ${
                    isSelected
                      ? 'bg-indigo-500/20 border-2 border-indigo-400 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                      : `bg-surface-soft border border-surface-edge hover:scale-[1.01] ${
                          isPending
                            ? 'hover:bg-amber-500/10 hover:border-amber-500/30'
                            : 'hover:bg-emerald-500/10 hover:border-emerald-500/30'
                        }`
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-400 text-white'
                        : 'bg-surface-edge/30 border-surface-edge/50 text-transparent group-hover:border-white/40'
                    }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-black truncate transition-colors ${
                        isSelected
                          ? 'text-indigo-200'
                          : isPending
                            ? 'text-white group-hover:text-amber-200'
                            : 'text-white group-hover:text-emerald-200'
                      }`}>{p.name}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        {p.type === 'external' ? 'Promotor Externo' : 'Staff Interno'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-lg font-black font-mono tracking-tighter ${
                      isPending ? 'text-warning' : 'text-emerald-400'
                    }`}>
                      {p.amount.toLocaleString()} ฿
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
