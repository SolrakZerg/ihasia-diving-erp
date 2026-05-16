import React from 'react';
import { AlertCircle, Package } from 'lucide-react';
import CRBT_LiquidationTable from './CRBT_LiquidationTable';

export default function CRBT_Sidebar({
  sidebarOpen,
  stats,
  prevMonthBalance,
  diffDays,
  advances,
  crForm,
  setCrForm,
  btForm,
  setBtForm,
  addAdvance,
  deleteAdvance,
  saveInlineEdit,
  initialBote,
  boteStats,
  months,
  month
}) {
  return (
    <div className={`bg-surface border-l border-surface-edge flex flex-col overflow-hidden transition-all duration-500 ease-in-out shadow-2xl z-10 ${sidebarOpen ? 'w-[400px] p-6 opacity-100' : 'w-0 p-0 opacity-0'}`}>
      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 min-w-[352px] mt-10 pb-10">

        <section className="space-y-4">
          <div className="bg-surface-soft border border-surface-edge rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-center border-collapse text-[12px] table-fixed">
              <thead>
                <tr className="bg-black/20 border-b border-surface-edge">
                  <th className="p-[1px]"></th>
                  <th className="p-[1px] bg-blue-500/5 text-blue-400 font-black">OFF</th>
                  <th className="p-[1px] bg-blue-500/5 text-blue-400 font-black">1/2</th>
                  <th className="p-[1px] bg-blue-500/10 text-blue-400 font-black">TOT</th>
                  <th className="p-[1px] text-text-header font-black uppercase">Ant.</th>
                  <th className="p-[1px] bg-white/5 text-text-header font-black uppercase tracking-tight">TOT 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-edge/10">
                {['CR', 'BT'].map(p => (
                  <tr key={p} className="h-10 font-black text-xs">
                    <td className="p-[1px] h-10"><div className={`w-full h-[38px] rounded-md flex items-center justify-center text-white font-black text-[11px] ${p === 'CR' ? 'bg-blue-600' : 'bg-pink-600'}`}>{p}</div></td>
                    <td className="p-[1px] text-blue-400 bg-blue-500/5 text-[12px]">{stats[p].fullOff}</td>
                    <td className="p-[1px] text-blue-400 bg-blue-500/5 text-[12px]">{stats[p].halfOff}</td>
                    <td className="p-[1px] text-blue-400 bg-blue-500/10 text-[12px]">{stats[p].totalOff}</td>
                    <td className="p-[1px] text-text-muted font-bold text-[12px]">{prevMonthBalance[p]}</td>
                    <td className="p-[1px] text-white bg-white/5 text-[12px]">{stats[p].totalOff + prevMonthBalance[p]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {diffDays !== 0 ? (
            <div className={`p-5 rounded-[28px] flex flex-col items-center justify-center gap-2 shadow-2xl border-2 transition-all animate-in zoom-in duration-500 ${diffDays > 0 ? 'bg-rose-600 border-rose-400 text-white shadow-rose-900/40' : 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40'}`}>
              <div className="flex items-center gap-3"><AlertCircle className="w-6 h-6 text-white/80" /><span className="text-[16px] font-black uppercase tracking-tighter">{Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'día' : 'días'} le debes a {diffDays > 0 ? 'BT' : 'CR'}</span></div>
            </div>
          ) : (
            <div className="p-5 rounded-[28px] flex flex-col items-center justify-center gap-2 shadow-2xl border-2 transition-all animate-in zoom-in duration-500 bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/40">
              <div className="flex items-center gap-3"><AlertCircle className="w-6 h-6 text-white/80" /><span className="text-[16px] font-black  tracking-tighter">¡Ni pa ti ni pa mi!</span></div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <CRBT_LiquidationTable partner="CR" total={advances.filter(a => a.partner_id === 'CR').reduce((acc, a) => acc + a.amount, 0)} form={crForm} setForm={setCrForm} advances={advances} onAdd={addAdvance} onDelete={deleteAdvance} onSaveInline={saveInlineEdit} />
          <CRBT_LiquidationTable partner="BT" total={advances.filter(a => a.partner_id === 'BT').reduce((acc, a) => acc + a.amount, 0)} form={btForm} setForm={setBtForm} advances={advances} onAdd={addAdvance} onDelete={deleteAdvance} onSaveInline={saveInlineEdit} />
        </div>

        <section className="space-y-4">
          <div className="bg-surface-soft border border-surface-edge/30 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="bg-amber-500 py-3 px-8"><p className="text-[12px] font-black text-amber-950 uppercase tracking-[0.2em] flex items-center gap-2"><Package className="w-4 h-4" /> BOTE</p></div>
            <div className="p-8 space-y-4 relative z-10">
              <div className="flex justify-between items-center"><span className="text-sm font-black text-text-muted uppercase tracking-widest">INICIAL</span><span className="text-lg font-black text-amber-500">{initialBote.toLocaleString()} ฿</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-black text-text-muted uppercase tracking-widest">BOTE {months[month - 1].toUpperCase()}</span><span className="text-lg font-black text-emerald-400">+{Number(boteStats.income || 0).toLocaleString()} ฿</span></div>
              <div className="flex justify-between items-center"><span className="text-sm font-black text-text-muted uppercase tracking-widest">GASTOS</span><span className="text-lg font-black text-rose-400">-{Number(boteStats.expenses || 0).toLocaleString()} ฿</span></div>
              <div className="pt-6 border-t border-surface-edge/30 flex flex-col items-center">
                <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">BOTE PROYECTADO</p>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                  {Number(boteStats.final || 0).toLocaleString()}
                  <span className="text-lg font-black text-text-muted ml-2 italic">฿</span>
                </h2>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
