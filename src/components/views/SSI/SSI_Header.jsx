import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

export default function SSIHeader({ 
  selectedMonth, 
  selectedYear, 
  totalSsi, 
  manualPaid, 
  handlePrevMonth, 
  handleNextMonth, 
  setShowConfigModal,
  setSelectedMonth,
  setSelectedYear
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] md:sticky top-0 transition-all duration-300 py-6 relative ${isExpanded ? 'header-expanded' : 'header-collapsed'}`}>
      <div className="header-full-content max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 overflow-x-auto custom-scrollbar">
        
        <div className="flex flex-col gap-4 shrink-0 items-center">
          <div className="flex items-center justify-center gap-10">
            <div className="flex flex-col">
              <img 
                src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png" 
                alt="SSI Branding" 
                className="h-16 w-auto object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]" 
              />
            </div>
          </div>

          {/* DATE SELECTOR */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-text-header hover:text-white transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
                >
                  {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                    <option key={m} value={i} className="bg-[#1a1c2d]">{m}</option>
                  ))}
                </select>
                
                <div className="w-px h-4 bg-surface-edge/30 mx-1" />

                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleNextMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-text-header hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setShowConfigModal(true)} 
              className="p-2.5 rounded-2xl bg-surface-edge/10 border border-surface-edge/30 text-text-header hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
              title="Configuración"
            >
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>

        {/* STATS WIDGETS */}
        <div className="flex flex-wrap gap-4 shrink-0">
             <div className="stats-widget flex-1 min-w-[160px]" style={{ '--widget-color': 'var(--color-warning)' }}>
                <div className="flex items-center gap-2 mb-2">
                   <div className="stats-widget-icon">
                      <TrendingUp className="w-3.5 h-3.5" />
                   </div>
                   <span className="stats-widget-title">TOTAL SSI</span>
                </div>
                <span className="stats-widget-value">
                   {totalSsi.toLocaleString()} <span className="stats-widget-currency">฿</span>
                </span>
             </div>

             <div className="stats-widget flex-1 min-w-[160px]" style={{ '--widget-color': 'var(--color-success)' }}>
                <div className="flex items-center gap-2 mb-2">
                   <div className="stats-widget-icon">
                      <TrendingUp className="w-3.5 h-3.5" />
                   </div>
                   <span className="stats-widget-title">PAGADO</span>
                </div>
                <span className="stats-widget-value">
                   {manualPaid.toLocaleString()} <span className="stats-widget-currency">฿</span>
                </span>
             </div>
             
             <div className="stats-widget flex-1 min-w-[160px]" style={{ '--widget-color': 'var(--color-danger)' }}>
                <div className="flex items-center gap-2 mb-2">
                   <div className="stats-widget-icon">
                      <TrendingDown className="w-3.5 h-3.5" />
                   </div>
                   <span className="stats-widget-title">POR PAGAR</span>
                </div>
                <span className="stats-widget-value">
                   {(totalSsi - manualPaid).toLocaleString()} <span className="stats-widget-currency">฿</span>
                </span>
             </div>
        </div>
      </div>

      {/* Compact Summary Content for Mobile Landscape */}
      <div className="header-summary-content hidden items-center justify-center gap-6 max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <img 
            src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png" 
            alt="SSI Branding" 
            className="h-6 w-auto object-contain" 
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-warning font-bold rounded-lg uppercase tracking-widest shrink-0">
              Total: {totalSsi.toLocaleString()} ฿
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-success font-bold rounded-lg uppercase tracking-widest shrink-0">
              Pagado: {manualPaid.toLocaleString()} ฿
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-danger font-bold rounded-lg uppercase tracking-widest shrink-0">
              Por pagar: {(totalSsi - manualPaid).toLocaleString()} ฿
            </span>
          </div>
        </div>
        <div className="text-xs font-black text-brand uppercase tracking-wider">
          {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][selectedMonth]}/{selectedYear}
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
}
