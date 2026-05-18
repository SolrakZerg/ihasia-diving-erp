import { useRef } from 'react';
import { Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function Billing_Header_Llegadas({
  arrivalsDate,
  setArrivalsDate,
  changeArrivalsDate,
  todayArrivals,
  loadingArrivals,
  selectedArrivalIds,
  setSelectedArrivalIds,
  handleAddArrivalsToTable,
}) {
  const dateInputRef = useRef(null);

  return (
    <div className="flex-none w-full max-w-[380px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
      {/* Cabecera del widget */}
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold whitespace-nowrap">
          <Users className="w-3.5 h-3.5" /> Llegadas
        </span>

        {/* Selector de fecha con flechas */}
        <div className="flex-none ml-auto flex items-center bg-surface-soft/50 rounded-2xl border border-surface-edge/30 overflow-hidden h-[21px] p-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); changeArrivalsDate(-1); }}
            className="p-1 hover:bg-surface-edge/30 rounded-lg text-gray-400 hover:text-white transition-all border-r border-surface-edge/20"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <div
            className="relative cursor-pointer group/date flex items-center justify-center px-3 h-full hover:bg-brand/5"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <input
              ref={dateInputRef}
              type="date"
              value={arrivalsDate}
              onChange={(e) => setArrivalsDate(e.target.value)}
              className="absolute w-0 h-0 opacity-0 border-0 p-0 m-0 pointer-events-none"
              style={{ visibility: 'hidden' }}
            />
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

      {/* Lista de llegadas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {loadingArrivals ? (
          <div className="flex justify-center p-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
          </div>
        ) : todayArrivals.length === 0 ? (
          <div className="text-sm text-center text-gray-400 py-2">No hay llegadas programadas.</div>
        ) : (
          <table className="w-full text-sm leading-tight text-left">
            <tbody>
              {todayArrivals.map((c, i) => (
                <tr
                  key={c.id}
                  className="hover:bg-surface rounded group transition-colors cursor-pointer"
                  onClick={() => {
                    const s = new Set(selectedArrivalIds);
                    if (s.has(c.id)) s.delete(c.id);
                    else s.add(c.id);
                    setSelectedArrivalIds(s);
                  }}
                >
                  <td className="py-0.5 px-1.5 w-6 text-center text-text-muted text-[10px] font-mono">{i + 1}</td>
                  <td className="py-0.5 px-1.5 w-6 text-center">
                    <input
                      type="checkbox"
                      checked={selectedArrivalIds.has(c.id)}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-brand bg-surface border-surface-edge cursor-pointer pointer-events-none"
                    />
                  </td>
                  <td className="py-0.5 px-1.5 text-white font-medium truncate max-w-[180px]">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="py-0.5 px-1.5 text-brand text-[10px] truncate max-w-[110px] font-bold opacity-80 pl-2">
                    {c.booked_activity || 'Genérico'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Botón añadir */}
      <div className="p-1 px-1.5 border-t border-surface-edge bg-surface/50 mt-auto">
        <button
          onClick={handleAddArrivalsToTable}
          disabled={selectedArrivalIds.size === 0}
          className="w-full py-0.5 bg-brand/10 text-brand hover:bg-brand hover:text-white disabled:opacity-50 border border-brand/30 rounded text-[13px] font-semibold transition-colors shadow-sm"
        >
          AÑADIR A LA MESA {selectedArrivalIds.size > 0 && `(${selectedArrivalIds.size})`}
        </button>
      </div>
    </div>
  );
}
