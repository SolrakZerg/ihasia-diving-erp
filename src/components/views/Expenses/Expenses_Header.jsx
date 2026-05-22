import React, { useState } from 'react';
import { DollarSign, Settings, TrendingDown, Users, ChevronDown } from 'lucide-react';
import MonthYearSelector from '../../common/MonthYearSelector';

const Expenses_Header = ({
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] md:sticky top-0 transition-all duration-300 py-6 px-3 sm:px-6 lg:px-8 relative ${isExpanded ? 'header-expanded' : 'header-collapsed'}`}>
      <div className="header-full-content max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 overflow-x-auto custom-scrollbar">
        
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-brand" />
              Gastos
            </h1>
          </div>

          {/* MONTH/YEAR SELECTOR */}
          <div className="flex items-center gap-3">
            <MonthYearSelector
              month={selectedMonth}
              setMonth={setSelectedMonth}
              year={selectedYear}
              setYear={setSelectedYear}
              shortNames
            />
            
            <button 
              onClick={() => setShowConfigModal(true)} 
              className="p-2.5 rounded-2xl bg-surface-edge/10 border border-surface-edge/30 text-text-header hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
              title="Configuración"
            >
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>

        {/* DIVIDER & WIDGETS 2x2 SECTION */}
        <div className="flex flex-col md:flex-row flex-1 items-center gap-8 self-stretch py-0">
          <div className="w-full h-px md:w-px md:h-full bg-surface-edge/40 shrink-0" />
          
          <div className="flex flex-wrap gap-4 shrink-0 justify-center">
            <div className="stats-widget min-w-[140px]" style={{ '--widget-color': 'var(--color-danger)' }}>
               <div className="stats-widget-icon mb-2">
                  <TrendingDown className="w-4 h-4" />
               </div>
               <span className="stats-widget-title mb-2">GASTO MES</span>
               <span className="stats-widget-value">
                  -{(monthlyTotal + commissionsPaid + commissionsPending + oxygenTotal).toLocaleString()} 
                  <span className="stats-widget-currency">฿</span>
               </span>
            </div>

            <div className="stats-widget min-w-[140px]" style={{ '--widget-color': 'var(--color-warning)' }}>
               <div className="stats-widget-icon mb-2">
                  <TrendingDown className="w-4 h-4" />
               </div>
               <span className="stats-widget-title mb-2">PENDIENTE</span>
               <span className="stats-widget-value">
                  {(commissionsPending + oxygenPending).toLocaleString()} 
                  <span className="stats-widget-currency">฿</span>
               </span>
            </div>
          </div>

          <div className="w-full h-px md:w-px md:h-full bg-surface-edge/40 shrink-0" />

          {/* PENDING COMMISSIONS BY INDIVIDUAL - RESTORED */}
          <div className="flex flex-col gap-3 w-full max-w-[500px] shrink-0">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-indigo-500/40" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                <Users className="w-3 h-3" /> Comisiones Pendientes
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-indigo-500/20 to-indigo-500/40" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
              {pendingByRecipient.length === 0 ? (
                <div className="col-span-2 py-3 px-4 bg-success/5 border border-success/10 rounded-2xl text-[11px] text-success/70 font-bold italic text-center">
                  Todos los pagos están al día
                </div>
              ) : (
                pendingByRecipient.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-0.5 px-3 bg-surface-edge/5 hover:bg-indigo-500/10 rounded-xl border border-surface-edge/10 hover:border-indigo-500/20 transition-all group/row">
                    <span className="text-[12px] font-bold text-white/70 group-hover/row:text-white truncate max-w-[100px]">{p.name}</span>
                    <span className="text-[12px] font-black text-warning font-mono tracking-tighter whitespace-nowrap">{p.amount.toLocaleString()} ฿</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full h-px md:w-px md:h-full bg-surface-edge/40 shrink-0" />
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Espacio libre a la derecha */}
        </div>
      </div>

      {/* Compact Summary Content for Mobile Landscape */}
      <div className="header-summary-content hidden items-center justify-center gap-6 max-w-[1700px] mx-auto">
        <div className="flex items-center gap-4">
          <DollarSign className="w-5 h-5 text-brand" />
          <span className="text-sm font-black text-white">Gastos</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-danger font-bold rounded-lg uppercase tracking-widest shrink-0">
              Gasto: -{(monthlyTotal + commissionsPaid + commissionsPending + oxygenTotal).toLocaleString()} ฿
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-warning font-bold rounded-lg uppercase tracking-widest shrink-0">
              Pendiente: {(commissionsPending + oxygenPending).toLocaleString()} ฿
            </span>
          </div>
        </div>
        <div className="text-xs font-black text-brand uppercase tracking-wider">
          {selectedMonth}/{selectedYear}
        </div>
      </div>

      {/* Floating Toggle Button for Mobile Landscape */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`header-toggle-btn hidden absolute right-4 w-8 h-8 rounded-xl bg-surface-edge hover:bg-brand text-gray-300 hover:text-white items-center justify-center transition-all z-[60] ${isExpanded ? 'bottom-2 top-auto translate-y-0' : 'top-1/2 -translate-y-1/2'}`}
        aria-label={isExpanded ? "Colapsar cabecera" : "Expandir cabecera"}
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

export default Expenses_Header;
