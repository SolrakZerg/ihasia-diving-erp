import { useState, useEffect, useRef } from 'react';
import { Loader2, Zap } from 'lucide-react';

export default function SSITable({ 
  loading, 
  data, 
  handleManualAdjustmentChange 
}) {
  const [isNarrow, setIsNarrow] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width < 800) {
          setIsNarrow(true);
        } else {
          setIsNarrow(false);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const pxClass = isNarrow ? 'px-[4px]' : 'px-[10px]';
  const plFirstClass = isNarrow ? 'pl-[10px]' : 'pl-8';
  const prLastClass = isNarrow ? 'pr-[10px]' : 'pr-8';

  return (
    <div ref={containerRef} className="flex-1 bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      <div className="py-2.5 px-6 border-b border-surface-edge bg-surface-soft/50 flex justify-center items-center flex-none">
         <h3 className="text-[10px] font-black text-text-header uppercase tracking-widest flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-indigo-400" /> Facturar por SSI
         </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-[#1a1c2d]/98 backdrop-blur-xl border-b border-surface-edge/50 h-[40px]">
              <th className={`${plFirstClass} pr-[10px] py-0 text-[10px] font-black text-text-header uppercase tracking-widest align-middle w-40`}>Acr.</th>
              <th className={`${pxClass} py-0 text-[10px] font-black text-text-header uppercase tracking-widest align-middle ${isNarrow ? 'hidden' : ''}`}>Curso</th>
              <th className={`${pxClass} py-0 text-[10px] font-black text-text-header uppercase tracking-widest text-center align-middle w-24`}>Cant. Sist.</th>
              <th className={`${pxClass} py-0 text-[10px] font-black text-text-header uppercase tracking-widest text-center align-middle w-16`}>Aj.</th>
              <th className={`${pxClass} py-0 text-[10px] font-black text-warning uppercase tracking-widest text-center align-middle w-24`}>Und. Reales</th>
              <th className={`${pxClass} py-0 text-[11px] font-black text-white/70 uppercase tracking-[0.2em] text-right align-middle w-24`}>P. Unit.</th>
              <th className={`${isNarrow ? 'pl-[4px]' : 'pl-[10px]'} ${prLastClass} py-0 text-[11px] font-black text-white/70 uppercase tracking-[0.2em] text-right align-middle w-32`}>Total ฿</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/10">
            {loading ? (
              <tr><td colSpan="7" className="py-32 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto opacity-30" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="7" className="py-32 text-center text-text-header italic text-sm">No hay datos para este mes.</td></tr>
            ) : (
              data.map(act => (
                <tr key={act.id} className="hover:bg-brand/5 border-b border-surface-edge/30 transition-colors group">
                  <td className={`${plFirstClass} pr-[10px] py-2.5 relative`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50" style={{ backgroundColor: act.color || '#334155' }} />
                    <span className="text-[16px] font-black tracking-tight leading-none" style={{ color: act.color || '#ffffff' }}>
                      {act.acronym || '-'}
                    </span>
                  </td>
                  <td className={`${pxClass} py-2.5 ${isNarrow ? 'hidden' : ''}`}>
                    <span className="text-[15px] text-gray-300 font-bold tracking-tight">
                      {act.name}
                    </span>
                  </td>
                  <td className={`${pxClass} py-2.5 text-center`}>
                    <span className="inline-flex items-center justify-center bg-surface-edge/30 min-w-[34px] h-9 rounded-lg text-[16px] font-black text-text-header font-mono">
                       {act.system_quantity}
                    </span>
                  </td>
                  <td className={`${pxClass} py-2.5 text-center`}>
                    <input
                      type="number"
                      value={act.manual_adjustment || ''}
                      placeholder="0"
                      onChange={(e) => handleManualAdjustmentChange(act.id, e.target.value)}
                      className={`w-12 bg-surface-edge/60 text-center h-9 rounded-lg text-[16px] font-black border border-gray-300/30 shadow-sm font-mono focus:border-warning outline-none ${
                        isNarrow ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''
                      } ${
                        Number(act.manual_adjustment || 0) > 0 
                          ? 'text-success' 
                          : Number(act.manual_adjustment || 0) < 0 
                            ? 'text-danger' 
                            : 'text-white opacity-30'
                      }`}
                    />
                  </td>
                  <td className={`${pxClass} py-2.5 text-center`}>
                    <span className={`inline-flex items-center justify-center bg-surface-edge/60 min-w-[34px] h-9 rounded-lg text-[20px] font-black border border-surface-edge shadow-sm font-mono ${
                      Number(act.manual_adjustment || 0) > 0 
                        ? 'text-success' 
                        : Number(act.manual_adjustment || 0) < 0 
                          ? 'text-danger' 
                          : 'text-warning'
                    }`}>
                       {act.unidades_reales}
                    </span>
                  </td>
                  <td className={`${pxClass} py-2.5 text-right`}>
                    <span className="text-[15px] font-bold text-text-header font-mono italic">{act.unit_cost.toLocaleString()}</span>
                  </td>
                  <td className={`${isNarrow ? 'pl-[4px]' : 'pl-[10px]'} ${prLastClass} py-2.5 text-right`}>
                    <span className="text-[22px] font-black font-mono tracking-tighter text-warning">
                       {act.total_fila.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
