import { ArrowLeft, Tag, Coins, WavesArrowDown, Milk, Loader2, Shirt } from 'lucide-react';
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
            {/* FILA 1: COLOR + NOMBRE, CATEGORIA, ACRONIMO */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 flex gap-3">
                <div className="space-y-2 shrink-0">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Color</label>
                  <div className="flex items-center justify-center bg-surface border border-surface-edge rounded-2xl px-3 h-[46px] mt-0.5">
                    <AdvancedColorPicker
                      color={formData.color}
                      onChange={(color) => setFormData({ ...formData, color })}
                    />
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre de la Actividad</label>
                  <input
                    type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Open Water Diver"
                    className="w-full h-[46px] bg-surface border border-surface-edge rounded-2xl px-4 text-white focus:border-brand focus:outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative">
                  <select
                    className="w-full h-[46px] bg-surface border border-surface-edge rounded-2xl px-4 text-white focus:border-brand focus:outline-none appearance-none font-bold text-sm"
                    value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Acrónimo</label>
                <input
                  type="text" value={formData.acronym} onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  placeholder="OWD"
                  className="w-full h-[46px] bg-surface border border-surface-edge rounded-2xl px-2 text-white focus:border-brand focus:outline-none transition-all font-black text-center uppercase"
                />
              </div>
            </div>

            {/* FILA 2: PRECIOS Y CARABAO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Precio Venta</label>
                <div className="relative">
                  <input
                    type="text" required value={formData.price_thb} onChange={e => handleThbChange(e.target.value)}
                    placeholder="0"
                    className="w-full h-[46px] bg-surface border border-brand/30 rounded-2xl px-4 text-white font-black text-lg focus:border-brand focus:outline-none transition-all shadow-[0_0_20px_-5px_rgba(0,163,255,0.2)]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand font-black">฿</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Coste SSI</label>
                <div className="relative">
                  <input
                    type="number" required value={formData.ssi_cost_thb} onChange={e => setFormData({ ...formData, ssi_cost_thb: e.target.value })}
                    placeholder="0"
                    className="w-full h-[46px] bg-surface border border-surface-edge rounded-2xl px-4 text-white font-bold focus:border-brand focus:outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">฿</div>
                </div>
              </div>

              <div className="space-y-2 group relative">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 cursor-help">
                  Grupo Carabao
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-[12px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 border border-emerald-500/30 font-medium leading-relaxed text-left normal-case tracking-normal">
                    Clasifica la actividad para la <b>liquidación mensual de Carabao</b>.<br /><br />
                    • <b>FD/DSD/SR:</b> Se agrupan y facturan sumando tanques.<br />
                    • <b>Cursos (OW, AOW...):</b> Se agrupan y facturan por tarifa fija de alumno.<br /><br />
                    <i>Si es "Ninguno", no entrará en estas agrupaciones automáticas.</i>
                  </div>
                </label>
                <select
                  value={formData.payout_group} onChange={(e) => setFormData({ ...formData, payout_group: e.target.value })}
                  className="w-full h-[46px] bg-surface border border-emerald-500/20 rounded-2xl px-4 text-white font-bold focus:border-emerald-400 focus:outline-none appearance-none"
                >
                  <option value="">Ninguno</option>
                  {payoutGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* FILA 3: DIAS, TANQUES Y BOOLEANOS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center block">Días</label>
                <input
                  type="number" step="0.5" min="0" required value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  className="w-full h-[46px] bg-surface border border-indigo-500/20 rounded-2xl px-2 text-white font-black text-center focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2 group relative">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center block cursor-help underline decoration-dashed decoration-gray-500/50 underline-offset-4 pb-0.5">
                  Tanques
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[12px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 border border-gray-500/30 font-medium leading-relaxed text-center normal-case tracking-normal">
                    Si indicas <b>más de 0</b>, se cobrará <b>automáticamente</b> en la factura de Carabao.
                  </div>
                </label>
                <input
                  type="number" required value={formData.tanks_weight} onChange={(e) => setFormData({ ...formData, tanks_weight: e.target.value })}
                  className="w-full h-[46px] bg-surface border border-surface-edge rounded-2xl px-2 text-white font-bold text-center focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center block">Comisión</label>
                <button
                  type="button" onClick={() => setFormData({ ...formData, is_commissionable: !formData.is_commissionable })}
                  className={`w-full h-[46px] flex items-center justify-between px-3 rounded-2xl border transition-all ${formData.is_commissionable ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface border-surface-edge text-gray-600'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_commissionable ? 'SÍ' : 'NO'}</span>
                  <Coins className={`w-4 h-4 ${formData.is_commissionable ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest text-center block">SSI_active</label>
                <button
                  type="button" onClick={() => setFormData({ ...formData, is_ssi_active: !formData.is_ssi_active })}
                  className={`w-full h-[46px] flex items-center justify-between px-3 rounded-2xl border transition-all ${formData.is_ssi_active ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-surface border-surface-edge text-gray-600'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.is_ssi_active ? 'SÍ' : 'NO'}</span>
                  <WavesArrowDown className={`w-4 h-4 ${formData.is_ssi_active ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest text-center block">Camiseta</label>
                <button
                  type="button" onClick={() => setFormData({ ...formData, tshirt_included: !formData.tshirt_included })}
                  className={`w-full h-[46px] flex items-center justify-between px-3 rounded-2xl border transition-all ${formData.tshirt_included ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' : 'bg-surface border-surface-edge text-gray-600'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{formData.tshirt_included ? 'SÍ' : 'NO'}</span>
                  <Shirt className={`w-4 h-4 ${formData.tshirt_included ? 'opacity-100' : 'opacity-20'}`} />
                </button>
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
