import React from 'react';

export default function Nominas_Table({ 
  matrixData, 
  fixedColumns, 
  dynamicActivities, 
  attendanceData, 
  assists, 
  handleAssChange, 
  setAdjModal, 
  manualAdj, 
  handleAttendanceToggle,
  totalComm,
  totalAssists,
  totalAdj,
  readOnly = false,
  headerTitle = "Día"
}) {
  const tableWidth = 690 + (dynamicActivities.length * 35);

  return (
    <div className="flex-1 px-0 py-0 lg:py-1 md:min-h-0 min-h-fit flex flex-col">
      <div 
        style={{ maxWidth: `${tableWidth}px` }}
        className="h-auto md:h-fit md:max-h-full w-full bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col mx-auto"
      >
        <div className="flex-1 overflow-y-auto md:overflow-x-hidden overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-30 bg-table-header/98 backdrop-blur-xl">
              <tr className="border-b border-surface-edge">
                <th className="sticky left-0 z-40 py-1 px-2 text-[12px] font-black text-brand uppercase tracking-widest text-center w-12 bg-table-header/98 backdrop-blur-xl border-r border-surface-edge/50 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                  {headerTitle}
                </th>
                {fixedColumns.map(col => (
                  <th key={col.key} className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 transition-colors hover:text-white w-[35px] min-w-[35px] h-[62px]">
                    <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-0.5">{col.label.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                  </th>
                ))}
                {dynamicActivities.map(act => (
                  <th key={act.id} className="p-0 text-[16px] font-black text-amber-500/80 uppercase tracking-tighter text-center border-l border-surface-edge/30 bg-amber-500/5 w-[35px] min-w-[35px] h-[62px]">
                    <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-0.5">{(act.acronym || act.name).split('').slice(0, 8).map((char, i) => <span key={i}>{char}</span>)}</div>
                  </th>
                ))}
                <th className="p-0 text-[16px] font-black text-cyan-400 uppercase tracking-widest text-center border-l border-surface-edge/30 w-[35px] min-w-[35px] bg-cyan-500/5 h-[62px]">
                  <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-0.5">{'ASS'.split('').map((char, i) => <span key={i}>{char}</span>)}</div>
                </th>
                <th className="p-1 text-[16px] font-black text-brand uppercase tracking-widest text-center border-l border-surface-edge/30 w-16 bg-brand/5 min-w-[64px]">Extra</th>
                <th className="p-2 text-[12px] font-black text-indigo-400 uppercase tracking-widest text-center w-12 border-l border-surface-edge/30 bg-indigo-500/5 min-w-[48px]">OFF</th>
                <th style={{ textAlign: 'center' }} className="p-2 text-[16px] font-black text-white uppercase tracking-widest bg-table-header/98 backdrop-blur-xl w-24 lg:w-24 min-w-[96px]">Total</th>
                </tr>
              <tr className="border-b border-surface-edge/50 bg-surface-edge/5 h-[26px]">
                <td className="sticky left-0 z-40 p-0 text-center text-text-muted font-black text-[10px] uppercase tracking-widest bg-table-header/98 backdrop-blur-xl border-r border-surface-edge/50 shadow-[2px_0_5px_rgba(0,0,0,0.1)] w-12 min-w-[48px]">TOT</td>
                {fixedColumns.map(col => (
                  <td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-[13px] font-black text-brand italic w-[35px] min-w-[35px]">
                    {Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}
                  </td>
                ))}
                {dynamicActivities.map(act => (
                  <td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[12px] font-black text-amber-500 bg-amber-500/5 w-[35px] min-w-[35px]">
                    {Object.values(matrixData).reduce((acc, d) => acc + (d.items[`dyn_${act.id}`] || 0), 0)}
                  </td>
                ))}
                <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 font-black text-[13px] bg-cyan-500/5 w-[35px] min-w-[35px]">
                  {Object.values(assists).reduce((acc, val) => acc + val, 0)}
                </td>
                <td className="p-0 text-center border-l border-surface-edge/10 text-brand font-black text-[11px] bg-brand/5 w-16 min-w-[64px]">
                  {totalAdj.toLocaleString()} ฿
                </td>
                <td className="p-0 text-center border-l border-surface-edge/10 bg-indigo-500/5 w-12 min-w-[48px]">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] font-black text-emerald-400">{attendanceData.summary.fullOff}F</span>
                    <span className="text-[10px] font-black text-amber-400">{attendanceData.summary.halfOff}H</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }} className="p-1 border-l border-surface-edge/20 text-emerald-400 font-black text-sm bg-table-header/98 backdrop-blur-xl w-24 lg:w-24 min-w-[96px]">
                  {(totalComm + totalAssists + totalAdj).toLocaleString()}
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/40">
              {Object.keys(matrixData).map(day => (
                <tr key={day} className="group hover:bg-white/5 transition-colors h-[34px]">
                  <td className="sticky left-0 z-20 p-0 text-center font-black text-text-muted text-sm bg-table-header/98 backdrop-blur-xl border-r border-surface-edge/50 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">{day}</td>
                  {fixedColumns.map(col => {
                     const count = matrixData[day].items[col.key] || 0;
                     return (<td key={col.key} className="p-0 border-l border-surface-edge/10 text-center w-[35px] min-w-[35px]"><span className={`text-base font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>{count || ''}</span></td>);
                  })}
                  {dynamicActivities.map(act => {
                      const count = matrixData[day].items[`dyn_${act.id}`] || 0;
                      return (<td key={act.id} className="p-0 border-l border-surface-edge/10 text-center bg-amber-500/5 w-[35px] min-w-[35px]"><span className={`text-[17px] font-black ${count > 0 ? 'text-amber-400' : 'text-gray-800'}`}>{count || ''}</span></td>);
                   })}
                  <td className="p-0 border-l border-surface-edge/10 bg-cyan-500/5 w-[35px] min-w-[35px] text-center">
                    {readOnly ? (
                      <span className="text-cyan-400 font-black text-base">{assists[day] || ''}</span>
                    ) : (
                      <input 
                        type="number" 
                        value={assists[day] || ''} 
                        onChange={(e) => handleAssChange(day, e.target.value)} 
                        className="w-full bg-transparent text-center text-cyan-400 font-black text-base outline-none focus:bg-cyan-500/10 rounded py-0" 
                      />
                    )}
                  </td>
                  <td 
                    className={`p-0 border-x border-brand/10 bg-slate-500/30 relative transition-all group/adj shadow-[inset_0_0_10px_rgba(59,130,246,0.05)] w-16 min-w-[64px] ${
                      readOnly ? '' : 'cursor-pointer hover:bg-brand/20'
                    }`}
                    onClick={() => !readOnly && setAdjModal({ 
                      open: true, 
                      day, 
                      amount: manualAdj[day]?.amount || 0, 
                      concept: manualAdj[day]?.concept || '' 
                    })}
                  >
                    {/* CUSTOM TOOLTIP */}
                    {manualAdj[day]?.concept && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0c0d16] text-white text-[11px] font-medium rounded-lg shadow-2xl opacity-0 group-hover/adj:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap border border-white/10 flex flex-col items-center">
                        {manualAdj[day].concept}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0c0d16]" />
                      </div>
                    )}

                    <div className="flex items-center justify-center h-full gap-1">
                      {manualAdj[day]?.amount ? (
                        <span className="text-sm font-black text-white/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                          {manualAdj[day].amount}
                        </span>
                      ) : (
                        !readOnly && <span className="text-[10px] text-brand/20 group-hover/adj:text-brand/60 transition-colors font-black">+</span>
                      )}
                    </div>
                  </td>
                  <td className={`p-0 border-l border-surface-edge/10 text-center transition-all w-12 min-w-[48px] ${
                    readOnly ? '' : 'cursor-pointer'
                  } ${attendanceData.grid[day] === 'OFF' ? 'bg-emerald-500/20' : attendanceData.grid[day] === 'HALF' ? 'bg-amber-500/20' : ''}`} onClick={() => !readOnly && handleAttendanceToggle(day)}>
                    <span className={`text-[11px] font-black ${attendanceData.grid[day] === 'OFF' ? 'text-emerald-400' : attendanceData.grid[day] === 'HALF' ? 'text-amber-400' : 'text-blue-400/90'}`}>{attendanceData.grid[day] === 'OFF' ? 'OFF' : attendanceData.grid[day] === 'HALF' ? 'HALF' : 'WORK'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }} className="p-0 border-l border-surface-edge/10 bg-surface-edge/5 w-24 lg:w-24 min-w-[96px]"><span className={`text-sm font-black ${matrixData[day].total + (manualAdj[day]?.amount || 0) + ((assists[day] || 0) * 2000) > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>{(matrixData[day].total + (manualAdj[day]?.amount || 0) + ((assists[day] || 0) * 2000)).toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-30 bg-table-header/98 backdrop-blur-xl border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
              <tr className="h-9 font-black">
                <td className="sticky left-0 z-40 p-0 text-center text-text-muted font-black text-[10px] uppercase tracking-widest bg-table-header/98 backdrop-blur-xl border-r border-surface-edge/50 shadow-[2px_0_5px_rgba(0,0,0,0.1)] w-12 min-w-[48px]">TOTAL</td>
                {fixedColumns.map(col => (
                  <td key={col.key} className="p-0 text-center border-l border-surface-edge/10 text-[9px] text-gray-400 w-[35px] min-w-[35px] overflow-hidden whitespace-nowrap">
                    {Object.values(matrixData).reduce((acc, d) => acc + (d.colTotals[col.key] || 0), 0).toLocaleString()}
                  </td>
                ))}
                {dynamicActivities.map(act => (
                  <td key={act.id} className="p-0 text-center border-l border-surface-edge/10 text-[9px] text-amber-500/60 bg-amber-500/5 w-[35px] min-w-[35px] overflow-hidden whitespace-nowrap">
                    {Object.values(matrixData).reduce((acc, d) => acc + (d.colTotals[`dyn_${act.id}`] || 0), 0).toLocaleString()}
                  </td>
                ))}
                <td className="p-0 text-center border-l border-surface-edge/10 text-cyan-400 text-[11px] bg-cyan-500/5 w-[35px] min-w-[35px] overflow-hidden whitespace-nowrap">
                  {totalAssists.toLocaleString()}
                </td>
                <td className="p-0 text-center border-l border-surface-edge/10 text-brand text-[11px] bg-brand/5 w-16 min-w-[64px] overflow-hidden whitespace-nowrap">
                  {totalAdj.toLocaleString()}
                </td>
                <td className="p-0 text-center border-l border-surface-edge/10 bg-indigo-500/5 w-12 min-w-[48px]"></td>
                <td style={{ textAlign: 'center' }} className="p-1 border-l border-surface-edge/20 text-emerald-400 text-lg bg-table-header/98 backdrop-blur-xl w-24 lg:w-24 min-w-[96px]">
                  {(totalComm + totalAssists + totalAdj).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
