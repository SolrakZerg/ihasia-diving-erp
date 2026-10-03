import { ChevronLeft, ChevronRight } from 'lucide-react';

const STANDARD_MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CashReservation_Calendar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onChangeMonth
}) {
  const prevMonth = () => {
    onChangeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onChangeMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Días del mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, dateObj: new Date(year, month, d) });
    }

    // Días del mes siguiente para completar la grilla
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  };

  return (
    <div className="bg-surface-soft border border-surface-edge rounded-2xl overflow-hidden shadow-2xl select-none w-full max-w-full">
      {/* Header Mes/Año con flechas grandes */}
      <div className="bg-surface-soft/90 border-b border-surface-edge px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 sm:p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <span className="font-black text-white text-lg sm:text-2xl tracking-wide">
          {STANDARD_MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 sm:p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Cabecera Días Semana (Verde Addtocalendar) */}
      <div className="grid grid-cols-7 bg-[#258547] text-white font-black text-xs sm:text-base text-center py-1.5 sm:py-2.5 uppercase tracking-wider shadow-inner">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>

      {/* Grilla de Días con números GRANDES adaptativos */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-1.5 sm:p-3 bg-surface">
        {renderCalendarDays().map((item, idx) => {
          if (!item.isCurrentMonth) {
            return (
              <div
                key={idx}
                className="h-9 sm:h-12 flex items-center justify-center text-gray-600 text-sm sm:text-lg font-bold opacity-20 cursor-not-allowed"
              >
                {item.day}
              </div>
            );
          }

          const isSelected = selectedDate.toDateString() === item.dateObj.toDateString();
          const isToday = new Date().toDateString() === item.dateObj.toDateString();

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(item.dateObj)}
              className={`h-9 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg font-black transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-brand text-white shadow-lg shadow-brand/30 scale-105 z-10 border-2 border-brand-light/60 font-black'
                  : isToday
                  ? 'bg-brand/15 text-brand-light border border-brand/30 hover:bg-brand/25'
                  : 'text-gray-100 hover:bg-surface-soft hover:text-white'
              }`}
            >
              {item.day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-light" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
