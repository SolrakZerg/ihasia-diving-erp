import { Settings, Zap, TrendingDown, CreditCard, AlertCircle, Receipt } from 'lucide-react';

export default function SSISidebar({ 
  mesAnterior, 
  saldoMesAnterior, 
  manualPaid, 
  totalSsi, 
  adjustmentsTotal, 
  setMesAnterior, 
  setManualPaid, 
  saveSettlement 
}) {
  return (
    <div className="w-full lg:w-64 flex flex-col sm:flex-row lg:flex-col gap-4">
       {/* AJUSTES MANUALES */}
       <div className="flex-1 bg-surface-soft border border-surface-edge rounded-3xl p-5 shadow-xl flex flex-col gap-6">
          <h4 className="text-[13px] font-black text-text-header uppercase tracking-[0.2em] flex items-center gap-2">
             <Settings className="w-4 h-4 text-text-header" /> AJUSTES SSI
          </h4>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
                <span className="text-[13px] font-black text-text-header uppercase tracking-widest mb-3 flex items-center gap-1.5">
                   <Zap className="w-4 h-4 text-indigo-400" /> ADELANTO (PRÓX. MES)
                </span>
                <div className="flex items-center gap-4 bg-surface-edge/20 p-3 rounded-[2rem] border border-surface-edge/30 shadow-inner">
                  <input
                    type="number"
                    value={mesAnterior || ''}
                    placeholder="0"
                    onChange={(e) => {
                       const val = parseInt(e.target.value) || 0;
                       setMesAnterior(val);
                       saveSettlement(val, manualPaid);
                    }}
                    className="w-full bg-transparent text-3xl font-black text-indigo-400 font-mono text-center tracking-tighter outline-none"
                  />
                </div>
            </div>

            <div className="h-px bg-surface-edge/20 mx-2" />

            <div className="flex flex-col opacity-90">
                <span className="text-[13px] font-black text-text-header uppercase tracking-widest mb-3 flex items-center gap-1.5">
                   <TrendingDown className="w-4 h-4 text-cyan-400" /> AJUSTE (MES ANTERIOR)
                </span>
                <div className="flex items-center gap-4 bg-surface-edge/10 p-3 rounded-[2rem] border border-surface-edge/10">
                   <span className="text-3xl font-black text-cyan-400/50 font-mono flex-1 text-center tracking-tighter">{saldoMesAnterior}</span>
                </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-edge/20 mt-2">
             <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[13px] font-black text-text-header uppercase tracking-wider">Impacto Total</span>
                <span className={`text-lg font-black ${adjustmentsTotal >= 0 ? 'text-indigo-400' : 'text-cyan-400'} font-mono`}>
                  {adjustmentsTotal > 0 ? '+' : ''}{adjustmentsTotal.toLocaleString()} ฿
                </span>
             </div>
          </div>
       </div>

        {/* LIQUIDACIÓN MENSUAL */}
        <div className="flex-1 bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl flex flex-col gap-6">
           <div className="w-fit mx-auto flex flex-col gap-6 w-full max-w-[240px]">
              
              {/* PAGADO */}
              <div className="flex flex-col gap-4 items-center">
                 <h4 className="text-[13px] font-black text-text-header uppercase tracking-[0.2em] flex items-center gap-2">
                   <CreditCard className="w-4 h-4 text-success" /> PAGADO
                 </h4>
                 <div className="w-full bg-surface-edge/20 border-2 border-surface-edge/30 rounded-2xl py-3 px-2 focus-within:border-success/50 focus-within:bg-success/5 transition-all">
                    <div className="flex justify-center items-baseline gap-2">
                       <input
                         type="number"
                         value={manualPaid || ''}
                         placeholder="0"
                         onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setManualPaid(val);
                            saveSettlement(mesAnterior, val);
                         }}
                         className="bg-transparent border-none p-0 !outline-none !ring-0 text-2xl font-black text-success font-mono text-right w-24"
                       />
                       <span className="text-success/50 font-black text-2xl font-mono w-4">฿</span>
                    </div>
                 </div>
              </div>

              <div className="h-px bg-surface-edge/20" />

              {/* POR PAGAR */}
              <div className="flex flex-col gap-2 items-center">
                 <span className="text-[13px] font-black text-text-header uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-danger" /> POR PAGAR
                 </span>
                 <div className="flex justify-center items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono text-right w-24 ${(totalSsi - manualPaid) === 0 ? 'text-success/50' : 'text-danger'}`}>
                       {(totalSsi - manualPaid).toLocaleString()}
                    </span>
                    <span className="text-danger/50 font-black text-2xl font-mono w-4">฿</span>
                 </div>
              </div>

              <div className="h-px bg-surface-edge/20" />

              {/* TOTAL */}
              <div className="flex flex-col gap-2 items-center">
                 <span className="text-[13px] font-black text-text-header uppercase tracking-widest flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-warning" /> TOTAL
                 </span>
                 <div className="flex justify-center items-baseline gap-2">
                    <span className="text-2xl font-black text-warning font-mono text-right w-24">
                       {totalSsi.toLocaleString()}
                    </span>
                    <span className="text-warning/50 font-black text-2xl font-mono w-4">฿</span>
                 </div>
              </div>
           </div>
        </div>
     </div>
  );
}
