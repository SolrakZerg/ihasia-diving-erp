import { UsersRound, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CRBT_Header({ month, setMonth, year, setYear, months }) {
  return (
    <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] md:sticky top-0 py-3 no-print print:hidden">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-white leading-tight uppercase tracking-tight flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-brand" />
            CRBT
          </h1>
        </div>

        {/* HYBRID DATE SELECTOR */}
        <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
          <button
            onClick={() => {
              if (month === 1) {
                setMonth(12);
                setYear(prev => prev - 1);
              } else {
                setMonth(prev => prev - 1);
              }
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-text-header hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              className="bg-transparent text-xs font-black text-white outline-none px-1.5 py-0.5 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
              ))}
            </select>

            <div className="w-px h-4 bg-surface-edge/30 mx-1" />

            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="bg-transparent text-xs font-black text-white outline-none px-1.5 py-0.5 cursor-pointer appearance-none transition-colors text-center"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              if (month === 12) {
                setMonth(1);
                setYear(prev => prev + 1);
              } else {
                setMonth(prev => prev + 1);
              }
            }}
            className="p-2 hover:bg-surface-edge/30 rounded-xl text-text-header hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
