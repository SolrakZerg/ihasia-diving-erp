import { Phone, Edit2, Trash2, Check, AlertCircle, Archive } from 'lucide-react';
import { getActivityColor, generateWhatsappLink, formatPrettyPhone } from './Bizums_Utils';

export default function Bizums_Row({
  row,
  activeTab,
  onTogglePaid,
  onToggleReturned,
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

  const formatBookingDatePill = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: '2-digit',
      }).replace('.', '').toUpperCase();
    } catch (e) {
      return dateStr;
    }
  };

  const renderActivityBadges = (activityStr) => {
    if (!activityStr) return <span className="text-gray-600 text-xs">-</span>;
    const parts = activityStr.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[120px] mx-auto">
        {parts.map((act, idx) => {
          const badge = getActivityColor(act);
          return (
            <span
              key={idx}
              className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wide leading-tight ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {act}
            </span>
          );
        })}
      </div>
    );
  };

  const regDate = formatDateDisplay(row.created_at);
  const waLink = generateWhatsappLink(
    row.whatsapp_phone || row.bizum_phone,
    row.customer_name,
    row.num_people,
    row.activity,
    row.booking_date
  );

  return (
    <tr className="hover:bg-brand/5 transition-colors group cursor-default">
      {/* Marca Temporal (Fecha + Hora) */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-surface-edge/10">
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

      {/* Fecha Reserva (Pill Badge) */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm tracking-wide shadow-sm">
          {formatBookingDatePill(row.booking_date)}
        </span>
      </td>

      {/* Nombre y Apellidos */}
      <td className="py-2.5 px-3 max-w-[180px] w-[180px]">
        <div className="flex items-center gap-1.5">
          <p
            className="text-white/70 font-bold text-sm capitalize leading-snug line-clamp-2 break-words"
            title={row.customer_name}
          >
            {row.customer_name}
          </p>
          {((row.is_returned && row.returned_people !== null && row.returned_people < row.num_people) || (row.is_retained && row.returned_people !== null && row.returned_people > 0)) && (
            <span 
              className="inline-flex text-amber-500 hover:text-amber-400 cursor-help shrink-0" 
              title={`Retención Parcial: asistieron ${row.returned_people} de ${row.num_people} personas. El importe restante de ${(row.num_people - row.returned_people) * 25}€ está retenido.`}
            >
              <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          )}
        </div>
      </td>

      {/* Pax */}
      <td className="py-2.5 px-3 text-center">
        {row.returned_people !== null && row.returned_people !== row.num_people ? (
          <span 
            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold text-[11px] shadow-sm mx-auto cursor-default"
            title={`Pax Asistidos/Devueltos: ${row.returned_people} de ${row.num_people} total`}
          >
            {row.returned_people}/{row.num_people}
          </span>
        ) : (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white border border-brand-light/30 font-black text-sm shadow-md shadow-brand/20 mx-auto">
            {row.num_people || 1}
          </span>
        )}
      </td>

      {/* Actividad */}
      <td className="py-2.5 px-3 max-w-[120px] w-[120px] border-r border-surface-edge/10 text-center">
        {renderActivityBadges(row.activity)}
      </td>

      {/* Teléfono Bizum */}
      <td className="py-2.5 px-2 font-mono text-white/70 font-bold text-base whitespace-nowrap tracking-tight max-w-[150px] w-[150px] truncate" title={row.bizum_phone}>
        {formatPrettyPhone(row.bizum_phone)}
      </td>

      {/* WhatsApp */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            title="Enviar mensaje de WhatsApp de confirmación"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/30 shadow-md mx-auto cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </a>
        ) : (
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-surface-edge/10 text-gray-600 border border-surface-edge/20 cursor-not-allowed opacity-40 mx-auto"
            title="Sin número de WhatsApp"
          >
            <Phone className="w-4 h-4" />
          </span>
        )}
      </td>

      {activeTab === 'retained' ? (
        /* Checkbox REPARTIDO */
        <td className="py-2.5 px-2 text-center">
          <button
            onClick={() => onToggleSettled(row)}
            title={row.is_settled ? 'Marcado como Repartido entre socios (clic para marcar como pendiente)' : 'Marcar como Repartido entre socios'}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto cursor-pointer ${
              row.is_settled
                ? 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/20'
                : 'border-surface-edge bg-surface-soft text-transparent hover:border-amber-500/50'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </td>
      ) : (
        <>
          {/* Checkbox RECIBIDO */}
          <td className="py-2.5 px-2 text-center">
            <button
              onClick={() => onTogglePaid(row)}
              title={row.is_paid ? 'Marcado como Recibido (clic para desmarcar)' : 'Marcar como Recibido'}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                row.is_paid
                  ? 'bg-brand border-brand-light text-white shadow-md shadow-brand/20'
                  : 'border-surface-edge bg-surface-soft text-transparent hover:border-brand/50'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </td>

          {/* Checkbox DEVUELTO */}
          <td className="py-2.5 px-2 text-center">
            <button
              onClick={() => onToggleReturned(row)}
              title={row.is_returned ? 'Marcado como Devuelto (clic para mover a activas)' : 'Marcar como Devuelto (mover a historial)'}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                row.is_returned
                  ? 'bg-brand border-brand-light text-white shadow-md shadow-brand/20'
                  : 'border-surface-edge bg-surface-soft text-transparent hover:border-brand/50'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </td>

          {/* Checkbox RETENIDO */}
          <td className="py-2.5 px-2 text-center">
            <button
              onClick={() => onToggleRetained(row)}
              title={row.is_retained ? 'Marcado como Retenido (clic para mover a activas)' : 'Marcar como Retenido (no presentado)'}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                row.is_retained
                  ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20'
                  : 'border-surface-edge bg-surface-soft text-transparent hover:border-amber-600/50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </td>
        </>
      )}

      {/* Acciones */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => onEdit(e, row)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-edge rounded-lg transition-colors cursor-pointer"
            title="Editar reserva"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(e, row.id, row.customer_name)}
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Eliminar reserva"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
