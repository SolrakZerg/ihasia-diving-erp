import React, { useMemo } from 'react';

export default function Carabao_Table({ invoiceItems, month, year, allActivities }) {
  const fixedKeys = ['FD', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));
    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const pGroup = (a?.payout_group || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        return pGroup === cleanK;
      });
      return { key, label: key, activityIds: matches.map(m => m.id) };
    });
  }, [allActivities]);

  const multipliers = {
    FD: 500, SR1: 500, SR2: 1000, DSD1: 500, DSD2: 1000, SD: 1500, OW: 2500, AOW: 2500, 'S&R': 2000, CAN: 500, DMT: 18000
  };

  const matrixData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = {};
    for (let i = 1; i <= daysInMonth; i++) data[i] = { items: {}, total: 0 };

    invoiceItems.forEach(item => {
      if (!item.date) return;
      const d = parseInt(item.date.split('-')[2]);
      const actId = String(item.activity_id || '');
      let colKey = null;
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      if (fixedCol) colKey = fixedCol.key;

      if (!colKey || !data[d]) return;
      const qty = Number(item.quantity ?? 1);
      data[d].items[colKey] = (data[d].items[colKey] || 0) + qty;

      const mult = multipliers[colKey] || 0;
      data[d].dailyMoney = (data[d].dailyMoney || 0) + (qty * mult);

      if (['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(colKey)) {
        const tankMultiplier = (colKey === 'DSD2' || colKey === 'SR2') ? 2 : 1;
        data[d].totalTanksGroup = (data[d].totalTanksGroup || 0) + (qty * tankMultiplier);
      }
    });
    return data;
  }, [invoiceItems, month, year, fixedColumns]);

  return (
    <div className="flex-none w-fit max-w-[850px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-y-auto overflow-x-hidden custom-scrollbar h-fit max-h-full relative">
      <table className="w-fit text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-30 bg-surface-soft/98 backdrop-blur-xl h-[70px]">
          <tr className="border-b border-surface-edge">
            <th className="p-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-12 bg-surface-soft">Día</th>
            {fixedColumns.map((col) => (
              <React.Fragment key={col.key}>
                <th className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[40px] min-w-[40px]">
                  <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">
                    {col.label.split('').map((char, i) => <span key={i}>{char}</span>)}
                  </div>
                </th>
                {col.key === 'SR2' && (
                  <th className="p-0 text-[18px] font-black text-emerald-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[40px] min-w-[40px] bg-emerald-500/10">
                    T
                  </th>
                )}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-edge/40">
          {/* TOTALS ROW AT TOP */}
          <tr className="bg-surface-edge/20 font-black h-9 border-b-2 border-surface-edge">
            <td className="p-0 text-center text-gray-500 text-[10px] uppercase">TOT</td>
            {fixedColumns.map(col => (
              <React.Fragment key={col.key}>
                <td className="p-0 text-center border-l border-surface-edge/10 text-sm text-brand w-[40px] min-w-[40px]">
                  {Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}
                </td>
                {col.key === 'SR2' && (
                  <td className="p-0 text-center border-l border-surface-edge/10 text-base text-emerald-400 bg-emerald-500/20 w-[40px] min-w-[40px]">
                    {Object.values(matrixData).reduce((acc, d) => acc + (d.totalTanksGroup || 0), 0)}
                  </td>
                )}
              </React.Fragment>
            ))}
          </tr>

          {Object.keys(matrixData).map(day => (
            <tr key={day} className="group hover:bg-white/5 transition-colors h-9">
              <td className="p-0 text-center font-black text-gray-600 text-sm">{day}</td>
              {fixedColumns.map((col, idx) => {
                const count = matrixData[day].items[col.key] || 0;
                const isSR2 = col.key === 'SR2';
                return (
                  <React.Fragment key={col.key}>
                    <td className="p-0 border-l border-surface-edge/10 text-center w-[40px] min-w-[40px]">
                      <span className={`text-base font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>
                        {count || ''}
                      </span>
                    </td>
                    {isSR2 && (
                      <td className="p-0 border-l border-surface-edge/10 text-center w-[40px] min-w-[40px] bg-emerald-500/20">
                        <span className={`text-base font-black ${matrixData[day].totalTanksGroup > 0 ? 'text-emerald-400' : 'text-gray-800'}`}>
                          {matrixData[day].totalTanksGroup || ''}
                        </span>
                      </td>
                    )}
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-30 bg-surface-soft border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)] font-black">
          {/* ONLY AMOUNTS ROW AT BOTTOM */}
          <tr className="h-6 bg-black/20">
            <td className="p-0 text-center text-emerald-500 text-[10px] uppercase tracking-widest">Tot</td>
            {fixedColumns.map(col => {
              const columnItems = invoiceItems.filter(item => {
                const actId = String(item.activity_id || '');
                return col.activityIds.map(String).includes(actId);
              });
              const columnAmount = columnItems.reduce((sum, item) => {
                const qty = Number(item.quantity ?? 1);
                const mult = multipliers[col.key] || 0;
                return sum + (qty * mult);
              }, 0);
              return (
                <React.Fragment key={col.key}>
                  <td className="p-0 text-center border-l border-surface-edge/10 text-[10px] text-emerald-400 w-[40px] min-w-[40px]">
                    {columnAmount > 0 ? columnAmount.toLocaleString() : ''}
                  </td>
                  {col.key === 'SR2' && (
                    <td className="p-0 text-center border-l border-surface-edge/10 text-[10px] text-emerald-400 bg-emerald-500/20 w-[40px] min-w-[40px]">
                      {(Object.values(matrixData).reduce((acc, d) => acc + (d.totalTanksGroup || 0), 0) * 500).toLocaleString()}
                    </td>
                  )}
                </React.Fragment>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
