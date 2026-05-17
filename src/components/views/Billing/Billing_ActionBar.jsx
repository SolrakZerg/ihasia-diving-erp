import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, ArrowDownRight, Calendar, Briefcase, CheckCircle2, Copy, Trash2, X, Compass, Search } from 'lucide-react';

function BulkActivitySelect({ value, onChange, activities, categories }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAct = activities.find(a => String(a.id) === String(value));
  const displayedLabel = selectedAct ? selectedAct.acronym?.toUpperCase() : '¿ACT.?';

  const eligibleActivities = activities.filter(a => a.acronym && a.acronym.trim() !== '');

  const filteredActivities = eligibleActivities.filter(a =>
    a.acronym.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative h-10 select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all h-full text-xs font-black uppercase tracking-wider cursor-pointer ${value
          ? 'bg-indigo-700 border-indigo-600 text-white hover:bg-indigo-800 hover:scale-[1.07] active:scale-95 shadow-lg shadow-indigo-500/30 scale-[1.02]'
          : 'bg-indigo-500 border-indigo-400 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20'
          }`}
      >
        <Compass className="w-4 h-4 text-white" />
        <span>{displayedLabel}</span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearch('');
            }}
            className="ml-0.5 text-indigo-200 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-32 bg-white border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-xl p-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-1 text-slate-800 text-[11px] placeholder-slate-400 outline-none focus:border-indigo-500/40 transition-colors"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full text-left px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase transition-colors mb-1"
              >
                — Quitar —
              </button>
            )}

            {(() => {
              let lastCategory = null;
              return filteredActivities.map(act => {
                const showHeader = act.category !== lastCategory;
                lastCategory = act.category;
                return (
                  <div key={act.id}>
                    {showHeader && (
                      <div className="px-2 py-1 bg-slate-800 text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] rounded-md my-1.5 shadow-inner">
                        {act.category || 'Otros'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onChange(act.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full text-left px-2 py-1 rounded-lg font-bold text-xs uppercase transition-colors flex items-center gap-1.5 ${String(value) === String(act.id)
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      {act.color && (
                        <span 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: act.color }} 
                        />
                      )}
                      <span>{act.acronym?.toUpperCase()}</span>
                    </button>
                  </div>
                );
              });
            })()}

            {filteredActivities.length === 0 && (
              <div className="text-center py-4 text-[10px] text-slate-400 italic">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BulkInstructorSelect({ value, onChange, staff, isStaffDisabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isStaffDisabled) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl px-3 border border-slate-100 bg-slate-50 h-10 opacity-30 cursor-not-allowed select-none">
        <Briefcase className="w-4 h-4 text-slate-400" />
        <span className="text-slate-400 text-xs font-black uppercase tracking-wider">—</span>
      </div>
    );
  }

  const selectedInst = staff.find(s => String(s.id) === String(value));
  const displayedLabel = selectedInst ? (selectedInst.initials || selectedInst.first_name).toUpperCase() : '¿INS.?';

  const activeStaff = staff.filter(s => s.active);
  const filteredStaff = activeStaff.filter(s =>
    s.initials?.toLowerCase().includes(search.toLowerCase()) ||
    s.first_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative h-10 select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all h-full text-xs font-black uppercase tracking-wider cursor-pointer ${value
          ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-600/80 hover:scale-[1.07] active:scale-95 shadow-lg shadow-amber-500/30 scale-[1.02]'
          : 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600/80 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
          }`}
      >
        <Briefcase className="w-4 h-4 text-white" />
        <span>{displayedLabel}</span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearch('');
            }}
            className="ml-0.5 text-amber-200 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-28 bg-white border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-xl p-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-1 text-slate-800 text-[11px] placeholder-slate-400 outline-none focus:border-amber-500/40 transition-colors"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full text-left px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase transition-colors mb-1"
              >
                — Quitar —
              </button>
            )}

            {filteredStaff.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-2.5 py-1 rounded-lg font-bold text-xs uppercase transition-colors ${String(value) === String(s.id)
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                {s.initials?.toUpperCase() || s.first_name.toUpperCase()}
              </button>
            ))}

            {filteredStaff.length === 0 && (
              <div className="text-center py-4 text-[10px] text-slate-400 italic">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingActionBar({
  selectedItemIds, setSelectedItemIds,
  selectedMonth, selectedYear, setToast,
  bulkGroupAction, setBulkGroupAction,
  bulkDate, setBulkDate,
  bulkInstructor, setBulkInstructor,
  bulkActivity, setBulkActivity,
  activities, categories,
  staff, loadingInvoices,
  handleApplyBulkChanges, handleCopyEmails, handleDeleteItems,
}) {
  const selectedAct = activities.find(a => String(a.id) === String(bulkActivity));
  const categoryData = categories.find(c => c.name === selectedAct?.category);
  const isStaffDisabled = categoryData ? categoryData.requires_staff === false : false;

  useEffect(() => {
    if (isStaffDisabled && bulkInstructor) {
      setBulkInstructor('');
    }
  }, [isStaffDisabled, bulkInstructor, setBulkInstructor]);

  if (selectedItemIds.size === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 flex items-center gap-1">
        <div className="px-3.5 py-2 flex items-center justify-center border-r border-slate-200 mr-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">{selectedItemIds.size}</div>
        </div>

        <div className="flex items-center gap-2 pr-1 ml-2">
          {/* Group / Ungroup */}
          <div className="flex items-center bg-slate-400/80 border border-slate-300/50 rounded-xl p-1 gap-1">
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'group' ? null : 'group')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all font-black text-xs uppercase tracking-tight cursor-pointer ${bulkGroupAction === 'group' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:scale-[1.05] active:scale-95' : 'bg-white border border-slate-200/50 text-blue-600 hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 shadow-sm'}`}>
              <Link className="w-3.5 h-3.5" />Agrupar
            </button>
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'ungroup' ? null : 'ungroup')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all font-black text-xs uppercase tracking-tight cursor-pointer ${bulkGroupAction === 'ungroup' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:scale-[1.05] active:scale-95' : 'bg-white border border-slate-200/50 text-orange-500 hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 shadow-sm'}`}>
              <ArrowDownRight className="w-3.5 h-3.5" />Separar
            </button>
          </div>

          {/* Bulk Date */}
          <div className="relative h-10">
            <button className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all font-black text-xs group border h-full cursor-pointer ${bulkDate ? 'bg-blue-700 border-blue-600 text-white hover:bg-blue-800 hover:scale-[1.07] active:scale-95 shadow-lg shadow-blue-500/30 scale-[1.02]' : 'bg-blue-500 border-blue-400 text-white hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20'}`} onClick={() => document.getElementById('bulk-date-input').showPicker()}>
              <Calendar className="w-4 h-4 text-white" />
              {bulkDate ? bulkDate.split('-')[2] : 'FECHA?'}
            </button>
            <input
              id="bulk-date-input"
              type="date"
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              min={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
              max={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${new Date(selectedYear, selectedMonth + 1, 0).getDate()}`}
              onChange={(e) => {
                const newDate = e.target.value;
                if (!newDate) {
                  setBulkDate('');
                  return;
                }
                const [y, m] = newDate.split('-').map(Number);
                if (y !== selectedYear || (m - 1) !== selectedMonth) {
                  if (setToast) {
                    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                    setToast(`⚠️ Solo puedes asignar fechas de ${monthNames[selectedMonth]} en este informe`);
                  }
                  return;
                }
                setBulkDate(newDate);
              }}
            />
          </div>

          {/* Bulk Activity */}
          <BulkActivitySelect
            value={bulkActivity}
            onChange={setBulkActivity}
            activities={activities}
            categories={categories}
          />

          {/* Bulk Instructor */}
          <BulkInstructorSelect
            value={bulkInstructor}
            onChange={setBulkInstructor}
            staff={staff}
            isStaffDisabled={isStaffDisabled}
          />

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Apply & Cancel */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleApplyBulkChanges}
              disabled={loadingInvoices || (!bulkGroupAction && !bulkDate && !bulkInstructor && !bulkActivity)}
              className="flex items-center justify-center w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:scale-110 active:scale-95 cursor-pointer"
              title="Confirmar cambios"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setSelectedItemIds(new Set()); setBulkDate(''); setBulkInstructor(''); setBulkActivity(''); setBulkGroupAction(null); }}
              className="flex items-center justify-center w-10 h-10 bg-rose-400 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-500/20 hover:scale-110 active:scale-95 cursor-pointer"
              title="Cancelar Selección"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <button onClick={handleCopyEmails} className="p-2.5 bg-slate-50 hover:bg-slate-200 border border-slate-200/60 text-slate-600 hover:text-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer" title="Copiar emails"><Copy className="w-4 h-4" /></button>
            <button onClick={handleDeleteItems} className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-500 hover:text-rose-700 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer" title="Eliminar seleccionados"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
