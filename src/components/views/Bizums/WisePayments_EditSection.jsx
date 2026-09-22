import { 
  User, 
  ArrowDownLeft, 
  Calendar as CalendarIcon, 
  Hash, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  Loader2, 
  Save 
} from 'lucide-react';

export default function WisePayments_EditSection({
  payment,
  clientName,
  selectedDate,
  activity,
  combinedActivitiesText,
  activityAcronymText,
  isProcessed,
  onChangeIsProcessed,
  isRetained,
  onChangeIsRetained,
  retainedPeople,
  onChangeRetainedPeople,
  isSettled,
  onChangeIsSettled,
  savingEdit,
  onSaveEdit
}) {
  const formattedDate = selectedDate ? (
    selectedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  ) : '---';

  const finalName = (clientName || '').trim() || payment.sender_name;

  return (
    <div className="pt-2.5 border-t border-surface-edge space-y-2.5 animate-in fade-in duration-200">
      
      {/* 1. RESUMEN INTERACTIVO DE DATOS DEL PAGO (2 COLUMNAS) */}
      <div className="bg-surface-soft/60 border border-surface-edge rounded-2xl p-3 space-y-1.5 text-xs sm:text-sm shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {/* Fila 1 - Izquierda: Cliente */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0">
              <User className="w-3.5 h-3.5 text-brand" /> Cliente:
            </span>
            <strong className="text-white capitalize truncate max-w-[180px]" title={finalName}>
              {finalName}
            </strong>
          </div>

          {/* Fila 1 - Derecha: Fecha */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0">
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" /> Fecha:
            </span>
            <span className="text-cyan-300 font-bold">{formattedDate}</span>
          </div>

          {/* Fila 2 - Izquierda: Actividad */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Actividad:
            </span>
            <span className="text-amber-300 font-bold truncate max-w-[180px]" title={activityAcronymText || activity}>
              {activityAcronymText || activity}
            </span>
          </div>

          {/* Fila 2 - Derecha: Importe */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Importe:
            </span>
            <strong className="text-emerald-400 font-black">
              {payment.amount_raw} {payment.currency} ({payment.num_people} Pax)
            </strong>
          </div>
        </div>

        {payment.reference && (
          <div className="flex items-center justify-between border-t border-surface-edge/40 pt-1.5 text-xs">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium shrink-0">
              <Hash className="w-3.5 h-3.5 text-gray-400" /> Referencia:
            </span>
            <span className="text-gray-300 font-mono truncate max-w-[280px]" title={payment.reference}>
              {payment.reference}
            </span>
          </div>
        )}
      </div>

      {/* 2. CONTROLES CONTABLES: PROCESADO Y RETENCIÓN EN LA MISMA LÍNEA */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Checkbox Procesado */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface border border-surface-edge">
            <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer">
              <Check className="w-4 h-4 text-blue-400" /> Marcar como Procesado
            </label>
            <input 
              type="checkbox"
              checked={isProcessed}
              onChange={(e) => onChangeIsProcessed(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-surface-edge bg-surface-soft text-brand focus:ring-brand accent-brand cursor-pointer"
            />
          </div>

          {/* Checkbox Retención */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface border border-surface-edge">
            <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Depósito Retenido
            </label>
            <input 
              type="checkbox"
              checked={isRetained}
              onChange={(e) => onChangeIsRetained(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-surface-edge bg-surface-soft text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Detalles de Retención (si está activo) */}
        {isRetained && (
          <div className="p-3 rounded-2xl bg-surface border border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
            {payment.num_people > 1 && (
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  Personas Retenidas (Pax):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from({ length: payment.num_people }).map((_, idx) => {
                    const paxVal = idx + 1;
                    const isSelected = Number(retainedPeople) === paxVal;
                    return (
                      <button
                        key={paxVal}
                        type="button"
                        onClick={() => onChangeRetainedPeople(paxVal)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>{paxVal} Pax</span>
                        <span className="text-[10px] opacity-75">
                          {paxVal === payment.num_people ? '(Total)' : '(Parcial)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-bold text-gray-300">
                Repartido entre socios:
              </label>
              <button
                type="button"
                onClick={() => onChangeIsSettled(!isSettled)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSettled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {isSettled ? '✓ Repartido (Liquidado)' : '⏳ Pendiente de Repartir'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTÓN GUARDAR CAMBIOS */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={savingEdit}
          className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-light text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          {savingEdit ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>Guardando Cambios...</span>
            </>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
