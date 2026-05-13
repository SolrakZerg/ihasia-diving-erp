export default function Dashboard_Cursos({ courseStats, year }) {
  const current = courseStats.count || 0;
  const target = courseStats.target || 0; // Year-1
  const prevTarget = courseStats.prevTarget || 0; // Year-2
  const prev3YearTarget = courseStats.prev3YearTarget || 0; // Year-3

  // Cálculos de crecimiento
  const growth2025 = target > 0 ? Math.round(((current - target) / target) * 100) : 0;
  const growth2024 = prevTarget > 0 ? Math.round(((current - prevTarget) / prevTarget) * 100) : 0;
  const growth2023 = prev3YearTarget > 0 ? Math.round(((current - prev3YearTarget) / prev3YearTarget) * 100) : 0;

  const getGrowthBadge = (val) => {
     if (val === 0) return null;
     const isPos = val >= 0;
     return (
        <span className={`text-[16px] font-black px-2 py-0.5 rounded-md ${isPos ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
           {isPos ? '+' : ''}{val}%
        </span>
     );
  };
  
  const r = 80;
  const circ = 2 * Math.PI * r;
  const progressTotal = target > 0 ? current / target : 0;
  
  // Capa 1: 0% a 100% (Azul)
  const progress1 = Math.min(progressTotal, 1);
  const offset1 = circ - progress1 * circ;
  
  // Capa 2: 100% a 200% (Verde)
  const progress2 = Math.max(0, Math.min(progressTotal - 1, 1));
  const offset2 = circ - progress2 * circ;

  const isOverTarget = progressTotal > 1;

  return (
    <div style={{ flex: '1 1 200px', maxWidth: '300px' }} className="bg-surface-soft border border-surface-edge rounded-3xl p-4 shadow-xl flex flex-col relative overflow-hidden h-[480px]">
       <div className={`absolute top-[-20%] right-[-20%] w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${isOverTarget ? 'bg-emerald-500/20' : 'bg-brand/10'}`}></div>
       
       <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.2em] mb-auto text-center z-10">CURSOS</h3>
       
       <div className="flex flex-col items-center justify-center flex-1 z-10">
          <div className="relative flex items-center justify-center mb-6 mt-2">
            <div className={`absolute inset-0 blur-[40px] rounded-full transition-colors duration-1000 ${isOverTarget ? 'bg-emerald-500/20' : 'bg-brand/10'}`}></div>
            <svg className="w-48 h-48 transform -rotate-90">
              {/* Fondo del círculo */}
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-edge/40" />
              
              {/* Capa 1: Azul (0-100%) */}
              <circle 
                cx="96" cy="96" r="80" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={circ} 
                strokeDashoffset={offset1} 
                className="text-brand transition-all duration-1000 ease-out" 
                strokeLinecap="round" 
              />

              {/* Capa 2: Verde (100-200%) */}
              {progress2 > 0 && (
                <circle 
                  cx="96" cy="96" r="80" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray={circ} 
                  strokeDashoffset={offset2} 
                  className="text-emerald-500 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  strokeLinecap="round" 
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-black tracking-tighter transition-all duration-500 ${isOverTarget ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'text-white drop-shadow-[0_0_15px_rgba(0,163,255,0.4)]'}`}>
                {current}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-2">
             {/* Comparativa 2025 */}
             <div className="flex items-center justify-center gap-4 bg-surface-edge/10 border border-surface-edge/20 px-3 py-2.5 rounded-xl">
                <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">{year - 1}</span>
                <div className="flex items-center gap-2">
                   <span className="text-[24px] font-black text-white font-mono">{target}</span>
                   {getGrowthBadge(growth2025)}
                </div>
             </div>

             {/* Comparativa 2024 */}
             <div className="flex items-center justify-center gap-4 bg-surface-edge/10 border border-surface-edge/20 px-3 py-2.5 rounded-xl">
                <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">{year - 2}</span>
                <div className="flex items-center gap-2">
                   <span className="text-[24px] font-black text-white font-mono">{prevTarget}</span>
                   {getGrowthBadge(growth2024)}
                </div>
             </div>

             {/* Comparativa 2023 */}
             <div className="flex items-center justify-center gap-4 bg-surface-edge/10 border border-surface-edge/20 px-3 py-2.5 rounded-xl">
                <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest">{year - 3}</span>
                <div className="flex items-center gap-2">
                   <span className="text-[24px] font-black text-white font-mono">{prev3YearTarget}</span>
                   {getGrowthBadge(growth2023)}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
