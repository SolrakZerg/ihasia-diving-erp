import React from 'react';
import { Check } from 'lucide-react';

const Expenses_Oxygen_Table = ({
  oxygenTotal,
  oxygenPending,
  oxygenTours,
  updateItem
}) => {
  return (
    <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col h-[350px] overflow-hidden">
        <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px] gap-4">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">Oxygen Tour Snorkell</h3>
           <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Pagado:</span>
                <span className="text-lg font-black text-emerald-400 font-mono leading-none">{(oxygenTotal - oxygenPending).toLocaleString()} ฿</span>
             </div>
             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Por Pagar:</span>
                <span className="text-lg font-black text-amber-400 font-mono leading-none">{oxygenPending.toLocaleString()} ฿</span>
             </div>
           </div>
        </div>
       <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-30">
              <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest w-[80px] align-middle">Fecha</th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle">
                   <div className="flex flex-row flex-wrap gap-4">
                      <span className="w-[200px] shrink-0">Cliente</span>
                      <span className="w-[160px] shrink-0">Actividad</span>
                   </div>
                </th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-center">Num</th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-right w-[100px]">X Pagar</th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle text-center">Pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/5">
              {oxygenTours.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-gray-600 italic text-xs">Sin tours registrados para este mes.</td></tr>
              ) : (
                oxygenTours.map(o => (
                  <tr key={o.id} className="hover:bg-brand/5 transition-colors group">
                    <td className="px-3 py-1.5">
                       <span className="text-xs font-black text-white bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/30">
                         {o.date ? new Date(o.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : '-'}
                       </span>
                    </td>
                    <td className="px-3 py-1.5">
                       <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                          <div className="w-[200px] shrink-0">
                             <span className="text-sm font-black text-white truncate block">
                               {o.customers?.first_name || 'Sin nombre'}
                             </span>
                          </div>
                          <div className="w-[160px] shrink-0">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o.activities?.color || '#4f4f4f' }} />
                                <span className="text-sm font-bold text-slate-400 truncate">
                                  {o.activities?.name}
                                </span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-3 py-1.5 text-center text-sm font-black text-white">{o.quantity}</td>
                    <td className="px-3 py-1.5 text-right w-[100px]">
                       <span className={`text-base font-bold transition-colors ${o.is_prov_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                         {(Number(o.quantity ?? 1) * Number(o.activities?.ssi_cost_thb || 0)).toLocaleString()}
                       </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                       <button 
                         onClick={() => updateItem(o.id, 'is_prov_paid', !o.is_prov_paid)}
                         className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center border transition-all ${o.is_prov_paid ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' : 'bg-surface-edge/20 border-surface-edge/30 text-gray-500 hover:border-amber-400 hover:bg-amber-400/5'}`}
                       >
                         <Check className={`w-4 h-4 ${o.is_prov_paid ? 'stroke-[4]' : 'opacity-40'}`} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default Expenses_Oxygen_Table;
