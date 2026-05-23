import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Palette, Settings, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';

import Billing_Header_Llegadas      from './Billing_Header_Llegadas';
import Billing_Header_Actividades   from './Billing_Header_Actividades';
import Billing_Header_Caja          from './Billing_Header_Caja';
import Billing_Header_Finanzas      from './Billing_Header_Finanzas';
import Billing_Header_Filtros       from './Billing_Header_Filtros';
import Billing_Header_ConfigModal   from './Billing_Header_ConfigModal';
import Billing_ThemeSettings              from './Billing_ThemeSettings';
import MonthYearSelector            from '../../common/MonthYearSelector';

export default function Billing_Header({
  // Llegadas
  arrivalsDate, setArrivalsDate, changeArrivalsDate,
  todayArrivals, loadingArrivals,
  selectedArrivalIds, setSelectedArrivalIds, handleAddArrivalsToTable,

  // Actividades
  activityStats, activities,

  // Caja
  bills50000, setBills50000,
  bills1000,  setBills1000,
  bills500,   setBills500,
  bills100,   setBills100,
  bills50,    setBills50,
  bills20,    setBills20,
  actualCash, expectedCash, diffCash, isSavingCash,

  // Finanzas
  stats,

  // Filtros
  searchTerm,             setSearchTerm,
  activitySearch,         setActivitySearch,
  instructorSearch,       setInstructorSearch,
  paymentMethodSearch,    setPaymentMethodSearch,
  showOnlyCommissionable, setShowOnlyCommissionable,
  showOnlyUnpaid,         setShowOnlyUnpaid,

  // Selector de mes / año / día
  selectedMonth, setSelectedMonth,
  selectedYear,  setSelectedYear,
  selectedDay,   setSelectedDay,
  fetchInvoices,

  // Config modal
  categories,
  fetchCatalogs,
  monthlyDbData,

  // Tema
  uiConfig, setUiConfig, updateUIConfig,

  // Zoom de tabla (solo móvil)
  tableZoom, handleZoomIn, handleZoomOut,

  // Layout
  isSidebarCollapsed,
}) {
  const { pushAction } = useUndo();

  // Estado local: solo afecta a los modales de configuración
  const [showConfig, setShowConfig]               = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded]   = useState(false);

  // Handler: crear nueva fila en blanco
  const handleAddRow = async () => {
    try {
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert({ status: 'Open' })
        .select()
        .single();

      if (invErr) {
        console.error('[Billing_Header] Error creating invoice:', invErr);
        alert('Error al crear factura: ' + invErr.message);
        return;
      }

      const { data: itemData, error: itemErr } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id:     inv.id,
          quantity:       null,
          unit_price_thb: 0,
          total_thb:      0,
          status:         'Pending',
          date:           null,
        })
        .select()
        .single();

      if (itemErr) {
        console.error('[Billing_Header] Error creating item:', itemErr);
        alert('Error al crear registro: ' + itemErr.message);
        return;
      }

      const actionDesc = {
        undo: `Nueva factura en blanco eliminada`,
        redo: `Nueva factura en blanco restaurada`
      };

      pushAction({
        view: 'billing',
        description: actionDesc,
        undo: async () => {
          const { error: delErr } = await supabase.from('invoices').delete().eq('id', inv.id);
          if (delErr) throw delErr;
        },
        redo: async () => {
          const cleanInv = { ...inv };
          const { error: insInvErr } = await supabase.from('invoices').insert(cleanInv);
          if (insInvErr) throw insInvErr;

          const cleanItem = { ...itemData };
          const { error: insItemErr } = await supabase.from('invoice_items').insert(cleanItem);
          if (insItemErr) throw insItemErr;
        }
      });

      sessionStorage.setItem('shouldScrollToBottom', 'true');
      fetchInvoices(false);
    } catch (err) {
      console.error('[Billing_Header] Unexpected error:', err);
    }
  };

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <>
      {/* ── BARRA DE WIDGETS ── */}
      <div className={`billing-header-container md:sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-edge shadow-xl relative transition-all duration-300 ${isHeaderExpanded ? 'header-expanded' : 'header-collapsed'}`}>
        <div className="header-full-content custom-scrollbar py-1.5 px-4 flex flex-row flex-nowrap gap-4 items-stretch h-auto overflow-x-auto overflow-y-hidden">

        <Billing_Header_Llegadas
          arrivalsDate={arrivalsDate}
          setArrivalsDate={setArrivalsDate}
          changeArrivalsDate={changeArrivalsDate}
          todayArrivals={todayArrivals}
          loadingArrivals={loadingArrivals}
          selectedArrivalIds={selectedArrivalIds}
          setSelectedArrivalIds={setSelectedArrivalIds}
          handleAddArrivalsToTable={handleAddArrivalsToTable}
        />

        <Billing_Header_Actividades
          activities={activities}
          activityStats={activityStats}
          monthlyDbData={monthlyDbData}
        />

        <Billing_Header_Caja
          bills50000={bills50000} setBills50000={setBills50000}
          bills1000={bills1000}   setBills1000={setBills1000}
          bills500={bills500}     setBills500={setBills500}
          bills100={bills100}     setBills100={setBills100}
          bills50={bills50}       setBills50={setBills50}
          bills20={bills20}       setBills20={setBills20}
          actualCash={actualCash}
          expectedCash={expectedCash}
          diffCash={diffCash}
          isSavingCash={isSavingCash}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        <Billing_Header_Finanzas stats={stats} />

        <Billing_Header_Filtros
          searchTerm={searchTerm}                       setSearchTerm={setSearchTerm}
          activitySearch={activitySearch}               setActivitySearch={setActivitySearch}
          instructorSearch={instructorSearch}           setInstructorSearch={setInstructorSearch}
          paymentMethodSearch={paymentMethodSearch}     setPaymentMethodSearch={setPaymentMethodSearch}
          showOnlyCommissionable={showOnlyCommissionable} setShowOnlyCommissionable={setShowOnlyCommissionable}
          showOnlyUnpaid={showOnlyUnpaid}               setShowOnlyUnpaid={setShowOnlyUnpaid}
          selectedDay={selectedDay}                     setSelectedDay={setSelectedDay}
          selectedMonth={selectedMonth}                 setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}                   setSelectedYear={setSelectedYear}
        />

        {/* ── SELECTOR MES / AÑO (esquina superior derecha) ── */}
        <div className="flex flex-col justify-start pt-1.5 items-center md:items-end md:ml-auto pr-2 shrink-0 h-full">
          <MonthYearSelector
            month={selectedMonth}
            setMonth={setSelectedMonth}
            year={selectedYear}
            setYear={setSelectedYear}
            shortNames={true}
            className="h-11"
          />
        </div>
        </div>{/* end header-full-content */}

        {/* ── RESUMEN COMPACTO (solo visible en landscape colapsado) ── */}
        <div className="header-summary-content hidden items-center justify-center gap-4 px-4 py-2">
          <div className="text-xs font-black text-brand uppercase tracking-wider">
            {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][selectedMonth - 1]}/{selectedYear}
          </div>
          {stats && (
            <span className="text-[10px] px-2 py-0.5 bg-brand/10 border border-brand/20 text-brand font-bold rounded-lg shrink-0">
              {stats.totalInvoices || 0} reg. · {(stats.totalThb || 0).toLocaleString('es-ES')} ฿
            </span>
          )}
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand hover:bg-brand-light text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3 h-3" /> Fila
          </button>

          {/* Zoom controls — solo móvil (ocultos en md+) */}
          <div className="lg:hidden flex items-center gap-1 border-l border-slate-600/30 pl-3">
            <button
              onClick={handleZoomOut}
              disabled={tableZoom <= 0.7}
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            {tableZoom < 1.0 && (
              <span className="text-[9px] font-black text-slate-400 w-6 text-center tabular-nums">
                {Math.round(tableZoom * 100)}%
              </span>
            )}
            <button
              onClick={handleZoomIn}
              disabled={tableZoom >= 1.0}
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── BOTÓN TOGGLE CHEVRON (solo visible en landscape) ── */}
        <button
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          className={`header-toggle-btn hidden absolute right-4 w-8 h-8 rounded-xl bg-surface-edge hover:bg-brand text-gray-300 hover:text-white items-center justify-center transition-all z-[60] ${isHeaderExpanded ? 'bottom-2 top-auto translate-y-0' : 'top-1/2 -translate-y-1/2'}`}
          aria-label={isHeaderExpanded ? 'Colapsar cabecera' : 'Expandir cabecera'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHeaderExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ── BOTÓN FLOTANTE: AÑADIR FILA (abajo izquierda) ── */}
      <div className={`billing-add-row-btn fixed bottom-6 transition-all duration-300 z-[100] hidden md:block ${isSidebarCollapsed ? 'left-[calc(5rem+1.5rem)]' : 'left-[calc(16rem+1.5rem)]'}`}>
        <button
          onClick={handleAddRow}
          className="group flex items-center gap-2 px-5 bg-brand hover:bg-brand-light text-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-brand/40 transition-all active:scale-95 border border-white/10 h-11 uppercase"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[11px] font-black tracking-widest">Añadir Fila</span>
        </button>
      </div>

      {/* ── BOTÓN FLOTANTE MÓVIL: AÑADIR FILA (abajo derecha, solo +) ── */}
      <div className="billing-mobile-add-row-btn fixed bottom-6 right-6 z-[100]">
        <button
          onClick={handleAddRow}
          className="flex items-center justify-center w-12 h-12 bg-brand hover:bg-brand-light text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-brand/40 transition-all active:scale-95 border border-white/10"
          aria-label="Añadir Fila"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ── BOTONES FLOTANTES: CONFIGURACIÓN (abajo derecha) — solo PC ── */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-[100] items-center gap-3 billing-config-btns">
        <button
          onClick={() => setShowThemeSettings(true)}
          className="flex items-center justify-center w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl text-gray-400 hover:text-brand hover:border-brand/50 transition-all shadow-2xl group"
          title="Personalizar Colores del ERP"
        >
          <Palette className="w-6 h-6 text-brand group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center justify-center w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl text-gray-400 hover:text-amber-500 hover:border-amber-500/50 transition-all shadow-2xl group"
          title="Configurar Columnas de Actividades"
        >
          <Settings className="w-6 h-6 text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      {/* ── MODAL: CONFIGURAR ACTIVIDADES ── */}
      {showConfig && (
        <Billing_Header_ConfigModal
          onClose={() => setShowConfig(false)}
          categories={categories}
          activities={activities}
          supabase={supabase}
          fetchCatalogs={fetchCatalogs}
          fetchInvoices={fetchInvoices}
        />
      )}

      {/* ── MODAL: TEMAS ── */}
      {showThemeSettings && (
        <Billing_ThemeSettings 
          onClose={() => setShowThemeSettings(false)} 
          uiConfig={uiConfig}
          setUiConfig={setUiConfig}
          updateUIConfig={updateUIConfig}
        />
      )}
    </>
  );
}
