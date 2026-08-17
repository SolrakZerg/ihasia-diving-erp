import React, { useState, useMemo } from 'react';
import { Search, Calendar, ShieldCheck, Download, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import InsuranceTableRow from './InsuranceTableRow';
import InsuranceFooterActions from './InsuranceFooterActions';
import InsuranceLoadModal from './InsuranceLoadModal';

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
  loadCustomersByDate,
  processing,
  onNavigate,
  editingId,
  setEditingId,
  updateCustomerField,
  handleRemoveCustomer,
  handleGenerateAndSend,
  confirmSend,
  setConfirmSend,
  onSendSingleToRoster,
  onSendSelectedToRoster
}) {
  const [sendToBilling, setSendToBilling] = useState(false);
  const [sendToRoster, setSendToRoster] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const toggleSelectCustomer = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [targetLoadDate, setTargetLoadDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const offset = tomorrow.getTimezoneOffset();
    return new Date(tomorrow.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [targetLoadActivity, setTargetLoadActivity] = useState('Fun Dive');

  const duplicateIds = useMemo(() => {
    const dups = new Set();
    
    const normalize = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    const getLevenshteinDistance = (a, b) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    };

    for (let i = 0; i < customers.length; i++) {
      const A = customers[i];
      const passA = normalize(A.passport_number);
      const firstA = normalize(A.first_name);
      const lastA = normalize(A.last_name);

      for (let j = i + 1; j < customers.length; j++) {
        const B = customers[j];
        const passB = normalize(B.passport_number);
        const firstB = normalize(B.first_name);
        const lastB = normalize(B.last_name);

        let isDup = false;

        if (passA && passA !== 'n/a' && passA === passB) {
          isDup = true;
        }

        if (!isDup && firstA && lastA && firstA === firstB && lastA === lastB) {
          isDup = true;
        }

        if (!isDup) {
          const nameSim = firstA && firstB && (firstA.includes(firstB) || firstB.includes(firstA) || getLevenshteinDistance(firstA, firstB) <= 2);
          const lastSim = lastA && lastB && (lastA.includes(lastB) || lastB.includes(lastA) || getLevenshteinDistance(lastA, lastB) <= 2);
          
          if (nameSim && lastSim) {
            isDup = true;
          }
        }

        if (!isDup && passA && passB && passA !== 'n/a' && passB !== 'n/a') {
          const passSim = getLevenshteinDistance(passA, passB) <= 1;
          const nameSim = firstA && firstB && (firstA.includes(firstB) || firstB.includes(firstA) || getLevenshteinDistance(firstA, firstB) <= 2);
          const lastSim = lastA && lastB && (lastA.includes(lastB) || lastB.includes(lastA) || getLevenshteinDistance(lastA, lastB) <= 2);
          
          if (passSim && nameSim && lastSim) {
            isDup = true;
          }
        }

        if (isDup) {
          dups.add(A.id);
          dups.add(B.id);
        }
      }
    }
    return dups;
  }, [customers]);

  return (
    <div className="w-full lg:w-auto flex-none lg:flex-1 bg-surface-soft border border-surface-edge shadow-xl rounded-2xl overflow-hidden flex flex-col min-w-0 lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
      
      {/* ── Top Header & Add Bar ── */}
      <div className="p-4 border-b border-surface-edge flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface-soft/50 flex-none gap-3">
        <h3 className="font-bold text-white flex items-center gap-2 shrink-0 whitespace-nowrap">Enviar ({customers.length})</h3>

        <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:flex-1 sm:justify-end min-w-0">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-[360px] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Añadir a alguien..."
              value={addSearchQuery}
              onChange={(e) => setAddSearchQuery(e.target.value)}
              className="bg-surface/50 border border-brand/30 rounded-xl pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-brand w-full transition-colors shadow-inner"
            />

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
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table Content ── */}
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
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={loadTodayCustomers}
                disabled={processing}
                className="flex items-center gap-2 bg-surface border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Cargar Reservas para Hoy
              </button>

              <button
                type="button"
                onClick={() => setShowLoadModal(true)}
                disabled={processing || loading}
                title="Seleccionar fecha y actividad para cargar reservas"
                className="flex items-center gap-2 bg-surface border border-cyan-500/50 text-cyan-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-cyan-500/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span>Cargar por Fecha</span>
              </button>

              <button
                onClick={() => onNavigate('customers')}
                className="flex items-center gap-2 bg-surface border border-surface-edge text-text-muted px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-edge transition-colors cursor-pointer"
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
                <th className="px-2 py-3 text-center w-[36px]">
                  <input
                    type="checkbox"
                    checked={filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
                    title="Seleccionar todos"
                  />
                </th>
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
                <InsuranceTableRow
                  key={customer.id}
                  customer={customer}
                  index={index}
                  paxBalance={paxBalance}
                  isDuplicate={duplicateIds.has(customer.id)}
                  isSelected={selectedIds.has(customer.id)}
                  toggleSelectCustomer={toggleSelectCustomer}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  updateCustomerField={updateCustomerField}
                  handleRemoveCustomer={handleRemoveCustomer}
                  onSendSingleToRoster={onSendSingleToRoster}
                />
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

      {/* ── Footer Action Bar ── */}
      <InsuranceFooterActions
        customers={customers}
        selectedIds={selectedIds}
        sendToBilling={sendToBilling}
        setSendToBilling={setSendToBilling}
        sendToRoster={sendToRoster}
        setSendToRoster={setSendToRoster}
        setConfirmSend={setConfirmSend}
        loadTodayCustomers={loadTodayCustomers}
        setShowLoadModal={setShowLoadModal}
        onSendSelectedToRoster={onSendSelectedToRoster}
        processing={processing}
        loading={loading}
      />

      {/* ── Modal de Carga por Fecha y Actividad ── */}
      <InsuranceLoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        targetLoadDate={targetLoadDate}
        setTargetLoadDate={setTargetLoadDate}
        targetLoadActivity={targetLoadActivity}
        setTargetLoadActivity={setTargetLoadActivity}
        loadCustomersByDate={loadCustomersByDate}
        processing={processing}
        loading={loading}
      />

    </div>
  );
}
