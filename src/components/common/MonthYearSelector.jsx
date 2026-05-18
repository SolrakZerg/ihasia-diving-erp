import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * MonthYearSelector — Componente común de selección de mes y año.
 *
 * Trabaja ÚNICAMENTE con meses naturales (1 = Enero, 12 = Diciembre).
 *
 * Props:
 *   month       {Number}   Mes actual (1-12)
 *   setMonth    {Function} Setter del mes
 *   year        {Number}   Año actual
 *   setYear     {Function} Setter del año
 *   shortNames  {Boolean}  Si true, muestra "Ene", "Feb"... (default: false → "Enero", "Febrero"...)
 *   yearsRange  {Array}    Años disponibles (default: [2024, 2025, 2026, 2027])
 *   className   {String}   Clases CSS adicionales
 */
export default function MonthYearSelector({
  month,
  setMonth,
  year,
  setYear,
  shortNames = false,
  yearsRange = [2024, 2025, 2026, 2027],
  className = '',
}) {
  const labels = shortNames ? MONTHS_SHORT : MONTHS_FULL;

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  return (
    <div className={`flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner ${className}`}>
      {/* Botón anterior */}
      <button
        type="button"
        onClick={handlePrev}
        className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all duration-200"
        title="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Selectores */}
      <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
        {/* Mes */}
        <select
          value={month}
          onChange={e => setMonth(parseInt(e.target.value, 10))}
          className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-75 transition-opacity text-center uppercase tracking-tighter"
        >
          {labels.map((label, i) => (
            <option key={label} value={i + 1} className="bg-[#1a1c2d] text-white">
              {shortNames ? label : label.slice(0, 3)}
            </option>
          ))}
        </select>

        {/* Separador */}
        <div className="w-px h-4 bg-surface-edge/30 mx-1" />

        {/* Año */}
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value, 10))}
          className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-75 transition-opacity text-center"
        >
          {yearsRange.map(y => (
            <option key={y} value={y} className="bg-[#1a1c2d] text-white">
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Botón siguiente */}
      <button
        type="button"
        onClick={handleNext}
        className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all duration-200"
        title="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
