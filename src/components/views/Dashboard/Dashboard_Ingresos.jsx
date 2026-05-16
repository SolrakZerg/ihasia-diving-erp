export default function Dashboard_Ingresos({ incomeData }) {
   return (
      <div style={{ flex: '1 1 200px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px] max-md:w-full md:max-w-[300px]">
         <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-3 text-center">Ingresos</h3>
         <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
            {Object.entries(incomeData.breakdown || {}).map(([label, value], idx) => {
               if (label === '---') return <div key={idx} className="h-px bg-surface-edge/30 my-3 mx-2" />;

               const diff = incomeData.diff || 0;
               const diffColor = diff === 0 ? 'text-blue-400' : diff > 0 ? 'text-emerald-400' : 'text-danger';

               return (
                  <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-1.5 transition-all ${label.startsWith('CR') ? 'bg-cr text-white' :
                        label.startsWith('BT') ? 'bg-bt text-white' :
                           label === 'CASH REAL' ? 'bg-white/10 text-emerald-400 border border-emerald-500/20' :
                              label === 'FALTA O SOBRA' ? `bg-surface-edge/20 ${diffColor} font-bold` :
                                 label === 'DEBERÍA' ? 'bg-surface-edge/10 text-text-muted italic' : 'bg-surface-edge/10 text-text-muted'
                     }`}>
                     <span className="text-[12px] font-black uppercase tracking-wider">{label}</span>
                     <span className="text-sm font-black font-mono">{Math.round(value).toLocaleString()}</span>
                  </div>
               );
            })}
         </div>
      </div>
   );
}
