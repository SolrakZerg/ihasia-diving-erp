import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Search } from 'lucide-react';

/**
 * SmartSelect — Unificado y altamente personalizable.
 * Soporta buscador en tiempo real, dirección de despliegue inteligente (up/down),
 * agrupaciones por categorías, renderizadores a medida para botón e ítems, y borrado rápido.
 */
const SmartSelect = ({
  value,
  options = [],
  onChange,
  placeholder = "Seleccionar...",
  triggerClassName = "",
  dropdownClassName = "absolute left-0 w-64 bg-[#1a1c2d] border border-brand/30 rounded-xl shadow-2xl z-[250] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
  searchContainerClassName = "p-2 border-b border-surface-edge/30 flex items-center gap-1.5 bg-black/20",
  searchInputClassName = "w-full bg-surface-edge/20 border border-brand/20 rounded px-2 py-1 text-[11px] text-white outline-none focus:border-brand/50 transition-colors",
  optionClassName = (o, isSelected) => `w-full text-left px-3 py-2.5 hover:bg-brand/10 border-b border-surface-edge/10 flex flex-col transition-colors ${isSelected ? 'bg-brand/10 font-bold' : ''}`,
  placement = "auto", // 'auto' | 'up' | 'down'
  renderTrigger,      // (selectedOption, isOpen, setIsOpen) => ReactNode
  renderOption,       // (option, isSelected) => ReactNode
  showClear = false,
  clearLabel = "— Quitar —",
  groupByKey = null,  // p.ej. 'category'
  searchIcon = <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dir, setDir] = useState('down');
  const containerRef = useRef(null);

  // Encontrar opción seleccionada (flexible con tipos string / number)
  const selectedOption = options.find(o => String(o.id) === String(value));

  // Filtrado inteligente por cualquiera de los campos de texto del objeto
  const filtered = options.filter(o => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    
    const nameMatch = o.name?.toLowerCase().includes(lower);
    const subtextMatch = o.subtext?.toLowerCase().includes(lower);
    const acronymMatch = o.acronym?.toLowerCase().includes(lower);
    const initialsMatch = o.initials?.toLowerCase().includes(lower);
    const firstNameMatch = o.first_name?.toLowerCase().includes(lower);
    const lastNameMatch = o.last_name?.toLowerCase().includes(lower);
    const categoryMatch = o.category?.toLowerCase().includes(lower);

    return nameMatch || subtextMatch || acronymMatch || initialsMatch || firstNameMatch || lastNameMatch || categoryMatch;
  });

  // Detectar y ajustar la dirección de despliegue si es 'auto'
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'auto') {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setDir(spaceBelow < 280 ? 'up' : 'down');
      } else {
        setDir(placement);
      }
    }
  }, [isOpen, placement]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ── Botón Disparador (Trigger) ── */}
      {renderTrigger ? (
        renderTrigger(selectedOption, isOpen, setIsOpen)
      ) : (
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-surface border border-surface-edge rounded px-2 py-1.5 text-left text-xs flex items-center justify-between group text-white font-bold transition-all ${triggerClassName}`}
        >
          <span className={selectedOption ? 'text-white' : 'text-gray-500 italic'}>
            {selectedOption 
              ? (selectedOption.name || selectedOption.initials || `${selectedOption.first_name || ''} ${selectedOption.last_name || ''}`.trim()) 
              : placeholder}
          </span>
          <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* ── Desplegable (Dropdown) ── */}
      {isOpen && (
        <div 
          className={`${dropdownClassName} ${
            dir === 'up' ? 'bottom-full mb-2' : 'top-full mt-1'
          }`}
        >
          {/* Campo de búsqueda interno */}
          <div className={searchContainerClassName}>
            {searchIcon}
            <input 
              autoFocus
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={searchInputClassName}
            />
          </div>

          {/* Listado de Opciones con scrollbar personalizada */}
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
            {/* Opción de borrar / limpiar */}
            {showClear && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(null);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider text-red-400 hover:bg-rose-500/10 hover:text-red-300 font-black border-b border-surface-edge/10 flex items-center transition-colors"
              >
                {clearLabel}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-gray-500 italic">No hay resultados</div>
            ) : (
              (() => {
                let lastGroup = null;
                return filtered.map(o => {
                  // Agrupación visual por campo
                  const showHeader = groupByKey && o[groupByKey] !== lastGroup;
                  if (groupByKey) lastGroup = o[groupByKey];

                  const isSelected = String(o.id) === String(value);

                  return (
                    <div key={o.id}>
                      {showHeader && (
                        <div className="px-3 py-1 bg-slate-800 text-[9px] font-black text-slate-350 uppercase tracking-[0.2em] shadow-inner select-none">
                          {o[groupByKey] || 'Otros'}
                        </div>
                      )}
                      
                      <button 
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onChange(o);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={typeof optionClassName === 'function' ? optionClassName(o, isSelected) : optionClassName}
                      >
                        {renderOption ? (
                          renderOption(o, isSelected)
                        ) : (
                          <>
                            <span className="text-xs font-bold text-white">
                              {o.name || o.initials || `${o.first_name || ''} ${o.last_name || ''}`.trim()}
                            </span>
                            {o.subtext && (
                              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">
                                {o.subtext}
                              </span>
                            )}
                          </>
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
};

export default SmartSelect;
