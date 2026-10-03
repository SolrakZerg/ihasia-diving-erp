import { CheckCircle2, MessageSquare, Calendar, ExternalLink, Plus, X } from 'lucide-react';

export default function CashReservation_Success({
  result,
  onReset,
  onClose
}) {
  const { customerName, activitySummary, bookingDateStr, reservaPax, paymentMethod, htmlLink, waLink } = result;
  const hasDeposit = Number(reservaPax) > 0;
  const totalAmountThb = (Number(reservaPax) || 0) * 1000;

  return (
    <div className="p-6 text-center space-y-6">
      {/* Icono de Éxito */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xl shadow-emerald-500/20 animate-in zoom-in duration-300">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-black text-white">¡Reserva Procesada con Éxito!</h3>
        <p className="text-xs font-semibold text-gray-400">
          Registrada en Supabase y sincronizada en tiempo real con Google Calendar.
        </p>
      </div>

      {/* Tarjeta Resumen */}
      <div className="bg-surface-soft/60 border border-surface-edge rounded-2xl p-4 text-left space-y-2.5 text-xs sm:text-sm">
        <div className="flex justify-between items-center py-1 border-b border-surface-edge/60">
          <span className="text-gray-400 font-bold">Cliente:</span>
          <span className="text-white font-extrabold">{customerName}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-surface-edge/60">
          <span className="text-gray-400 font-bold">Curso(s):</span>
          <span className="text-emerald-300 font-black">{activitySummary}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-surface-edge/60">
          <span className="text-gray-400 font-bold">Fecha de inicio:</span>
          <span className="text-white font-bold">{bookingDateStr}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-gray-400 font-bold">Depósito:</span>
          {hasDeposit ? (
            <span className="text-amber-400 font-black">
              {reservaPax} PAX ({totalAmountThb.toLocaleString()} THB {paymentMethod || 'CASH'})
            </span>
          ) : (
            <span className="text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
              0 THB (Pendiente / Rosa)
            </span>
          )}
        </div>
      </div>

      {/* Botón Principal: WhatsApp Directo */}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-emerald-600/30 active:scale-[0.99] cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          📲 Enviar WhatsApp a {customerName}
        </a>
      )}

      {/* Botón Secundario: Google Calendar Link */}
      {htmlLink && (
        <a
          href={htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-soft hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs rounded-xl border border-surface-edge transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          Ver Evento en Google Calendar
          <ExternalLink className="w-3 h-3 text-gray-500" />
        </a>
      )}

      {/* Acciones de pie */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand/20 hover:bg-brand/30 text-brand-light font-extrabold text-xs rounded-xl border border-brand/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Nueva Reserva
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-soft hover:bg-surface-edge text-gray-300 hover:text-white font-bold text-xs rounded-xl border border-surface-edge transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          Cerrar
        </button>
      </div>
    </div>
  );
}
