import React, { useState, useMemo } from 'react';
import { Users, Minus, Plus, AlertCircle, Check } from 'lucide-react';

export default function Nominas_AdjModal_ShareMode({
  adjModal,
  setAdjModal,
  handleShareActivity,
  year,
  month,
  staff = [],
  selectedStaffId,
  invoiceItems = [],
  payoutRules = []
}) {
  const [targetStaffId, setTargetStaffId] = useState('');
  const [shareQtys, setShareQtys] = useState({});
  const [customNote, setCustomNote] = useState('');
  const [customManualAmount, setCustomManualAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Instructores disponibles (solo activos y excluyendo al actual)
  const availableInstructors = useMemo(() => {
    return (staff || []).filter(s => String(s.id) !== String(selectedStaffId) && s.active === true);
  }, [staff, selectedStaffId]);

  // Actividades facturadas por el instructor actual en este día concreto
  const dayBilledActivities = useMemo(() => {
    if (!adjModal.day || !selectedStaffId || !invoiceItems?.length) return [];
    const dayNum = Number(adjModal.day);

    const filtered = invoiceItems.filter(item => {
      if (!item.date) return false;
      const [y, m, d] = item.date.substring(0, 10).split('-').map(Number);
      if (y !== year || m !== month || d !== dayNum) return false;
      const itInstId = typeof item.instructor_id === 'object' ? item.instructor_id?.id : item.instructor_id;
      return String(itInstId) === String(selectedStaffId);
    });

    const map = new Map();
    filtered.forEach(item => {
      const actId = String(item.activity_id || '');
      if (!actId) return;
      const qty = Number(item.quantity) || 1;
      if (!map.has(actId)) {
        const rule = payoutRules?.find(r => String(r.activity_id) === actId);
        const rate = rule ? (Number(rule.amount_thb) || 0) : 0;
        map.set(actId, {
          activityId: actId,
          name: item.activities?.name || 'Actividad',
          acronym: item.activities?.acronym || '',
          totalQty: qty,
          payoutRate: rate,
          halfRate: Math.round(rate / 2)
        });
      } else {
        const prev = map.get(actId);
        prev.totalQty += qty;
      }
    });

    return Array.from(map.values());
  }, [adjModal.day, selectedStaffId, invoiceItems, year, month, payoutRules]);

  // Manejo de contadores limitados al máximo facturado
  const handleQtyChange = (actId, delta, max) => {
    setShareQtys(prev => {
      const curr = prev[actId] || 0;
      const next = Math.max(0, Math.min(max, curr + delta));
      return { ...prev, [actId]: next };
    });
  };

  const selectedShares = dayBilledActivities
    .map(act => ({
      ...act,
      selectedQty: shareQtys[act.activityId] || 0
    }))
    .filter(act => act.selectedQty > 0);

  const activitiesCalculatedAmount = selectedShares.reduce((sum, act) => sum + (act.selectedQty * act.halfRate), 0);
  const parsedCustomAmount = parseFloat(customManualAmount) || 0;
  const totalShareAmount = activitiesCalculatedAmount > 0 ? activitiesCalculatedAmount : parsedCustomAmount;

  const currentStaff = staff?.find(s => String(s.id) === String(selectedStaffId));
  const targetStaff = staff?.find(s => String(s.id) === String(targetStaffId));
  const currentName = currentStaff?.first_name || 'Compañero';
  const targetName = targetStaff?.first_name || 'Compañero';

  const actsSummary = selectedShares.length > 0 
    ? selectedShares.map(act => `${act.selectedQty}x ${act.acronym || act.name}`).join(', ')
    : customNote || 'Actividad';
  const extraNote = customNote.trim() && selectedShares.length > 0 ? ` (${customNote.trim()})` : '';

  const sourceLine = `a medias con ${targetName}: ${actsSummary}${extraNote} (-${totalShareAmount})`;
  const targetLine = `a medias con ${currentName}: ${actsSummary}${extraNote} (+${totalShareAmount})`;

  const canSubmitShare = targetStaffId && totalShareAmount > 0 && !isSubmitting;

  const handleSubmitShare = async () => {
    if (!canSubmitShare || !handleShareActivity) return;
    setIsSubmitting(true);
    try {
      await handleShareActivity({
        day: adjModal.day,
        targetStaffId,
        shareAmount: totalShareAmount,
        sourceLineText: sourceLine,
        targetLineText: targetLine
      });
      setAdjModal({ open: false, day: null, amount: 0, concept: '' });
    } catch (err) {
      console.error('Error aplicando reparto a medias:', err);
      alert('Error al aplicar el reparto: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* 1. SELECCIONAR COMPAÑERO */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand" />
            Compartir a medias con:
          </label>
          <select
            value={targetStaffId}
            onChange={(e) => setTargetStaffId(e.target.value)}
            className="w-full bg-[#12131e] border border-surface-edge rounded-xl p-3.5 text-sm sm:text-base text-white font-bold outline-none focus:border-brand transition-all cursor-pointer shadow-inner"
          >
            <option value="" disabled className="bg-[#1a1c2d] text-gray-400 font-bold">
              Selecciona un instructor compañero...
            </option>
            {availableInstructors.map(inst => (
              <option key={inst.id} value={inst.id} className="bg-[#1a1c2d] text-white py-2 font-bold">
                {inst.first_name} {inst.last_name || ''} ({inst.initials || 'INST'})
              </option>
            ))}
          </select>
        </div>

        {/* 2. ACTIVIDADES DEL DÍA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-300 uppercase tracking-wider">
              Actividades facturadas el día {adjModal.day}:
            </label>
            {dayBilledActivities.length > 0 && (
              <span className="text-[11px] text-brand font-black">
                {dayBilledActivities.length} actividad(es)
              </span>
            )}
          </div>

          {dayBilledActivities.length > 0 ? (
            <div className="space-y-2.5">
              {dayBilledActivities.map(act => {
                const selected = shareQtys[act.activityId] || 0;
                return (
                  <div 
                    key={act.activityId}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      selected > 0 
                        ? 'bg-brand/10 border-brand/40 shadow-sm' 
                        : 'bg-surface-edge/20 border-surface-edge/40 hover:border-surface-edge/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{act.name}</span>
                        {act.acronym && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-surface-edge text-cyan-300">
                            {act.acronym}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Facturado: <strong className="text-gray-200">{act.totalQty} pax</strong> · Mitad: <span className="text-emerald-400 font-bold">{act.halfRate} ฿/pax</span>
                      </div>
                    </div>

                    {/* CONTADOR LIMITADO */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 hidden sm:inline">A medias:</span>
                      <div className="flex items-center bg-surface-edge/60 border border-surface-edge rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={selected <= 0}
                          onClick={() => handleQtyChange(act.activityId, -1, act.totalQty)}
                          className="w-8 h-8 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-white">
                          {selected}
                        </span>
                        <button
                          type="button"
                          disabled={selected >= act.totalQty}
                          onClick={() => handleQtyChange(act.activityId, 1, act.totalQty)}
                          className="w-8 h-8 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                No se encontraron actividades facturadas por este instructor el día {adjModal.day}.
                Puedes introducir abajo una cantidad manual para compartir a medias si fue una actividad especial.
              </div>
            </div>
          )}
        </div>

        {/* FALLBACK MANUAL SI NO HAY ACTIVIDADES O IMPORTE PERSONALIZADO */}
        {dayBilledActivities.length === 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
              Importe a compartir (฿):
            </label>
            <input
              type="number"
              value={customManualAmount}
              onChange={(e) => setCustomManualAmount(e.target.value)}
              placeholder="Ej: 400"
              className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-xl p-3 text-lg font-black text-white outline-none focus:border-brand"
            />
          </div>
        )}

        {/* NOTA ADICIONAL OPCIONAL */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
            Aclaración adicional (opcional):
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ej: 1er día, teoría, 2 tanques..."
            className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-xl p-3 text-sm font-bold text-gray-200 outline-none focus:border-brand"
          />
        </div>

        {/* RESUMEN DE IMPACTO EN TIEMPO REAL */}
        {totalShareAmount > 0 && targetStaffId && (
          <div className="p-4 rounded-2xl bg-surface border border-brand/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-edge/40">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider">Total a repartir:</span>
              <span className="text-lg font-black text-brand">฿ {totalShareAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="font-black text-rose-400 flex items-center gap-1">
                  <span>{currentName} (actual)</span>
                  <span className="text-white font-black ml-auto">- {totalShareAmount} ฿</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1 truncate">
                  "{sourceLine}"
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-black text-emerald-400 flex items-center gap-1">
                  <span>{targetName} (compañero)</span>
                  <span className="text-white font-black ml-auto">+ {totalShareAmount} ฿</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1 truncate">
                  "{targetLine}"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PIE / BOTONES DE ACCIÓN PARA MODO A MEDIAS */}
      <div className="p-6 bg-white/5 border-t border-surface-edge/20 flex gap-4 shrink-0">
        <button 
          onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })}
          className="flex-1 btn-modal-cancel"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          disabled={!canSubmitShare}
          onClick={handleSubmitShare}
          className="flex-[2] btn-modal-confirm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Repartiendo...</span>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Confirmar y Repartir {totalShareAmount > 0 ? `(฿ ${totalShareAmount.toLocaleString()})` : ''}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
