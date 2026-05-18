import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Dashboard_Header({
  month,
  setMonth,
  year,
  setYear,
  months,
  handlePrevMonth,
  handleNextMonth
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-soft/30 py-8 px-6 rounded-2xl border border-surface-edge shadow-2xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <img src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-main.svg" alt="Logo" className="w-24 md:w-28 h-24 md:h-28 object-contain brightness-0 invert opacity-100" />
        <img
          src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo-ihasia-secondary.webp"
          alt="iHasia Financial"
          className="h-12 md:h-16 w-auto object-contain brightness-0 invert"
        />
      </div>

      <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none text-center uppercase tracking-tighter">
            {months.map((m, i) => (<option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>))}
          </select>
          <div className="w-px h-4 bg-surface-edge/30 mx-1" />
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none text-center">
            {[2024, 2025, 2026, 2027].map(y => (<option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>))}
          </select>
        </div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Espacio reservado para futuros widgets de cabecera */}
      </div>
    </div>
  );
}
