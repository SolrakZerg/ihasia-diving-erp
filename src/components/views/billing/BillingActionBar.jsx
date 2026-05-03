import { Link, ArrowDownRight, Calendar, Briefcase, CheckCircle2, Copy, Trash2, X } from 'lucide-react';

export default function BillingActionBar({
  selectedItemIds, setSelectedItemIds,
  bulkGroupAction, setBulkGroupAction,
  bulkDate, setBulkDate,
  bulkInstructor, setBulkInstructor,
  staff, loadingInvoices,
  handleApplyBulkChanges, handleCopyEmails, handleDeleteItems,
}) {
  if (selectedItemIds.size === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-[#0B1121]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-1.5 flex items-center gap-1">
        <div className="px-4 py-2 flex items-center gap-3 border-r border-white/5 mr-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner shadow-blue-400/50">{selectedItemIds.size}</div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter leading-none mb-0.5">Items</span>
            <span className="text-white text-[13px] font-black leading-none">Seleccionados</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1 ml-2">
          {/* Group / Ungroup */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 border border-white/5">
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'group' ? null : 'group')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-tight ${bulkGroupAction === 'group' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-white/5 text-blue-400/60 hover:text-blue-400'}`}>
              <Link className="w-3.5 h-3.5" />Agrupar
            </button>
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'ungroup' ? null : 'ungroup')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-tight ${bulkGroupAction === 'ungroup' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'hover:bg-white/5 text-orange-400/60 hover:text-orange-400'}`}>
              <ArrowDownRight className="w-3.5 h-3.5" />Separar
            </button>
          </div>

          {/* Bulk Date */}
          <div className="relative h-10">
            <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-black text-xs group border h-full ${bulkDate ? 'bg-brand/20 border-brand/40 text-brand shadow-[0_0_15px_-3px_rgba(var(--brand-rgb),0.4)]' : 'hover:bg-white/5 border-transparent text-gray-400'}`} onClick={() => document.getElementById('bulk-date-input').showPicker()}>
              <Calendar className="w-4 h-4" />
              {bulkDate ? bulkDate : 'FECHA?'}
            </button>
            <input id="bulk-date-input" type="date" className="absolute w-0 h-0 opacity-0 pointer-events-none" onChange={(e) => setBulkDate(e.target.value)} />
          </div>

          {/* Bulk Instructor */}
          <div className={`flex items-center gap-2 rounded-xl px-3 border transition-all h-10 ${bulkInstructor ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-transparent'}`}>
            <Briefcase className={`w-4 h-4 ${bulkInstructor ? 'text-amber-400' : 'text-gray-500'}`} />
            <select className="bg-transparent text-white text-xs font-black outline-none cursor-pointer pr-2 py-1.5" value={bulkInstructor} onChange={(e) => setBulkInstructor(e.target.value)}>
              <option value="" className="bg-slate-900 uppercase">¿INSTRUCTOR?</option>
              {staff.filter(s => s.active).map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.first_name}</option>)}
            </select>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Apply */}
          <button onClick={handleApplyBulkChanges} disabled={loadingInvoices || (!bulkGroupAction && !bulkDate && !bulkInstructor)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-xl transition-all font-black text-xs shadow-lg shadow-emerald-900/20 active:scale-95 h-10">
            <CheckCircle2 className="w-4 h-4" />CONFIRMAR ACCIÓN
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Tools */}
          <div className="flex items-center gap-0.5">
            <button onClick={handleCopyEmails} className="p-2.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all" title="Copiar emails"><Copy className="w-4 h-4" /></button>
            <button onClick={handleDeleteItems} className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-xl transition-all" title="Eliminar seleccionados"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => { setSelectedItemIds(new Set()); setBulkDate(''); setBulkInstructor(''); setBulkGroupAction(null); }} className="p-2.5 hover:bg-white/5 text-gray-500 hover:text-white rounded-xl transition-all" title="Cancelar Selección"><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
