import { 
  Check, 
  ArrowDownLeft, 
  User, 
  FileText, 
  Hash, 
  AlertTriangle, 
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';

export default function WisePayments_Row({ 
  payment, 
  activeTab, 
  onToggleProcessed, 
  onToggleRetained, 
  onToggleSettled, 
  onEdit, 
  onDelete 
}) {
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return { date: '---', time: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };
      const datePart = d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: '2-digit',
      }).replace('.', '').toUpperCase();
      const timePart = d.toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit',
      });
      return { date: datePart, time: timePart };
    } catch (e) {
      return { date: dateStr, time: '' };
    }
  };

  const formatNumber = (num) => {
    return Number(num).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const regDate = formatDateDisplay(payment.created_at);
  const isPartialRetention = payment.is_retained && payment.retained_people !== null && payment.retained_people < payment.num_people;

  return (
    <tr className={`hover:bg-brand/5 transition-colors ${payment.is_processed ? 'opacity-75' : ''}`}>
      {/* 1. FECHA REGISTRO */}
      <td className="py-2.5 px-4 text-center whitespace-nowrap">
        <div className="flex flex-col items-center">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-tight">
            {regDate.date}
          </p>
          {regDate.time && (
            <p className="text-cyan-600/50 text-[11px] font-semibold">
              {regDate.time}
            </p>
          )}
        </div>
      </td>

      {/* 2. REMITENTE */}
      <td className="py-2.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-brand" />
          <p className="text-white/70 font-bold text-sm capitalize">
            {payment.sender_name}
          </p>
          {isPartialRetention && (
            <span 
              className="inline-flex text-amber-500 hover:text-amber-400 cursor-help shrink-0" 
              title={`Retención Parcial: retenidos ${payment.retained_people} de ${payment.num_people} pax.`}
            >
              <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          )}
        </div>
      </td>

      {/* 3. PAX */}
      <td className="py-2.5 px-4 text-center whitespace-nowrap">
        {isPartialRetention ? (
          <span 
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold text-[11px] shadow-sm mx-auto cursor-default"
            title={`Pax Retenidos: ${payment.retained_people} de ${payment.num_people} total`}
          >
            {payment.retained_people}/{payment.num_people}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white border border-brand-light/30 font-black text-sm shadow-md shadow-brand/20 mx-auto">
            {payment.num_people || 1}
          </span>
        )}
      </td>

      {/* 4. IMPORTE RECIBIDO */}
      <td className="py-2.5 px-4 whitespace-nowrap text-right font-black text-emerald-400 text-sm">
        <div className="flex items-center justify-end gap-1.5">
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          {formatNumber(payment.amount_raw)} {payment.currency}
        </div>
      </td>

      {/* 5. ACCIONES (PROCESADO / RETENIDO / REPARTIDO) */}
      {activeTab !== 'retained' ? (
        <>
          {/* Checkbox Procesado */}
          <td className="py-2.5 px-4 whitespace-nowrap text-center">
            <button
              onClick={() => onToggleProcessed(payment)}
              title={payment.is_processed ? 'Marcar como Pendiente' : 'Marcar como Procesado y Configurar Reserva'}
              className="inline-flex items-center justify-center cursor-pointer group focus:outline-none"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                payment.is_processed
                  ? 'bg-blue-600 border border-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'border border-surface-edge bg-surface-soft/60 group-hover:border-blue-500/60 text-transparent hover:text-gray-400'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          </td>

          {/* Checkbox Retenido */}
          <td className="py-2.5 px-4 whitespace-nowrap text-center">
            <button
              onClick={() => onToggleRetained(payment)}
              title={payment.is_retained ? 'Quitar de Retenidos' : 'Marcar como Retenido (No presentado / Cancelación)'}
              className="inline-flex items-center justify-center cursor-pointer group focus:outline-none"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                payment.is_retained
                  ? 'bg-amber-500 border border-amber-400 text-white shadow-md shadow-amber-500/30'
                  : 'border border-surface-edge bg-surface-soft/60 group-hover:border-amber-500/60 text-transparent hover:text-gray-400'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </button>
          </td>
        </>
      ) : (
        /* Checkbox Repartido entre socios */
        <td className="py-2.5 px-4 whitespace-nowrap text-center">
          <button
            onClick={() => onToggleSettled(payment.id, payment.is_settled)}
            title={payment.is_settled ? 'Marcar como Pendiente de Repartir' : 'Marcar como Repartido / Liquidado'}
            className="inline-flex items-center justify-center cursor-pointer group focus:outline-none"
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
              payment.is_settled
                ? 'bg-emerald-600 border border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'border border-surface-edge bg-surface-soft/60 group-hover:border-emerald-500/60 text-transparent hover:text-gray-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>
        </td>
      )}

      {/* 6. REFERENCIA */}
      <td className="py-2.5 px-4 font-medium text-gray-400 max-w-[200px] truncate text-xs" title={payment.reference}>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gray-500" />
          {payment.reference || '---'}
        </div>
      </td>

      {/* 7. ID TRANSFERENCIA */}
      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-gray-500 text-xs">
        <div className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5" />
          {payment.id}
        </div>
      </td>

      {/* 8. COLUMNA ACCIONES */}
      <td className="py-2.5 px-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEdit(payment)}
            title="Editar Estado y Notas"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(payment.id, payment.sender_name)}
            title="Eliminar Registro"
            className="p-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
