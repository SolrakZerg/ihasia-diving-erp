import { CheckCircle2 } from 'lucide-react';
import EditableInput from '../../common/EditableInput';

export default function Dashboard_Table_Gastos({
  expenseData,
  incomeData,
  updateGenericPending,
  fetchDashboardData
}) {
  return (
    <div style={{ flex: '1.5 1 350px' }} className="bg-surface-soft border border-surface-edge rounded-3xl p-4 shadow-xl h-[480px] flex flex-col relative overflow-hidden max-md:w-full md:max-w-[550px]">
      {/* Glow Ambient */}
      <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <h3 className="text-[14px] font-black text-text-header uppercase tracking-[0.2em] mb-4 text-center z-10">Gastos</h3>
      <div className="flex-1 overflow-auto custom-scrollbar z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface-soft/95 backdrop-blur-md z-20">
            <tr className="border-b border-surface-edge/40">
              <th className="text-[10px] font-black text-text-header uppercase py-1 text-center w-20 tracking-widest">Cat.</th>
              <th className="text-[10px] font-black text-text-header uppercase py-1 text-center w-24 tracking-widest">Gastos</th>
              <th className="text-[10px] font-black text-emerald-500 uppercase py-1 text-center w-10 tracking-widest">Pag.</th>
              <th className="text-[10px] font-black text-danger uppercase py-1 text-center w-28 tracking-widest">X Pagar</th>
              <th className="text-[10px] font-black text-text-header uppercase py-1 text-center w-10 tracking-widest">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/30">
            {expenseData.map((e, idx) => {
              const facturado = incomeData.total || 0;
              const perc = facturado > 0 ? ((e.value / facturado) * 100).toFixed(1) : 0;
              const isPaid = e.pending === 0 || e.pending === '0';

              return (
                <tr key={idx} className="group hover:bg-surface-edge transition-colors">
                  <td className="py-0.5 text-left pl-2"><span className={`text-[12px] font-black uppercase tracking-widest whitespace-nowrap ${e.color || 'text-white'}`}>{e.name}</span></td>
                  <td className="py-0.5 text-right font-mono text-[16px] text-white/90 pr-2">{Math.round(e.value).toLocaleString()}</td>
                  <td className="py-0.5 text-center">
                    {e.isEditable || e.isGeneric ? (
                      <div className="flex justify-center">
                        <button
                          onClick={() => updateGenericPending(e.col, isPaid ? '' : '0')}
                          className={`p-1 rounded-lg transition-all ${isPaid ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'text-text-muted hover:text-white bg-surface-edge/20 hover:bg-surface-edge/40'}`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isPaid ? 'fill-emerald-500/20' : ''}`} />
                        </button>
                      </div>
                    ) : <div className="text-gray-700/50 text-center">-</div>}
                  </td>
                  <td className="py-0.5 px-1">
                    <div className={`w-full rounded-lg px-2 transition-all ${isPaid
                      ? 'bg-transparent text-emerald-400/40'
                      : 'bg-danger/10 border border-danger/20 shadow-inner text-white'
                      }`}>
                      {e.isEditable || e.isGeneric ? (
                        <EditableInput
                          defaultValue={e.pending}
                          onSave={(val) => updateGenericPending(e.col, val)}
                          type="text"
                          inputMode="decimal"
                          className={`bg-transparent border-none text-right font-mono text-[18px] font-black w-full outline-none focus:text-brand transition-colors no-spinner ${isPaid ? 'text-emerald-400/40' : 'text-white'}`}
                        />
                      ) : (
                        <div className="text-right font-mono text-[18px] font-black">{Math.round(e.pending || 0).toLocaleString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5 text-center font-mono text-[12px] text-text-muted font-bold">
                    {perc}<span className="ml-1 opacity-60">%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-surface-soft/95 backdrop-blur-md border-t border-surface-edge/50 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-20">
            <tr className="h-10">
              <td className="text-[12px] font-black text-text-muted uppercase tracking-widest text-center">Total</td>
              <td className="text-[18px] font-black text-white text-right font-mono tracking-tighter pr-2">
                {Math.round(expenseData.reduce((acc, e) => acc + e.value, 0)).toLocaleString()}
              </td>
              <td className="text-center text-gray-700/50">-</td>
              <td className="text-[20px] font-black text-danger text-right font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] pr-3">
                {Math.round(expenseData.reduce((acc, e) => acc + (Number(e.pending) || 0), 0)).toLocaleString()}
              </td>
              <td className="text-[12px] font-black text-text-muted text-center font-mono">
                {incomeData.total > 0 ? ((expenseData.reduce((acc, e) => acc + e.value, 0) / incomeData.total) * 100).toFixed(1) : 0}<span className="ml-1 opacity-60">%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
