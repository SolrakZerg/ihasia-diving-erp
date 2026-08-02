import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import Bizums_Row from './Bizums_Row';

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
  onToggleRetained,
  onToggleSettled,
  onEdit,
  onDelete,
  goToPage,
  getPageNumbers,
}) {
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const renderTableHeader = () => (
    <thead>
      <tr className="bg-surface-soft/80 text-gray-400 font-bold text-[11px] uppercase tracking-wider border-b border-surface-edge select-none">
        <th
          onClick={() => onSort('created_at')}
          className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors border-r border-surface-edge/10"
        >
          REGISTRADO {getSortIcon('created_at')}
        </th>

        <th
          onClick={() => onSort('booking_date')}
          className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
        >
          FECHA RESERVA {getSortIcon('booking_date')}
        </th>

        <th
          onClick={() => onSort('customer_name')}
          className="py-3 px-3 text-left cursor-pointer hover:text-white transition-colors max-w-[180px] w-[180px]"
        >
          REMITENTE / CLIENTE {getSortIcon('customer_name')}
        </th>

        <th
          onClick={() => onSort('num_people')}
          className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
        >
          PAX {getSortIcon('num_people')}
        </th>

        <th
          onClick={() => onSort('activity')}
          className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors max-w-[120px] w-[120px] border-r border-surface-edge/10"
        >
          ACTIVIDAD {getSortIcon('activity')}
        </th>

        <th className="py-3 px-2 text-left">TEL. BIZUM</th>
        <th className="py-3 px-2 text-center">WHATSAPP</th>

        {activeTab === 'retained' ? (
          <th className="py-3 px-2 text-center">REPARTIDO</th>
        ) : (
          <>
            <th className="py-3 px-2 text-center">PAGADO</th>
            <th className="py-3 px-2 text-center">DEVUELTO</th>
            <th className="py-3 px-2 text-center">RETENIDO</th>
          </>
        )}

        <th className="py-3 px-3 text-right">ACC.</th>
      </tr>
    </thead>
  );

  const renderTableRows = (rows, emptyMsg) => {
    if (loading) {
      return (
        <tr>
          <td colSpan="10" className="py-8 text-center text-gray-400 font-medium text-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
              Cargando reservas Bizum...
            </div>
          </td>
        </tr>
      );
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="py-8 text-center text-gray-400 font-medium text-xs">
            {emptyMsg}
          </td>
        </tr>
      );
    }

    return rows.map((row) => (
      <Bizums_Row
        key={row.id}
        row={row}
        activeTab={activeTab}
        onTogglePaid={onTogglePaid}
        onToggleReturned={onToggleReturned}
        onToggleRetained={onToggleRetained}
        onToggleSettled={onToggleSettled}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));
  };

  // --- Vista 1: RESERVAS ACTIVAS (Dividida en 2 tablas: Pendientes y Pagadas) ---
  if (activeTab === 'active') {
    const pendingBizums = bizums.filter((b) => !b.is_paid);
    const paidBizums = bizums.filter((b) => b.is_paid);

    return (
      <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
        {/* SECCIÓN 1: PENDIENTES DE CONFIRMACIÓN */}
        <div className="bg-surface-soft/40 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
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

          <div className="overflow-x-auto overflow-y-auto max-h-[290px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-full">
              {renderTableHeader()}
              <tbody className="divide-y divide-surface-edge/60 text-sm">
                {renderTableRows(pendingBizums, '🎉 ¡Genial! No hay reservas pendientes de confirmar pago en este momento.')}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 2: PAGADAS (PENDIENTES DE DEVOLUCIÓN) */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface-soft/40 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl">
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Vista para Depósitos Retenidos (2 Secciones: Pendientes y Repartidos) */}
      {activeTab === 'retained' ? (
        <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
          {/* SECCIÓN 1: PENDIENTES DE REPARTIR ENTRE SOCIOS */}
          <div className="bg-surface-soft/40 border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl shrink-0">
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    Pendientes de Repartir entre Socios
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {bizums.filter(b => !b.is_settled).length} registros
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">
                Depósito retenido (No presentado). Haz el reparto entre socios y marca "REPARTIDO"
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[290px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                {renderTableHeader()}
                <tbody className="divide-y divide-surface-edge/60 text-sm">
                  {renderTableRows(bizums.filter(b => !b.is_settled), '🎉 ¡Genial! No hay depósitos retenidos pendientes de repartir entre socios.')}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN 2: HISTORIAL DE REPARTIDOS */}
          <div className="flex-1 flex flex-col min-h-0 bg-surface-soft/40 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                    Historial de Repartidos (Liquidado)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {bizums.filter(b => b.is_settled).length} registros
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-medium hidden sm:inline">
                Cuentas saldadas. Depósitos liquidados entre los socios.
              </span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-full">
                {renderTableHeader()}
                <tbody className="divide-y divide-surface-edge/60 text-sm">
                  {renderTableRows(bizums.filter(b => b.is_settled), 'No hay depósitos liquidados en el historial.')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Vista Estándar (Historial Devueltos) */
        <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 rounded-2xl border border-surface-edge bg-surface-soft/20 shadow-xl custom-scrollbar">
          <table className="w-full border-collapse text-left min-w-full">
            {renderTableHeader()}
            <tbody className="divide-y divide-surface-edge/60 text-sm">
              {renderTableRows(bizums, 'No hay reservas devueltas en el historial.')}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-edge mt-3 shrink-0">
          <span className="text-xs text-gray-400 font-semibold">
            Mostrando página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong> ({totalCount} reservas totales)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-surface-edge text-gray-400 hover:text-white hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' && goToPage(page)}
                disabled={page === '...'}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  page === currentPage
                    ? 'bg-brand text-white border border-brand-light shadow-md shadow-brand/20'
                    : page === '...'
                    ? 'text-gray-500 cursor-default border-transparent'
                    : 'text-gray-400 hover:text-white hover:bg-surface-soft border border-surface-edge cursor-pointer'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-surface-edge text-gray-400 hover:text-white hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
