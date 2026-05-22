import React, { useState } from 'react';
import { UsersRound, ChevronDown } from 'lucide-react';
import MonthYearSelector from '../../common/MonthYearSelector';

export default function CRBT_Header({ month, setMonth, year, setYear }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] md:sticky top-0 transition-all duration-300 py-3 relative ${isExpanded ? 'header-expanded' : 'header-collapsed'}`}>
      
      {/* Full Header Content */}
      <div className="header-full-content max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center sm:justify-between gap-4">
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

      {/* Compact Summary Content for Mobile Landscape */}
      <div className="header-summary-content hidden items-center justify-center gap-6 max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <UsersRound className="w-5 h-5 text-brand" />
          <span className="text-sm font-black text-white uppercase tracking-tight">CRBT</span>
        </div>
        <div className="text-xs font-black text-brand uppercase tracking-wider">
          {["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][month - 1]}/{year}
        </div>
      </div>

      {/* Floating Toggle Button for Mobile Landscape */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="header-toggle-btn hidden absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-surface-edge hover:bg-brand text-gray-300 hover:text-white items-center justify-center transition-all z-[60]"
        aria-label={isExpanded ? "Colapsar cabecera" : "Expandir cabecera"}
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

    </div>
  );
}
