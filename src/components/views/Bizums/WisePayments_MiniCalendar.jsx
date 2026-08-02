import { ChevronLeft, ChevronRight } from 'lucide-react';

const STANDARD_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function WisePayments_MiniCalendar({ 
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

    // Mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }

    // Mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, dateObj: new Date(year, month, d) });
    }

    // Mes siguiente
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  };

  return (
    <div className="bg-surface-soft/60 border border-surface-edge rounded-2xl overflow-hidden shadow-lg">
      {/* Header Mes/Año */}
      <div className="bg-surface-soft border-b border-surface-edge px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-black text-white text-base sm:text-lg tracking-wide">
          {STANDARD_MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Cabecera Días Semana (Verde Addtocalendar) */}
      <div className="grid grid-cols-7 bg-emerald-600 text-white font-black text-xs sm:text-sm text-center py-2 uppercase tracking-wider">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Grilla de Días */}
      <div className="grid grid-cols-7 gap-1.5 p-2 sm:p-3 bg-surface">
        {renderCalendarDays().map((item, idx) => {
          if (!item.isCurrentMonth) {
            return (
              <div key={idx} className="h-10 sm:h-11 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-bold opacity-30 cursor-not-allowed">
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
              className={`h-10 sm:h-11 rounded-xl text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105 border-2 border-emerald-300'
                  : isToday
                  ? 'bg-brand/20 text-brand border border-brand/40 hover:bg-brand/30'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              {item.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
