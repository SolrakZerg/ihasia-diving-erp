import { AlertCircle, Check, X, Pencil, Trash2, Settings, Plus } from 'lucide-react';

export default function Activities_Header({
  isEditingRate, 
  setIsEditingRate,
  newRate, 
  setNewRate,
  exchangeRate, 
  updateExchangeRate,
  selectedIds, 
  handleBulkDelete,
  setShowCatModal, 
  setView
}) {
  return (
    <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
         <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">Catálogo de Precios</h1>
         <div className="flex items-center gap-2 mt-1">
           <AlertCircle className="w-3.5 h-3.5 text-gray-400"/> 
           <p className="text-xs text-gray-400 flex items-center gap-1">
             Precios EUR autocalculados al cambio base: 
             {isEditingRate ? (
               <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                 <input 
                   type="number" 
                   value={newRate} 
                   onChange={(e) => setNewRate(e.target.value)}
                   className="w-16 bg-brand/10 border border-brand/30 rounded px-1.5 py-0 text-white font-bold text-xs outline-none focus:border-brand"
                   autoFocus
                 />
                 <button onClick={updateExchangeRate} className="p-0.5 bg-brand rounded hover:bg-brand-light transition-colors"><Check className="w-3 h-3 text-white"/></button>
                 <button onClick={() => {setIsEditingRate(false); setNewRate(exchangeRate)}} className="p-0.5 bg-gray-600 rounded hover:bg-gray-500 transition-colors"><X className="w-3 h-3 text-white"/></button>
               </div>
             ) : (
               <button 
                 onClick={() => setIsEditingRate(true)}
                 className="text-white bg-surface-edge px-2 py-1 rounded-lg flex items-center gap-2 group cursor-pointer hover:bg-brand/20 transition-all border border-transparent hover:border-brand/30 shadow-sm" 
               >
                 <span className="font-bold">1€ = {exchangeRate} ฿</span>
                 <Pencil className="w-3 h-3 text-brand opacity-60 group-hover:opacity-100 transition-opacity" />
               </button>
             )}
           </p>
         </div>
      </div>
      
      <div className="flex items-center gap-3">
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm font-bold shadow-sm animate-in fade-in"
          >
            <Trash2 className="w-4 h-4" /> Borrar Lote ({selectedIds.size})
          </button>
        )}
        <button 
          onClick={() => setShowCatModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-edge bg-surface-soft text-gray-300 hover:text-white hover:border-brand/40 transition-colors text-sm font-bold shadow-sm"
        >
          <Settings className="w-4 h-4" /> Categorías
        </button>
        <button 
          onClick={() => setView('add')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-colors text-sm font-bold shadow-lg shadow-brand/20"
        >
          <Plus className="w-4 h-4" /> Añadir Artículo
        </button>
      </div>
    </div>
  );
}
