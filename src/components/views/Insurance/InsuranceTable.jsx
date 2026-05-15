import React from 'react';
import { Search, Calendar, ShieldCheck, Download, UserPlus, Loader2, Check, X, Edit2, Trash2, AlertCircle, Send } from 'lucide-react';
import EditableInput from '../../common/EditableInput';

export default function InsuranceTable({
  customers,
  paxBalance,

  addSearchQuery,
  setAddSearchQuery,
  isSearching,
  addResults,
  handleAddDirectly,
  searchTerm,
  setSearchTerm,
  loading,
  filteredCustomers,
  loadTodayCustomers,
  processing,
  onNavigate,
  editingId,
  setEditingId,
  updateCustomerField,
  handleRemoveCustomer,
  handleGenerateAndSend
}) {
  return (
    <div className="w-full lg:w-auto flex-none lg:flex-1 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl overflow-hidden flex flex-col min-w-0 lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
      <div className="p-4 border-b border-surface-edge flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface-soft/50 flex-none gap-3">
        <h3 className="font-bold text-white flex items-center gap-2 shrink-0 whitespace-nowrap">Enviar ({customers.length})</h3>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:flex-1 sm:justify-end min-w-0">
          {/* Add directly inline search */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-[360px] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Añadir a alguien..."
              value={addSearchQuery}
              onChange={(e) => setAddSearchQuery(e.target.value)}
              className="bg-surface/50 border border-brand/30 rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-brand w-full transition-colors shadow-inner"
            />

            {/* Search Results Dropdown */}
            {addSearchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-edge rounded-xl shadow-2xl z-50 overflow-hidden max-h-[500px] overflow-y-auto w-full">
                {isSearching ? (
                  <div className="p-3 text-center text-text-muted text-xs">Buscando...</div>
                ) : addResults.length === 0 ? (
                  <div className="p-3 text-center text-text-muted text-xs">Sin resultados</div>
                ) : (
                  <div className="py-1">
                    {addResults.map(res => (
                      <button
                        key={res.id}
                        onClick={() => handleAddDirectly(res)}
                        className="w-full text-left px-3 py-2 hover:bg-brand/10 transition-colors flex flex-row items-center justify-between gap-3 border-b border-surface-edge/30 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white capitalize block truncate">
                            {res.first_name} {res.last_name}
                          </span>
                          {res.booked_activity && (
                            <span className="text-[12px] text-brand uppercase font-black block truncate mt-0.5 tracking-tight">
                              {res.booked_activity}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1.5">
                          <span className="text-[14px] text-amber-400 font-mono font-black uppercase bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded shadow-sm">
                            {res.passport_number || 'S/P'}
                          </span>
                          {res.booking_date ? (
                            <span className="text-[12px] text-cyan-400 font-bold mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(res.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-dim font-mono">-</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:block w-px h-6 bg-surface-edge mx-1"></div>

          <div className="relative group/filter w-full sm:w-auto shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Filtrar en la lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface/50 border border-surface-edge rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-surface-edge hover:border-surface-edge/70 w-full sm:w-48 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto lg:flex-1 lg:overflow-auto relative custom-scrollbar pb-14">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
            <p className="text-sm text-text-muted">Cargando datos...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted pt-8">
            <ShieldCheck className="w-12 h-12 opacity-20 mb-4" />
            <p>No tienes a nadie preparado en la bandeja de salida de seguros.</p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={loadTodayCustomers}
                disabled={processing}
                className="flex items-center gap-2 bg-surface border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/10 transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Cargar Reservas para Hoy
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className="flex items-center gap-2 bg-surface border border-surface-edge text-text-muted px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-edge transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Buscador Avanzado
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="static sm:sticky top-0 z-20 bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 shadow-sm">
              <tr>
                <th className="hidden sm:table-cell px-3 py-3 text-[10px] font-black text-text-header uppercase tracking-widest text-center w-[50px] min-w-[50px]">Nº</th>
                <th className="px-2 py-3 text-[10px] font-black text-text-header uppercase tracking-widest min-w-[190px] max-w-[300px]">Name  & Reg</th>
                <th className="hidden md:table-cell px-2 py-3 text-[10px] font-black text-text-header uppercase tracking-widest text-center min-w-[85px]">Seguro</th>
                <th className="hidden md:table-cell px-2 py-3 text-[10px] font-black text-text-header uppercase tracking-widest text-center w-[50px] min-w-[50px]">Gen.</th>
                <th className="px-1 py-3 text-[10px] font-black text-text-header uppercase tracking-widest text-center min-w-[80px]">ID</th>
                <th className="px-1 md:pr-4 py-3 text-[10px] font-black text-text-header uppercase tracking-widest text-center w-[35px] min-w-[35px]">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/20">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-brand/5 transition-colors group">
                  <td className="hidden sm:table-cell px-3 py-3 text-center text-brand font-mono text-[15px] font-bold min-w-[50px]">
                    {paxBalance - index}
                  </td>
                  <td className="px-2 py-3 min-w-[190px] max-w-[300px]">
                    <div className="flex flex-col justify-center min-w-0">
                      {editingId === customer.id ? (
                        <div className="flex gap-1 font-bold text-white text-[15px] capitalize">
                          <EditableInput
                            defaultValue={customer.first_name || ''}
                            onSave={(val) => {
                              updateCustomerField(customer.id, 'first_name', val);
                              setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                            className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors max-w-[100px]"
                            placeholder="Nombre"
                            autoFocus
                          />
                          <EditableInput
                            defaultValue={customer.last_name || ''}
                            onSave={(val) => {
                              updateCustomerField(customer.id, 'last_name', val);
                              setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                            className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors max-w-[150px]"
                            placeholder="Apellidos"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-white text-[15px] capitalize truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[300px]">
                            {(customer.first_name || '') + ' ' + (customer.last_name || '')}
                          </p>
                          <button
                            onClick={() => {
                              setEditingId(customer.id);
                            }}
                            className="p-1 text-text-muted hover:text-brand hover:bg-brand/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Corregir nombre"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {customer.booking_date && (
                          <p className="text-[11px] text-cyan-500/80 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(customer.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                            {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 md:hidden flex-shrink-0 ml-1" />
                            )}
                            <span className="text-text-muted md:hidden ml-1 uppercase">
                              · {customer.gender?.[0] || '-'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="hidden md:table-cell px-2 py-3 text-center min-w-[85px]">
                    {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                      <span className="text-[12px] text-rose-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider inline-flex whitespace-nowrap mx-auto">
                        <AlertCircle className="w-3 h-3" /> Activo
                      </span>
                    )}
                  </td>

                  <td className="hidden md:table-cell px-2 py-3 text-center text-text-muted font-bold uppercase text-sm min-w-[50px]">
                    {customer.gender?.[0] || '-'}
                  </td>

                  <td className="px-1 py-3 text-center min-w-[90px]">
                    <EditableInput
                      defaultValue={customer.passport_number || ''}
                      onSave={(val) => updateCustomerField(customer.id, 'passport_number', val)}
                      className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-0 outline-none transition-colors w-full text-center font-mono text-[15px] text-brand-light font-bold tracking-wider"
                      placeholder="N/A"
                    />
                  </td>

                  <td className="px-2 md:pr-4 py-3 text-center min-w-[35px]">
                    <div className="flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button
                        onClick={() => handleRemoveCustomer(customer.id)}
                        className="p-0 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Quitar de la lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Floating text at the end of the table */}
        {customers.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-surface-edge shadow-lg text-xs text-text-muted flex items-center gap-1.5 z-30">
            <AlertCircle className="w-3.5 h-3.5 text-brand" /> Se descontarán <span className="font-bold text-white">{customers.length}</span> plazas
          </div>
        )}
      </div>

      <div className="p-4 border-t border-surface-edge bg-surface/50 flex justify-between items-center flex-none">
        <button
          onClick={loadTodayCustomers}
          disabled={processing || loading}
          title="Añadir a la lista todos los registrados para hoy"
          className="flex items-center gap-1 bg-surface border border-emerald-500/50 text-emerald-400 px-2 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/10 transition-colors"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Reservas Hoy
        </button>

        <button
          disabled={customers.length === 0 || processing}
          onClick={handleGenerateAndSend}
          className="bg-brand text-white font-bold py-2.5 px-2.5 rounded-xl hover:bg-brand-light transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
        >
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Enviar Seguros
        </button>
      </div>
    </div>
  );
}
