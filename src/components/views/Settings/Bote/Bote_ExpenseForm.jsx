import { Plus, Loader2, Save } from 'lucide-react';

/**
 * Bote_ExpenseForm — Formulario lateral para añadir un nuevo gasto de Bote.
 * Componente puramente presentacional.
 *
 * Props:
 *  - newExpense    {object}   { day, amount, concept, category }
 *  - setNewExpense {function}
 *  - handleAddExpense {function}
 *  - saving        {boolean}
 */
export default function Bote_ExpenseForm({ newExpense, setNewExpense, handleAddExpense, saving }) {
  return (
    <div className="bg-surface-soft border border-surface-edge p-8 rounded-[2.5rem] shadow-xl h-fit">
      <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
        <Plus className="w-5 h-5 text-brand" /> Nuevo Gasto de Bote
      </h3>

      <div className="space-y-4">
        {/* Día + Concepto */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 text-center">Día</label>
            <input
              type="number"
              placeholder="0"
              value={newExpense.day}
              onChange={e => setNewExpense({ ...newExpense, day: e.target.value })}
              className="text-center w-full bg-surface border border-surface-edge rounded-xl px-2 py-3 text-white focus:border-brand outline-none transition-all no-spinner font-black"
              min="1"
              max="31"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Concepto</label>
            <input
              placeholder="Ej: Compra 50 Camisetas"
              value={newExpense.concept}
              onChange={e => setNewExpense({ ...newExpense, concept: e.target.value })}
              className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all"
            />
          </div>
        </div>

        {/* Cantidad + Categoría */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Cantidad (฿)</label>
            <input
              type="number"
              placeholder="0"
              value={newExpense.amount}
              onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="text-center w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all no-spinner"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Categoría</label>
            <select
              value={newExpense.category}
              onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all"
            >
              <option value="Material">Material</option>
              <option value="Camisetas">Camisetas</option>
              <option value="Seguros">Seguros</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAddExpense}
          disabled={saving || !newExpense.amount || !newExpense.concept}
          className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Registrar Gasto
        </button>
      </div>
    </div>
  );
}
