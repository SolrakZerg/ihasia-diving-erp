import EditableInput from '../../common/EditableInput';

export default function Dashboard_Cuentas({
   incomeData,
   updateOpeningCash,
   fetchDashboardData,
   monthlyReport
}) {
   return (
      <div style={{ flex: '1 1 250px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col h-[480px] max-md:w-full md:max-w-[350px]">
         <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-4 text-center">Cuentas</h3>
         <div className="space-y-1.5 flex-1 overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-edge/10 text-text-muted mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Mes Anterior</span>
               <EditableInput
                  defaultValue={incomeData.openingCash === 0 ? 0 : (incomeData.openingCash || '')}
                  onSave={(val) => updateOpeningCash(val)}
                  type="number"
                  className="bg-transparent border-none text-right font-mono text-sm font-black w-24 outline-none focus:text-white transition-colors no-spinner"
               />
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-brand/10 border border-brand/20 text-white/90 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado</span>
               <span className="text-sm font-black font-mono">{Math.round(incomeData.total || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-white/80 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado</span>
               <span className="text-sm font-black font-mono">{Math.round(incomeData.collected || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-danger/10 border border-danger/20 text-white/80 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Por Cobrar</span>
               <span className="text-sm font-black font-mono">{Math.round(incomeData.pending || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-white/80 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Pagado</span>
               <span className="text-sm font-black font-mono">
                  {Math.round(monthlyReport?.total_pagado || 0).toLocaleString()}
               </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 text-emerald-400/80 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Cobrado + M. Ant.</span>
               <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_disponible || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 text-emerald-400/80 mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Facturado + M. Ant.</span>
               <span className="text-sm font-black font-mono">{Math.round(monthlyReport?.total_facturado_mes_ant || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-teal-600/10 border border-violet-500/20 text-white/80 italic mb-1.5">
               <span className="text-[12px] font-black uppercase tracking-normal truncate whitespace-nowrap">Hay o Habrá + Pag.</span>
               <span className="text-sm font-black font-mono">
                  {Math.round(monthlyReport?.hay_o_habra_mas_pagado || 0).toLocaleString()}
               </span>
            </div>
         </div>
      </div>
   );
}
