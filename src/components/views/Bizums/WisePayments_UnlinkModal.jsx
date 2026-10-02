import { Link2Off, X, AlertTriangle, ArrowRight, User, CreditCard } from 'lucide-react';

export default function WisePayments_UnlinkModal({
  isOpen,
  payment,
  onClose,
  onConfirm,
  loading
}) {
  if (!isOpen || !payment) return null;

  const studentName = payment.customer_name || payment.sender_name;
  const bankPayer = payment.titular_wise || payment.sender_name;
  const amount = payment.amount_raw || payment.amount_eur || 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface-soft border border-surface-edge rounded-3xl max-w-3xl w-full p-8 sm:p-10 shadow-2xl space-y-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header con tamaño generoso */}
        <div className="flex items-center justify-between border-b border-surface-edge pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-brand/15 border border-brand/30 text-brand-light">
              <Link2Off className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-2xl sm:text-3xl tracking-tight leading-snug">
                Desvincular Reserva
              </h3>
              <p className="text-base sm:text-lg text-gray-300 mt-0.5">
                Volver a separar este registro en pago bancario y formulario web
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors p-2.5 rounded-xl hover:bg-surface-edge/50 disabled:opacity-50"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Explicación visual de la separación */}
        <div className="space-y-4">
          <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
            Esta acción separará la reserva actual en <strong className="text-white underline decoration-brand decoration-2 underline-offset-4">2 registros independientes</strong> tal como estaban originalmente:
          </p>

          {/* Tarjetas apiladas (uno debajo del otro para máxima legibilidad) */}
          <div className="flex flex-col gap-4 pt-1">
            {/* Tarjeta 1: Pago Bancario */}
            <div className="bg-surface/90 border border-surface-edge/80 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> 1. Pago en Banco (Wise)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-black">
                    Recibido ✅
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-white truncate" title={bankPayer}>
                  {bankPayer}
                </p>
                <p className="text-sm text-gray-400">
                  Quedará como transferencia libre en el banco sin curso asignado
                </p>
              </div>
              <div className="sm:text-right shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
                <span className="text-xs text-emerald-300/80 font-bold block uppercase tracking-wider">Importe Recibido</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {amount} <span className="text-base font-bold">THB</span>
                </span>
              </div>
            </div>

            {/* Tarjeta 2: Formulario Web */}
            <div className="bg-surface/90 border border-surface-edge/80 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 2. Reserva Web Alumno
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-black">
                    Pendiente ⏳
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-white truncate" title={studentName}>
                  {studentName}
                </p>
                <p className="text-base font-bold text-cyan-300">
                  {payment.activity || 'Curso'} • {payment.num_people || 1} {Number(payment.num_people) === 1 ? 'Persona' : 'Personas'} (Pax)
                </p>
              </div>
              <div className="sm:text-right shrink-0 bg-surface-edge/40 border border-surface-edge px-5 py-3 rounded-2xl">
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Fecha Actividad</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {payment.booking_date || 'Sin fecha'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-sm sm:text-base text-amber-200/90 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            Podrás volver a vincularlos en cualquier momento con el botón <strong>🔗</strong>.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 pt-5 border-t border-surface-edge">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-7 py-3.5 rounded-xl text-base font-bold text-gray-300 hover:text-white cursor-pointer transition-colors hover:bg-surface disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-8 py-3.5 rounded-xl text-base sm:text-lg font-black bg-brand hover:bg-brand-light text-white shadow-xl shadow-brand/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2.5"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Separando registros...</span>
              </>
            ) : (
              <>
                <Link2Off className="w-6 h-6 stroke-[2.5]" />
                <span>Confirmar y Separar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

