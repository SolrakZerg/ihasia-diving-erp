import { useState, useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Billing_GridRow_InstructorSelect({
  item,
  staff,
  isStaffDisabled,
  act,
  handleItemUpdate,
}) {
  const [isOpen, setIsOpen]   = useState(false);
  const [query, setQuery]     = useState('');
  const inputRef              = useRef(null);
  const containerRef          = useRef(null);

  const currentStaff = staff.find(s => s.id === item.instructor_id);

  // Active staff + currently assigned even if inactive
  const filteredStaff = staff
    .filter(s => s.active || s.id === item.instructor_id)
    .filter(s =>
      !query ||
      s.first_name?.toLowerCase().includes(query.toLowerCase()) ||
      s.initials?.toLowerCase().includes(query.toLowerCase())
    );

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (staffId) => {
    handleItemUpdate(item, 'instructor_id', staffId || null);
    setIsOpen(false);
    setQuery('');
  };

  // ── Disabled state ──────────────────────────────────────────────────────────
  if (isStaffDisabled) {
    return (
      <div
        className="flex items-center justify-center h-full w-full opacity-20 cursor-not-allowed"
        title={`Staff no disponible para ${act?.category}`}
      >
        <span className="text-sm font-black text-gray-400">—</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">

      {/* Alert when instructor missing */}
      {!item.instructor_id && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Falta Instructor" />
        </div>
      )}

      {isOpen ? (
        <>
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape')                              { setIsOpen(false); setQuery(''); }
              if (e.key === 'Enter' && filteredStaff.length === 1) { handleSelect(filteredStaff[0].id); }
            }}
            placeholder="Buscar..."
            className="relative z-10 bg-white border border-brand/40 text-gray-900 font-black text-[11px] w-full h-6 text-center outline-none rounded-sm px-1 shadow-sm"
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 z-[200] min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden mt-0.5">
            {/* Clear option */}
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSelect(null); }}
              className="w-full px-3 py-1.5 text-left text-[11px] text-gray-400 hover:bg-red-50 hover:text-red-600 font-medium border-b border-gray-100 whitespace-nowrap"
            >
              — Sin instructor
            </button>

            {filteredStaff.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-gray-400 italic">Sin resultados</div>
            ) : (
              filteredStaff.map(s => (
                <button
                  key={s.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s.id); }}
                  className={`w-full px-3 py-1.5 text-left text-[11px] font-black hover:bg-brand/10 transition-colors whitespace-nowrap ${
                    s.id === item.instructor_id ? 'bg-brand/5 text-brand' : 'text-gray-800'
                  }`}
                >
                  <span className="font-black">{s.initials}</span>
                  <span className="text-gray-500 font-normal ml-1.5 text-[10px]">{s.first_name}</span>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* Display mode — click to open */
        <button
          onClick={() => setIsOpen(true)}
          title="Asignar Instructor"
          className={`relative z-10 w-full h-6 text-sm font-black text-center cursor-pointer transition-all hover:opacity-80 ${
            !item.instructor_id
              ? 'text-red-600 animate-pulse'
              : 'text-cyan-700'
          }`}
        >
          {currentStaff?.initials || ''}
        </button>
      )}
    </div>
  );
}
