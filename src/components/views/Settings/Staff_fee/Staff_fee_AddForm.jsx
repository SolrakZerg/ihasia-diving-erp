import { ArrowLeft, Loader2, Check } from 'lucide-react';

/**
 * Staff_fee_AddForm — Formulario para añadir una nueva regla de pago.
 *
 * Props:
 *  - formData    {object}   Valores del formulario.
 *  - setFormData {function} Actualizador del formulario.
 *  - savePayout  {function} onSubmit con lógica de guardado.
 *  - saving      {boolean}  Muestra spinner mientras se guarda.
 *  - activities  {Array}    Lista de actividades del catálogo.
 *  - payouts     {Array}    Reglas existentes (para filtrar el select).
 *  - onCancel    {function} Vuelve al listado.
 */
export default function Staff_fee_AddForm({
  formData,
  setFormData,
  savePayout,
  saving,
  activities,
  payouts,
  onCancel,
}) {
  return (
    <div className="p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 bg-surface-soft px-4 py-2 rounded-xl border border-surface-edge transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Cancelar
      </button>

      <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Añadir Regla de Pago</h2>
        <p className="text-gray-400 mb-8 text-sm">Define cuánto cobra el instructor por una actividad específica.</p>

        <form onSubmit={savePayout} className="space-y-6">

          {/* Tipo selector */}
          <div className="flex gap-2 p-1 bg-surface rounded-xl border border-surface-edge">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'catalog' })}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'catalog' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Desde Catálogo
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'custom' })}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'custom' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Concepto Manual
            </button>
          </div>

          <div className="space-y-4">
            {/* Catálogo o nombre manual */}
            {formData.type === 'catalog' ? (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Seleccionar Actividad</label>
                <select
                  required
                  value={formData.activity_id}
                  onChange={e => setFormData({ ...formData, activity_id: e.target.value })}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none"
                >
                  <option value="">Selecciona curso/actividad...</option>
                  {activities
                    .filter(act =>
                      !payouts.some(p => p.activity_id === act.id) &&
                      act.category !== 'Retail' &&
                      act.category !== 'Snorkeling'
                    )
                    .map(act => (
                      <option key={act.id} value={act.id}>{act.name} ({act.category})</option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nombre del Concepto</label>
                <input
                  required
                  placeholder="Ej: Asistencia OW (1 día)"
                  value={formData.concept_name}
                  onChange={e => setFormData({ ...formData, concept_name: e.target.value })}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none"
                />
              </div>
            )}

            {/* Importe */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pago Instructor (THB)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount_thb}
                  onChange={e => setFormData({ ...formData, amount_thb: e.target.value })}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white font-black text-lg focus:border-brand outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand font-black italic">฿</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-light py-4 rounded-xl font-black text-white shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <span className="animate-spin">⟳</span> : <><Check className="w-5 h-5" /> Guardar Regla</>}
          </button>
        </form>
      </div>
    </div>
  );
}
