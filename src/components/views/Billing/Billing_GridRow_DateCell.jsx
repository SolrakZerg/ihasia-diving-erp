import { useRef, useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function Billing_GridRow_DateCell({
  item,
  handleItemUpdate,
  bLine,
  formatSmartDate,
  selectedMonth,
  selectedYear,
  setToast,
}) {
  const dateInputRef = useRef(null);

  // ¿La fecha actual del item pertenece al mes seleccionado?
  const isWrongMonth = useMemo(() => {
    if (!item.date) return false;
    const [y, m] = item.date.split('-').map(Number);
    return y !== selectedYear || (m - 1) !== selectedMonth;
  }, [item.date, selectedMonth, selectedYear]);

  // Rango permitido para el input date (bloqueo preventivo del navegador)
  const minDate = useMemo(() => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${month}-01`;
  }, [selectedMonth, selectedYear]);

  const maxDate = useMemo(() => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return `${selectedYear}-${month}-${lastDay}`;
  }, [selectedMonth, selectedYear]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const onDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) {
      handleItemUpdate(item, 'date', null);
      return;
    }

    const [y, m] = newDate.split('-').map(Number);
    if (y !== selectedYear || (m - 1) !== selectedMonth) {
      if (setToast) {
        const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        setToast(`⚠️ Solo puedes asignar fechas de ${monthNames[selectedMonth]} en este informe`);
      }
      return; // Bloquear actualización
    }

    handleItemUpdate(item, 'date', newDate);
  };

  return (
    <td className={`w-[110px] min-w-[110px] border-r border-gray-100 ${bLine} h-[30px] overflow-hidden relative py-0`}>
      <button
        onClick={handleClick}
        aria-label={`Cambiar fecha: ${item.date || 'Sin fecha'}`}
        className={`flex items-center justify-center gap-1.5 h-full w-full transition-colors px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:z-10 group/datebtn ${
          isWrongMonth ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-white/10'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 transition-colors ${
          !item.date || isWrongMonth ? 'text-red-500 animate-pulse' : 'text-brand'
        } group-hover/datebtn:scale-110`} />
        <span className={`text-[12px] font-black transition-all whitespace-nowrap ${
          !item.date || isWrongMonth
            ? 'text-red-600 animate-pulse bg-red-50 px-1.5 py-0.5 rounded border border-red-200'
            : 'text-gray-900'
        }`}>
          {item.date ? formatSmartDate(item.date).toUpperCase() : "FECHA"}
        </span>
      </button>

      {/* Input date oculto — solo sirve para abrir el picker nativo */}
      <input
        ref={dateInputRef}
        type="date"
        value={item.date || ""}
        min={minDate}
        max={maxDate}
        onChange={onDateChange}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    </td>
  );
}
