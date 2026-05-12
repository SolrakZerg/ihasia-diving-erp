import React, { useState, useRef } from 'react';
import { TrendingUp, Receipt, Banknote, Plus, X, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import EditableInput from '../../common/EditableInput';

export default function Nominas_Sidebar({
  finalBalance,
  attendanceData,
  assists,
  syncing,
  totalComm,
  totalAdj,
  totalAssists,
  totalAdvances,
  advances,
  addAdvance,
  removeAdvance,
  updateAdvance
}) {
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [currentAdvId, setCurrentAdvId] = useState(null);
  const conceptRef = useRef(null);
  const isSaving = useRef(false);

  return (
    <div className="w-[380px] bg-surface-soft border-l border-surface-edge flex flex-col p-8 space-y-10 overflow-auto shadow-2xl z-10">
      <div className="bg-emerald-600 rounded-[32px] p-8 shadow-xl shadow-emerald-900/20 relative overflow-hidden group border border-emerald-400/20">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex justify-between items-start relative z-10">
          <p className="text-lg font-black text-emerald-100 uppercase tracking-[0.2em] mb-4 opacity-80">Sueldo</p>
          {syncing && <Loader2 className="w-4 h-4 text-white/50 animate-spin" />}
        </div>
        <div className="relative z-10">
          <h3 className="text-6xl font-black text-white tracking-tighter leading-none mb-2">
            {finalBalance.toLocaleString()}
            <span className="text-xl font-black text-emerald-300/40 ml-2 italic">฿</span>
          </h3>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-emerald-950/40 uppercase tracking-widest leading-none mb-1">Días Libres</span>
              <span className="text-xl font-black text-white leading-none">{attendanceData.summary.totalOff}</span>
            </div>
            <div className="w-px h-8 bg-emerald-950/10" />
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-emerald-950/40 uppercase tracking-widest leading-none mb-1">Asistencias</span>
              <span className="text-xl font-black text-white leading-none">{Object.values(assists).reduce((acc, v) => acc + v, 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-950/50 text-[10px] font-black uppercase tracking-[0.2em] mt-6 border-t border-emerald-950/5 pt-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sincronizado</span>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h4 className="text-lg font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Receipt className="w-4 h-4" /> Desglose Económico</h4>
        <div className="bg-surface p-6 rounded-2xl border border-surface-edge space-y-4">
          <div className="flex justify-between items-center group/item"><span className="text-base font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Cursos</span><span className="text-base font-black text-white">{totalComm.toLocaleString()} ฿</span></div>
          <div className="flex justify-between items-center group/item"><span className="text-base font-bold text-gray-400 group-hover/item:text-gray-200 transition-colors">Extras y Ajustes</span><span className={`text-base font-black ${totalAdj + totalAssists >= 0 ? 'text-brand' : 'text-rose-400'}`}>{totalAdj + totalAssists >= 0 ? '+' : ''}{(totalAdj + totalAssists).toLocaleString()}</span></div>
          <div className="h-px bg-surface-edge/50 my-2" />
          <div className="flex justify-between items-center text-rose-400"><span className="text-base font-bold">Cobrado</span><span className="text-base font-black">-{totalAdvances.toLocaleString()} ฿</span></div>
        </div>
      </section>

      <section className="space-y-4 flex-1">
        <div className="flex items-center justify-between"><h4 className="text-lg font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Banknote className="w-4 h-4" /> Pagos</h4><button onClick={() => setShowAdvForm(!showAdvForm)} className={`p-1.5 rounded-lg transition-all ${showAdvForm ? 'bg-rose-500 text-white' : 'bg-brand/10 text-brand hover:bg-brand hover:text-white'}`}>{showAdvForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button></div>
        {showAdvForm && (
          <div className="adv-form-container bg-surface p-4 rounded-xl border border-brand/30 animate-in slide-in-from-top-2 duration-300 space-y-3 relative">
            <div className="space-y-2 pt-2">
              <EditableInput
                defaultValue=""
                onSave={async (val) => {
                  if (!val) return;
                  if (!currentAdvId) {
                    const newAdv = await addAdvance(val, '');
                    if (newAdv) {
                      setCurrentAdvId(newAdv.id);
                      // Move focus to concept after a short delay to allow state update
                      setTimeout(() => conceptRef.current?.focus(), 100);
                    }
                  } else {
                    await updateAdvance(currentAdvId, { amount: parseFloat(val) || 0 });
                    setTimeout(() => conceptRef.current?.focus(), 100);
                  }
                }}
                type="number"
                placeholder="Cantidad (฿)"
                className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white font-black outline-none focus:border-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              <input
                type="text"
                ref={conceptRef}
                placeholder="Concepto"
                disabled={!currentAdvId}
                className={`w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-brand ${!currentAdvId ? 'opacity-50 cursor-not-allowed' : ''}`}
                onKeyDown={async (ev) => {
                  if (ev.key === 'Enter') {
                    const val = ev.target.value;
                    if (currentAdvId && val) {
                      isSaving.current = true;
                      await updateAdvance(currentAdvId, { concept: val });
                      isSaving.current = false;
                    }
                    setShowAdvForm(false);
                    setCurrentAdvId(null);
                  } else if (ev.key === 'Escape') {
                    setShowAdvForm(false);
                    setCurrentAdvId(null);
                  }
                }}
                onBlur={async (ev) => {
                  const val = ev.target.value;
                  if (currentAdvId && val) {
                    isSaving.current = true;
                    await updateAdvance(currentAdvId, { concept: val });
                    isSaving.current = false;
                  }
                  // Close after a delay to allow clicks inside the container
                  setTimeout(() => {
                    if (!isSaving.current && !document.activeElement?.closest('.adv-form-container')) {
                      setShowAdvForm(false);
                      setCurrentAdvId(null);
                    }
                  }, 300);
                }}
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          {advances.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-surface-edge rounded-2xl flex flex-col items-center text-center">
              <div className="p-3 bg-surface rounded-full mb-3"><AlertCircle className="w-5 h-5 text-gray-600" /></div>
              <p className="text-[10px] font-bold text-gray-600 uppercase">Sin pagos este mes</p>
            </div>
          ) : (
            advances.map((adv, idx) => (
              <div key={idx} className="bg-surface border border-surface-edge p-3 rounded-xl flex items-center gap-4 group/adv hover:border-brand/30 transition-all text-sm">
                {/* 1. Fecha (Solo el día) */}
                <div className="text-gray-500 font-bold w-8 text-center">
                  {new Date(adv.date).getDate()}
                </div>

                {/* 2. Cantidad */}
                <div className="flex items-center gap-1 w-22">
                  <EditableInput
                    defaultValue={adv.amount.toString()}
                    onSave={(val) => updateAdvance(adv.id, { amount: parseFloat(val) || 0 })}
                    type="number"
                    className="bg-transparent font-black text-white outline-none focus:text-brand focus:border-b border-brand/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-16 text-right text-base"
                  />
                  <span className="font-black text-white text-base">฿</span>
                </div>

                {/* 3. Concepto */}
                <div className="flex-1 min-w-0">
                  <EditableInput
                    defaultValue={adv.concept}
                    onSave={(val) => updateAdvance(adv.id, { concept: val })}
                    type="text"
                    placeholder="Sin concepto"
                    className="bg-transparent outline-none focus:text-brand focus:border-b border-brand/30 w-full truncate text-gray-400 font-medium text-sm"
                  />
                </div>

                {/* 4. Acciones */}
                <div className="w-6 flex justify-end">
                  <button onClick={() => removeAdvance(idx)} className="p-1.5 text-rose-400 hover:text-rose-500 transition-all">
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
