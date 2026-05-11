import { useEffect, useRef } from 'react';
import { Search, CheckCircle2, X, Loader2, Calendar, AlertTriangle, RotateCcw } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useBilling } from './useBilling';
import Billing_Header from './Billing_Header';
import BillingActionBar from './BillingActionBar';
import Billing_GridRow from './Billing_GridRow';
import { useColumnResize, MIN_WIDTHS } from './useColumnResize';

// Resize handle rendered inside each <th>
const ResizeHandle = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="absolute top-0 right-0 h-full w-[5px] cursor-col-resize z-10 flex items-center justify-center group/rh"
    title="Arrastrar para redimensionar"
  >
    <div className="w-[2px] h-4 bg-white/10 group-hover/rh:bg-brand/60 rounded-full transition-colors" />
  </div>
);

// Thin header cell with resize handle — NO minWidth on th, colgroup is the sole width authority
const RH = ({ children, colKey, startResize, className = '' }) => (
  <th
    className={`relative px-1 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none overflow-hidden ${className}`}
  >
    {children}
    <ResizeHandle onMouseDown={(e) => startResize(e, colKey)} />
  </th>
);

export default function Billing({ isSidebarCollapsed }) {
  const billing = useBilling();
  const { widths, startResize, resetWidths } = useColumnResize();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!billing.loadingInvoices && scrollRef.current) {
      // 1. Prioridad: Scroll al fondo si acabamos de crear una fila
      const shouldScroll = sessionStorage.getItem('shouldScrollToBottom');
      if (shouldScroll === 'true') {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            sessionStorage.removeItem('shouldScrollToBottom');
          }
        }, 300); // Pequeño delay para dejar que la tabla renderice
        return;
      }

      // 2. Si no, restaurar posición guardada
      const savedScroll = sessionStorage.getItem('billingScrollPos');
      if (savedScroll) {
        scrollRef.current.scrollTop = Number(savedScroll);
      }
    }
  }, [billing.loadingInvoices, billing.invoices.length]);

  // 🐛 DEBUG: log column widths vs minimums every time widths change
  useEffect(() => {
    const totalPx = Object.values(widths).reduce((a, b) => a + b, 0);
    console.groupCollapsed(`%c[BillingGrid] Column widths — total: ${totalPx}px`, 'color:#60a5fa;font-weight:bold');
    console.table(
      Object.keys(widths).map(key => ({
        columna: key,
        actual: widths[key],
        minimo: MIN_WIDTHS[key],
        ok: widths[key] >= MIN_WIDTHS[key] ? '✅' : `❌ BAJO (${widths[key] - MIN_WIDTHS[key]}px)`,
      }))
    );
    console.groupEnd();
  }, [widths]);

  const {
    invoices, loadingInvoices, staff, activities, categories,
    selectedItemIds, setSelectedItemIds,
    toast, setToast, confirmConfig, setConfirmConfig,
    bulkDate, setBulkDate, bulkInstructor, setBulkInstructor,
    bulkGroupAction, setBulkGroupAction,
    handleToggleSelection, fetchInvoices, searchTerm, setSearchTerm,
    activitySearch, setActivitySearch,
    showOnlyToday, setShowOnlyToday, showOnlyUnpaid, setShowOnlyUnpaid,
    handleDeleteInvoice, handleExtractItem, handleDissolveGroup,
    handleApplyBulkChanges, handleCopyEmails, handleDeleteItems,
  } = billing;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 bg-surface">

      <Billing_Header
        isSidebarCollapsed={isSidebarCollapsed}
        arrivalsDate={billing.arrivalsDate}
        setArrivalsDate={billing.setArrivalsDate}
        changeArrivalsDate={billing.changeArrivalsDate}
        todayArrivals={billing.todayArrivals}
        loadingArrivals={billing.loadingArrivals}
        selectedArrivalIds={billing.selectedArrivalIds}
        setSelectedArrivalIds={billing.setSelectedArrivalIds}
        handleAddArrivalsToTable={billing.handleAddArrivalsToTable}
        activityStats={billing.activityStats}
        bills50000={billing.bills50000} setBills50000={billing.setBills50000}
        bills1000={billing.bills1000} setBills1000={billing.setBills1000}
        bills500={billing.bills500} setBills500={billing.setBills500}
        bills100={billing.bills100} setBills100={billing.setBills100}
        bills50={billing.bills50} setBills50={billing.setBills50}
        bills20={billing.bills20} setBills20={billing.setBills20}
        actualCash={billing.actualCash}
        expectedCash={billing.expectedCash}
        diffCash={billing.diffCash}
        isSavingCash={billing.isSavingCash}
        stats={billing.stats}
        selectedMonth={billing.selectedMonth} setSelectedMonth={billing.setSelectedMonth}
        selectedYear={billing.selectedYear} setSelectedYear={billing.setSelectedYear}
        selectedDay={billing.selectedDay} setSelectedDay={billing.setSelectedDay}
        searchTerm={billing.searchTerm} setSearchTerm={billing.setSearchTerm}
        activitySearch={billing.activitySearch} setActivitySearch={billing.setActivitySearch}
        instructorSearch={billing.instructorSearch} setInstructorSearch={billing.setInstructorSearch}
        paymentMethodSearch={billing.paymentMethodSearch} setPaymentMethodSearch={billing.setPaymentMethodSearch}
        showOnlyCommissionable={billing.showOnlyCommissionable} setShowOnlyCommissionable={billing.setShowOnlyCommissionable}
        showOnlyToday={billing.showOnlyToday} setShowOnlyToday={billing.setShowOnlyToday}
        showOnlyUnpaid={billing.showOnlyUnpaid} setShowOnlyUnpaid={billing.setShowOnlyUnpaid}
        activities={billing.activities}
        categories={billing.categories}
        fetchInvoices={fetchInvoices}
        fetchCatalogs={billing.fetchCatalogs}
        monthlyDbData={billing.monthlyDbData}
        uiConfig={billing.uiConfig}
        setUiConfig={billing.setUiConfig}
        updateUIConfig={billing.updateUIConfig}
      />

      {/* GRID PRINCIPAL - single scroll container: fit-content hugs table, maxWidth 100% constrains when screen narrows */}
      <div className="flex-1 px-5 py-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={(e) => {
            if (!billing.loadingInvoices && billing.invoices.length > 0) {
              sessionStorage.setItem('billingScrollPos', e.target.scrollTop);
            }
          }}
          className="bg-surface border border-surface-edge rounded-lg shadow-2xl custom-scrollbar"
          style={{
            overflow: 'auto',
            width: 'fit-content',
            maxWidth: '100%',
            height: 'calc(100vh - 380px)',
          }}
        >
            {loadingInvoices ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                <Search className="w-8 h-8 opacity-20" /><p>No hay facturas para este periodo</p>
              </div>
            ) : (
              <table
                className="table-fixed border-separate border-spacing-0 [&_td]:min-w-0 [&_td]:overflow-visible [&_th]:min-w-0 [&_th]:overflow-visible"
                style={{
                  width: Object.values(widths).reduce((a, b) => a + b, 0),
                  minWidth: Object.values(MIN_WIDTHS).reduce((a, b) => a + b, 0)
                }}
              >
                {/* colgroup: source of truth for column widths with table-fixed */}
                <colgroup>
                  <col style={{ width: widths.checkbox }} />
                  <col style={{ width: widths.plus }} />
                  <col style={{ width: widths.fecha }} />
                  <col style={{ width: widths.nombre }} />
                  <col style={{ width: widths.apellidos }} />
                  <col style={{ width: widths.email }} />
                  <col style={{ width: widths.actividad }} />
                  <col style={{ width: widths.precio }} />
                  <col style={{ width: widths.qty }} />
                  <col style={{ width: widths.total }} />
                  <col style={{ width: widths.estado }} />
                  <col style={{ width: widths.medio }} />
                  <col style={{ width: widths.instr }} />
                  <col style={{ width: widths.bizum }} />
                  <col style={{ width: widths.com }} />
                  <col style={{ width: widths.notas }} />
                  <col style={{ width: widths.actions }} />
                </colgroup>

                <thead className="sticky top-0 z-30 bg-slate-900 shadow-sm">
                  <tr className="border-b border-white/5">
                    {/* Checkbox - no resize */}
                    <th className="px-1 py-2 text-left relative overflow-hidden" style={{ width: widths.checkbox }}>
                      <input type="checkbox" className="rounded bg-slate-800 border-slate-700" />
                      <ResizeHandle onMouseDown={(e) => startResize(e, 'checkbox')} />
                    </th>
                    {/* + */}
                    <th className="px-1 py-2 relative overflow-hidden" style={{ width: widths.plus }}>
                      <ResizeHandle onMouseDown={(e) => startResize(e, 'plus')} />
                    </th>
                    <RH colKey="fecha" startResize={startResize} className="text-left">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> FECHA</div>
                    </RH>
                    <RH colKey="nombre" startResize={startResize} className="text-left">NOMBRE</RH>
                    <RH colKey="apellidos" startResize={startResize} className="text-left">APELLIDOS</RH>
                    <RH colKey="email" startResize={startResize} className="text-left">EMAIL</RH>
                    <RH colKey="actividad" startResize={startResize} className="text-left">ACTIVIDAD</RH>
                    <RH colKey="precio" startResize={startResize} className="text-right">PRECIO</RH>
                    <RH colKey="qty" startResize={startResize} className="text-center">Q.</RH>
                    <RH colKey="total" startResize={startResize} className="text-right">TOTAL</RH>
                    <RH colKey="estado" startResize={startResize} className="text-center">ESTADO</RH>
                    <RH colKey="medio" startResize={startResize} className="text-left">MEDIO</RH>
                    <RH colKey="instr" startResize={startResize} className="text-left">INSTR.</RH>
                    <RH colKey="bizum" startResize={startResize} className="text-center">BIZUM</RH>
                    <RH colKey="com" startResize={startResize} className="text-center">COM.</RH>
                    <RH colKey="notas" startResize={startResize} className="text-left">NOTAS</RH>
                    {/* Actions - resize on LEFT edge + reset button */}
                    <th className="px-1 py-2 text-center relative overflow-hidden" style={{ width: widths.actions }}>
                      {/* Left-side handle since this is the last column */}
                      <div
                        onMouseDown={(e) => startResize(e, 'actions')}
                        className="absolute top-0 left-0 h-full w-[5px] cursor-col-resize z-10 flex items-center justify-center group/rh"
                        title="Arrastrar para redimensionar"
                      >
                        <div className="w-[2px] h-4 bg-white/10 group-hover/rh:bg-brand/60 rounded-full transition-colors" />
                      </div>
                      <button
                        onClick={resetWidths}
                        title="Restablecer anchos de columna"
                        className="p-1 hover:bg-white/10 text-gray-600 hover:text-gray-300 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {billing.displayedInvoices.map((inv, index) => (
                    <Billing_GridRow
                      key={inv.id}
                      invoice={inv}
                      staff={staff}
                      activities={activities}
                      categories={categories}
                      selectedItemIds={selectedItemIds}
                      selectedMonth={billing.selectedMonth}
                      selectedYear={billing.selectedYear}
                      setToast={setToast}
                      onSelectItem={(itemId) => {
                        setSelectedItemIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(itemId)) newSet.delete(itemId);
                          else newSet.add(itemId);
                          return newSet;
                        });
                      }}
                      onToggleGroup={(event) => handleToggleSelection(inv, index, event.shiftKey)}
                      onSelectItems={(ids, selected) => {
                        setSelectedItemIds(prev => {
                          const newSet = new Set(prev);
                          ids.forEach(id => {
                            if (selected) newSet.add(id);
                            else newSet.delete(id);
                          });
                          return newSet;
                        });
                      }}
                      onUpdate={() => fetchInvoices(false)}
                      onDeleteInvoice={handleDeleteInvoice}
                      onExtractItem={handleExtractItem}
                      handleDissolveGroup={handleDissolveGroup}
                      setConfirmConfig={billing.setConfirmConfig}
                      uiConfig={billing.uiConfig}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>



        {/* TOAST */}
        {toast && (
          <div className="fixed bottom-6 right-8 z-[150] animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm">
                {typeof toast === 'object' ? toast.message : toast}
              </span>
              <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/10 rounded-lg p-1 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* CONFIRM MODAL */}
        {confirmConfig.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} />
            <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${confirmConfig.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{confirmConfig.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed">{confirmConfig.message}</p>
              </div>
              <div className="flex gap-3 p-6 bg-white/5 border-t border-white/5">
                <button onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                <button onClick={confirmConfig.onConfirm} className={`flex-1 px-6 py-3 font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${confirmConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BillingActionBar
        selectedItemIds={selectedItemIds}
        setSelectedItemIds={setSelectedItemIds}
        selectedMonth={billing.selectedMonth}
        selectedYear={billing.selectedYear}
        setToast={setToast}
        bulkGroupAction={bulkGroupAction}
        setBulkGroupAction={setBulkGroupAction}
        bulkDate={bulkDate}
        setBulkDate={setBulkDate}
        bulkInstructor={bulkInstructor}
        setBulkInstructor={setBulkInstructor}
        staff={staff}
        loadingInvoices={loadingInvoices}
        handleApplyBulkChanges={handleApplyBulkChanges}
        handleCopyEmails={handleCopyEmails}
        handleDeleteItems={handleDeleteItems}
      />
    </div>
  );
}
