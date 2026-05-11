import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, X } from 'lucide-react';

const CustomerSearchInput = ({ onSelect, onCancel }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const search = async (q) => {
    if (q.length < 2) return;
    setIsLoading(true);
    try {
      // Intentar RPC v3
      const { data: rpcData, error: rpcErr } = await supabase.rpc('search_customers_v3', { query_text: q });
      if (!rpcErr && rpcData) {
        setResults(rpcData);
      } else {
        // Fallback directo
        const { data: dirData } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email')
          .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(5);
        if (dirData) setResults(dirData);
      }
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative z-[120]" ref={containerRef}>
      <div className="flex gap-1">
        <input 
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nombre o email..."
          className="w-full bg-blue-500/10 border border-blue-400/40 rounded px-2 py-1 text-xs text-blue-100 font-bold outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3 text-gray-500" /></button>
      </div>
      {query.length >= 2 && (
        <div className="absolute top-full left-0 w-80 bg-white border border-gray-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 z-[130]">
          {isLoading ? (
            <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin text-brand mx-auto" /></div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 italic">No hay resultados</div>
          ) : (
            results.map(c => (
              <button 
                key={c.id} 
                onClick={() => onSelect(c)}
                className="w-full text-left p-3 hover:bg-brand/5 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-start gap-3 group/res"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm text-gray-900 group-hover/res:text-brand truncate">
                    {c.first_name || c.name} {c.last_name || ''}
                  </span>
                  <span className="text-xs text-slate-600 font-bold truncate">{c.email || 'Sin contacto'}</span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                   <span className="text-[11px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                     {c.booked_activity || 'General'}
                   </span>
                   {c.booking_date && (
                     <span className="text-[11px] text-slate-800 font-black bg-slate-100 px-1.5 py-0.5 rounded">
                       {new Date(c.booking_date).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit'})}
                     </span>
                   )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchInput;
