import React from 'react';
import { Search, Calendar, ShieldCheck, Download, UserPlus, Loader2, Check, X, Edit2, Trash2, AlertCircle, Send } from 'lucide-react';

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
  editData,
  setEditData,
  saveEdit,
  handleRemoveCustomer,
  handleGenerateAndSend
}) {
  return (
    <div className="flex-1 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="p-4 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50 flex-none">
        <h3 className="font-bold text-white flex items-center gap-2">Lista a Enviar ({customers.length})</h3>

        <div className="flex gap-3 items-center">
          {/* Add directly inline search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Añadir a alguien..."
              value={addSearchQuery}
              onChange={(e) => setAddSearchQuery(e.target.value)}
              className="bg-surface/50 border border-brand/30 rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-brand w-[360px] transition-colors shadow-inner"
            />

            {/* Search Results Dropdown */}
            {addSearchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-edge rounded-xl shadow-2xl z-50 overflow-hidden max-h-[500px] overflow-y-auto w-full">
                {isSearching ? (
                  <div className="p-3 text-center text-gray-500 text-xs">Buscando...</div>
                ) : addResults.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-xs">Sin resultados</div>
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
                            <span className="text-[11px] text-gray-600 font-mono">-</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-surface-edge mx-1"></div>

          <div className="relative group/filter">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar en la lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface/50 border border-surface-edge rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-surface-edge hover:border-gray-500 w-48 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
            <p className="text-sm text-gray-500">Cargando datos...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 pt-8">
            <ShieldCheck className="w-12 h-12 opacity-20 mb-4" />
            <p>No tienes a nadie preparado en la bandeja de salida de seguros.</p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={loadTodayCustomers}
                disabled={processing}
                className="flex items-center gap-2 bg-surface border border-brand/50 text-brand px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand/10 transition-colors"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Cargar Reservas de Hoy
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className="flex items-center gap-2 bg-surface border border-surface-edge text-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-edge transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Buscador Avanzado
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-table-header/98 backdrop-blur-xl border-b border-surface-edge/50 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Plaza</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buceador y Registro</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Seguro</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Gen.</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-48">Pasaporte / ID</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/20">
              {filteredCustomers.map((customer, index) => editingId === customer.id ? (
                <tr key={customer.id} className="bg-brand/5 border-l-2 border-brand">
                  <td className="px-6 py-3 text-center text-gray-500 font-mono text-sm font-bold">
                    {paxBalance - index}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <input value={editData.first_name} onChange={e => setEditData({ ...editData, first_name: e.target.value })} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 text-sm text-white w-full focus:border-brand focus:outline-none" placeholder="Nombre" />
                      <input value={editData.last_name} onChange={e => setEditData({ ...editData, last_name: e.target.value })} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 text-sm text-white w-full focus:border-brand focus:outline-none" placeholder="Apellidos" />
                    </div>
                  </td>

                  <td className="px-6 py-3 text-center">
                    {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                      <span className="text-[12px] text-rose-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider inline-flex whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Seguro Activo
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3 text-center text-gray-500 font-bold uppercase text-sm">
                    {customer.gender?.[0] || '-'}
                  </td>

                  <td className="px-6 py-3">
                    <input value={editData.passport_number} onChange={e => setEditData({ ...editData, passport_number: e.target.value })} className="bg-surface border border-surface-edge rounded-lg px-3 py-1.5 font-mono text-[13px] text-brand-light w-full uppercase focus:border-brand focus:outline-none text-center" placeholder="Pasaporte" />
                  </td>

                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1 items-center">
                      <button onClick={() => saveEdit(customer.id)} title="Guardar cambios" className="p-1.5 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/30"> <Check className="w-4 h-4" /> </button>
                      <button onClick={() => setEditingId(null)} title="Cancelar" className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-edge rounded-lg transition-colors border border-transparent"> <X className="w-4 h-4" /> </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={customer.id} className="hover:bg-brand/5 transition-colors group">
                  <td className="px-6 py-3 text-center text-brand font-mono text-[15px] font-bold">
                    {paxBalance - index}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="font-bold text-white text-[15px] capitalize truncate">
                        {(customer.first_name || '') + ' ' + (customer.last_name || '')}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {customer.booking_date && (
                          <p className="text-[11px] text-cyan-500/80 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(customer.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3 text-center">
                    {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                      <span className="text-[12px] text-rose-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider inline-flex whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Seguro Activo
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3 text-center text-gray-500 font-bold uppercase text-sm">
                    {customer.gender?.[0] || '-'}
                  </td>

                  <td className="px-6 py-3 text-center">
                    <p className="text-[15px] text-brand-light font-mono font-bold tracking-wider">
                      {customer.passport_number || 'N/A'}
                    </p>
                  </td>

                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button
                        onClick={() => {
                          setEditingId(customer.id);
                          setEditData({ first_name: customer.first_name || '', last_name: customer.last_name || '', passport_number: customer.passport_number || '' });
                        }}
                        className="p-1.5 text-gray-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
                        title="Corregir datos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveCustomer(customer.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
      </div>

      <div className="p-4 border-t border-surface-edge bg-surface/50 flex justify-between items-center flex-none">
        <button
          onClick={loadTodayCustomers}
          disabled={processing || loading}
          title="Añadir a la lista todos los registrados para hoy"
          className="text-xs text-brand border border-brand/30 bg-brand/5 hover:bg-brand/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors"
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Cargar Reservas de Hoy
        </button>

        <div className="flex items-center gap-6">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-brand" /> Se descontarán {customers.length} plazas
          </p>
          <button
            disabled={customers.length === 0 || processing}
            onClick={handleGenerateAndSend}
            className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-light transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Generar y Enviar Seguros
          </button>
        </div>
      </div>
    </div>
  );
}
