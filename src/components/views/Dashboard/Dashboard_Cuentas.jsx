export default function Dashboard_Cuentas({ 
  incomeData, 
  updateOpeningCash, 
  fetchDashboardData, 
  monthlyReport 
}) {
  return (
    <div style={{ flex: '1 1 250px', maxWidth: '350px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
       <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center text-emerald-400">Cuentas</h3>
       <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 text-gray-400 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Mes Anterior</span>
             <input 
               type="number" 
               value={incomeData.openingCash === 0 ? 0 : (incomeData.openingCash || '')} 
               onChange={(e) => updateOpeningCash(e.target.value)} 
               onBlur={() => fetchDashboardData()}
               onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
               className="bg-transparent border-none text-right font-mono text-sm font-black w-24 outline-none focus:text-white transition-colors no-spinner" 
             />
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-400/25 border border-emerald-500/70 text-white/90 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado</span>
             <span className="text-sm font-black font-mono">{Math.round(incomeData.total || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-400/25 border border-emerald-500/70 text-white/80 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado</span>
             <span className="text-sm font-black font-mono">{Math.round(incomeData.collected || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-400/25 border border-rose-400/70 text-white/80 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Por Cobrar</span>
             <span className="text-sm font-black font-mono">{Math.round(incomeData.pending || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-400/25 border border-amber-500/70 text-white/80 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Pagado</span>
             <span className="text-sm font-black font-mono">
               {Math.round(monthlyReport?.total_pagado || 0).toLocaleString()}
             </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/70 text-emerald-400/80 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado + M. Ant.</span>
             <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_disponible || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/70 text-emerald-400/80 mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado + M. Ant.</span>
             <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_facturado_mes_ant || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-violet-500/25 to-teal-600/10 border border-violet-500/70 text-white/80 italic mb-1.5">
             <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Hay o Habrá + Pag.</span>
             <span className="text-sm font-black font-mono">
               {Math.round(monthlyReport?.hay_o_habra_mas_pagado || 0).toLocaleString()}
             </span>
          </div>
       </div>
    </div>
  );
}
