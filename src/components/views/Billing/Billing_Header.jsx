import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Palette, Settings } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useUndo } from '../../../context/UndoContext';

import Billing_Header_Llegadas      from './Billing_Header_Llegadas';
import Billing_Header_Actividades   from './Billing_Header_Actividades';
import Billing_Header_Caja          from './Billing_Header_Caja';
import Billing_Header_Finanzas      from './Billing_Header_Finanzas';
import Billing_Header_Filtros       from './Billing_Header_Filtros';
import Billing_Header_ConfigModal   from './Billing_Header_ConfigModal';
import Billing_ThemeSettings              from './Billing_ThemeSettings';

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

  // Layout
  isSidebarCollapsed,
}) {
  const { pushAction } = useUndo();

  // Estado local: solo afecta a los modales de configuración
  const [showConfig, setShowConfig]               = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);

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

  return (
    <>
      {/* ── BARRA DE WIDGETS ── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-edge py-1.5 px-4 shadow-xl flex gap-4 items-stretch h-[290px] overflow-x-auto custom-scrollbar">

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
        <div className="flex flex-col justify-start pt-1.5 items-end ml-auto pr-2 shrink-0 h-full">
          <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner h-11">


            {/* Mes anterior */}
            <button
              onClick={() => {
                let nm = selectedMonth - 1, ny = selectedYear;
                if (nm < 0) { nm = 11; ny--; }
                setSelectedMonth(nm);
                setSelectedYear(ny);
                fetchInvoices(false, null, showOnlyUnpaid, nm, ny, selectedDay);
              }}
              className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Selectores de mes y año */}
            <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSelectedMonth(v);
                  fetchInvoices(false, null, showOnlyUnpaid, v, selectedYear, selectedDay);
                }}
                className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
              >
                {['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].map((m, i) => (
                  <option key={i} value={i} className="bg-slate-900 text-white">{m}</option>
                ))}
              </select>
              <div className="w-px h-4 bg-surface-edge/30 mx-1" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSelectedYear(v);
                  fetchInvoices(false, null, showOnlyUnpaid, selectedMonth, v, selectedDay);
                }}
                className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                ))}
              </select>
            </div>

            {/* Mes siguiente */}
            <button
              onClick={() => {
                let nm = selectedMonth + 1, ny = selectedYear;
                if (nm > 11) { nm = 0; ny++; }
                setSelectedMonth(nm);
                setSelectedYear(ny);
                fetchInvoices(false, null, showOnlyUnpaid, nm, ny, selectedDay);
              }}
              className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTÓN FLOTANTE: AÑADIR FILA (abajo izquierda) ── */}
      <div className={`fixed bottom-6 transition-all duration-300 z-[100] ${isSidebarCollapsed ? 'left-[calc(5rem+1.5rem)]' : 'left-[calc(16rem+1.5rem)]'}`}>
        <button
          onClick={handleAddRow}
          className="group flex items-center gap-2 px-5 bg-brand hover:bg-brand-light text-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-brand/40 transition-all active:scale-95 border border-white/10 h-11 uppercase"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[11px] font-black tracking-widest">Añadir Fila</span>
        </button>
      </div>

      {/* ── BOTONES FLOTANTES: CONFIGURACIÓN (abajo derecha) ── */}
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3">
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
