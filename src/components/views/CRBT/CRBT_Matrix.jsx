import React from 'react';
import EditableInput from '../../common/EditableInput';

export default function CRBT_Matrix({ 
  fixedColumns, 
  dynamicActivities, 
  matrixData, 
  assists, 
  manualAdj, 
  updateAssist, 
  updateAdjustment,
  totalAdj,
  totalComm,
  totalAssists
}) {
  return (
    <div className="flex-none w-fit max-w-full lg:max-w-[850px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-full">
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-30 bg-table-header/98 backdrop-blur-xl h-[70px]">
            <tr className="border-b border-surface-edge">
              <th className="p-2 text-[10px] font-black text-text-header uppercase tracking-widest text-center w-12 bg-table-header/98 sticky left-0 z-40">Día</th>
              {fixedColumns.map(col => (<th key={col.key} className="p-0 text-[16px] font-black text-text-muted uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[35px]"><div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{col.label.split('').map((char, i) => <span key={i}>{char}</span>)}</div></th>))}
              {dynamicActivities.map(act => (<th key={act.id} className="p-0 text-[16px] font-black text-amber-500/60 uppercase tracking-tighter text-center border-l border-surface-edge/30 bg-amber-500/5 w-[35px]"><div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{(act.acronym || act.name).split('').slice(0, 8).map((char, i) => <span key={i}>{char}</span>)}</div></th>))}
              <th className="p-0 text-[16px] font-black text-cyan-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-[35px] bg-cyan-500/5"><div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">{'ASS'.split('').map((char, i) => <span key={i}>{char}</span>)}</div></th>
              <th className="p-1 text-[16px] font-black text-indigo-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-16 bg-indigo-500/5 min-w-[64px]">Extra</th>
              <th className="p-2 text-[14px] font-black text-white uppercase tracking-widest text-right bg-surface-edge/30 w-auto">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/40">
            {Object.keys(matrixData).map(day => (
              <tr key={day} className="group hover:bg-white/5 transition-colors h-9">
                <td className="p-0 text-center font-black text-text-muted text-sm sticky left-0 bg-table-header/98 z-20 group-hover:bg-surface-edge/20 transition-colors border-r border-surface-edge/10">{day}</td>
                {fixedColumns.map(col => {
                   const count = matrixData[day].items[col.key] || 0;
                   return (<td key={col.key} className="p-0 border-l border-surface-edge/10 text-center w-[35px] min-w-[35px]"><span className={`text-base font-black transition-colors ${count > 0 ? 'text-white' : 'text-text-muted/20'}`}>{count || ''}</span></td>);
                })}
                {dynamicActivities.map(act => {
                    const count = matrixData[day].items[`dyn_${act.id}`] || 0;
                    return (<td key={act.id} className="p-0 border-l border-surface-edge/10 text-center bg-amber-500/5 w-[35px] min-w-[35px]"><span className={`text-[17px] font-black transition-colors ${count > 0 ? 'text-amber-400' : 'text-text-muted/20'}`}>{count || ''}</span></td>);
                 })}
                <td className="p-0 border-l border-surface-edge/10 bg-cyan-500/5">
                  <EditableInput
                    type="number"
                    defaultValue={assists[day] || ''}
                    onSave={(val) => updateAssist(day, val)}
                    className="w-full bg-transparent text-center text-cyan-400 font-black text-base outline-none no-spinner"
                    placeholder="0"
                  />
                </td>
                <td className="p-0 border-l border-surface-edge/10 bg-indigo-500/5">
                  <EditableInput
                    type="number"
                    defaultValue={manualAdj[day] || ''}
                    onSave={(val) => updateAdjustment(day, val)}
                    className="w-full bg-transparent text-center text-indigo-400 font-black text-sm outline-none no-spinner"
                    placeholder="0"
                  />
                </td>
                <td className="p-0 text-right border-l border-surface-edge/10 bg-surface-edge/5 pr-4"><span className={`text-sm font-black transition-all ${matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000) > 0 ? 'text-emerald-400' : 'text-text-muted/30'}`}>{(matrixData[day].total + (manualAdj[day] || 0) + ((assists[day] || 0) * 2000)).toLocaleString()} ฿</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-30 bg-table-header/98 border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)] h-9 font-black">
            <tr>
              <td className="p-0 text-center text-text-muted text-[10px] uppercase bg-table-header/98 sticky left-0 z-40 border-r border-surface-edge/10">TOT</td>
              {fixedColumns.map(col => (<td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-sm text-text-muted">{Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}</td>))}
              {dynamicActivities.map(act => (<td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[13px] text-amber-500/40 bg-amber-500/5">{Object.values(matrixData).reduce((acc, d) => acc + (d.items[`dyn_${act.id}`] || 0), 0)}</td>))}
              <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 text-sm bg-cyan-500/5">{Object.values(assists).reduce((acc, val) => acc + val, 0)}</td>
              <td className="p-0 text-center border-l border-surface-edge/10 text-indigo-400 text-sm bg-indigo-500/5">{totalAdj.toLocaleString()} ฿</td>
              <td className="p-1 text-right border-l border-surface-edge/20 text-emerald-400 text-lg bg-surface-edge/30 pr-4">{(totalComm + totalAssists + totalAdj).toLocaleString()} ฿</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
