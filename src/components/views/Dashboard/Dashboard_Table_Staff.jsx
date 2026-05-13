export default function Dashboard_Table_Staff({ staffData }) {
   const totalEarned = staffData.reduce((acc, s) => acc + s.totalEarned, 0);
   const totalPending = staffData.reduce((acc, s) => acc + s.pending, 0);

   return (
      <div style={{ flex: '1 1 250px', maxWidth: '350px' }} className="bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-xl h-[480px] flex flex-col">
         <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2 text-center">Staff</h3>
         <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-surface-edge/50">
                     <th className="text-[14px] font-black text-gray-500 uppercase py-0.5">Nombre</th>
                     <th className="text-[14px] font-black text-gray-500 uppercase py-0.5 text-right">Sueldo</th>
                     <th className="text-[14px] font-black text-gray-500 uppercase py-0.5 text-right">Pend.</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/15">
                  {staffData.map((s, idx) => (
                     <tr key={idx} className="group hover:bg-surface-edge transition-colors">
                        <td className="py-1 text-sm font-black text-white uppercase">{s.name}</td>
                        <td className="py-1 text-right text-sm font-mono text-white">{Math.round(s.totalEarned).toLocaleString()}</td>
                        <td className={`py-1 text-right text-sm font-mono ${s.pending > 0 ? 'text-amber-500' : 'text-emerald-500 opacity-70'}`}>{Math.round(s.pending).toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
               <tfoot className="sticky bottom-0 bg-surface-soft border-t-2 border-surface-edge/80 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                  <tr className="h-10">
                     <td className="text-[13px] font-black text-gray-400 uppercase italic pl-2">Total</td>
                     <td className="text-[18px] font-black text-cyan-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                        {Math.round(totalEarned).toLocaleString()}
                     </td>
                     <td className="text-[18px] font-black text-orange-400 text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(251,146,60,0.2)] pr-2">
                        {Math.round(totalPending).toLocaleString()}
                     </td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
   );
}
