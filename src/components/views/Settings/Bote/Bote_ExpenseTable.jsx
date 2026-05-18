import { Edit2, Trash2, Check, X, AlertCircle, Package } from 'lucide-react';

const CATEGORIES = ['Material', 'Camisetas', 'Seguros', 'Otros'];

/**
 * Bote_ExpenseTable — Tabla de movimientos con edición inline de fila completa.
 * Componente puramente presentacional.
 *
 * Props:
 *  - expenses         {Array}
 *  - inlineEditId     {string|null}
 *  - inlineForm       {object}  { day, amount, concept, category }
 *  - setInlineForm    {function}
 *  - startInlineEdit  {function}
 *  - handleSaveInline {function}
 *  - cancelInlineEdit {function}
 *  - handleDeleteExpense {function}
 */
export default function Bote_ExpenseTable({
  expenses,
  inlineEditId,
  inlineForm,
  setInlineForm,
  startInlineEdit,
  handleSaveInline,
  cancelInlineEdit,
  handleDeleteExpense,
}) {
  return (
    <div className="lg:col-span-2 bg-surface-soft border border-surface-edge rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col h-[550px]">
      {/* Header de la tabla */}
      <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex justify-between items-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Package className="w-4 h-4 text-brand" /> Registro de Movimientos
        </h3>
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
          {expenses.length} movimientos
        </span>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <AlertCircle className="w-12 h-12 opacity-10 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-30">No hay gastos registrados este mes</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
                <th className="px-6 py-4 text-[10px] font-black text-text-header uppercase tracking-widest text-left">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-header uppercase tracking-widest text-left">Concepto</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-header uppercase tracking-widest text-center">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-header uppercase tracking-widest text-right">Cantidad</th>
                <th className="px-6 py-4 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/10">
              {expenses.map(expense => (
                <tr
                  key={expense.id}
                  className="hover:bg-white/5 transition-colors group"
                  onKeyDown={e => {
                    if (inlineEditId === expense.id) {
                      if (e.key === 'Enter')  { e.preventDefault(); handleSaveInline(expense.id); }
                      if (e.key === 'Escape') { cancelInlineEdit(); }
                    }
                  }}
                >
                  {inlineEditId === expense.id ? (
                    <>
                      {/* Fila en modo edición */}
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={inlineForm.day}
                          onChange={e => setInlineForm({ ...inlineForm, day: e.target.value })}
                          className="w-16 bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none font-black text-center no-spinner"
                          min="1" max="31"
                          autoFocus
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={inlineForm.concept}
                          onChange={e => setInlineForm({ ...inlineForm, concept: e.target.value })}
                          className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none font-black"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={inlineForm.category}
                          onChange={e => setInlineForm({ ...inlineForm, category: e.target.value })}
                          className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={inlineForm.amount}
                          onChange={e => setInlineForm({ ...inlineForm, amount: e.target.value })}
                          className="w-full bg-surface border border-brand/50 rounded-lg px-2 py-1 text-xs text-white text-right outline-none font-black no-spinner"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveInline(expense.id)}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Fila en modo visualización */}
                      <td className="px-6 py-4 text-sm font-bold text-gray-400">
                        {new Date(expense.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-white capitalize">
                        {expense.concept}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-surface-edge text-gray-400 uppercase tracking-widest">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-400">
                        - {Number(expense.amount).toLocaleString()} ฿
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startInlineEdit(expense)}
                            className="p-2 text-text-dim hover:text-brand hover:bg-brand/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-text-dim hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
