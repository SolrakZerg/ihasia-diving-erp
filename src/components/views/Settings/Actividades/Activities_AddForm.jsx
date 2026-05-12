import { ArrowLeft, Tag, Coins, WavesArrowDown, Milk, Loader2 } from 'lucide-react';
import AdvancedColorPicker from '../../../common/AdvancedColorPicker';

export default function Activities_AddForm({
  setView,
  saveActivity,
  saving,
  formData, setFormData,
  categories,
  colorPresets,
  payoutGroups,
  handleThbChange
}) {
  return (
    <div className="flex flex-col h-full bg-background overflow-auto p-4 sm:p-10">
      <div className="max-w-3xl mx-auto w-full">
        <button 
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors bg-surface-soft w-fit px-4 py-2 rounded-xl border border-surface-edge hover:border-brand/30"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>

        <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Añadir Nuevo</h1>
          <p className="text-gray-400 mb-8">Registra un nuevo curso, fun dive o producto para la venta.</p>

          <form onSubmit={saveActivity} className="space-y-8">
            {/* FILA 1: NOMBRE, CATEGORIA, ACRONIMO, DURACION */}
            <div className="grid grid-cols-1 md:grid-cols-20 gap-5">
              <div className="md:col-span-10 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre de la Actividad</label>
                <input 
                  type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Open Water Diver"
                  className="w-full bg-surface border border-surface-edge rounded-2xl px-4 py-3 text-white focus:border-brand focus:outline-none transition-all font-bold"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface border border-surface-edge rounded-2xl px-4 py-3 text-white focus:border-brand focus:outline-none appearance-none font-bold text-sm"
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-center block">Acrónimo</label>
                <input 
                  type="text" value={formData.acronym} onChange={(e) => setFormData({...formData, acronym: e.target.value})}
                  placeholder="OWD"
                  className="w-full bg-surface border border-surface-edge rounded-2xl px-4 py-3 text-white focus:border-brand focus:outline-none transition-all font-black text-center"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 text-center block">Días</label>
                <div className="relative">
                  <input 
                    type="number" step="0.5" min="0" required value={formData.duration_days} onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                    className="w-full bg-surface border border-indigo-500/20 rounded-2xl px-4 py-3 text-white font-black text-center focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* FILA 2: COLOR ACTIVIDAD */}
            <div className="space-y-3 p-5 bg-surface/30 rounded-[32px] border border-surface-edge/50">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color de Actividad (Fondo en Tabla)</label>
              <div className="flex items-center gap-4">
                <AdvancedColorPicker 
                  color={formData.color} 
                  onChange={(color) => setFormData({...formData, color})}
                />
                <button 
                  type="button" onClick={() => setFormData({...formData, color: ''})}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${!formData.color ? 'bg-white text-gray-900 border-white shadow-lg shadow-white/20' : 'bg-surface border-surface-edge text-gray-500 hover:text-white hover:border-gray-600'}`}
                >
                  Sin Color (Transparente)
                </button>
              </div>
            </div>

            {/* FILA 3: PRECIO, COMISION, SSI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Precio Venta (THB)</label>
                <div className="relative">
                  <input 
                    type="text" required value={formData.price_thb} onChange={e=>handleThbChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface border border-brand/30 rounded-2xl px-4 py-3.5 text-white font-black text-lg focus:border-brand focus:outline-none transition-all shadow-[0_0_20px_-5px_rgba(0,163,255,0.2)]"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-brand font-black">฿</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Paga Comisión</label>
                <button 
                  type="button" onClick={() => setFormData({...formData, is_commissionable: !formData.is_commissionable})}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${formData.is_commissionable ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface border-surface-edge text-gray-600'}`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{formData.is_commissionable ? 'SÍ' : 'NO'}</span>
                  <Coins className={`w-5 h-5 ${formData.is_commissionable ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Visible en SSI</label>
                <button 
                  type="button" onClick={() => setFormData({...formData, is_ssi_active: !formData.is_ssi_active})}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${formData.is_ssi_active ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-surface border-surface-edge text-gray-600'}`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{formData.is_ssi_active ? 'VISIBLE' : 'OCULTO'}</span>
                  <WavesArrowDown className={`w-5 h-5 ${formData.is_ssi_active ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              </div>
            </div>

            {/* FILA 4: NUMERO TANQUES, SUELDO, COSTE SSI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Milk className="w-3 h-3"/> Número Tanques</label>
                <input 
                  type="number" required value={formData.tanks_weight} onChange={(e) => setFormData({...formData, tanks_weight: e.target.value})}
                  className="w-full bg-surface border border-surface-edge rounded-2xl px-4 py-3 text-white font-bold focus:border-brand focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Grupo Carabao</label>
                <select 
                  value={formData.payout_group} onChange={(e) => setFormData({...formData, payout_group: e.target.value})}
                  className="w-full bg-surface border border-emerald-500/20 rounded-2xl px-4 py-3 text-white font-bold focus:border-emerald-400 focus:outline-none appearance-none"
                >
                  <option value="">Ninguno</option>
                  {payoutGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-edge">
              <button 
                type="submit" disabled={saving}
                className="w-full bg-brand hover:bg-brand-light text-white font-black uppercase tracking-[0.2em] py-5 rounded-[24px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand/20 disabled:opacity-50 text-base"
              >
                {saving ? <><Loader2 className="w-6 h-6 animate-spin" /> Guardando...</> : 'Confirmar Guardado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
