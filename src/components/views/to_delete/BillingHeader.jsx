import { useRef, useState } from 'react';
import { Users, ChevronLeft, ChevronRight, Target, Calculator, CheckCircle2, Loader2, Calendar, Search, Plus, Briefcase, Settings, Palette, X as CloseIcon, BookOpen, CreditCard, Zap, DollarSign, Coins } from 'lucide-react';
import ThemeSettings from './ThemeSettings';

const StatItem = ({ label, value, color = "text-white", noBorder = false, first = false }) => (
  <div className={`flex items-center justify-between gap-0.5 ${first ? 'pb-0.5 pt-0' : 'py-0.5'} w-full ${noBorder ? '' : 'border-b border-white/[0.04]'}`}>
    <span className={`text-[10px] font-bold tracking-tighter truncate ${value === 0 ? 'text-gray-400/60' : 'text-gray-300'}`}>{label}</span>
    <span className={`text-[12px] font-black tabular-nums transition-colors ${value === 0 ? 'text-gray-500' : color}`}>{value}</span>
  </div>
);

export default function BillingHeader({
  // Arrivals
  arrivalsDate, setArrivalsDate, changeArrivalsDate, todayArrivals, loadingArrivals,
  selectedArrivalIds, setSelectedArrivalIds, handleAddArrivalsToTable,
  // Activity Stats
  activityStats, activities,
  // Cash
  bills50000, setBills50000, bills1000, setBills1000, bills500, setBills500,
  bills100, setBills100, bills50, setBills50, bills20, setBills20,
  actualCash, expectedCash, diffCash, isSavingCash,
  // Finance
  stats,
  // Month/Year/Day
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, selectedDay, setSelectedDay,
  // Filters
  searchTerm, setSearchTerm,
  activitySearch, setActivitySearch,
  instructorSearch, setInstructorSearch,
  paymentMethodSearch, setPaymentMethodSearch,
  showOnlyCommissionable, setShowOnlyCommissionable,
  showOnlyToday, setShowOnlyToday, showOnlyUnpaid, setShowOnlyUnpaid,
  fetchInvoices,
  isSidebarCollapsed,
  // Add row
  fetchCatalogs,
  monthlyDbData,
  categories = [],
  supabase,
  uiConfig,
  setUiConfig,
  updateUIConfig
}) {
  const dateInputRef = useRef(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [catFilter, setCatFilter] = useState(['Course', 'Fun Dive', 'Pro']);

  return (
    <>
    <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-edge py-1.5 px-4 shadow-xl flex gap-4 items-stretch h-[290px] overflow-x-auto custom-scrollbar">

      {/* Widget 1: LLEGADAS */}
      <div className="flex-none w-full max-w-[380px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold whitespace-nowrap"><Users className="w-3.5 h-3.5" /> Llegadas</span>
          <div className="flex-none ml-auto flex items-center bg-surface-soft/50 rounded-2xl border border-surface-edge/30 overflow-hidden h-[21px] p-0.5">
            <button 
              onClick={(e) => { e.stopPropagation(); changeArrivalsDate(-1); }} 
              className="p-1 hover:bg-surface-edge/30 rounded-lg text-gray-400 hover:text-white transition-all border-r border-surface-edge/20"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            
            <div className="relative cursor-pointer group/date flex items-center justify-center px-3 h-full hover:bg-brand/5" onClick={() => dateInputRef.current?.showPicker()}>
              <input ref={dateInputRef} type="date" value={arrivalsDate} onChange={(e) => setArrivalsDate(e.target.value)} className="absolute w-0 h-0 opacity-0 border-0 p-0 m-0 pointer-events-none" style={{ visibility: 'hidden' }} />
              <span className="text-[10px] text-brand font-black whitespace-nowrap uppercase">
                {new Date(arrivalsDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); changeArrivalsDate(1); }} 
              className="p-1 hover:bg-surface-edge/30 rounded-lg text-gray-400 hover:text-white transition-all border-l border-surface-edge/20"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {loadingArrivals ? (
            <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div>
          ) : todayArrivals.length === 0 ? (
            <div className="text-sm text-center text-gray-400 py-2">No hay llegadas programadas.</div>
          ) : (
            <table className="w-full text-sm leading-tight text-left">
              <tbody>
                {todayArrivals.map((c, i) => (
                  <tr key={c.id} className="hover:bg-surface rounded group transition-colors cursor-pointer" onClick={() => { const s = new Set(selectedArrivalIds); if (s.has(c.id)) s.delete(c.id); else s.add(c.id); setSelectedArrivalIds(s); }}>
                    <td className="py-0.5 px-1.5 w-6 text-center text-gray-500 text-[10px] font-mono">{i + 1}</td>
                    <td className="py-0.5 px-1.5 w-6 text-center"><input type="checkbox" checked={selectedArrivalIds.has(c.id)} readOnly className="w-3.5 h-3.5 rounded text-brand bg-surface border-surface-edge cursor-pointer pointer-events-none" /></td>
                    <td className="py-0.5 px-1.5 text-white font-medium truncate max-w-[180px]">{c.first_name} {c.last_name}</td>
                    <td className="py-0.5 px-1.5 text-brand text-[10px] truncate max-w-[110px] font-bold opacity-80 pl-2">{c.booked_activity || 'Genérico'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-1 px-1.5 border-t border-surface-edge bg-surface/50 mt-auto">
          <button onClick={handleAddArrivalsToTable} disabled={selectedArrivalIds.size === 0} className="w-full py-0.5 bg-brand/10 text-brand hover:bg-brand hover:text-white disabled:opacity-50 border border-brand/30 rounded text-[13px] font-semibold transition-colors shadow-sm">
            AÑADIR A LA MESA {selectedArrivalIds.size > 0 && `(${selectedArrivalIds.size})`}
          </button>
        </div>
      </div>

      {/* Widget 2: ACTIVIDADES */}
      <div className="flex-none w-[250px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-2xl overflow-hidden shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-brand text-xs font-bold"><Target className="w-3.5 h-3.5" /> Actividades</span>
        </div>

        <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 p-1.5 overflow-y-auto">
          {/* COLUMNA 1: CURSOS */}
          <div className="pr-2 flex flex-col justify-between">
            <div className="flex flex-col gap-0">
              {(activities || [])
                .filter(a => a.widget_column === 1 && (activityStats[a.acronym] > 0))
                .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
                .map((act, idx, arr) => (
                  <StatItem 
                    key={act.id} 
                    label={act.acronym || act.name} 
                    value={activityStats[act.acronym] || 0} 
                    first={idx === 0} 
                    noBorder={idx === arr.length - 1} 
                  />
                ))}
            </div>
            <div className="mt-1 pt-1 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black text-brand uppercase">CURSOS</span>
              <span className="text-xs font-black text-white">
                {monthlyDbData?.total_courses || 0}
              </span>
            </div>
          </div>

          {/* COLUMNA 2: TANQUES */}
          <div className="px-2 flex flex-col justify-between">
            <div className="flex flex-col gap-0">
              {(activities || [])
                .filter(a => a.widget_column === 2 && (activityStats[a.acronym] > 0))
                .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
                .map((act, idx, arr) => (
                  <StatItem 
                    key={act.id} 
                    label={act.acronym || act.name} 
                    value={activityStats[act.acronym] || 0} 
                    first={idx === 0} 
                    noBorder={idx === arr.length - 1} 
                  />
                ))}
            </div>
            <div className="mt-1 pt-1 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black text-brand uppercase">TANKS</span>
              <span className="text-xs font-black text-white">
                {monthlyDbData?.total_tanks || 0}
              </span>
            </div>
          </div>

          {/* COLUMNA 3: ESPECIALIDADES */}
          <div className="pl-2 flex flex-col justify-between">
            <div className="flex flex-col gap-0">
              {(activities || [])
                .filter(a => a.widget_column === 3 && ((activityStats[a.acronym] > 0) || (a.acronym === 'CAN' && (Number(activityStats.CAN || 0) + Number(activityStats.CAN2 || 0)) > 0)))
                .sort((a, b) => (a.widget_order || 0) - (b.widget_order || 0))
                .map((act, idx, arr) => {
                  const isCancel = (act.acronym || '').toLowerCase().startsWith('can');
                  const val = isCancel 
                    ? (Number(activityStats.CAN || 0) + Number(activityStats.CAN2 || 0)) 
                    : (activityStats[act.acronym] || 0);
                  
                  return (
                    <StatItem 
                      key={act.id} 
                      label={isCancel ? 'CANCEL' : (act.acronym || act.name)} 
                      value={val} 
                      first={idx === 0} 
                      color={isCancel ? "text-red-400" : undefined} 
                      noBorder={idx === arr.length - 1} 
                    />
                  );
                })}
            </div>
            <div className="mt-1 pt-1 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black text-brand uppercase">ESPEC</span>
              <span className="text-xs font-black text-white">
                {monthlyDbData?.total_spec || 0}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Widget 3: CAJA */}
      <div className="flex-none w-fit flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden min-w-[180px] shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold"><Calculator className="w-3.5 h-3.5" /> Caja</span>
          {isSavingCash ? <Loader2 className="w-3 h-3 animate-spin text-emerald-500/50" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500/30" />}
        </div>
        <div className="flex-1 flex flex-col p-2 px-2.5">
          <div className="space-y-[3px]">
            {[
              { label: '50.000', value: 50000, state: bills50000, setState: setBills50000 },
              { label: '1.000', value: 1000, state: bills1000, setState: setBills1000 },
              { label: '500', value: 500, state: bills500, setState: setBills500 },
              { label: '100', value: 100, state: bills100, setState: setBills100 },
              { label: '50', value: 50, state: bills50, setState: setBills50 },
              { label: '20', value: 20, state: bills20, setState: setBills20 },
            ].map((b, index) => (
              <div key={b.label} className="flex items-center justify-between gap-2 group">
                <div className="w-10 text-emerald-400/90 font-mono text-[12px] group-hover:text-emerald-400 transition-colors">{b.label}</div>
                <input 
                  id={`bill-input-${index}`}
                  type="number" 
                  min="0" 
                  max="999" 
                  value={b.state} 
                  onChange={e => b.setState(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = document.getElementById(`bill-input-${index + 1}`);
                      if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                      } else {
                        e.target.blur();
                      }
                    }
                  }}
                  className="w-10 h-[20px] bg-surface text-white border border-surface-edge hover:border-emerald-500/50 rounded text-center outline-none focus:border-emerald-500 py-0 text-xs font-bold transition-all shadow-inner" 
                />
                <div className="w-16 text-right text-white/50 font-mono text-[12px]">
                  {(Number(b.state || 0) * b.value).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-surface-edge/50 space-y-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center"><span className="text-gray-400 text-[12px] uppercase font-black">Hay:</span><span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">{actualCash.toLocaleString()} ฿</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-400 text-[12px] uppercase font-black tracking-tighter">Debería:</span><span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">{expectedCash.toLocaleString()} ฿</span></div>
              <div className="flex flex-col items-center pt-2 mt-1 border-t border-surface-edge/30">
                <span className={`text-[20px] font-black leading-none drop-shadow-sm ${diffCash === 0 ? 'text-blue-400' : diffCash > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{diffCash > 0 ? '+' : ''}{diffCash.toLocaleString()} ฿</span>
                <span className="text-[9px] uppercase text-gray-400 font-black mt-0.5">{diffCash === 0 ? 'DIFERENCIA OK' : diffCash > 0 ? 'SOBRA DINERO' : 'FALTA DINERO'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget 4: FINANZAS */}
      <div className="flex-none w-[200px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold"><Target className="w-3.5 h-3.5" /> Finanzas</span>
          <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Global</span>
        </div>
        <div className="flex-1 flex flex-col p-3 px-4 justify-between bg-surface-soft/30 gap-1.5">
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-amber-500 text-[12px] uppercase font-black tracking-tight">Facturado:</span>
              <span className="text-amber-500 font-black text-[16px]">{stats.facturado.toLocaleString()} <span className="text-[12px] opacity-40">฿</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-500 text-[12px] uppercase font-black tracking-tight">Cobrado:</span>
              <span className="text-emerald-500 font-black text-[16px]">{stats.cobrado.toLocaleString()} <span className="text-[12px] opacity-40">฿</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rose-400 text-[12px] uppercase font-black tracking-tight">Pendiente:</span>
              <span className="text-rose-400 font-black text-[16px]">{stats.pendiente.toLocaleString()} <span className="text-[12px] opacity-40">฿</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 py-1.5 border-y border-surface-edge/20">
            <div>
              <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">Wise BT</span>
              <span className="text-pink-400 font-black text-[16px]">{stats.wiseBT.toLocaleString()} <span className="text-[10px] opacity-50">฿</span></span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">Wise CR</span>
              <span className="text-blue-400 font-black text-[16px]">{stats.wiseCR.toLocaleString()} <span className="text-[10px] opacity-50">฿</span></span>
            </div>
            <div>
              <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">EUR BT</span>
              <span className="text-pink-400 font-black text-[16px]">{stats.eurBT.toLocaleString()} <span className="text-[10px] opacity-50">฿</span></span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">EUR CR</span>
              <span className="text-blue-400 font-black text-[16px]">{stats.eurCR.toLocaleString()} <span className="text-[10px] opacity-50">฿</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget 5: FILTROS */}
      <div className="flex-none w-[300px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-brand text-xs font-bold"><Search className="w-3.5 h-3.5" /> Filtros</span>
          <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Búsqueda</span>
        </div>
        <div className="flex-1 flex flex-col p-2 gap-2 bg-surface-soft/30">
          {/* BUSCADOR DE CLIENTES */}
          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-brand transition-colors" />
            <input 
              type="text"
              placeholder="NOMBRE O APELLIDO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1">
                <CloseIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* BUSCADOR DE ACTIVIDADES */}
          <div className="relative group w-full">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-brand transition-colors" />
            <input 
              type="text"
              placeholder="ACTIVIDAD (EJ. OPEN...)"
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
            />
            {activitySearch && (
              <button onClick={() => setActivitySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1">
                <CloseIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* BUSCADOR DE INSTRUCTOR (NUEVO) */}
          <div className="relative group w-full">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="INSTRUCTOR..."
              value={instructorSearch}
              onChange={(e) => setInstructorSearch(e.target.value)}
              className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/5 transition-all shadow-inner tracking-widest uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-surface-edge/20">
            {/* PAGO Y COMISION (AHORA EN FILA 1) */}
            <div className="relative group">
              <CreditCard className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors pointer-events-none ${paymentMethodSearch ? 'text-amber-400' : 'text-gray-500'}`} />
              <select 
                value={paymentMethodSearch}
                onChange={(e) => setPaymentMethodSearch(e.target.value)}
                className={`h-8 w-full rounded-lg pl-8 pr-2 text-[9px] font-black outline-none transition-all border shadow-sm cursor-pointer appearance-none uppercase tracking-tighter ${
                  paymentMethodSearch 
                    ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' 
                    : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
                }`}
              >
                <option value="" className="bg-slate-900 text-gray-400">PAGO (TODO)</option>
                <option value="WISE BT" className="bg-slate-900 text-white">WISE BT</option>
                <option value="WISE CR" className="bg-slate-900 text-white">WISE CR</option>
                <option value="EUR BT" className="bg-slate-900 text-white">EUR BT</option>
                <option value="EUR CR" className="bg-slate-900 text-white">EUR CR</option>
                <option value="BIZUM" className="bg-slate-900 text-white">BIZUM</option>
              </select>
            </div>
            <button 
              onClick={() => setShowOnlyCommissionable(!showOnlyCommissionable)} 
              className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 ${showOnlyCommissionable ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' : 'bg-surface border-surface-edge text-gray-400 hover:text-white'} whitespace-nowrap uppercase tracking-tighter`}
            >
              <Coins className={`w-3 h-3 ${showOnlyCommissionable ? 'text-amber-400' : ''}`} />
              {showOnlyCommissionable ? 'COMISIONABLE' : 'TODOS'}
            </button>

            {/* DIAS Y ESTADOS (AHORA EN FILA 2) */}
            <button 
              onClick={() => setShowOnlyToday(!showOnlyToday)} 
              className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 ${showOnlyToday ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-surface border-surface-edge text-gray-400 hover:text-white'} whitespace-nowrap uppercase tracking-tighter`}
            >
              <Calendar className={`w-3 h-3 ${showOnlyToday ? 'text-blue-400' : ''}`} />
              {showOnlyToday ? 'HOY' : 'TODOS LOS DIAS'}
            </button>
            <button 
              onClick={() => setShowOnlyUnpaid(!showOnlyUnpaid)} 
              className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 ${showOnlyUnpaid ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' : 'bg-surface border-surface-edge text-gray-400 hover:text-white'} whitespace-nowrap uppercase tracking-tighter`}
            >
              <Search className={`w-3 h-3 ${showOnlyUnpaid ? 'text-amber-500' : ''}`} />
              {showOnlyUnpaid ? 'PENDIENTES' : 'TODOS LOS ESTADOS'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTROL DE FECHA (PEGADO ARRIBA DERECHA) */}
      <div className="flex flex-col justify-start pt-1.5 items-end ml-auto pr-2 shrink-0 h-full">
        <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner h-11">
          {/* Selector de DÍA */}
          <select 
            value={selectedDay || ''} 
            onChange={(e) => { 
              const v = e.target.value === '' ? null : Number(e.target.value); 
              setSelectedDay(v); 
              if (v !== null) setShowOnlyToday(false);
            }}
            className={`bg-transparent text-[11px] font-black outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter ${selectedDay ? 'text-brand' : 'text-gray-400'}`}
          >
            <option value="" className="bg-slate-900 text-gray-400">DÍA</option>
            {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map(d => (
              <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-surface-edge/30 mx-1" />

          <button 
            onClick={() => {
              let nm = selectedMonth - 1, ny = selectedYear;
              if (nm < 0) { nm = 11; ny--; }
              setSelectedMonth(nm); setSelectedYear(ny); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, nm, ny, selectedDay);
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
            <select 
              value={selectedMonth} 
              onChange={(e) => { const v = Number(e.target.value); setSelectedMonth(v); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, v, selectedYear, selectedDay); }}
              className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
            >
              {['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].map((m, i) => <option key={i} value={i} className="bg-slate-900 text-white">{m}</option>)}
            </select>
            <div className="w-px h-4 bg-surface-edge/30 mx-1" />
            <select 
              value={selectedYear} 
              onChange={(e) => { const v = Number(e.target.value); setSelectedYear(v); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, selectedMonth, v, selectedDay); }}
              className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
            </select>
          </div>

          <button 
            onClick={() => {
              let nm = selectedMonth + 1, ny = selectedYear;
              if (nm > 11) { nm = 0; ny++; }
              setSelectedMonth(nm); setSelectedYear(ny); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, nm, ny, selectedDay);
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    {/* BOTÓN AÑADIR FILA FLOTANTE (Abajo a la izquierda, evitando la barra lateral) */}
    <div className={`fixed bottom-6 transition-all duration-300 z-[100] ${isSidebarCollapsed ? 'left-[calc(5rem+1.5rem)]' : 'left-[calc(16rem+1.5rem)]'}`}>
      <button 
        onClick={async () => {
          try {
            const { data: inv, error: invErr } = await supabase.from('invoices').insert({ 
              status: 'Open'
            }).select().single();
            
            if (invErr) {
              console.error("[BillingHeader] Error creating invoice:", invErr);
              alert("Error al crear factura: " + invErr.message);
              return;
            }

            const { error: itemErr } = await supabase.from('invoice_items').insert({ 
              invoice_id: inv.id, 
              quantity: 1, 
              unit_price_thb: 0, 
              total_thb: 0, 
              status: 'Pending', 
              date: null
            });

            if (!itemErr) {
              sessionStorage.setItem('shouldScrollToBottom', 'true');
            }

            if (itemErr) {
              console.error("[BillingHeader] Error creating item:", itemErr);
              alert("Error al crear registro: " + itemErr.message);
              return;
            }

            fetchInvoices(false);
          } catch (err) {
            console.error("[BillingHeader] Unexpected error:", err);
          }
        }}
        className="group flex items-center gap-2 px-5 bg-brand hover:bg-brand-light text-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-brand/40 transition-all active:scale-95 border border-white/10 h-11 uppercase"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        <span className="text-[11px] font-black tracking-widest">Añadir Fila</span>
      </button>
    </div>

    {/* BOTONES DE CONFIGURACIÓN FLOTANTES (Abajo a la derecha) */}
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

    {/* MODAL DE CONFIGURACIÓN DE ACTIVIDADES */}
    {showConfig && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowConfig(false)} />
        <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand" />
                Configurar Widget
              </h3>
              <p className="text-xs text-gray-400 font-medium">Personaliza qué actividades ves en cada columna</p>
            </div>
            <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* FILTRO DE CATEGORÍAS */}
          <div className="p-4 bg-slate-800/50 border-b border-white/5 flex flex-wrap gap-2">
            {(categories || []).map(cat => {
              const isActive = catFilter.includes(cat.name);
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setCatFilter(prev => 
                    prev.includes(cat.name) ? prev.filter(c => c !== cat.name) : [...prev, cat.name]
                  )}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    isActive 
                      ? (cat.color || 'bg-brand/20 border-brand text-brand') + ' shadow-lg shadow-brand/10' 
                      : 'bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-900">
            <div className="grid grid-cols-1 gap-2">
              {(activities || [])
                .filter(act => catFilter.includes(act.category || 'Other'))
                .map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-brand transition-colors">{act.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-[10px] font-black px-1.5 py-0.5 rounded border"
                        style={{ 
                          color: act.color || '#94a3b8', 
                          backgroundColor: (act.color || '#94a3b8') + '15',
                          borderColor: (act.color || '#94a3b8') + '30'
                        }}
                      >
                        {act.acronym || 'SIN ACRÓNIMO'}
                      </span>
                      {(() => {
                        const catObj = categories.find(c => c.name === act.category);
                        return (
                          <span 
                            className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold ${catObj?.color || 'bg-white/5 text-gray-400 border border-white/10'}`}
                          >
                            {act.category}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={act.widget_column || ''}
                      onChange={async (e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        setIsSavingConfig(true);
                        await supabase.from('activities').update({ widget_column: val }).eq('id', act.id);
                        await fetchCatalogs();
                        await fetchInvoices(false);
                        setIsSavingConfig(false);
                      }}
                      className="bg-slate-800 border-none text-[11px] font-bold text-white rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-brand cursor-pointer min-w-[120px]"
                    >
                      <option value="">Ocultar</option>
                      <option value="1">Columna 1 (Cursos)</option>
                      <option value="2">Columna 2 (Tanques)</option>
                      <option value="3">Columna 3 (Especialidades)</option>
                    </select>
                    
                    <input 
                      type="number"
                      placeholder="Ord"
                      defaultValue={act.widget_order || 0}
                      onBlur={async (e) => {
                        const val = Number(e.target.value);
                        setIsSavingConfig(true);
                        await supabase.from('activities').update({ widget_order: val }).eq('id', act.id);
                        await fetchCatalogs();
                        await fetchInvoices(false);
                        setIsSavingConfig(false);
                      }}
                      className="w-12 bg-slate-800 border-none text-[11px] font-bold text-white text-center rounded-lg py-1.5 focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-slate-900 border-t border-white/5 flex justify-end gap-3">
            <button 
              onClick={() => setShowConfig(false)}
              className="px-8 py-3 bg-brand text-white font-black text-sm rounded-2xl shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
            >
              Cerrar Configurador
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL DE TEMAS */}
    {showThemeSettings && (
      <ThemeSettings 
        onClose={() => setShowThemeSettings(false)} 
      />
    )}
  </>
);
}
