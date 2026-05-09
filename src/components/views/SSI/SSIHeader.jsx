import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

const SSIIcon = ({ className }) => (
  <div 
    className={className}
    style={{
      backgroundColor: 'currentColor',
      maskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      WebkitMaskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      transform: 'scale(1.3)',
      filter: 'brightness(1.2)'
    }}
  />
);

export default function SSIHeader({ 
  selectedMonth, 
  selectedYear, 
  totalSsi, 
  manualPaid, 
  handlePrevMonth, 
  handleNextMonth, 
  setShowConfigModal 
}) {
  return (
    <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] h-[200px]">
      <div className="max-w-[1700px] mx-auto px-8 h-full flex items-center justify-center gap-24">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <SSIIcon className="h-16 w-16 text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">MODO SHADOW (PRUEBAS)</span>
            </div>
          </div>

          {/* DATE SELECTOR */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                <span className="text-sm font-black text-white px-2 py-1 uppercase">
                  {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][selectedMonth]} {selectedYear}
                </span>
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
                <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em] mb-2">TOTAL SSI</span>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {totalSsi.toLocaleString()} <span className="text-sm font-black text-amber-400/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>

             <div className="bg-emerald-500/5 border border-emerald-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-2">PAGADO</span>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {manualPaid.toLocaleString()} <span className="text-sm font-black text-emerald-500/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>
             
             <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] mb-2">POR PAGAR</span>
                <span className="text-3xl font-black text-white tracking-tighter">
                   {(totalSsi - manualPaid).toLocaleString()} <span className="text-sm font-black text-rose-400/40 ml-1 italic font-mono">฿</span>
                </span>
             </div>
        </div>
      </div>
    </div>
  );
}
