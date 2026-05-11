import { Calculator, CheckCircle2, Loader2 } from 'lucide-react';

export default function Billing_Header_Caja({
  bills50000, setBills50000,
  bills1000,  setBills1000,
  bills500,   setBills500,
  bills100,   setBills100,
  bills50,    setBills50,
  bills20,    setBills20,
  actualCash,
  expectedCash,
  diffCash,
  isSavingCash,
}) {
  const billRows = [
    { label: '50.000', value: 50000, state: bills50000, setState: setBills50000 },
    { label: '1.000',  value: 1000,  state: bills1000,  setState: setBills1000  },
    { label: '500',    value: 500,   state: bills500,   setState: setBills500   },
    { label: '100',    value: 100,   state: bills100,   setState: setBills100   },
    { label: '50',     value: 50,    state: bills50,    setState: setBills50    },
    { label: '20',     value: 20,    state: bills20,    setState: setBills20    },
  ];

  return (
    <div className="flex-none w-fit flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden min-w-[180px] shrink-0">
      {/* Cabecera */}
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
          <Calculator className="w-3.5 h-3.5" /> Caja
        </span>
        {isSavingCash
          ? <Loader2 className="w-3 h-3 animate-spin text-emerald-500/50" />
          : <CheckCircle2 className="w-3 h-3 text-emerald-500/30" />
        }
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col p-2 px-2.5">
        {/* Filas de billetes */}
        <div className="space-y-[3px]">
          {billRows.map((b, index) => (
            <div key={b.label} className="flex items-center justify-between gap-2 group">
              <div className="w-10 text-emerald-400/90 font-mono text-[12px] group-hover:text-emerald-400 transition-colors">
                {b.label}
              </div>
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

        {/* Totales y diferencia */}
        <div className="mt-2 pt-2 border-t border-surface-edge/50 space-y-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[12px] uppercase font-black">Hay:</span>
              <span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">
                {actualCash.toLocaleString()} ฿
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[12px] uppercase font-black tracking-tighter">Debería:</span>
              <span className="text-white font-black text-[15px] font-mono tracking-tighter leading-tight">
                {expectedCash.toLocaleString()} ฿
              </span>
            </div>
            <div className="flex flex-col items-center pt-2 mt-1 border-t border-surface-edge/30">
              <span className={`text-[20px] font-black leading-none drop-shadow-sm ${
                diffCash === 0 ? 'text-blue-400' : diffCash > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {diffCash > 0 ? '+' : ''}{diffCash.toLocaleString()} ฿
              </span>
              <span className="text-[9px] uppercase text-gray-400 font-black mt-0.5">
                {diffCash === 0 ? 'DIFERENCIA OK' : diffCash > 0 ? 'SOBRA DINERO' : 'FALTA DINERO'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
