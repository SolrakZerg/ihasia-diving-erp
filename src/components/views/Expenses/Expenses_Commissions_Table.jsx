import React, { useRef, useEffect, useState } from 'react';
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
   const [refreshKey, setRefreshKey] = React.useState(0);
   const [isNarrow, setIsNarrow] = useState(false);
   const containerRef = useRef(null);

   useEffect(() => {
      if (!containerRef.current) return;
      const observer = new ResizeObserver(entries => {
         for (let entry of entries) {
            setIsNarrow(entry.contentRect.width < 450);
         }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
   }, []);

   return (
      <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden" ref={containerRef}>
         <div className={`py-1.5 border-b border-surface-edge bg-surface-soft/50 flex-none flex gap-2 ${isNarrow ? 'flex-col items-center px-2' : 'flex-row items-center justify-between px-4'}`}>
            <h3 className={`text-[11px] font-black text-text-header uppercase tracking-widest flex items-center gap-2 ${isNarrow ? 'text-center' : 'text-left'}`}>Comisiones</h3>
            <div className={`flex flex-wrap gap-3 ${isNarrow ? 'justify-center' : 'justify-end'}`}>
               <div className="stats-pill" style={{ '--widget-color': 'var(--color-success)' }}>
                  <span className="stats-pill-title">Pagado:</span>
                  <span className="stats-pill-value">
                     {commissionsPaid.toLocaleString()}
                     <span className="stats-pill-currency">฿</span>
                  </span>
               </div>
               <div className="stats-pill" style={{ '--widget-color': 'var(--color-warning)' }}>
                  <span className="stats-pill-title">Por Pagar:</span>
                  <span className="stats-pill-value">
                     {commissionsPending.toLocaleString()}
                     <span className="stats-pill-currency">฿</span>
                  </span>
               </div>
            </div>
         </div>

         <div className="overflow-auto flex-1 relative custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 z-30">
                  <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                     <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest w-[60px] align-middle">Día</th>
                     <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle">
                        <div className="flex flex-row flex-wrap gap-4">
                           <span className="w-[200px] shrink-0">Cliente</span>
                           <span className="w-[160px] shrink-0">Actividad</span>
                        </div>
                     </th>
                     <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle">Quién recibe</th>
                     <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest text-right align-middle w-[120px]">Comisión</th>
                     <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest text-center align-middle">Pagado</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-surface-edge/10">
                  {commissions.length === 0 ? (
                     <tr><td colSpan="5" className="py-24 text-center text-text-header/60 italic text-xs">No hay facturas marcadas como comisionables este mes.</td></tr>
                  ) : (
                     commissions.map(c => (
                        <tr key={c.id} className="hover:bg-brand/5 transition-colors group">
                           <td className="px-3 py-1">
                              <span className="text-xs font-black text-white bg-surface-edge/20 px-2.5 py-0.5 rounded border border-surface-edge/30 whitespace-nowrap">
                                 {c.date ? c.date.split('-')[2] : '—'}
                              </span>
                           </td>
                           <td className="px-3 py-1">
                              <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                                 <div className="w-[200px] shrink-0">
                                    <span className="text-sm font-black text-[#d9d9d9] whitespace-nowrap truncate block">
                                       {c.customers ? `${c.customers.first_name || ''} ${c.customers.last_name || ''}` : (c.temporary_name || 'Sin cliente')}
                                    </span>
                                 </div>
                                 <div className="w-[160px] shrink-0">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.activities?.color || '#4f4f4f' }} />
                                       <span className="text-sm font-bold truncate" style={{ color: c.activities?.color || 'var(--text-header)' }}>
                                          {c.activities?.name}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-3 py-1 w-[200px]">
                              <SmartSelect
                                 options={recipientOptions}
                                 value={c.comm_recipient_id}
                                 onChange={o => updateItem(c.id, 'comm_recipient_id', o.id)}
                                 triggerClassName="!py-0.5"
                              />
                           </td>
                           <td className="px-3 py-1 text-right w-[120px]">
                              <div className="flex flex-col items-end">
                                 <EditableInput
                                    key={`${c.id}-${c.comm_amount_thb}-${refreshKey}`}
                                    type="number"
                                    defaultValue={c.comm_amount_thb != null ? parseFloat(c.comm_amount_thb) : parseFloat(c.activities?.price_thb || 0) * 0.1}
                                    onSave={async (value) => {
                                       const numVal = parseFloat(value);
                                       await updateItem(c.id, 'comm_amount_thb', isNaN(numVal) ? null : numVal);
                                       setRefreshKey(prev => prev + 1);
                                    }}
                                    className={`bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded text-right text-sm font-bold outline-none px-1 py-0 transition-colors w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${c.comm_amount_thb != null ? 'text-brand' : (c.is_comm_paid ? 'text-success' : 'text-warning')}`}
                                 />
                                 <span className="text-[9px] text-text-header font-bold tracking-widest uppercase mt-0.5">Base: {c.activities?.price_thb?.toLocaleString()}</span>
                              </div>
                           </td>
                           <td className="px-3 py-1 text-center">
                              <button
                                 onClick={() => updateItem(c.id, 'is_comm_paid', !c.is_comm_paid)}
                                 className={`w-7 h-7 mx-auto rounded-xl flex items-center justify-center border transition-all ${c.is_comm_paid ? 'bg-success border-success text-[#1a1c2d] shadow-lg shadow-success/20' : 'bg-surface-edge/20 border-surface-edge/30 text-text-header hover:border-warning hover:bg-warning/5'}`}
                              >
                                 <Check className={`w-4 h-4 ${c.is_comm_paid ? 'stroke-[4]' : 'opacity-40'}`} />
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
