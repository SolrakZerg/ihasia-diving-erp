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

  return (
    <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-black text-white leading-tight flex items-center gap-3">
          <Handshake className="w-8 h-8 text-brand" />
          Sueldos de Staff
        </h1>
      </div>

      <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-surface-edge shadow-inner relative">
        <div className="relative">
          <button onClick={() => setShowStaffDropdown(!showStaffDropdown)} className="flex items-center gap-3 px-4 py-2 bg-surface-soft/50 hover:bg-surface-soft rounded-xl border border-surface-edge/50 transition-all min-w-[240px] group">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-black text-xs">{selectedMember?.initials || '??'}</div>
            <div className="flex-1 text-left">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Instructor</p>
              <p className="text-sm font-black text-white leading-none truncate">{selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Seleccionar...'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showStaffDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showStaffDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStaffDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1c2d]/95 backdrop-blur-xl border border-surface-edge rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-surface-edge/50 flex items-center gap-2 bg-white/5"><Search className="w-3.5 h-3.5 text-gray-500 ml-2" /><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Filtrado por facturación</span></div>
                <div className="max-h-[500px] overflow-auto custom-scrollbar">
                  {staff.filter(s => activeStaffIds.has(s.id)).map(s => (
                    <button key={s.id} onClick={() => { setSelectedStaffId(s.id); setShowStaffDropdown(false); }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-brand/10 transition-colors text-left group ${selectedStaffId === s.id ? 'bg-brand/5' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedStaffId === s.id ? 'bg-brand text-[#1a1c2d]' : 'bg-surface-edge text-gray-400 group-hover:bg-brand/20 group-hover:text-brand'}`}>{s.initials}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-black transition-colors ${selectedStaffId === s.id ? 'text-brand' : 'text-gray-300 group-hover:text-white'}`}>{s.first_name} {s.last_name}</p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{s.role}</p>
                      </div>
                      {selectedStaffId === s.id && <Check className="w-4 h-4 text-brand" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
