import { useRef } from 'react';
import { Users, ChevronLeft, ChevronRight, Target, Calculator, CheckCircle2, Loader2, Calendar, Search, Plus, Briefcase } from 'lucide-react';

const StatItem = ({ label, value, color = "text-white", noBorder = false, first = false }) => (
  <div className={`flex items-center justify-between gap-3 ${first ? 'pb-1 pt-0' : 'py-1'} w-full ${noBorder ? '' : 'border-b border-white/[0.04]'}`}>
    <span className={`text-[10px] font-bold tracking-wide uppercase truncate ${value === 0 ? 'text-gray-400/60' : 'text-gray-300'}`}>{label}</span>
    <span className={`text-[12px] font-black tabular-nums transition-colors ${value === 0 ? 'text-gray-500' : color}`}>{value}</span>
  </div>
);

export default function BillingHeader({
  // Arrivals
  arrivalsDate, setArrivalsDate, changeArrivalsDate, todayArrivals, loadingArrivals,
  selectedArrivalIds, setSelectedArrivalIds, handleAddArrivalsToTable,
  // Activity Stats
  activityStats,
  // Cash
  bills50000, setBills50000, bills1000, setBills1000, bills500, setBills500,
  bills100, setBills100, bills50, setBills50, bills20, setBills20,
  actualCash, expectedCash, diffCash, isSavingCash,
  // Finance
  stats,
  // Month/Year
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
  // Filters
  showOnlyToday, setShowOnlyToday, showOnlyUnpaid, setShowOnlyUnpaid,
  fetchInvoices,
  // Add row
  supabase,
}) {
  const dateInputRef = useRef(null);

  return (
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
                    <td className="py-0.5 px-1.5 text-brand text-[10px] truncate max-w-[110px] font-bold uppercase opacity-80 pl-2">{c.booked_activity || 'Genérico'}</td>
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
      <div className="flex-none w-[250px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-2xl overflow-hidden hidden lg:flex shrink-0">
        <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
          <span className="flex items-center gap-1.5 text-brand text-xs font-bold"><Target className="w-3.5 h-3.5" /> Actividades</span>
        </div>
        <div className="flex-1 grid grid-cols-2 divide-x divide-white/10 p-3">
          <div className="pr-3 flex flex-col justify-between">
            <div className="flex flex-col gap-0">
              <StatItem label="OW" value={activityStats.ow} first />
              <StatItem label="SD" value={activityStats.sd} />
              <StatItem label="AA" value={activityStats.aa} />
              <StatItem label="DSD1" value={activityStats.dsd1} />
              <StatItem label="DSD2" value={activityStats.dsd2} />
              <StatItem label="SR1" value={activityStats.sr1} />
              <StatItem label="SR2" value={activityStats.sr2} noBorder />
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">TANQUES</span>
              <span className="text-sm font-black text-brand-light leading-none">{activityStats.totalTanks}</span>
            </div>
          </div>
          <div className="pl-3 flex flex-col gap-0">
            <StatItem label="FD 1" value={activityStats.fd1} first />
            <StatItem label="FD 2-5" value={activityStats.fd25} />
            <StatItem label="FD AL" value={activityStats.fdAlum} />
            <StatItem label="DEEP A" value={activityStats.deepAdv} />
            <StatItem label="DEEP E" value={activityStats.deepEsp} />
            <StatItem label="EAN" value={activityStats.ean} />
            <StatItem label="CANCEL" value={activityStats.cancel} color="text-red-500" noBorder />
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
            ].map((b) => (
              <div key={b.label} className="flex items-center justify-between gap-2 group">
                <div className="w-10 text-emerald-400/90 font-mono text-[12px] group-hover:text-emerald-400 transition-colors">{b.label}</div>
                <input 
                  type="number" 
                  min="0" 
                  max="999" 
                  value={b.state} 
                  onChange={e => b.setState(e.target.value)} 
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
      <div className="flex-none w-full max-w-[280px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
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

      {/* ACCIONES GLOBALES: selector arriba-derecha, botones abajo */}
      <div className="flex flex-col justify-between items-end ml-auto pb-2 gap-2 shrink min-w-[200px]">
        {/* NUEVO CONTROLADOR DE FECHA HÍBRIDO (MES/AÑO) */}
        <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner h-11">
          <button 
            onClick={() => {
              let nm = selectedMonth - 1, ny = selectedYear;
              if (nm < 0) { nm = 11; ny--; }
              setSelectedMonth(nm); setSelectedYear(ny); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, nm, ny);
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
            <select 
              value={selectedMonth} 
              onChange={(e) => { const v = Number(e.target.value); setSelectedMonth(v); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, v, selectedYear); }}
              className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
            >
              {['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].map((m, i) => <option key={i} value={i} className="bg-slate-900 text-white">{m}</option>)}
            </select>
            
            <div className="w-px h-4 bg-surface-edge/30 mx-1" />

            <select 
              value={selectedYear} 
              onChange={(e) => { const v = Number(e.target.value); setSelectedYear(v); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, selectedMonth, v); }}
              className="bg-transparent text-[11px] font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none transition-colors text-center"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
            </select>
          </div>

          <button 
            onClick={() => {
              let nm = selectedMonth + 1, ny = selectedYear;
              if (nm > 11) { nm = 0; ny++; }
              setSelectedMonth(nm); setSelectedYear(ny); fetchInvoices(false, showOnlyToday, showOnlyUnpaid, nm, ny);
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros + añadir fila — abajo */}
        <div className="flex flex-wrap justify-end items-center gap-2">
          <button onClick={() => { const v = !showOnlyToday; setShowOnlyToday(v); fetchInvoices(false, v, showOnlyUnpaid); }} className={`flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border shadow-sm h-11 ${showOnlyToday ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-surface border-surface-edge text-gray-400 hover:text-white'} whitespace-nowrap`}>
            <Calendar className={`w-3.5 h-3.5 ${showOnlyToday ? 'text-blue-400' : ''}`} />
            {showOnlyToday ? 'MOSTRANDO: HOY' : 'MOSTRANDO: TODO'}
          </button>
          <button onClick={() => { const v = !showOnlyUnpaid; setShowOnlyUnpaid(v); fetchInvoices(false, showOnlyToday, v); }} className={`flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all border shadow-sm h-11 ${showOnlyUnpaid ? 'bg-amber-600/10 border-amber-500/50 text-amber-400' : 'bg-surface border-surface-edge text-gray-400 hover:text-white'} whitespace-nowrap`}>
            <Search className={`w-3.5 h-3.5 ${showOnlyUnpaid ? 'text-amber-500' : ''}`} />
            {showOnlyUnpaid ? 'FILTRO: PENDIENTES' : 'FILTRO: TODOS'}
          </button>
          <button onClick={async () => {
            try {
              const { data: inv, error: invErr } = await supabase.from('invoices').insert({ 
                status: 'Open'
              }).select().single();
              
              if (invErr) {
                console.error("[BillingHeader] Error creating invoice:", invErr);
                alert("Error al crear factura: " + invErr.message);
                return;
              }

              console.log("[BillingHeader] Invoice created, adding first item...", inv.id);
              const { error: itemErr } = await supabase.from('invoice_items').insert({ 
                invoice_id: inv.id, 
                quantity: 1, 
                unit_price_thb: 0, 
                total_thb: 0, 
                status: 'Pending', 
                date: null
              });

              if (!itemErr) {
                // Indicamos que queremos scroll al final
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
          }} className="flex-none flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-xl transition-all shadow-lg active:scale-95 group h-11 whitespace-nowrap">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> AÑADIR FILA
          </button>
        </div>
      </div>
    </div>
  );
}
