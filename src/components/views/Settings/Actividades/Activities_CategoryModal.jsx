import { Tag, X, Pencil, Trash2, Coins, Users } from 'lucide-react';
import AdvancedColorPicker from '../../../common/AdvancedColorPicker';

function getBadgeStyle(colorStr) {
  if (!colorStr) return { className: 'bg-surface/50 text-gray-400 border border-surface-edge' };
  if (colorStr.startsWith('bg-')) return { className: colorStr };
  return { className: 'text-white border border-white/20 shadow-sm', style: { backgroundColor: colorStr } };
}

export default function Activities_CategoryModal({
  setShowCatModal,
  categories,
  editingCat,
  catForm, setCatForm,
  colorPresets,
  handleAddCategory,
  startEditingCat,
  cancelEditingCat,
  handleDeleteCategory
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-surface-edge shadow-brand/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50">
           <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-brand" /> Editor de Categorías</h3>
              <p className="text-xs text-gray-400 mt-1">Configura las etiquetas de color para clasificar tu catálogo.</p>
           </div>
           <button onClick={() => { cancelEditingCat(); setShowCatModal(false); }} className="p-2 text-gray-400 hover:text-white bg-surface-edge/50 hover:bg-surface-edge rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-5 overflow-auto flex-1">
          {/* Existing Categories */}
          <div className="space-y-3 mb-8">
            <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Categorías Activas</h4>
            {categories.length === 0 ? <p className="text-sm text-gray-500 italic">No hay categorías configuradas.</p> : null}
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center bg-surface-soft border border-surface-edge p-3 rounded-xl hover:border-surface-edge/80 transition-colors group">
                 <div className="flex items-center gap-3">
                    <span 
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getBadgeStyle(cat.color).className}`}
                      style={getBadgeStyle(cat.color).style}
                    >
                      {cat.name}
                    </span>
                    {cat.is_commissionable && (
                       <Coins className="w-3 h-3 text-amber-500/60" title="Categoría Comisionable" />
                    )}
                 </div>
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditingCat(cat)} className="text-gray-500 hover:text-brand hover:bg-brand/10 p-1.5 rounded-lg">
                       <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Category Form */}
          <div className={`px-4 py-5 rounded-xl border transition-all ${editingCat ? 'bg-brand/5 border-brand/30 ring-1 ring-brand/20' : 'bg-surface border-surface-edge'}`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] text-brand uppercase font-black tracking-widest">
                {editingCat ? 'Editando Categoría' : 'Añadir Nueva Categoría'}
              </h4>
              {editingCat && (
                <button onClick={cancelEditingCat} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Cancelar</button>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <input 
                  value={catForm.name} onChange={e=>setCatForm({...catForm, name: e.target.value})}
                  placeholder="Ej: Alojamiento" className="flex-1 bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                />
                <AdvancedColorPicker 
                  color={catForm.color} 
                  onChange={(color) => setCatForm({...catForm, color})}
                  align="right"
                />
              </div>

              {/* Commission Toggle for Category */}
              <div className="flex items-center justify-between p-3 bg-surface-soft border border-surface-edge rounded-xl">
                <div className="flex items-center gap-2">
                   <Coins className={`w-4 h-4 ${catForm.is_commissionable ? 'text-amber-500' : 'text-gray-600'}`} />
                   <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pagar Comisión por defecto</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setCatForm({...catForm, is_commissionable: !catForm.is_commissionable})}
                  className={`w-12 h-6 rounded-full transition-all relative ${catForm.is_commissionable ? 'bg-amber-500' : 'bg-surface-edge'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${catForm.is_commissionable ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {/* Requires Staff Toggle for Category */}
              <div className="flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                   <Users className={`w-4 h-4 ${catForm.requires_staff ? 'text-indigo-400' : 'text-gray-600'}`} />
                   <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">¿Requiere Staff / Instructor?</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setCatForm({...catForm, requires_staff: !catForm.requires_staff})}
                  className={`w-12 h-6 rounded-full transition-all relative ${catForm.requires_staff ? 'bg-indigo-500' : 'bg-surface-edge'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${catForm.requires_staff ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <button 
                onClick={handleAddCategory} disabled={!catForm.name.trim()}
                className={`w-full text-white text-sm font-bold py-2.5 rounded-lg mt-2 disabled:opacity-50 transition-all ${editingCat ? 'bg-brand hover:bg-brand-light shadow-lg shadow-brand/20' : 'bg-surface-edge hover:bg-surface-edge/80'}`}
              >
                {editingCat ? 'Actualizar Categoría' : 'Guardar Categoría'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
