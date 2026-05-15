import {
  Search, Calendar, Activity, Phone,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  Pencil, Trash2,
} from 'lucide-react';
import { getActivityColor, shortenLastDive, normalizeLevel } from './Customers_Utils';

export default function Customers_Table({
  customers,
  loading,
  totalCount,
  currentPage,
  totalPages,
  PAGE_SIZE,
  sortConfig,
  handleSort,
  isExtendedView,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  handleEdit,
  handleDelete,
  handleRowClick,
  goToPage,
  getPageNumbers,
}) {
  return (
    <div
      className="bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500"
      style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      {/* Scrollable table area */}
      <div className="overflow-auto flex-1 relative">
        <table className={`w-full text-left table-fixed ${isExtendedView ? 'min-w-[2200px]' : 'min-w-[520px] md:min-w-[1000px]'}`}>
          {/* ── Sticky Header ── */}
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
              {/* Checkbox select-all */}
              <th className="px-2 sm:px-4 py-2 text-center w-[30px] sm:w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                  checked={customers.length > 0 && selectedIds.size === customers.length}
                  onChange={toggleSelectAll}
                />
              </th>

              <SortableHeader label="Reg." colKey="created_at" sortConfig={sortConfig} onSort={handleSort} center compact={isExtendedView} width={isExtendedView ? 'w-[90px] max-w-[90px]' : 'w-[70px] sm:w-[100px]'} />
              {isExtendedView && <SortableHeader label="Email" colKey="email" sortConfig={sortConfig} onSort={handleSort} compact width="w-[220px] max-w-[220px]" />}
              <SortableHeader label="Buceador" colKey="first_name" sortConfig={sortConfig} onSort={handleSort} compact={isExtendedView} width={isExtendedView ? 'w-[260px]' : 'w-[170px] sm:w-[200px] md:w-[320px]'} />
              {isExtendedView && (
                <>
                  <SortableHeader label="Gen" colKey="gender" sortConfig={sortConfig} onSort={handleSort} compact width="w-[50px] max-w-[50px]" />
                  <SortableHeader label="Passport" colKey="passport_number" sortConfig={sortConfig} onSort={handleSort} compact width="w-[80px] max-w-[90px]" />
                </>
              )}
              <SortableHeader label="Act." colKey="booked_activity" sortConfig={sortConfig} onSort={handleSort} compact={isExtendedView} width={isExtendedView ? 'w-[90px] max-w-[120px]' : 'w-[90px] md:w-[120px]'} />
              <SortableHeader label="Reserva" colKey="booking_date" sortConfig={sortConfig} onSort={handleSort} center compact={isExtendedView} width={isExtendedView ? 'w-[90px] max-w-[90px]' : 'hidden md:table-cell w-[100px]'} />
              {isExtendedView && <SortableHeader label="Teléfono" colKey="phone" sortConfig={sortConfig} onSort={handleSort} compact width="w-[90px] max-w-[100px]" />}

              <th className={`${isExtendedView ? 'px-2 w-[60px] max-w-[80px]' : 'px-2 w-[60px] md:w-[80px]'} py-2 text-xs font-bold text-text-header uppercase tracking-wider text-center`}>
                WhatsApp
              </th>

              {isExtendedView && (
                <>
                  <SortableHeader label="F. Nac" colKey="birth_date" sortConfig={sortConfig} onSort={handleSort} compact width="w-[80px] max-w-[90px]" />
                  <SortableHeader label="Contacto Emergencia" colKey="emergency_contact" sortConfig={sortConfig} onSort={handleSort} compact width="w-[130px] max-w-[130px]" />
                  <SortableHeader label="Dirección" colKey="address" sortConfig={sortConfig} onSort={handleSort} compact width="w-[140px] max-w-[160px]" />
                  <SortableHeader label="Conocido" colKey="lead_source" sortConfig={sortConfig} onSort={handleSort} compact width="w-[120px] max-w-[140px]" />
                  <SortableHeader label="Nivel" colKey="certification_level" sortConfig={sortConfig} onSort={handleSort} compact width="w-[110px] max-w-[140px]" />
                  <SortableHeader label="Tot" colKey="total_dives" sortConfig={sortConfig} onSort={handleSort} center compact width="w-[50px] max-w-[50px]" />
                  <SortableHeader label="Last" colKey="last_dive_date" sortConfig={sortConfig} onSort={handleSort} compact width="w-[80px] max-w-[90px]" />
                  <SortableHeader label="Origen" colKey="form_origin" sortConfig={sortConfig} onSort={handleSort} compact width="w-[80px] max-w-[90px]" />
                  <SortableHeader label="Seguro" colKey="insurance_expiry" sortConfig={sortConfig} onSort={handleSort} compact width="w-[90px] max-w-[90px]" />
                </>
              )}

              <th className={`py-2 text-xs font-bold text-text-header uppercase tracking-wider text-center ${isExtendedView ? 'px-2 w-[80px] max-w-[80px]' : 'px-2 md:px-4 w-[100px] md:w-[160px]'}`}>
                Acc.
              </th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-surface-edge/50">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-2 md:px-6 py-2">
                      <div className="h-4 bg-surface-edge/40 rounded-lg w-3/4 mx-auto" />
                    </td>
                  ))}
                </tr>
              ))
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-brand/5 transition-colors group cursor-pointer"
                  onClick={() => handleRowClick(customer)}
                >
                  {/* Checkbox */}
                  <td className="px-2 sm:px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                      checked={selectedIds.has(customer.id)}
                      onChange={(e) => toggleSelectOne(customer.id, e)}
                    />
                  </td>

                  {/* Fecha de registro */}
                  <td
                    className={`${isExtendedView ? 'px-2' : 'px-2 md:px-6'} py-2 whitespace-nowrap text-center border-r border-surface-edge/10`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center">
                      <p className="text-white text-xs font-bold uppercase tracking-tight">
                        {new Date(customer.created_at).toLocaleDateString('es-ES', {
                          timeZone: 'Asia/Bangkok',
                          day: '2-digit', month: 'short', year: '2-digit',
                        }).replace('.', '')}
                      </p>
                      <p className="text-cyan-500/80 text-[11px] font-bold">
                        {new Date(customer.created_at).toLocaleTimeString('es-ES', {
                          timeZone: 'Asia/Bangkok',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </td>

                  {/* Email (extended only) */}
                  {isExtendedView && (
                    <td
                      className="px-2 py-2 whitespace-nowrap text-sm text-cyan-500/80 font-medium font-mono truncate max-w-[220px]"
                      title={customer.email}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {customer.email}
                    </td>
                  )}

                  {/* Buceador */}
                  <td className={`${isExtendedView ? 'px-2' : 'px-2 md:px-6'} py-2 whitespace-nowrap truncate`} title={`${customer.first_name} ${customer.last_name}`}>
                    <div className="flex items-center gap-3">
                      {!isExtendedView && (
                        <div className="hidden md:flex w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 items-center justify-center text-brand font-bold border border-brand/10">
                          {customer.first_name?.[0]}{customer.last_name?.[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-base capitalize truncate">
                          {customer.first_name} {customer.last_name}
                        </p>
                        {!isExtendedView && (
                          <p className="text-cyan-500/80 text-sm truncate">{customer.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Género y Pasaporte (extended) */}
                  {isExtendedView && (
                    <>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-center text-text-muted capitalize">
                        {customer.gender?.[0] || '---'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-200 font-mono font-semibold tracking-wider">
                        {customer.passport_number || '---'}
                      </td>
                    </>
                  )}

                  {/* Actividad */}
                  <td className={`${isExtendedView ? 'px-2' : 'px-2 md:px-6'} py-2`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Activity className={`w-3.5 h-3.5 ${getActivityColor(customer.booked_activity)}`} />
                        <span className={`truncate ${isExtendedView ? 'max-w-[120px] text-xs' : 'max-w-[150px] text-sm'}`}>
                          {customer.booked_activity || '---'}
                        </span>
                      </div>
                      {/* Fecha de reserva en móvil */}
                      {!isExtendedView && (
                        <div className="flex md:hidden items-center gap-1 text-[11px] font-bold text-text-dim mt-0.5">
                          <Calendar className="w-3 h-3 text-brand" />
                          <span>
                            {customer.booking_date
                              ? new Date(customer.booking_date).toLocaleDateString('es-ES', {
                                day: '2-digit', month: 'short', year: '2-digit',
                              }).replace('.', '')
                              : '---'}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Fecha de reserva */}
                  <td className={`${isExtendedView ? 'px-1' : 'px-2 md:px-6 hidden md:table-cell'} py-2 whitespace-nowrap text-center`}>
                    <div className="flex flex-col items-center text-text-muted">
                      <div className={`flex items-center gap-1 font-bold text-white ${isExtendedView ? 'text-xs' : 'text-sm'}`}>
                        <Calendar className={`${isExtendedView ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-brand`} />
                        <span>
                          {customer.booking_date
                            ? new Date(customer.booking_date).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', year: '2-digit',
                            }).replace('.', '')
                            : '---'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Teléfono (extended) */}
                  {isExtendedView && (
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-brand font-bold">
                      {customer.phone || '---'}
                    </td>
                  )}

                  {/* WhatsApp */}
                  <td className={`${isExtendedView ? 'px-2' : 'px-2 md:px-4'} py-2 text-center`}>
                    <a
                      href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 shadow-sm"
                      title="Abrir WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </td>

                  {/* Columnas extendidas */}
                  {isExtendedView && (
                    <>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted truncate max-w-[90px]" title={customer.birth_date}>{customer.birth_date || '---'}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted max-w-[130px] truncate" title={customer.emergency_contact}>
                        {customer.emergency_contact || '---'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted max-w-[160px] truncate" title={customer.address}>
                        {customer.address || '---'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted max-w-[140px] truncate" title={customer.lead_source}>
                        {customer.lead_source || '---'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted truncate max-w-[140px]" title={normalizeLevel(customer.certification_level)}>
                        {normalizeLevel(customer.certification_level)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-center font-bold text-amber-500 truncate max-w-[50px]">
                        {customer.total_dives || '0'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-text-muted max-w-[90px] truncate" title={customer.last_dive_date}>
                        {shortenLastDive(customer.last_dive_date)}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[10px] text-text-dim italic uppercase truncate max-w-[90px]" title={customer.form_origin}>
                        {customer.form_origin || 'Web'}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-rose-400 truncate max-w-[90px]" title={customer.insurance_expiry}>
                        {customer.insurance_expiry || '---'}
                      </td>
                    </>
                  )}

                  {/* Acciones */}
                  <td className={`${isExtendedView ? 'px-2 pr-4' : 'px-2 md:px-4'} py-2 text-center`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => handleEdit(e, customer)}
                        className="p-1.5 rounded-lg bg-surface-edge/30 text-text-muted hover:text-brand hover:bg-brand/10 transition-all"
                        title="Editar registros"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, customer.id, `${customer.first_name} ${customer.last_name}`)}
                        className="p-1.5 rounded-lg bg-surface-edge/30 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {!isExtendedView && (
                        <button className="p-1 text-gray-500 hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center text-text-muted">
                  <div className="flex flex-col items-center">
                    <Search className="w-12 h-12 mb-4 text-surface-edge" />
                    <p className="text-lg font-medium">No se encontraron buceadores</p>
                    <p className="text-sm">Intenta con otro término de búsqueda o cambia los filtros.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: count + pagination ── */}
      <div className="px-6 py-2 bg-surface/30 border-t border-surface-edge flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-text-dim">
          Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} de {totalCount.toLocaleString('es-ES')} registros
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => goToPage(0)} disabled={currentPage === 0} title="Primera página">
              <ChevronsLeft className="w-4 h-4" />
            </PageBtn>
            <PageBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} title="Página anterior">
              <ChevronLeft className="w-4 h-4" />
            </PageBtn>

            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === currentPage
                  ? 'bg-brand text-white shadow-md shadow-brand/30'
                  : 'text-text-muted hover:bg-surface-edge hover:text-white'
                  }`}
              >
                {page + 1}
              </button>
            ))}

            <PageBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} title="Página siguiente">
              <ChevronRight className="w-4 h-4" />
            </PageBtn>
            <PageBtn onClick={() => goToPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} title="Última página">
              <ChevronsRight className="w-4 h-4" />
            </PageBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponentes locales ───────────────────────────────────────────────────

function SortableHeader({ label, colKey, sortConfig, onSort, center, compact, width }) {
  const isActive = sortConfig.key === colKey;
  return (
    <th
      className={`py-2 text-xs font-bold text-text-header uppercase tracking-wider cursor-pointer hover:bg-surface-edge/30 transition-colors text-center ${compact ? 'px-2' : 'px-2 md:px-6'} ${width || ''}`}
      onClick={() => onSort(colKey)}
    >
      <div className="flex items-center gap-1 justify-center">
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100 text-brand' : 'opacity-0'}`}>
          {isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↑'}
        </span>
      </div>
    </th>
  );
}

function PageBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-edge hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}
