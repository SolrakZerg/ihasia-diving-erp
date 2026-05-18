import { UsersRound } from 'lucide-react';
import MonthYearSelector from '../../common/MonthYearSelector';

export default function CRBT_Header({ month, setMonth, year, setYear }) {
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
        <MonthYearSelector
          month={month}
          setMonth={setMonth}
          year={year}
          setYear={setYear}
          shortNames={true}
        />
      </div>
    </div>
  );
}
