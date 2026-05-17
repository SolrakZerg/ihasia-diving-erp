import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Billing_GridRow_SmartActivitySelect({
  value,
  activities = [],
  onChange,
  placeholder = "Elegir Actividad...",
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);

  const selectedActivity = activities.find(a => String(a.id) === String(localValue));

  // Detect available space and flip dropdown if needed
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < 280 ? 'up' : 'down');
    }
  }, [isOpen]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Filtered list based on search term
  const filtered = useMemo(() => {
    if (!searchTerm) return activities;
    const lower = searchTerm.toLowerCase();
    return activities.filter(a => a.name.toLowerCase().includes(lower));
  }, [activities, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (activity) => {
    setLocalValue(activity.id);
    onChange(activity.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Trigger */}
      <div
        className="w-full h-full flex items-center cursor-text"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className={`bg-transparent text-sm w-full h-6 outline-none cursor-text focus-visible:ring-1 focus-visible:ring-brand-light rounded-sm py-0 ${
            !selectedActivity && !isOpen ? 'text-gray-400 italic font-normal' : 'text-gray-900 font-black'
          }`}
          value={isOpen ? searchTerm : (selectedActivity?.name || '')}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={activities.length > 0 ? placeholder : "Cargando..."}
          autoComplete="off"
          aria-label="Seleccionar actividad"
        />
        {!isOpen && (
          <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 z-[100] w-[280px] bg-white border border-gray-200 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {/* Opción para quitar/vaciar actividad */}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSelect({ id: null, name: '' }); }}
              className="w-full text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-gray-400 hover:bg-rose-50 hover:text-rose-600 font-black border-b border-gray-100 flex items-center gap-2 transition-colors"
            >
              <span>— Quitar Actividad —</span>
            </button>

            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400 italic">No hay coincidencias...</div>
            ) : (
              (() => {
                let lastCategory = null;
                return filtered.map((a) => {
                  const showHeader = a.category !== lastCategory;
                  lastCategory = a.category;
                  return (
                    <div key={a.id}>
                      {showHeader && (
                        <div className="px-3 py-1.5 bg-slate-800 text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] mt-2 first:mt-0 shadow-inner">
                          {a.category || 'Otros'}
                        </div>
                      )}
                      <button
                        onClick={() => handleSelect(a)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-brand/5 group transition-colors ${
                          a.id === value ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {a.color && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                          )}
                          <span className="font-bold">{a.name}</span>
                        </div>
                        {a.price_thb && (
                          <span className="text-[11px] text-brand font-black font-mono bg-brand/5 px-2 py-0.5 rounded border border-brand/10">
                            {a.price_thb.toLocaleString()} ฿
                          </span>
                        )}
                      </button>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
