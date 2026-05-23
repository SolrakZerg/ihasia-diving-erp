import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, ArrowDownRight, Calendar, Briefcase, CheckCircle2, Copy, Trash2, X, Compass, Search } from 'lucide-react';
import SmartSelect from '../../common/SmartSelect';

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
    <div className="fixed bottom-1 lg:bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300 max-w-[95vw] lg:max-w-none">
      <div className="bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl p-1 flex flex-col md:flex-row items-center gap-1.5 md:gap-1">
        
        {/* FILA 1: Estado y Acciones Generales (Confirmación, Cancelación, Grupo, Copiar, Borrar) */}
        <div className="flex items-center gap-1 md:gap-1.5 justify-center w-full md:w-auto">
          {/* Contador */}
          <div className="px-2 md:px-3.5 py-1 md:py-2 flex items-center justify-center border-r border-slate-200 mr-0.5 md:mr-1">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs md:text-sm shadow-md shadow-blue-500/20">{selectedItemIds.size}</div>
          </div>

          {/* Group / Ungroup */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 md:p-1 gap-0.5 md:gap-1">
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'group' ? null : 'group')} className={`flex items-center gap-1 px-2 py-1 md:py-1.5 rounded-lg transition-all font-black text-[11px] md:text-xs uppercase tracking-tight cursor-pointer ${bulkGroupAction === 'group' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:scale-[1.05] active:scale-95' : 'bg-white border border-slate-200/50 text-blue-600 hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 shadow-sm'}`}>
              <Link className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Agrupar</span>
            </button>
            <button onClick={() => setBulkGroupAction(bulkGroupAction === 'ungroup' ? null : 'ungroup')} className={`flex items-center gap-1 px-2 py-1 md:py-1.5 rounded-lg transition-all font-black text-[11px] md:text-xs uppercase tracking-tight cursor-pointer ${bulkGroupAction === 'ungroup' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 hover:scale-[1.05] active:scale-95' : 'bg-white border border-slate-200/50 text-orange-500 hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 shadow-sm'}`}>
              <ArrowDownRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden md:inline">Separar</span>
            </button>
          </div>

          {/* Confirm (✓) & Cancel (✕) */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleApplyBulkChanges}
              disabled={loadingInvoices || (!bulkGroupAction && !bulkDate && !bulkInstructor && !bulkActivity)}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:scale-110 active:scale-95 cursor-pointer"
              title="Confirmar cambios"
            >
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => { setSelectedItemIds(new Set()); setBulkDate(''); setBulkInstructor(''); setBulkActivity(''); setBulkGroupAction(null); }}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-rose-400 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-500/20 hover:scale-110 active:scale-95 cursor-pointer"
              title="Cancelar Selección"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Tools (Copy / Delete) */}
          <div className="flex items-center gap-1">
            <button onClick={handleCopyEmails} className="p-2 bg-slate-50 hover:bg-slate-200 border border-slate-200/60 text-slate-600 hover:text-slate-800 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer" title="Copiar emails"><Copy className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
            <button onClick={handleDeleteItems} className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-500 hover:text-rose-700 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer" title="Eliminar seleccionados"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
          </div>
        </div>

        {/* Separador de PC */}
        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1" />

        {/* FILA 2: Selectores de Parámetros (Fecha, Actividad, Instructor) */}
        <div className="flex items-center gap-1 md:gap-2 justify-center w-full md:w-auto">
          {/* Bulk Date */}
          <div className="relative h-8 md:h-10">
            <button className={`flex items-center gap-1 px-2.5 py-1.5 md:py-2.5 rounded-xl transition-all font-black text-[11px] md:text-xs group border h-full cursor-pointer ${bulkDate ? 'bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:scale-[1.07] active:scale-95 shadow-md shadow-slate-700/20 scale-[1.02]' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-105 active:scale-95'}`} onClick={() => document.getElementById('bulk-date-input').showPicker()}>
              <Calendar className={`w-3.5 h-3.5 md:w-4 md:h-4 ${bulkDate ? 'text-slate-300' : 'text-slate-400'}`} />
              {bulkDate ? <span>{bulkDate.split('-')[2]}</span> : <><span className="hidden md:inline">FECHA</span><span className="md:hidden">—</span></>}
            </button>
            <input
              id="bulk-date-input"
              type="date"
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              min={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
              max={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`}
              onChange={(e) => {
                const newDate = e.target.value;
                if (!newDate) {
                  setBulkDate('');
                  return;
                }
                const [y, m] = newDate.split('-').map(Number);
                if (y !== selectedYear || m !== selectedMonth) {
                  if (setToast) {
                    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                    setToast(`⚠️ Solo puedes asignar fechas de ${monthNames[selectedMonth - 1]} en este informe`);
                  }
                  return;
                }
                setBulkDate(newDate);
              }}
            />
          </div>

          {/* Bulk Activity */}
          <div className="relative h-8 md:h-10 flex items-stretch">
            <SmartSelect
              value={bulkActivity}
              options={activities.filter(a => a.acronym && a.acronym.trim() !== '')}
              onChange={(opt) => setBulkActivity(opt ? opt.id : '')}
              placeholder="¿ACT.?"
              placement="up"
              groupByKey="category"
              dropdownClassName="absolute bottom-full mb-2 left-0 w-32 bg-white border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-xl p-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200"
              searchContainerClassName="relative mb-2"
              searchIcon={<Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
              searchInputClassName="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-1 text-slate-800 text-[11px] placeholder-slate-400 outline-none focus:border-indigo-500/40 transition-colors"
              optionClassName={(act, isSelected) => `w-full text-left px-2 py-1 rounded-lg font-bold text-xs uppercase transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              renderTrigger={(selectedOption, isOpen, setIsOpen) => {
                const displayedLabel = selectedOption ? selectedOption.acronym?.toUpperCase() : null;
                return (
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all h-full text-[11px] md:text-xs font-black uppercase tracking-wider cursor-pointer ${bulkActivity
                      ? 'bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:scale-[1.07] active:scale-95 shadow-md shadow-slate-700/20 scale-[1.02]'
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Compass className={`w-3.5 h-3.5 md:w-4 md:h-4 ${bulkActivity ? 'text-slate-300' : 'text-slate-400'}`} />
                    {displayedLabel ? <span>{displayedLabel}</span> : <><span className="hidden md:inline">ACT.</span><span className="md:hidden">—</span></>}
                    {bulkActivity && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setBulkActivity('');
                        }}
                        className="ml-0.5 text-slate-300 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              }}
              renderOption={(act, isSelected) => (
                <>
                  {act.color && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: act.color }} 
                    />
                  )}
                  <span>{act.acronym?.toUpperCase()}</span>
                </>
              )}
              showClear={true}
              clearLabel="--"
            />
          </div>

          {/* Bulk Instructor */}
          {isStaffDisabled ? (
            <div className="flex items-center gap-1 rounded-xl px-2.5 border border-slate-100 bg-slate-50 h-8 md:h-10 opacity-30 cursor-not-allowed select-none">
              <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
              <span className="text-slate-400 text-[11px] md:text-xs font-black uppercase tracking-wider">—</span>
            </div>
          ) : (
            <div className="relative h-8 md:h-10 flex items-stretch">
              <SmartSelect
                value={bulkInstructor}
                options={staff.filter(s => s.active)}
                onChange={(opt) => setBulkInstructor(opt ? opt.id : '')}
                placeholder="¿INS.?"
                placement="up"
                dropdownClassName="absolute bottom-full mb-2 left-0 w-28 bg-white border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-xl p-2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-200"
                searchContainerClassName="relative mb-2"
                searchIcon={<Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />}
                searchInputClassName="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-1 text-slate-800 text-[11px] placeholder-slate-400 outline-none focus:border-amber-500/40 transition-colors"
                optionClassName={(o, isSelected) => `w-full text-left px-2.5 py-1 rounded-lg font-bold text-xs uppercase transition-colors ${
                  isSelected
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                renderTrigger={(selectedOption, isOpen, setIsOpen) => {
                  const displayedLabel = selectedOption ? (selectedOption.initials || selectedOption.first_name).toUpperCase() : null;
                  return (
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all h-full text-[11px] md:text-xs font-black uppercase tracking-wider cursor-pointer ${bulkInstructor
                        ? 'bg-slate-600 border-slate-500 text-white hover:bg-slate-700 hover:scale-[1.07] active:scale-95 shadow-md shadow-slate-700/20 scale-[1.02]'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Briefcase className={`w-3.5 h-3.5 md:w-4 md:h-4 ${bulkInstructor ? 'text-slate-300' : 'text-slate-400'}`} />
                      {displayedLabel ? <span>{displayedLabel}</span> : <><span className="hidden md:inline">INS.</span><span className="md:hidden">—</span></>}
                      {bulkInstructor && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setBulkInstructor('');
                          }}
                          className="ml-0.5 text-slate-300 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                }}
                renderOption={(s, isSelected) => (
                  <span className={`font-bold text-xs uppercase ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {s.initials?.toUpperCase() || s.first_name.toUpperCase()}
                  </span>
                )}
                showClear={true}
                clearLabel="--"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
