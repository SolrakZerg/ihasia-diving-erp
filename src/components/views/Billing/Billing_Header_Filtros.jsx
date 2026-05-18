import { useRef, useMemo } from 'react';
import { Search, BookOpen, Users, CreditCard, Coins, Calendar, X as CloseIcon } from 'lucide-react';

export default function Billing_Header_Filtros({
  searchTerm,              setSearchTerm,
  activitySearch,          setActivitySearch,
  instructorSearch,        setInstructorSearch,
  paymentMethodSearch,     setPaymentMethodSearch,
  showOnlyCommissionable,  setShowOnlyCommissionable,
  showOnlyUnpaid,          setShowOnlyUnpaid,
  selectedDay,             setSelectedDay,
  selectedMonth,           setSelectedMonth,
  selectedYear,            setSelectedYear,
}) {
  const dayInputRef = useRef(null);

  // Computar rango mínimo y máximo del mes actual para el input date
  const minDate = useMemo(() => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${month}-01`;
  }, [selectedMonth, selectedYear]);

  const maxDate = useMemo(() => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return `${selectedYear}-${month}-${lastDay}`;
  }, [selectedMonth, selectedYear]);

  // Formato para el value del input date oculto (si hay día seleccionado)
  const dateValue = useMemo(() => {
    if (!selectedDay) return '';
    const m = String(selectedMonth + 1).padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${selectedYear}-${m}-${d}`;
  }, [selectedDay, selectedMonth, selectedYear]);

  return (
    <div className="flex-none w-[300px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
      {/* Cabecera */}
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-brand text-xs font-bold">
          <Search className="w-3.5 h-3.5" /> Filtros
        </span>
        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Búsqueda</span>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col p-2 gap-2 bg-surface-soft/30">

        {/* Buscador de clientes */}
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="NOMBRE O APELLIDO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-surface-edge rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-text-muted outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors p-1">
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Buscador de actividades */}
        <div className="relative group w-full">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="ACTIVIDAD (EJ. OPEN...)"
            value={activitySearch}
            onChange={(e) => setActivitySearch(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-surface-edge rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-text-muted outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
          />
          {activitySearch && (
            <button onClick={() => setActivitySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors p-1">
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Buscador de instructor */}
        <div className="relative group w-full">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="INSTRUCTOR..."
            value={instructorSearch}
            onChange={(e) => setInstructorSearch(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-surface-edge rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-text-muted outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/5 transition-all shadow-inner tracking-widest uppercase"
          />
        </div>

        {/* Cuadrícula de Filtros 2x2 Simétrica y Premium */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-surface-edge/20">
          {/* Fila 1 - Columna 1: Método de pago */}
          <div className="relative h-8 w-full group">
            {/* Presentador visual perfectamente centrado e idéntico a los otros botones */}
            <div
              className={`absolute inset-0 flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black border shadow-sm transition-all uppercase tracking-tighter pointer-events-none ${
                paymentMethodSearch
                  ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                  : 'bg-surface border-surface-edge text-gray-400 group-hover:text-white'
              }`}
            >
              <CreditCard className={`w-3 h-3 ${paymentMethodSearch ? 'text-amber-400' : 'text-text-muted'}`} />
              <span>{paymentMethodSearch || 'PAGO (TODO)'}</span>
            </div>

            {/* Selector nativo transparente que captura los clics */}
            <select
              value={paymentMethodSearch}
              onChange={(e) => setPaymentMethodSearch(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[9px]"
            >
              <option value="" className="bg-slate-900 text-gray-400">PAGO (TODO)</option>
              <option value="WISE BT" className="bg-slate-900 text-white">WISE BT</option>
              <option value="WISE CR" className="bg-slate-900 text-white">WISE CR</option>
              <option value="EUR BT"  className="bg-slate-900 text-white">EUR BT</option>
              <option value="EUR CR"  className="bg-slate-900 text-white">EUR CR</option>
              <option value="BIZUM"   className="bg-slate-900 text-white">BIZUM</option>
            </select>
          </div>

          {/* Fila 1 - Columna 2: Comisionable */}
          <button
            onClick={() => setShowOnlyCommissionable(!showOnlyCommissionable)}
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 whitespace-nowrap uppercase tracking-tighter ${
              showOnlyCommissionable
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
            }`}
          >
            <Coins className={`w-3 h-3 ${showOnlyCommissionable ? 'text-amber-400' : ''}`} />
            {showOnlyCommissionable ? 'COMISIONABLE' : 'TODOS'}
          </button>

          {/* Fila 2 - Columna 1: Selector de día (datepicker nativo) */}
          <div className="relative h-8 w-full group">
            <button
              onClick={() => dayInputRef.current?.showPicker()}
              className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 w-full uppercase tracking-tighter ${
                selectedDay
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                  : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedDay ? `DÍA: ${selectedDay}` : 'FILTRAR DÍA'}</span>
            </button>

            <input
              ref={dayInputRef}
              type="date"
              value={dateValue}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedDay(null);
                } else {
                  const parts = val.split('-');
                  setSelectedDay(Number(parts[2]));
                }
              }}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
            />

            {selectedDay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDay(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white transition-colors p-1 z-10"
                title="Limpiar filtro de día"
              >
                <CloseIcon className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Fila 2 - Columna 2: Pendientes */}
          <button
            onClick={() => setShowOnlyUnpaid(!showOnlyUnpaid)}
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 whitespace-nowrap uppercase tracking-tighter ${
              showOnlyUnpaid
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
            }`}
          >
            <Search className={`w-3 h-3 ${showOnlyUnpaid ? 'text-amber-500' : ''}`} />
            {showOnlyUnpaid ? 'PENDIENTES' : 'TODOS'}
          </button>
        </div>

      </div>
    </div>
  );
}
