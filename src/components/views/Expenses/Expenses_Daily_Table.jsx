import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Loader2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import EditableInput from '../../common/EditableInput';

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
  const tableRef = useRef(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    if (!tableRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Si el ancho de la tabla es menor a 420px, se considera estrecha
        if (entry.contentRect.width < 420) {
          setIsNarrow(true);
        } else {
          setIsNarrow(false);
        }
      }
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lg:col-span-4 flex flex-col h-[calc(100vh-260px)]">
      <div className="bg-surface-soft border border-surface-edge rounded-2xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="py-2 px-4 border-b border-surface-edge flex items-center justify-between bg-surface-soft/50 flex-none h-[58px] gap-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">Libro de Gastos</h3>
          <div className="flex items-center gap-3">
            <div className="bg-danger/10 border border-danger/20 px-4 py-2 rounded-xl flex items-center gap-3 shrink-0">
              <span className="text-xs font-black text-danger uppercase tracking-widest">Total:</span>
              <span className="text-xl font-black text-white leading-none tracking-tighter">
                -{monthlyTotal.toLocaleString()} <span className="text-xs font-black text-danger ml-0.5">฿</span>
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table ref={tableRef} className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-30">
              <tr className="bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 h-[45px]">
                <th className="px-1 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle w-[60px] text-center">Día</th>
                <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest align-middle">Descripción</th>
                {!isNarrow && <th className="px-3 py-0 text-[11px] font-black text-text-header uppercase tracking-widest text-center align-middle w-[120px]">Cat.</th>}
                <th className="pl-1 pr-2 py-0 text-[11px] font-black text-text-header uppercase tracking-widest text-right align-middle w-[90px]">Importe</th>
                <th className="px-1 py-0 w-8 align-middle"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/10">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto opacity-20" /></td></tr>
              ) : expenses.length === 0 && !isAddingExpense ? (
                <tr><td colSpan="5" className="py-20 text-center text-text-header/60 italic text-xs">Sin movimientos registrados.</td></tr>
              ) : (
                <>
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-brand/5 transition-colors group">
                      <td className="px-1 py-1.5 text-center">
                        <EditableInput
                          type="number"
                          min="1" max="31"
                          defaultValue={e.date ? parseInt(e.date.split('-')[2], 10) : ''}
                          onSave={(value) => {
                            const d = parseInt(value);
                            if (!isNaN(d)) {
                              const validD = Math.min(31, Math.max(1, d));
                              const mm = String(selectedMonth + 1).padStart(2, '0');
                              const newDate = `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}`;
                              if (newDate !== e.date) handleExpenseUpdate(e.id, 'date', newDate);
                            }
                          }}
                          className="text-sm font-black text-white bg-surface-soft/70 px-1 py-1 rounded-lg border border-transparent hover:border-surface-edge/40 focus:border-brand shadow-sm w-10 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex flex-col gap-0.5">
                          <EditableInput
                            type="text"
                            defaultValue={e.description}
                            onSave={(value) => { if (value !== e.description) handleExpenseUpdate(e.id, 'description', value) }}
                            className="text-sm font-bold text-white/90 truncate w-full bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-2 py-1 outline-none transition-colors"
                          />
                          {isNarrow && (() => {
                            const catColor = categories.find(c => c.name === e.category)?.color;
                            return (
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: catColor || '#4f4f4f' }} />
                                <select
                                  value={e.category}
                                  onChange={(ev) => handleExpenseUpdate(e.id, 'category', ev.target.value)}
                                  className="appearance-none text-[11px] font-black uppercase bg-transparent border-transparent outline-none cursor-pointer transition-colors"
                                  style={{ color: catColor || 'var(--color-text-header)' }}
                                >
                                  {categories.map(c => <option key={c.id} value={c.name} className="bg-surface text-white">{c.name}</option>)}
                                </select>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      {!isNarrow && (
                        <td className="px-3 py-1.5 text-center w-[120px]">
                          {(() => {
                            const catColor = categories.find(c => c.name === e.category)?.color;
                            return (
                              <select
                                value={e.category}
                                onChange={(ev) => handleExpenseUpdate(e.id, 'category', ev.target.value)}
                                className={`appearance-none text-xs font-bold uppercase px-2.5 py-1 rounded-lg border hover:border-surface-edge/50 focus:border-brand shadow-sm outline-none cursor-pointer transition-colors text-center w-full ${catColor ? 'text-white border-white/20' : 'text-gray-400 bg-surface border-transparent'}`}
                                style={catColor ? { backgroundColor: catColor } : {}}
                              >
                                {categories.map(c => <option key={c.id} value={c.name} className="bg-surface text-white">{c.name}</option>)}
                              </select>
                            );
                          })()}
                        </td>
                      )}
                      <td className="pl-1 pr-2 py-1.5 text-right w-[90px]">
                        <EditableInput
                          type="number"
                          defaultValue={e.amount}
                          onSave={(value) => { if (value != e.amount) handleExpenseUpdate(e.id, 'amount', value) }}
                          className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded text-right font-bold text-danger text-base w-16 outline-none px-1 py-0.5 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none inline-block"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center w-8">
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
                        }} className="p-1.5 text-text-header/60 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  
                  {!isAddingExpense && (
                    <tr className="hover:bg-brand/5 transition-colors">
                      <td colSpan="5" className="px-3 py-3 text-center">
                        <button 
                          onClick={() => setIsAddingExpense(true)} 
                          className="btn-accept mx-auto"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Nuevo Gasto
                        </button>
                      </td>
                    </tr>
                  )}

                  {isAddingExpense && (
                    <tr className="bg-danger/10 animate-in slide-in-from-bottom-2 duration-300">
                      <td className="px-2 py-3 text-center">
                        <input type="number" min="1" max="31" value={newDataExp.date ? parseInt(newDataExp.date.split('-')[2], 10) : ''} onChange={e => {
                          const d = parseInt(e.target.value) || 1;
                          const validD = Math.min(31, Math.max(1, d));
                          const mm = String(selectedMonth + 1).padStart(2, '0');
                          setNewDataExp({ ...newDataExp, date: `${selectedYear}-${mm}-${String(validD).padStart(2, '0')}` })
                        }} className="w-10 bg-surface border border-surface-edge rounded px-1 py-1 text-xs text-center text-white font-black outline-none focus:ring-1 focus:ring-danger/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </td>
                      <td className="px-2 py-3">
                        <input autoFocus placeholder="Descripción..." value={newDataExp.description} onChange={e => setNewDataExp({ ...newDataExp, description: e.target.value })} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-danger/50" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <select value={newDataExp.category} onChange={e => setNewDataExp({ ...newDataExp, category: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-danger/50">
                          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-3 text-right"><input type="number" placeholder="0.00" value={newDataExp.amount} onChange={e => setNewDataExp({ ...newDataExp, amount: e.target.value })} className="w-full bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-danger text-right font-black outline-none focus:ring-1 focus:ring-danger/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                      <td className="px-2 py-3 text-right flex items-center justify-end gap-1">
                        <button onClick={handleAddExpense} className="p-1.5 bg-brand text-white rounded-lg hover:scale-110 shadow-lg shadow-brand/20"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setIsAddingExpense(false)} className="p-1.5 text-text-header hover:text-white"><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  )}
                  {notification && (
                    <tr className={`border-t border-surface-edge/50 ${notification.type === 'error' ? 'bg-danger/80 text-white' : 'bg-success/80 text-white'}`}>
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
