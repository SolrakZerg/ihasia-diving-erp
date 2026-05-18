import { Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { useUndo } from '../../../context/UndoContext';
import EditableInput from '../../common/EditableInput';
import { buildBillingCashControlAction } from './billingUndoActions';

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
  selectedMonth,
  selectedYear,
}) {
  const { pushAction } = useUndo();

  const billRows = [
    { label: '50.000', value: 50000, state: bills50000, setState: setBills50000 },
    { label: '1.000',  value: 1000,  state: bills1000,  setState: setBills1000  },
    { label: '500',    value: 500,   state: bills500,   setState: setBills500   },
    { label: '100',    value: 100,   state: bills100,   setState: setBills100   },
    { label: '50',     value: 50,    state: bills50,    setState: setBills50    },
    { label: '20',     value: 20,    state: bills20,    setState: setBills20    },
  ];

  const handleSave = (label, newValue, oldValue, setState) => {
    setState(newValue);

    const cleanVal = (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const currentBills = {
      '50.000': cleanVal(bills50000),
      '1.000':  cleanVal(bills1000),
      '500':    cleanVal(bills500),
      '100':    cleanVal(bills100),
      '50':     cleanVal(bills50),
      '20':     cleanVal(bills20),
    };

    const oldBills = { ...currentBills };

    const newBills = { ...currentBills };
    newBills[label] = cleanVal(newValue);

    const computeTotal = (bills) => {
      return bills['50.000'] * 50000 +
             bills['1.000'] * 1000 +
             bills['500'] * 500 +
             bills['100'] * 100 +
             bills['50'] * 50 +
             bills['20'] * 20;
    };

    const oldTotal = computeTotal(oldBills);
    const newTotal = computeTotal(newBills);

    pushAction(buildBillingCashControlAction({
      selectedYear,
      selectedMonth,
      label,
      oldVal: oldValue,
      newVal: newValue,
      oldBills,
      newBills,
      oldTotal,
      newTotal,
      setters: {
        setBills50000,
        setBills1000,
        setBills500,
        setBills100,
        setBills50,
        setBills20,
      }
    }));
  };

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
        <div 
          className="space-y-[3px]"
          onKeyDownCapture={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const targetId = e.target.id;
              const match = targetId?.match(/bill-input-(\d+)/);
              if (match) {
                const index = parseInt(match[1], 10);
                const nextInput = document.getElementById(`bill-input-${index + 1}`);
                if (nextInput) {
                  nextInput.focus();
                  nextInput.select();
                } else {
                  e.target.blur();
                }
              }
            }
          }}
        >
          {billRows.map((b, index) => (
            <div key={b.label} className="flex items-center justify-between gap-2 group">
              <div className="w-10 text-emerald-400/90 font-mono text-[12px] group-hover:text-emerald-400 transition-colors">
                {b.label}
              </div>
              <EditableInput
                id={`bill-input-${index}`}
                type="number"
                min="0"
                max="999"
                defaultValue={b.state}
                onSave={(newValue, oldValue) => handleSave(b.label, newValue, oldValue, b.setState)}
                onFocus={(e) => e.target.select()}
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
