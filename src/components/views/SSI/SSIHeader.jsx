import { ChevronLeft, ChevronRight, Settings, TrendingUp, TrendingDown } from 'lucide-react';

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
  return (
    <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] h-[200px]">
      <div className="max-w-[1700px] mx-auto px-8 h-full flex items-center justify-center gap-24">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <img 
                src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi-logo.png" 
                alt="SSI Branding" 
                className="h-16 w-auto object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]" 
              />
            </div>
          </div>

          {/* DATE SELECTOR */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all">
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
              <button onClick={handleNextMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all">
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

        {/* STATS WIDGETS */}
        <div className="flex gap-4">
             <div className="bg-amber-500/5 border border-amber-400/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                   </div>
                   <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em]">TOTAL SSI</span>
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {totalSsi.toLocaleString()} <span className="text-sm font-black text-amber-400/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>

             <div className="bg-emerald-500/5 border border-emerald-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                   </div>
                   <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.2em]">PAGADO</span>
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {manualPaid.toLocaleString()} <span className="text-sm font-black text-emerald-500/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>
             
             <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                      <TrendingDown className="w-3.5 h-3.5" />
                   </div>
                   <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em]">POR PAGAR</span>
                </div>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {(totalSsi - manualPaid).toLocaleString()} <span className="text-sm font-black text-rose-400/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>
        </div>
      </div>
    </div>
  );
}
