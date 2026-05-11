import React from 'react';
import { Receipt, ChevronLeft, ChevronRight, Settings, TrendingDown, Users } from 'lucide-react';

const Expenses_Header = ({
  handlePrevMonth,
  handleNextMonth,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  setShowConfigModal,
  monthlyTotal,
  commissionsPaid,
  commissionsPending,
  oxygenTotal,
  oxygenPending,
  pendingByRecipient
}) => {
  return (
    <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] sticky top-0 h-[200px]">
      <div className="max-w-[1700px] mx-auto px-8 h-full flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-brand/20 p-3 rounded-2xl ring-1 ring-brand/30">
              <Receipt className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Gastos</h1>
            </div>
          </div>

          {/* HYBRID DATE SELECTOR */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
                >
                  {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                    <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                  ))}
                </select>
                
                <div className="w-px h-4 bg-surface-edge/30 mx-1" />

                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowConfigModal(true)} 
              className="p-2.5 rounded-2xl bg-surface-edge/10 border border-surface-edge/30 text-gray-500 hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
              title="Configuración"
            >
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>

        {/* DIVIDER & WIDGETS 2x2 SECTION */}
        <div className="hidden md:flex flex-1 items-center gap-8 self-stretch py-0">
          <div className="w-px h-full bg-surface-edge/40" />
          
          <div className="grid grid-cols-2 gap-x-4">
            <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-rose-500/10 transition-all">
               <div className="p-2 rounded-2xl bg-rose-500/10 mb-2 text-rose-400 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-4 h-4" />
               </div>
               <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] leading-none mb-2">GASTO MES</span>
               <span className="text-3xl font-black text-white tracking-tighter">
                  -{(monthlyTotal + commissionsPaid + commissionsPending + oxygenTotal).toLocaleString()} 
                  <span className="text-sm font-black text-rose-500/40 ml-1 italic font-mono">฿</span>
               </span>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px] shadow-sm group hover:bg-amber-500/10 transition-all">
               <div className="p-2 rounded-2xl bg-amber-500/10 mb-2 text-amber-400 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-4 h-4" />
               </div>
               <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em] leading-none mb-2">PENDIENTE</span>
               <span className="text-3xl font-black text-white tracking-tighter">
                  {(commissionsPending + oxygenPending).toLocaleString()} 
                  <span className="text-sm font-black text-amber-500/40 ml-1 italic font-mono">฿</span>
               </span>
            </div>
          </div>

          <div className="w-px h-full bg-surface-edge/40" />

          {/* PENDING COMMISSIONS BY INDIVIDUAL - RESTORED */}
          <div className="flex flex-col gap-3 min-w-[420px] max-w-[600px]">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-indigo-500/40" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                <Users className="w-3 h-3" /> Comisiones Pendientes
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-indigo-500/20 to-indigo-500/40" />
            </div>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
              {pendingByRecipient.length === 0 ? (
                <div className="col-span-2 py-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] text-emerald-500/70 font-bold italic text-center">
                  Todos los pagos están al día
                </div>
              ) : (
                pendingByRecipient.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-0.5 px-3 bg-surface-edge/5 hover:bg-indigo-500/10 rounded-xl border border-surface-edge/10 hover:border-indigo-500/20 transition-all group/row">
                    <span className="text-[12px] font-bold text-white/70 group-hover/row:text-white truncate max-w-[100px]">{p.name}</span>
                    <span className="text-[12px] font-black text-amber-500 font-mono tracking-tighter whitespace-nowrap">{p.amount.toLocaleString()} ฿</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-px h-full bg-surface-edge/40" />
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Espacio libre a la derecha */}
        </div>
      </div>
    </div>
  );
};

export default Expenses_Header;
