import React from 'react';
import { Activity, Download } from 'lucide-react';

export default function InsuranceSidebar({ historyBatches, onViewPDF }) {
  return (
    <div className="w-full lg:w-64 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl flex flex-col lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
      <div className="p-4 border-b border-surface-edge bg-surface-soft/50">
        <h3 className="font-bold text-white text-sm">Historial Reciente</h3>
        <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Últimos envíos</p>
      </div>
      <div className="flex-1 p-4 flex flex-col items-center overflow-y-auto custom-scrollbar">
        {historyBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-12">
            <Activity className="w-8 h-8 text-surface-edge mb-3" />
            <p className="text-xs text-text-muted">Aún no hay envíos recientes.</p>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {historyBatches.map(batch => (
              <div key={batch.id} 
                   className="bg-surface border border-surface-edge p-3 rounded-xl hover:border-brand/30 transition-colors group flex items-center justify-between relative">
                <div>
                  <p className="text-sm text-brand font-bold">
                    {new Date(batch.created_at).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(batch.created_at).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                
                <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                  {batch.total_pax} PAX
                </span>
                
                {batch.pdf_url ? (
                  <button 
                    onClick={() => onViewPDF(batch.pdf_url)}
                    className="p-1.5 bg-surface-soft border border-surface-edge text-text-muted rounded-lg flex items-center justify-center hover:text-white hover:bg-surface-edge transition-colors"
                    title="Ver PDF Generado"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-[26px]"></div>
                )}

                {/* Tooltip Personalizado */}
                {batch.customer_list && (
                  <div className="hidden group-hover:block absolute top-full left-0 mt-2 w-full z-50 bg-surface-soft border border-surface-edge p-4 rounded-xl shadow-2xl">
                    <ul className="space-y-1.5">

                      {batch.customer_list.map((c, idx) => (
                        <li key={idx} className="text-base text-white font-medium truncate" title={c.name}>
                          {c.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
