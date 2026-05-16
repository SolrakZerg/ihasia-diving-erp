import React from 'react';

export default function CRBT_DailyLog({ 
  year, 
  month, 
  dailyLog, 
  updateLog, 
  stats, 
  LOG_OPTIONS 
}) {
  return (
    <div className="flex-none min-w-0 w-full lg:w-fit lg:min-w-[400px] max-w-[550px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col h-fit xl:max-h-full">
      <div className="flex-1 overflow-x-auto overflow-y-visible xl:overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="md:sticky top-0 z-40 bg-table-header/98 backdrop-blur-xl h-[70px]">
            <tr className="border-b border-surface-edge">
              <th className="px-2 text-[14px] font-black text-text-header uppercase tracking-widest w-20 text-right pr-4 bg-table-header/98">Día</th>
              {['OFIC', 'AGUA', 'TEO', 'OFF'].map(h => (<th key={h} className="text-[14px] font-black text-text-header uppercase text-center border-l border-surface-edge/20">{h}</th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/10">
            {Array.from({length: new Date(year, month, 0).getDate()}).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const log = dailyLog[dateStr] || {};
              const dayName = new Date(year, month-1, day).toLocaleDateString('es-ES', {weekday: 'short'}).toUpperCase();
              return (
                <tr key={day} className="hover:bg-white/5 transition-colors h-9">
                  <td className="pr-4 text-right bg-table-header/98"><div className="flex items-center justify-end gap-2 leading-none"><span className="text-[10px] font-black text-text-dim">{dayName.slice(0,3)}</span><span className="text-xs font-black text-white w-4">{day}</span></div></td>
                  {['office', 'water', 'theory', 'off'].map(field => (
                    <td key={field} className="px-0.5 border-l border-surface-edge/10">
                       <select value={log[field] || 'EMPTY'} onChange={e => updateLog(dateStr, field, e.target.value)} className={`w-full text-[12px] font-black rounded-md px-1 py-1.5 outline-none appearance-none text-center ${LOG_OPTIONS.find(o => o.id === (log[field] || 'EMPTY'))?.color}`}>
                         {LOG_OPTIONS.map(opt => <option key={opt.id} value={opt.id} className="bg-surface text-white">{opt.label}</option>)}
                       </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="md:sticky bottom-0 z-30 bg-table-header/98 border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.5)] h-10 font-black text-[14px]">
            <tr>
              <td className="pr-4 text-right text-text-muted uppercase text-[11px] bg-table-header/98">TOT</td>
              {['office', 'water', 'theory', 'totalOff'].map(field => (
                <td key={field} className="text-center border-l border-surface-edge/10 p-0">
                  <div className="flex h-full items-center divide-x divide-white/5">
                     <div className="flex-1 text-blue-400 py-2 font-black">{stats.CR[field]}</div>
                     <div className="flex-1 text-pink-400 py-2 font-black">{stats.BT[field]}</div>
                  </div>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
