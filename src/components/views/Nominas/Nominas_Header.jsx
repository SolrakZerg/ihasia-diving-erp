import React, { useState } from 'react';
import { Handshake, Search, Check, ChevronDown } from 'lucide-react';
import MonthYearSelector from '../../common/MonthYearSelector';

export default function Nominas_Header({
  month, setMonth,
  year, setYear,
  selectedMember,
  staff, activeStaffIds,
  selectedStaffId, setSelectedStaffId
}) {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`flex-shrink-0 bg-surface-soft/50 border-b border-surface-edge/50 z-[50] md:sticky top-0 transition-all duration-300 py-5 px-3 sm:px-6 lg:px-8 relative ${isExpanded ? 'header-expanded' : 'header-collapsed'}`}>
      <div className="header-full-content max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Title and Month/Year Selector */}
        <div className="flex flex-col gap-4 w-full md:w-auto items-center md:items-start shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white leading-tight flex items-center gap-3">
              <Handshake className="w-8 h-8 text-brand" />
              Sueldos de Staff
            </h1>
          </div>

          {/* MONTH/YEAR SELECTOR */}
          <div className="flex items-center gap-3">
            <MonthYearSelector
              month={month}
              setMonth={setMonth}
              year={year}
              setYear={setYear}
              shortNames={true}
            />
          </div>
        </div>

        {/* Right Side: Instructor Selector Separated */}
        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-surface-edge shadow-inner relative w-full md:w-auto justify-center md:justify-end shrink-0">
          <div className="relative w-full md:w-auto">
            <button 
              onClick={() => setShowStaffDropdown(!showStaffDropdown)} 
              className="flex items-center gap-3 px-4 py-2 bg-surface-soft/50 hover:bg-surface-soft rounded-xl border border-surface-edge/50 transition-all w-full md:min-w-[240px] group"
            >
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs shrink-0">
                {selectedMember?.initials || '??'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Instructor</p>
                <p className="text-sm font-black text-white leading-none truncate">
                  {selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Seleccionar...'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 ${showStaffDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStaffDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStaffDropdown(false)} />
                <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1c2d]/95 backdrop-blur-xl border border-surface-edge rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-surface-edge/50 flex items-center gap-2 bg-white/5">
                    <Search className="w-3.5 h-3.5 text-gray-500 ml-2" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Filtrado por facturación</span>
                  </div>
                  <div className="max-h-[500px] overflow-auto custom-scrollbar">
                    {staff.filter(s => activeStaffIds.has(s.id)).map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => { setSelectedStaffId(s.id); setShowStaffDropdown(false); }} 
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand/10 transition-colors text-left group ${selectedStaffId === s.id ? 'bg-brand/5' : ''}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${selectedStaffId === s.id ? 'bg-brand text-[#1a1c2d]' : 'bg-surface-edge text-gray-400 group-hover:bg-brand/20 group-hover:text-brand'}`}>
                          {s.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black transition-colors truncate ${selectedStaffId === s.id ? 'text-brand' : 'text-gray-300 group-hover:text-white'}`}>
                            {s.first_name} {s.last_name}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{s.role}</p>
                        </div>
                        {selectedStaffId === s.id && <Check className="w-4 h-4 text-brand shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Compact Summary Content for Mobile Landscape */}
      <div className="header-summary-content hidden items-center justify-center gap-6 max-w-[1700px] mx-auto">
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-brand" />
          <span className="text-sm font-black text-white">Sueldos:</span>
          <span className="text-xs font-black text-gray-300">
            {selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Ninguno'}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-surface-edge text-gray-400 font-bold rounded-lg uppercase tracking-widest shrink-0">
            {selectedMember?.initials || '??'}
          </span>
        </div>
        <div className="text-xs font-black text-brand uppercase tracking-wider">
          {month}/{year}
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
