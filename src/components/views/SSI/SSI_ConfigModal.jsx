import { useState, useEffect } from 'react';
import { Settings, X, Check, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';

export default function SSIConfigModal({ 
  isOpen, 
  onClose, 
  allActivities, 
  activeActivityIds, 
  saveConfig 
}) {
  const [localActivities, setLocalActivities] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const filtered = allActivities
        .filter(act => ['course', 'pro'].includes((act.category || '').toLowerCase()))
        .map(act => ({
          ...act,
          isSelected: activeActivityIds?.includes(act.id)
        }))
        .sort((a, b) => (a.ssi_order || 0) - (b.ssi_order || 0) || a.name.localeCompare(b.name));
      
      setLocalActivities(filtered);
    }
  }, [isOpen, allActivities, activeActivityIds]);

  if (!isOpen) return null;

  const toggleSelect = (index) => {
    const newList = [...localActivities];
    newList[index].isSelected = !newList[index].isSelected;
    setLocalActivities(newList);
  };

  const handleSave = () => {
    saveConfig(localActivities);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
       <div className="bg-[#1a1c2d] border border-indigo-500/30 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-surface-edge/50 flex justify-between items-center bg-indigo-500/5">
             <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-indigo-400" />
                <div>
                   <h3 className="text-lg font-black text-white tracking-tight uppercase">Configurar Filtro SSI</h3>
                   <p className="text-[10px] text-text-header font-black uppercase tracking-widest">Arrastra para ordenar y selecciona los cursos</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#1a1c2d]">
             <Reorder.Group axis="y" values={localActivities} onReorder={setLocalActivities} className="grid grid-cols-1 gap-2">
                {localActivities.map((act, index) => {
                   const isSelected = act.isSelected;
                   
                   return (
                      <Reorder.Item 
                         key={act.id} 
                         value={act}
                         className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                      >
                         {/* Grip Icon */}
                         <div className="text-white/20 hover:text-white/50 transition-colors p-1">
                            <GripVertical className="w-5 h-5" />
                         </div>

                         {/* Item Content */}
                         <div
                            className={`flex-1 flex items-center gap-4 py-2 px-6 rounded-2xl border-2 transition-all text-left ${
                              isSelected 
                                ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                                : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:border-white/10'
                            }`}
                         >
                            <div className="flex-1 grid grid-cols-2 gap-4 items-center">
                               <span className={`text-[15px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                 {act.name}
                               </span>
                               <span className={`text-[10px] font-black uppercase tracking-[0.2em] truncate ${isSelected ? 'text-brand' : 'text-white/20'}`}>
                                 {act.category}
                               </span>
                            </div>
                            
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleSelect(index)}
                              onPointerDown={(e) => e.stopPropagation()}
                              className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
                                isSelected ? 'bg-success border-success text-[#1a1c2d] shadow-lg shadow-success/20' : 'border-white/10 bg-black/20 text-transparent hover:border-white/30'
                              }`}
                            >
                              <Check className={`w-4 h-4 stroke-[4] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                         </div>
                      </Reorder.Item>
                   );
                })}
             </Reorder.Group>
          </div>

          <div className="p-6 bg-brand/5 flex justify-center border-t border-white/5">
             <button 
                onClick={handleSave}
                className="btn-accept w-full justify-center"
             >
                Guardar y Aplicar
             </button>
          </div>
       </div>
    </div>
  );
}
