import React from 'react';
import { Check, Pencil, X } from 'lucide-react';
import SmartSelect from '../../common/SmartSelect';
import EditableInput from '../../common/EditableInput';

const Expenses_Commissions_Table = ({
  commissions,
  commissionsPaid,
  commissionsPending,
  recipientOptions,
  editingCommId,
  setEditingCommId,
  editCommVal,
  setEditCommVal,
  updateItem
}) => {
  return (
    <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="py-2 px-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none h-[58px] gap-4">
           <div className="flex items-center gap-4 shrink-0">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Gestión de Comisiones</h3>
              <div className="bg-brand/10 text-brand px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand/20">
                 Sinc. Facturas
              </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Pagado:</span>
                <span className="text-xl font-black text-white leading-none tracking-tighter">
                   {commissionsPaid.toLocaleString()} <span className="text-xs font-black text-emerald-500/40 ml-0.5">฿</span>
                </span>
             </div>
             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Por Pagar:</span>
                <span className="text-xl font-black text-white leading-none tracking-tighter">
                   {commissionsPending.toLocaleString()} <span className="text-xs font-black text-amber-500/40 ml-0.5">฿</span>
                </span>
             </div>
           </div>
        </div>

      <div className="overflow-auto flex-1 relative custom-scrollbar overflow-x-hidden">
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
               <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest align-middle">Quién recibe</th>
               <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right align-middle w-[120px]">Comisión</th>
               <th className="px-3 py-0 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center align-middle">Pagado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/10">
            {commissions.length === 0 ? (
              <tr><td colSpan="5" className="py-24 text-center text-gray-600 italic text-xs">No hay facturas marcadas como comisionables este mes.</td></tr>
            ) : (
              commissions.map(c => (
                <tr key={c.id} className="hover:bg-brand/5 transition-colors group">
                  <td className="px-3 py-1.5">
                     <span className="text-xs font-black text-white bg-slate-800/50 px-2 py-1.5 rounded border border-slate-700/30 whitespace-nowrap">
                       {c.date ? new Date(c.date).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'}) : 'Sin fecha'}
                     </span>
                  </td>
                   <td className="px-3 py-1.5">
                      <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                         <div className="w-[200px] shrink-0">
                            <span className="text-sm font-black text-white whitespace-nowrap truncate block">
                              {c.customers ? `${c.customers.first_name || ''} ${c.customers.last_name || ''}` : 'Sin cliente'}
                            </span>
                         </div>
                         <div className="w-[160px] shrink-0">
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.activities?.color || '#4f4f4f' }} />
                               <span className="text-sm font-bold text-slate-400 truncate">
                                 {c.activities?.name}
                               </span>
                            </div>
                         </div>
                      </div>
                   </td>
                  <td className="px-3 py-1.5 w-[200px]">
                     <SmartSelect 
                        options={recipientOptions} 
                        value={c.comm_recipient_id} 
                        onChange={o => updateItem(c.id, 'comm_recipient_id', o.id)} 
                     />
                  </td>
                  <td className="px-3 py-1.5 text-right w-[120px]">
                     <div className="flex flex-col items-end">
                        <EditableInput
                          type="number"
                          defaultValue={c.comm_amount_thb != null ? parseFloat(c.comm_amount_thb) : parseFloat(c.activities?.price_thb || 0) * 0.1}
                          onSave={async (value) => {
                             const numVal = parseFloat(value);
                             await updateItem(c.id, 'comm_amount_thb', isNaN(numVal) ? null : numVal);
                          }}
                          className={`bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded text-right text-base font-bold outline-none px-1 py-0.5 transition-colors w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${c.comm_amount_thb != null ? 'text-brand' : (c.is_comm_paid ? 'text-emerald-500' : 'text-amber-500')}`}
                        />
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Base: {c.activities?.price_thb?.toLocaleString()}</span>
                     </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                     <button 
                       onClick={() => updateItem(c.id, 'is_comm_paid', !c.is_comm_paid)}
                       className={`w-9 h-9 mx-auto rounded-2xl flex items-center justify-center border transition-all ${c.is_comm_paid ? 'bg-emerald-500 border-emerald-500 text-[#1a1c2d] shadow-lg shadow-emerald-500/20' : 'bg-surface-edge/20 border-surface-edge/30 text-gray-500 hover:border-amber-400 hover:bg-amber-400/5'}`}
                     >
                       <Check className={`w-5 h-5 ${c.is_comm_paid ? 'stroke-[4]' : 'opacity-40'}`} />
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

export default Expenses_Commissions_Table;
