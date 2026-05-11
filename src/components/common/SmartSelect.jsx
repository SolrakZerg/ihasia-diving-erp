import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const SmartSelect = ({ value, options, onChange, placeholder = "Seleccionar...", type = 'activity' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.id === value);
  
  const filtered = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.subtext && o.subtext.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface border border-surface-edge rounded px-2 py-1.5 text-left text-xs flex items-center justify-between group"
      >
        <span className={selectedOption ? 'text-white font-bold' : 'text-gray-500 italic'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-64 bg-[#1a1c2d] border border-brand/30 rounded-xl mt-1 shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="p-2 border-b border-surface-edge/30">
            <input 
              autoFocus
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface-edge/20 border border-brand/20 rounded px-2 py-1 text-[11px] text-white outline-none"
            />
          </div>
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 italic">No hay resultados</div>
            ) : (
              filtered.map(o => (
                <button 
                  key={o.id} 
                  onClick={() => { onChange(o); setIsOpen(false); setSearchTerm(''); }}
                  className="w-full text-left p-2.5 hover:bg-brand/10 border-b border-surface-edge/10 flex flex-col transition-colors"
                >
                  <span className="text-xs font-bold text-white">{o.name}</span>
                  {o.subtext && <span className="text-[11px] text-gray-500 uppercase font-black tracking-widest">{o.subtext}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSelect;
