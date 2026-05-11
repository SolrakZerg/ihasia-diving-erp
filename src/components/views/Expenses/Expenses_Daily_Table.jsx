import React from 'react';
import { PlusCircle, Loader2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const Expenses_Daily_Table = ({
  isAddingExpense,
  setIsAddingExpense,
  monthlyTotal,
  loading,
  expenses,
  selectedMonth,
  selectedYear,
  handleExpenseUpdate,
  categories,
  setConfirmConfig,
  newDataExp,
  setNewDataExp,
  handleAddExpense,
  fetchData,
  handleDeleteExpense,
  notification
}) => {
  return (
    <div className="lg:col-span-4 flex flex-col h-[calc(100vh-260px)]">
      <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="py-2 px-4 border-b border-surface-edge flex items-center justify-between bg-surface-soft/50 flex-none h-[58px] gap-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">Libro de Gastos</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAddingExpense(true)} className="bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20 text-[11px] uppercase tracking-wider shrink-0">
              <PlusCircle className="w-3.5 h-3.5" />
              Nuevo Gasto
            </button>
            <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Total:</span>
              <span className="text-xl font-black text-white leading-none tracking-tighter">
                -{monthlyTotal.toLocaleString()} <span className="text-xs font-black text-rose-500/40 ml-0.5">฿</span>
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-30">
              <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest align-middle w-[60px] text-center">Día</th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest align-middle">Descripción</th>
                <th className="px-3 py-0 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center align-middle w-[100px]">Cat.</th>
                <th className="px-3 py-0 text-xs font-black text-slate-300 uppercase tracking-widest text-[11px] text-right align-middle w-[100px]">Importe</th>
                <th className="px-3 py-0 w-10 align-middle"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/10">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto opacity-20" /></td></tr>
              ) : expenses.length === 0 && !isAddingExpense ? (
                <tr><td colSpan="5" className="py-20 text-center text-gray-600 italic text-xs">Sin movimientos registrados.</td></tr>
              ) : (
                <>
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-brand/5 transition-colors group">
                      <td className="px-3 py-1.5 text-center">
                        <input
                          type="number"
                          min="1" max="31"
                          defaultValue={e.date ? parseInt(e.date.split('-')[2], 10) : ''}
                          onBlur={(ev) => {
                            const d = parseInt(ev.target.value);
                            if (!isNaN(d)) {
                              const validD = Math.min(31, Math.max(1, d));
                              const mm = String(selectedMonth + 1).padStart(2, '0');
                              const newDate = `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}`;
                              if (newDate !== e.date) handleExpenseUpdate(e.id, 'date', newDate);
                            }
                          }}
                          onKeyDown={(ev) => { if (ev.key === 'Enter') ev.target.blur(); }}
                          className="text-sm font-black text-white bg-surface-soft/70 px-1 py-1 rounded-lg border border-transparent hover:border-surface-edge/40 focus:border-brand shadow-sm w-10 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          defaultValue={e.description}
                          onBlur={(ev) => { if (ev.target.value !== e.description) handleExpenseUpdate(e.id, 'description', ev.target.value) }}
                          onKeyDown={(ev) => { if (ev.key === 'Enter') ev.target.blur(); }}
                          className="text-sm font-bold text-white/90 truncate w-full bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-2 py-1 outline-none transition-colors"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <select
                          value={e.category}
                          onChange={(ev) => handleExpenseUpdate(e.id, 'category', ev.target.value)}
                          className={`appearance-none text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-surface border border-transparent hover:border-surface-edge/50 focus:border-brand shadow-sm outline-none cursor-pointer transition-colors text-center w-full ${categories.find(c => c.name === e.category)?.color || 'text-gray-400'}`}
                        >
                          {categories.map(c => <option key={c.id} value={c.name} className="bg-surface text-white">{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-1.5 text-right flex items-center justify-end h-full">
                        <input
                          type="number"
                          defaultValue={e.amount}
                          onBlur={(ev) => { if (ev.target.value != e.amount) handleExpenseUpdate(e.id, 'amount', ev.target.value) }}
                          onKeyDown={(ev) => { if (ev.key === 'Enter') ev.target.blur(); }}
                          className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded text-right font-bold text-rose-400 text-base w-24 outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-rose-400 font-bold ml-1">฿</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button onClick={() => {
                          setConfirmConfig({
                            show: true,
                            title: 'Borrar Gasto',
                            message: `¿Estás seguro de que quieres eliminar este gasto por valor de ${e.amount} ฿?`,
                            type: 'danger',
                            onConfirm: () => {
                              handleDeleteExpense(e.id);
                              setConfirmConfig(prev => ({ ...prev, show: false }));
                            }
                          });
                        }} className="p-1.5 text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {isAddingExpense && (
                    <tr className="bg-rose-400/10 animate-in slide-in-from-bottom-2 duration-300">
                      <td className="px-2 py-3 text-center">
                        <input type="number" min="1" max="31" value={newDataExp.date ? parseInt(newDataExp.date.split('-')[2], 10) : ''} onChange={e => {
                          const d = parseInt(e.target.value) || 1;
                          const validD = Math.min(31, Math.max(1, d));
                          const mm = String(selectedMonth + 1).padStart(2, '0');
                          setNewDataExp({ ...newDataExp, date: `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}` })
                        }} className="w-10 bg-surface border border-surface-edge rounded px-1 py-1 text-xs text-center text-white font-black outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </td>
                      <td className="px-2 py-3">
                        <input autoFocus placeholder="Descripción..." value={newDataExp.description} onChange={e => setNewDataExp({ ...newDataExp, description: e.target.value })} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-rose-500/50" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <select value={newDataExp.category} onChange={e => setNewDataExp({ ...newDataExp, category: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-rose-500/50">
                          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-3 text-right"><input type="number" placeholder="0.00" value={newDataExp.amount} onChange={e => setNewDataExp({ ...newDataExp, amount: e.target.value })} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-rose-400 text-right font-black outline-none focus:ring-1 focus:ring-rose-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                      <td className="px-2 py-3 text-right flex items-center justify-end gap-1">
                        <button onClick={handleAddExpense} className="p-1.5 bg-rose-500 text-white rounded-lg hover:scale-110 shadow-lg shadow-rose-500/20"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setIsAddingExpense(false)} className="p-1.5 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )}
                  {notification && (
                    <tr className={`border-t border-surface-edge/50 ${notification.type === 'error' ? 'bg-rose-800 text-white' : 'bg-emerald-800 text-white'}`}>
                      <td colSpan="5" className="px-3 py-1.5 text-[11px] font-black uppercase text-center tracking-wider">
                        {notification.msg}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses_Daily_Table;
