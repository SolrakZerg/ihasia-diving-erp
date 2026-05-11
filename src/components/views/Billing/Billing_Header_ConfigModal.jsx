import { useState } from 'react';
import { Settings, X as CloseIcon } from 'lucide-react';

export default function Billing_Header_ConfigModal({
  onClose,
  categories = [],
  activities = [],
  supabase,
  fetchCatalogs,
  fetchInvoices,
}) {
  // Estado local: solo vive dentro de este modal
  const [catFilter, setCatFilter] = useState(['Course', 'Fun Dive', 'Pro']);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Cabecera del modal */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand" />
              Configurar Widget
            </h3>
            <p className="text-xs text-gray-400 font-medium">Personaliza qué actividades ves en cada columna</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro de categorías */}
        <div className="p-4 bg-slate-800/50 border-b border-white/5 flex flex-wrap gap-2">
          {categories.map(cat => {
            const isActive = catFilter.includes(cat.name);
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => setCatFilter(prev =>
                  prev.includes(cat.name)
                    ? prev.filter(c => c !== cat.name)
                    : [...prev, cat.name]
                )}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? (cat.color || 'bg-brand/20 border-brand text-brand') + ' shadow-lg shadow-brand/10'
                    : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Lista de actividades */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-900">
          <div className="grid grid-cols-1 gap-2">
            {activities
              .filter(act => catFilter.includes(act.category || 'Other'))
              .map(act => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-brand/30 transition-all group"
                >
                  {/* Info de la actividad */}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-brand transition-colors">{act.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded border"
                        style={{
                          color: act.color || '#94a3b8',
                          backgroundColor: (act.color || '#94a3b8') + '15',
                          borderColor: (act.color || '#94a3b8') + '30'
                        }}
                      >
                        {act.acronym || 'SIN ACRÓNIMO'}
                      </span>
                      {(() => {
                        const catObj = categories.find(c => c.name === act.category);
                        return (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold ${catObj?.color || 'bg-white/5 text-gray-400 border border-white/10'}`}>
                            {act.category}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Controles de columna y orden */}
                  <div className="flex items-center gap-2">
                    <select
                      value={act.widget_column || ''}
                      onChange={async (e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        setIsSavingConfig(true);
                        await supabase.from('activities').update({ widget_column: val }).eq('id', act.id);
                        await fetchCatalogs();
                        await fetchInvoices(false);
                        setIsSavingConfig(false);
                      }}
                      className="bg-slate-800 border-none text-[11px] font-bold text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-brand cursor-pointer min-w-[120px]"
                    >
                      <option value="">Ocultar</option>
                      <option value="1">Columna 1 (Cursos)</option>
                      <option value="2">Columna 2 (Tanques)</option>
                      <option value="3">Columna 3 (Especialidades)</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Ord"
                      defaultValue={act.widget_order || 0}
                      onBlur={async (e) => {
                        const val = Number(e.target.value);
                        setIsSavingConfig(true);
                        await supabase.from('activities').update({ widget_order: val }).eq('id', act.id);
                        await fetchCatalogs();
                        await fetchInvoices(false);
                        setIsSavingConfig(false);
                      }}
                      className="w-12 bg-slate-800 border-none text-[11px] font-bold text-white text-center rounded-lg py-1.5 focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="p-6 bg-slate-900 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-brand text-white font-black text-sm rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
          >
            Cerrar Configurador
          </button>
        </div>
      </div>
    </div>
  );
}
