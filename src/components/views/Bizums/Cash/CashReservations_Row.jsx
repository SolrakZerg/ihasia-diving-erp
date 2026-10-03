import { User, Phone, Calendar, Trash2, Lock, Clock, ArrowDownLeft } from 'lucide-react';
import { getActivityColor } from '../Bizums_Utils';

export default function CashReservations_Row({ row, onDelete }) {
  const formatBookingDatePill = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('es-ES', {
          day: '2-digit', month: 'short', year: '2-digit',
        }).replace('.', '').toUpperCase();
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: '2-digit',
      }).replace('.', '').toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const cleanPhone = (p) => {
    if (!p) return null;
    return p.replace(/[^0-9]/g, '');
  };

  const customerName = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.customer_name || 'Sin nombre';
  const phoneVal = row.phone || '';
  const phoneDigits = cleanPhone(phoneVal);
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  const totalPax = row.num_people || row.pax || 1;
  const depositVal = Number(row.amount_thb || row.deposit_amount || row.deposit_thb || 0);
  const depositPax = row.deposit_pax || (depositVal > 0 ? Math.round(depositVal / 1000) : 0);
  const calLink = row.calendar_html_link || row.google_calendar_link;

  // Formatear badges de actividad idénticos a Bizum/Wise
  const renderActivityBadges = () => {
    const rawActivity = row.activity_code || row.activity_summary || '';
    if (!rawActivity) return <span className="text-gray-600 text-xs font-semibold">-</span>;

    const parts = rawActivity.split(/[,+]|\s\+\s/).map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[130px] mx-auto">
        {parts.map((act, idx) => {
          const badge = getActivityColor(act);
          const upper = act.toUpperCase();
          const multMatch = act.match(/(?:x\s*(\d+)|(\d+)\s*x)/i);
          const mult = multMatch ? (multMatch[1] || multMatch[2]) : (parts.length === 1 && totalPax > 1 ? totalPax : null);
          let label = upper;
          if (upper.includes('OW') && (upper.includes('2 DÍAS') || upper.includes('2 DIAS') || upper.includes('2 DAYS') || upper.includes('2D'))) {
            label = mult && parseInt(mult, 10) > 1 ? `OW 2x${mult}` : 'OW 2';
          } else if (upper.includes('RES') || upper.includes('RESCUE')) {
            label = mult && parseInt(mult, 10) > 1 ? `RESx${mult}` : 'RES';
          } else {
            const cleanBase = upper.replace(/\s*\(.*?\)/g, '').replace(/x\d+/i, '').trim();
            label = mult && parseInt(mult, 10) > 1 ? `${cleanBase}x${mult}` : cleanBase;
          }

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

  return (
    <tr className="hover:bg-brand/5 transition-colors group cursor-default border-b border-surface-edge/40">
      {/* 1. FECHA RESERVA (Pill Verde Esmeralda idéntico a Bizum/Wise) */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        {row.booking_date ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm tracking-wide shadow-sm">
            {formatBookingDatePill(row.booking_date)}
          </span>
        ) : (
          <span className="text-gray-600 text-xs font-semibold">---</span>
        )}
      </td>

      {/* 2. REMITENTE / CLIENTE */}
      <td className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-brand shrink-0" />
          <p
            className="text-white/80 font-bold text-sm capitalize truncate max-w-[220px]"
            title={customerName}
          >
            {customerName}
          </p>
        </div>
      </td>

      {/* 3. PAX (Círculo azul idéntico a Bizum/Wise) */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white border border-brand-light/30 font-black text-sm shadow-md shadow-brand/20 mx-auto">
          {totalPax}
        </span>
      </td>

      {/* 4. ACTIVIDAD */}
      <td className="py-2.5 px-3 min-w-[100px] border-r border-surface-edge/10 text-center">
        {renderActivityBadges()}
      </td>

      {/* 5. WHATSAPP (Botón icono cuadrado idéntico a Bizum/Wise) */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            title={`Abrir WhatsApp (${phoneVal})`}
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

      {/* 6. IMPORTE / DEPÓSITO */}
      <td className="py-2.5 px-3 whitespace-nowrap text-right font-black text-sm">
        {depositVal > 0 ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center justify-end gap-1 text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{depositVal.toLocaleString('es-ES')} THB</span>
            </div>
            {row.payment_method && row.payment_method !== 'CASH' && (
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border leading-none ${
                row.payment_method === 'WISE CR'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              }`}>
                {row.payment_method}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30">
            0 THB (Sin señal)
          </span>
        )}
      </td>

      {/* 7. FACTURACIÓN */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        {row.imported_to_invoice ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Facturado</span>
            {row.invoice_id && (
              <span className="font-mono text-[10px] text-emerald-300">
                #{row.invoice_id.slice(-4).toUpperCase()}
              </span>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendiente</span>
          </div>
        )}
      </td>

      {/* 8. CALENDAR */}
      <td className="py-2.5 px-2 text-center whitespace-nowrap">
        {calLink ? (
          <a
            href={calLink}
            target="_blank"
            rel="noreferrer"
            title="Abrir evento en Google Calendar"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/30 shadow-md mx-auto cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-gray-600 text-xs font-semibold">-</span>
        )}
      </td>

      {/* 9. ACCIÓN */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <button
          onClick={() => onDelete(row)}
          title="Eliminar reserva"
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
