import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Billing_GridRow_CustomerSearchInput({
  item,
  handleItemUpdate,
  onCancel,
}) {
  const [query, setQuery] = useState(item.temporary_name || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [direction, setDirection] = useState('down');
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isSavingLocal = useRef(false);

  // Detect dropdown direction based on available space inside the scroll container
  useEffect(() => {
    if (query.length >= 2 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollContainer = containerRef.current.closest('.custom-scrollbar');

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const spaceBelowInContainer = containerRect.bottom - rect.bottom;
        setDirection(spaceBelowInContainer < 320 ? 'up' : 'down');
      } else {
        const spaceBelow = window.innerHeight - rect.bottom;
        setDirection(spaceBelow < 350 ? 'up' : 'down');
      }
    }
  }, [query]);

  // Debounced search: RPC first, direct query fallback
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        const q = query.trim();

        let data = null;

        // 1. Try RPC
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('search_customers_v3', { query_text: q });
          if (!rpcErr && rpcData) {
            data = rpcData;
          } else if (rpcErr) {
            console.warn('[Search] RPC failed, falling back:', rpcErr.message);
          }
        } catch (e) {
          console.warn('[Search] RPC error, falling back:', e);
        }

        // 2. Direct fallback
        if (!data || data.length === 0) {
          const { data: directData, error: dirErr } = await supabase
            .from('customers')
            .select('*')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
            .limit(8);

          if (!dirErr && directData) {
            data = directData;
          } else if (dirErr) {
            console.error('[Search] Direct query failed:', dirErr.message);
            setError('Error en búsqueda');
          }
        }

        setResults(data || []);
      } catch (err) {
        console.error('[Search] Critical error:', err);
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 400);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [query]);

  // Save as temporary name (when no real customer is selected)
  const handleSaveTemporary = async () => {
    if (isSavingLocal.current) return;
    isSavingLocal.current = true;
    await handleItemUpdate(item, 'temporary_name', query.trim());
    onCancel();
  };

  return (
    <div className="py-1 relative w-full h-full z-[1001]" ref={containerRef}>
      <input
        autoFocus
        type="text"
        value={query}
        placeholder="Nombre o Alias..."
        aria-label="Buscar o crear cliente"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSaveTemporary();
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={() => {
          // Delay to allow clicking on results
          setTimeout(() => {
            if (!isSavingLocal.current) handleSaveTemporary();
          }, 400);
        }}
        className="w-full bg-blue-50 border border-blue-400 text-gray-900 px-2 py-0.5 text-xs rounded outline-none font-bold focus:ring-2 focus:ring-brand"
      />

      {query.length >= 2 && (
        <div className={`absolute left-0 right-[-140px] z-[1002] bg-white border-2 border-brand/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
          {isLoading ? (
            <div className="px-4 py-3 text-[11px] text-brand font-black flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              BUSCANDO...
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-[11px] text-red-500 font-bold">{error}</div>
          ) : results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {results.map(c => (
                <div
                  key={c.id}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSavingLocal.current) return;
                    isSavingLocal.current = true;

                    try {
                      await handleItemUpdate(item, {
                        customer_id: c.id,
                        temporary_name: null,
                        _customer: c,
                      });
                    } catch (err) {
                      console.error('[Search] Update FAILED:', err);
                      alert('Error al vincular: ' + err.message);
                    } finally {
                      onCancel();
                    }
                  }}
                  className="px-3 py-2.5 hover:bg-brand/5 cursor-pointer border-b border-gray-100 last:border-0 transition-colors flex justify-between items-start gap-3 group/res"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="text-[12px] font-black text-gray-900 group-hover/res:text-brand truncate">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-[11px] text-brand/90 truncate">{c.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-black px-2 py-1 rounded-md uppercase tracking-tight shadow-sm border border-amber-100">
                      {c.booked_activity || 'General'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="px-4 py-3">
              <div className="text-[12px] font-black text-gray-800">No hay coincidencias</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Pulsa Enter para nombre provisional</div>
            </div>
          ) : (
            <div className="px-4 py-2 text-[10px] text-gray-300 font-black italic">Preparando...</div>
          )}
        </div>
      )}
    </div>
  );
}
