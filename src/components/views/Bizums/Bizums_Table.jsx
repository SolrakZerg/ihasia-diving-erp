import { Phone, Edit2, Trash2, ChevronLeft, ChevronRight, Check, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getActivityColor, getTranslucentBg, generateWhatsappLink, formatPrettyPhone } from './Bizums_Utils';

export default function Bizums_Table({
  bizums,
  loading,
  activeTab = 'active',
  totalCount,
  currentPage,
  totalPages,
  sortConfig,
  onSort,
  onTogglePaid,
  onToggleReturned,
  onEdit,
  onDelete,
  goToPage,
  getPageNumbers,
}) {
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

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

  const renderTableRows = (rows, emptyMsg) => {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="py-8 text-center text-gray-400 font-medium text-xs">
            {emptyMsg}
          </td>
        </tr>
      );
    }

    return rows.map((row) => {
      const regDate = formatDateDisplay(row.created_at);
      const waLink = generateWhatsappLink(
        row.whatsapp_phone || row.bizum_phone,
        row.customer_name,
        row.num_people,
        row.activity,
        row.booking_date
      );

      return (
        <tr
          key={row.id}
          className="hover:bg-brand/5 transition-colors group cursor-default"
        >
          {/* Marca Temporal (Fecha + Hora) */}
          <td className="py-2.5 px-3 text-center whitespace-nowrap border-r border-surface-edge/10">
            <div className="flex flex-col items-center">
              <p className="text-white text-xs font-bold uppercase tracking-tight">
                {regDate.date}
              </p>
              {regDate.time && (
                <p className="text-cyan-500/80 text-[11px] font-bold">
                  {regDate.time}
                </p>
              )}
            </div>
          </td>

          {/* Fecha Reserva (Pill Badge) */}
          <td className="py-2.5 px-3 text-center whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-slate-800/90 border border-slate-700/50 text-amber-500/90 font-extrabold text-xs tracking-wide shadow-sm">
              {formatBookingDatePill(row.booking_date)}
            </span>
          </td>

          {/* Nombre y Apellidos */}
          <td className="py-2.5 px-3 max-w-[180px] w-[180px]">
            <p
              className="text-white/70 font-bold text-sm capitalize leading-snug line-clamp-2 break-words"
              title={row.customer_name}
            >
              {row.customer_name}
            </p>
          </td>

          {/* Pax */}
          <td className="py-2.5 px-3 text-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white border border-brand-light/30 font-black text-sm shadow-md shadow-brand/20 mx-auto">
              {row.num_people || 1}
            </span>
          </td>

          {/* Actividad */}
          <td className="py-2.5 px-3 max-w-[120px] w-[120px] border-r border-surface-edge/10 text-center">
            {renderActivityBadges(row.activity)}
          </td>

          {/* Teléfono Bizum */}
          <td className="py-2.5 px-2 font-mono text-cyan-500 font-bold text-sm whitespace-nowrap tracking-tight max-w-[150px] w-[150px] truncate" title={row.bizum_phone}>
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

          {/* Checkbox PAGADO */}
          <td className="py-2.5 px-2 text-center">
            <button
              onClick={() => onTogglePaid(row)}
              title={row.is_paid ? 'Marcado como Pagado (clic para desmarcar)' : 'Marcar como Pagado'}
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

          {/* Acciones */}
          <td className="py-2.5 px-3 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => onEdit(e, row)}
                title="Editar registro"
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-soft transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => onDelete(e, row.id, row.customer_name)}
                title="Eliminar registro"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  const renderTableHeader = () => (
    <thead>
      <tr className="border-b border-surface-edge bg-surface/80 text-[11px] uppercase font-extrabold tracking-wider text-gray-400 select-none sticky top-0 z-10 backdrop-blur-md">
        <th
          onClick={() => onSort('created_at')}
          className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors w-[95px]"
        >
          REGISTRADO {getSortIcon('created_at')}
        </th>
        <th
          onClick={() => onSort('booking_date')}
          className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors w-[95px]"
        >
          RESERVA {getSortIcon('booking_date')}
        </th>
        <th
          onClick={() => onSort('customer_name')}
          className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors max-w-[180px] w-[180px]"
        >
          BUCEADOR {getSortIcon('customer_name')}
        </th>
        <th
          onClick={() => onSort('num_people')}
          className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors w-[45px]"
        >
          PAX {getSortIcon('num_people')}
        </th>
        <th
          onClick={() => onSort('activity')}
          className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors max-w-[120px] w-[120px]"
        >
          ACTIVIDAD {getSortIcon('activity')}
        </th>
        <th className="py-2.5 px-2 max-w-[150px] w-[150px]">TEL. BIZUM</th>
        <th className="py-2.5 px-2 text-center w-[65px]">WHATSAPP</th>
        <th className="py-2.5 px-2 text-center w-[55px]">PAGADO</th>
        <th className="py-2.5 px-2 text-center w-[55px]">DEVUELTO</th>
        <th className="py-2.5 px-3 text-right w-[55px]">ACC.</th>
      </tr>
    </thead>
  );

  if (loading && bizums.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse text-sm">Cargando reservas por Bizum...</p>
      </div>
    );
  }

  // --- Vista 1: RESERVAS ACTIVAS (Dividida en 2 tablas) ---
  if (activeTab === 'active') {
    const pendingBizums = bizums.filter((b) => !b.is_paid);
    const paidBizums = bizums.filter((b) => b.is_paid);

    return (
      <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
        {/* SECCIÓN 1: PENDIENTES DE CONFIRMACIÓN (Compacta para 4-6 filas) */}
        <div className="bg-surface-soft/40 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
          {/* Banner de Sección */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  Pendientes de Confirmación de Pago
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingBizums.length} {pendingBizums.length === 1 ? 'reserva' : 'reservas'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">
              Comprueba el pago en la app del banco y marca la casilla "PAGADO"
            </span>
          </div>

          {/* Tabla de Pendientes (Hasta ~290px de alto máximo para 4-6 filas completas) */}
          <div className="overflow-x-auto overflow-y-auto max-h-[290px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-full">
              {renderTableHeader()}
              <tbody className="divide-y divide-surface-edge/60 text-sm">
                {renderTableRows(pendingBizums, '🎉 ¡Genial! No hay reservas pendientes de confirmar pago en este momento.')}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 2: PAGADAS (PENDIENTES DE DEVOLUCIÓN - Ocupa TODO el alto restante) */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface-soft/40 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl">
          {/* Banner de Sección */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                  Pagadas (Pendientes de Devolución en la Actividad)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {paidBizums.length} {paidBizums.length === 1 ? 'reserva' : 'reservas'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400/80 font-medium hidden sm:inline">
              Bizum comprobado. El día del buceo se les devuelve el importe y se marca "DEVUELTO"
            </span>
          </div>

          {/* Tabla de Pagadas (Flex-1: Expande 100% hasta el final de la pantalla) */}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-full">
              {renderTableHeader()}
              <tbody className="divide-y divide-surface-edge/60 text-sm">
                {renderTableRows(paidBizums, 'No hay reservas pagadas pendientes de devolución.')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- Vista 2: HISTORIAL DE DEVUELTAS (Paginada) ---
  return (
    <div className="flex flex-col h-full bg-surface-soft/40 border border-surface-edge rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-surface/90 border-b border-surface-edge px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-5 h-5 text-gray-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
            Historial de Reservas Devueltas
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-full">
          {renderTableHeader()}
          <tbody className="divide-y divide-surface-edge/60 text-sm">
            {renderTableRows(bizums, 'No se encontraron reservas devueltas en el historial.')}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-surface-edge bg-surface/80 flex items-center justify-between text-xs text-gray-300 backdrop-blur-md">
          <span>
            Mostrando página <strong className="text-white">{currentPage + 1}</strong> de{' '}
            <strong className="text-white">{totalPages}</strong> ({totalCount} total)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-1.5 rounded-xl border border-surface-edge bg-surface-soft hover:bg-surface-edge disabled:opacity-30 disabled:hover:bg-surface-soft text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((num) => (
              <button
                key={num}
                onClick={() => goToPage(num)}
                className={`w-7 h-7 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentPage === num
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'bg-surface-soft border border-surface-edge text-gray-300 hover:bg-surface-edge'
                }`}
              >
                {num + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-1.5 rounded-xl border border-surface-edge bg-surface-soft hover:bg-surface-edge disabled:opacity-30 disabled:hover:bg-surface-soft text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
