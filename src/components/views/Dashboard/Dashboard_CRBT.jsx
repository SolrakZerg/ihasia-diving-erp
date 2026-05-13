export default function Dashboard_CRBT({ monthlyReport }) {
  const profit = (monthlyReport?.partner_split || 0) * 2;
  const facturado = monthlyReport?.facturado || 0;
  const margin = facturado > 0 ? ((profit / facturado) * 100).toFixed(1) : 0;

  return (
    <div style={{ flex: '0.5 1 300px', maxWidth: '400px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl flex flex-col justify-center min-h-[240px]">
       <h3 className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-0 text-center">CRBT</h3>
       
       <div className="flex-1 flex flex-col justify-center gap-4">
         <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 border border-emerald-400/30 shadow-[0_8px_30px_rgba(16,185,129,0.3)] relative overflow-hidden flex items-center justify-between">
           <div className="absolute -right-2 -bottom-4 text-[80px] font-black text-emerald-900/10 pointer-events-none select-none tracking-tighter">
             {margin}<span className="text-[60px] ml-3 opacity-60">%</span>
           </div>
           
           <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest block mb-1">X SOCIO</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-[36px] font-black text-white font-mono tracking-tighter drop-shadow-md leading-none">{Math.round(monthlyReport?.partner_split || 0).toLocaleString()}</span>
                 <span className="text-xl text-emerald-200/80 ml-0.5">฿</span>
              </div>
           </div>
           
           <div className="flex flex-col items-end relative z-10">
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest block mb-1">MARGEN</span>
              <div className="bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                <span className="text-[24px] font-black text-white tracking-tighter font-mono leading-none">
                  {margin}<span className="ml-0.5 opacity-80">%</span>
                </span>
              </div>
           </div>
         </div>

         <div className="grid grid-cols-2 gap-2">
           <div className="flex flex-col gap-1.5">
             <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest text-center">CR (x cobrar)</span>
             <div className="bg-blue-600 rounded-xl p-3 text-center border border-blue-500 shadow-lg">
               <span className="text-[24px] font-black text-white font-mono tracking-tighter drop-shadow-md">
                 {Math.round(monthlyReport?.pending_cr || 0).toLocaleString()}<span className="text-sm opacity-50 ml-1">฿</span>
               </span>
             </div>
           </div>
           <div className="flex flex-col gap-1.5">
             <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest text-center">BT (x cobrar)</span>
             <div className="bg-pink-600 rounded-xl p-3 text-center border border-pink-500 shadow-lg">
               <span className="text-[24px] font-black text-white font-mono tracking-tighter drop-shadow-md">
                 {Math.round(monthlyReport?.pending_bt || 0).toLocaleString()}<span className="text-sm opacity-50 ml-1">฿</span>
               </span>
             </div>
           </div>
         </div>
       </div>
    </div>
  );
}
