import React, { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const Expenses_Oxygen_Table = ({
  oxygenTotal,
  oxygenPending,
  oxygenTours,
  updateItem
}) => {
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
    <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col h-[350px] overflow-hidden" ref={containerRef}>
      <div className={`py-1.5 border-b border-surface-edge bg-surface-soft/50 flex-none flex gap-2 ${isNarrow ? 'flex-col items-center px-2' : 'flex-row items-center justify-between px-4'}`}>
        <h3 className={`text-[11px] font-black text-text-header uppercase tracking-widest flex items-center gap-2 ${isNarrow ? 'text-center' : 'text-left'}`}>Oxygen</h3>
        <div className={`flex flex-wrap gap-3 ${isNarrow ? 'justify-center' : 'justify-end'}`}>
          <div className="stats-pill" style={{ '--widget-color': 'var(--color-success)' }}>
            <span className="stats-pill-title">Pagado:</span>
            <span className="stats-pill-value">
              {(oxygenTotal - oxygenPending).toLocaleString()}
              <span className="stats-pill-currency">฿</span>
            </span>
          </div>
          <div className="stats-pill" style={{ '--widget-color': 'var(--color-warning)' }}>
            <span className="stats-pill-title">Por Pagar:</span>
            <span className="stats-pill-value">
              {oxygenPending.toLocaleString()}
              <span className="stats-pill-currency">฿</span>
            </span>
          </div>
        </div>
      </div>
      <div className="overflow-auto flex-1 relative custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
              <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest w-[80px] align-middle">Fecha</th>
              <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle">
                <div className="flex flex-row flex-wrap gap-4">
                  <span className="w-[200px] shrink-0">Cliente</span>
                  <span className="w-[160px] shrink-0">Actividad</span>
                </div>
              </th>
              <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle text-center">Num</th>
              <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle text-right w-[100px]">X Pagar</th>
              <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle text-center">Pagado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/5">
            {oxygenTours.length === 0 ? (
              <tr><td colSpan="5" className="py-20 text-center text-text-header/60 italic text-xs">Sin tours registrados para este mes.</td></tr>
            ) : (
              oxygenTours.map(o => (
                <tr key={o.id} className="hover:bg-brand/5 transition-colors group">
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-black text-white bg-surface-edge/20 px-2 py-1.5 rounded border border-surface-edge/30">
                      {o.date ? new Date(o.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '-'}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-0.5">
                      <div className="w-[200px] shrink-0">
                        <span className="text-sm font-black text-[#d9d9d9] truncate block">
                          {o.customers ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}` : (o.temporary_name || 'Sin cliente')}
                        </span>
                      </div>
                      <div className="w-[160px] shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o.activities?.color || '#4f4f4f' }} />
                          <span className="text-sm font-bold truncate" style={{ color: o.activities?.color || 'var(--text-header)' }}>
                            {o.activities?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center text-sm font-black text-white">{o.quantity}</td>
                  <td className="px-3 py-1.5 text-right w-[100px]">
                    <span className={`text-base font-bold transition-colors ${o.is_prov_paid ? 'text-success' : 'text-warning'}`}>
                      {((Number(o.quantity) || 0) * Number(o.activities?.ssi_cost_thb || 0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => updateItem(o.id, 'is_prov_paid', !o.is_prov_paid)}
                      className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center border transition-all ${o.is_prov_paid ? 'bg-success border-success text-[#1a1c2d] shadow-lg shadow-success/20' : 'bg-surface-edge/20 border-surface-edge/30 text-text-header hover:border-warning hover:bg-warning/5'}`}
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
