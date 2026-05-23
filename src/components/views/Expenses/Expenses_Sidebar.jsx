import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

export default function Expenses_Sidebar({
  sidebarOpen,
  pendingByRecipient = [],
  inline = false
}) {
  const containerClass = inline
    ? 'block lg:hidden w-full bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col overflow-hidden p-6'
    : `hidden lg:flex bg-surface border-t lg:border-t-0 lg:border-l border-surface-edge flex flex-col overflow-hidden transition-all duration-500 ease-in-out shadow-2xl z-10 mx-auto lg:mx-0 w-full max-w-[550px] lg:max-w-none
      ${sidebarOpen ? 'lg:w-[400px] p-4 sm:p-6 opacity-100' : 'lg:w-0 lg:h-full lg:p-0 lg:opacity-0'}`;

  const innerClass = inline
    ? 'flex-grow flex flex-col space-y-6'
    : 'flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 mt-4 lg:mt-10 pb-10';

  return (
    <div className={containerClass}>
      <div className={innerClass}>

        {/* SIDEBAR HEADER */}
        <div className="flex items-center gap-3 pb-4 border-b border-surface-edge/30">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Comisiones Pendientes</h2>
          </div>
        </div>

        {/* RECIPIENTS LIST */}
        <div className="space-y-3">
          {pendingByRecipient.length === 0 ? (
            <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center gap-3 text-center transition-all animate-in zoom-in duration-500">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">¡Todo al día!</p>
                <p className="text-[11px] text-white/50 mt-1">No hay comisiones pendientes de pago en este mes.</p>
              </div>
            </div>
          ) : (
            pendingByRecipient.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 p-4 bg-surface-soft hover:bg-indigo-500/10 border border-surface-edge rounded-[2rem] hover:border-indigo-500/20 transition-all duration-300 group shadow-md"
              >
                <div className="flex items-center min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate group-hover:text-indigo-200 transition-colors">{p.name}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      {p.type === 'external' ? 'Promotor Externo' : 'Staff Interno'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-warning font-mono tracking-tighter">
                    {p.amount.toLocaleString()} ฿
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
