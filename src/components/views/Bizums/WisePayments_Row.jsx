import { 
  Check, 
  ArrowDownLeft, 
  User, 
  FileText, 
  AlertTriangle, 
  AlertCircle,
  Pencil, 
  Trash2,
  Phone
} from 'lucide-react';
import { getActivityColor, cleanPhone } from './Bizums_Utils';

export default function WisePayments_Row({ 
  payment, 
  activeTab, 
  onTogglePaid,
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

  const formatBookingDatePill = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: '2-digit',
      }).replace('.', '').toUpperCase();
    } catch (e) {
      return dateStr;
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getActivityAcronym = (act) => {
    if (!act) return 'OW';
    const upper = act.toUpperCase().replace(/\s+/g, '');
    if (upper.includes('BAUTIZO') || upper.includes('DSD') || upper.includes('TRY')) return 'DSD';
    if (upper.includes('OPEN') || upper.includes('OW')) return 'OW';
    if (upper.includes('AVANZADO') || upper.includes('ADVANCED') || upper.includes('AA')) return 'AA';
    if (upper.includes('REFRESH') || upper.includes('SR')) return 'SR';
    if (upper.includes('FUN') || upper.includes('FD')) return 'FD';
    if (upper.includes('RESCUE') || upper.includes('RES')) return 'RES';
    return act;
  };

  const renderActivityBadges = () => {
    // 1. Si tenemos activity_lines con conteo exacto por curso:
    if (Array.isArray(payment.activity_lines) && payment.activity_lines.length > 0) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[130px] mx-auto">
          {payment.activity_lines.map((l, idx) => {
            const code = (l.code || l.activity || getActivityAcronym(l.name)).toUpperCase();
            const cnt = parseInt(l.count || l.pax || 1, 10);
            const badge = getActivityColor(code);
            // Formato con x minúscula (ej: OW x2, o DSD x1 si son mixtas)
            const isSingleOverall = payment.activity_lines.length === 1 && cnt === 1;
            const label = isSingleOverall ? code : `${code}x${cnt}`;
            return (
              <span
                key={idx}
                title={`${l.name || code} (${cnt} ${cnt === 1 ? 'persona' : 'personas'})`}
                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold border tracking-wider leading-tight shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      );
    }

    // 2. Si viene de texto plano (registros antiguos o procesados):
    if (!payment.activity) return <span className="text-gray-600 text-xs">-</span>;
    const parts = payment.activity.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[130px] mx-auto">
        {parts.map((act, idx) => {
          const badge = getActivityColor(act);
          const acronym = getActivityAcronym(act);
          // Detectar si el texto trae multiplicador (ej: "Open Water x2", "2x Open Water", etc.)
          const multMatch = act.match(/(?:x\s*(\d+)|(\d+)\s*x)/i);
          const mult = multMatch 
            ? (multMatch[1] || multMatch[2]) 
            : (parts.length === 1 && payment.num_people > 1 ? payment.num_people : null);
          
          const label = mult && parseInt(mult, 10) > 1 ? `${acronym}x${mult}` : acronym;

          return (
            <span
              key={idx}
              title={act}
              className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold border tracking-wider leading-tight shadow-xs ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const regDate = formatDateDisplay(payment.created_at);
  const isPartialRetention = payment.is_retained && payment.retained_people !== null && payment.retained_people < payment.num_people;
  
  // Teléfono WhatsApp
  const phoneClean = cleanPhone(payment.phone);
  const waLink = phoneClean ? `https://wa.me/${phoneClean.replace('+', '')}` : null;

  // Remitente / Titular diferente
  const displayName = payment.customer_name || payment.sender_name;
  const showTitular = payment.titular_wise && payment.customer_name && (payment.titular_wise.toLowerCase() !== payment.customer_name.toLowerCase());
  const showAltSender = !payment.titular_wise && payment.customer_name && (payment.sender_name.toLowerCase() !== payment.customer_name.toLowerCase());

  return (
    <tr className={`hover:bg-brand/5 transition-colors group cursor-default ${payment.is_processed ? 'opacity-75' : ''}`}>
      {/* 1. FECHA REGISTRO */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap border-r border-surface-edge/10">
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

      {/* 2. FECHA RESERVA (Pill Verde Esmeralda) */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap">
        {payment.booking_date ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm tracking-wide shadow-sm">
            {formatBookingDatePill(payment.booking_date)}
          </span>
        ) : (
          <span className="text-gray-600 text-xs font-semibold">---</span>
        )}
      </td>

      {/* 3. REMITENTE / ALUMNO (En 1 sola línea, más ancho) */}
      <td className="py-2.5 px-3 min-w-[230px] whitespace-nowrap">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand shrink-0" />
            <p 
              className="text-white/80 font-bold text-sm capitalize truncate max-w-[220px]"
              title={payment.notes ? `${displayName}\n\n📝 Nota: ${payment.notes}` : displayName}
            >
              {displayName}
            </p>
            {payment.notes && (
              <span
                className="inline-flex text-cyan-400 hover:text-cyan-300 cursor-default shrink-0"
                title={`📝 Nota: ${payment.notes}`}
              >
                <FileText className="w-3.5 h-3.5" />
              </span>
            )}
            {isPartialRetention && (
              <span 
                className="inline-flex text-amber-500 hover:text-amber-400 cursor-help shrink-0" 
                title={`Retención Parcial: retenidos ${payment.retained_people} de ${payment.num_people} pax.`}
              >
                <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            )}
          </div>
          {showTitular && (
            <span className="text-[10px] text-amber-400/90 pl-5 pt-0.5 truncate max-w-[210px]" title={`Titular cuenta Wise: ${payment.titular_wise}`}>
              Titular: {payment.titular_wise}
            </span>
          )}
          {showAltSender && (
            <span className="text-[10px] text-amber-400/90 pl-5 pt-0.5 truncate max-w-[210px]" title={`Pagado por: ${payment.sender_name}`}>
              Titular: {payment.sender_name}
            </span>
          )}
        </div>
      </td>

      {/* 4. PAX */}
      <td className="py-2.5 px-1 text-center whitespace-nowrap">
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

      {/* 5. ACTIVIDAD (Badges con acrónimos compactos y cantidades) */}
      <td className="py-2.5 px-2 min-w-[100px] border-r border-surface-edge/10 text-center">
        {renderActivityBadges()}
      </td>

      {/* 6. WHATSAPP */}
      <td className="py-2.5 px-1 text-center whitespace-nowrap">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            title={`Abrir WhatsApp (${payment.phone})`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/30 shadow-md mx-auto cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </a>
        ) : (
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-surface-edge/10 text-gray-600 border border-surface-edge/20 cursor-not-allowed opacity-40 mx-auto"
            title="Sin número de WhatsApp registrado"
          >
            <Phone className="w-4 h-4" />
          </span>
        )}
      </td>

      {/* 7. RECIBIDO (is_paid) */}
      <td className="py-2.5 px-1 text-center whitespace-nowrap">
        {payment.is_paid ? (
          <button
            onClick={() => onTogglePaid(payment)}
            title="Pago verificado en Wise (clic para desmarcar)"
            className="w-6 h-6 rounded-lg border flex items-center justify-center transition-all mx-auto cursor-pointer bg-brand border-brand-light text-white shadow-md shadow-brand/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        ) : (
          <button
            onClick={() => onTogglePaid(payment)}
            title="Pendiente de confirmar transferencia bancaria (clic para marcar como recibido manualmente)"
            className="px-2 py-0.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold text-[10px] hover:bg-amber-500/20 transition-all mx-auto inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Pendiente</span>
          </button>
        )}
      </td>

      {/* 8. IMPORTE RECIBIDO */}
      <td className="py-2.5 px-2 whitespace-nowrap text-right font-black text-emerald-400 text-sm">
        <div className="flex items-center justify-end gap-1" title={payment.id ? `ID: ${payment.id}` : ''}>
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{formatNumber(payment.amount_raw)} {payment.currency || 'THB'}</span>
        </div>
      </td>

      {/* 9. ACCIONES (PROCESADO / RETENIDO / REPARTIDO) */}
      {activeTab !== 'retained' ? (
        <>
          {/* Checkbox Procesado (Abre Modal de Reserva) */}
          <td className="py-2.5 px-1 whitespace-nowrap text-center">
            <button
              onClick={() => onToggleProcessed(payment)}
              title={payment.is_processed ? 'Marcar como Pendiente' : 'Configurar y Procesar Reserva (Google Calendar + WhatsApp)'}
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
          <td className="py-2.5 px-1 whitespace-nowrap text-center">
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
        <td className="py-2.5 px-1 whitespace-nowrap text-center">
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

      {/* 10. COLUMNA ACCIONES */}
      <td className="py-2.5 px-2 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(payment)}
            title="Editar Estado y Notas"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(payment.id, displayName)}
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
