import { UsersRound, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CRBT_Header({ month, setMonth, year, setYear, months }) {
  return (
    <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><UsersRound className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-black text-white leading-tight">Liquidación Socios</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-none mt-1">Gestión Unificada</p>
        </div>
      </div>
      {/* HYBRID DATE SELECTOR */}
      <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
        <button 
          onClick={() => {
            if (month === 1) {
              setMonth(12);
              setYear(prev => prev - 1);
            } else {
              setMonth(prev => prev - 1);
            }
          }}
          className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
          <select 
            value={month} 
            onChange={e => setMonth(parseInt(e.target.value))}
            className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
            ))}
          </select>
          
          <div className="w-px h-4 bg-surface-edge/30 mx-1" />

          <select 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))}
            className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
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
          className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
