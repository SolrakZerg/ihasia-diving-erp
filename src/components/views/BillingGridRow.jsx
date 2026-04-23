import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, Trash2, Target, User, Search, 
  CheckCircle2, X, Plus, Unlink, LogOut, Calendar,
  Coins
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SmartActivitySelect = ({ value, activities, onChange, placeholder = "Elegir Actividad..." }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);

  const selectedActivity = activities.find(a => a.id === localValue);
  
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < 280 ? 'up' : 'down');
    }
  }, [isOpen]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const filtered = useMemo(() => {
    if (!searchTerm) return activities;
    const lowerSearch = searchTerm.toLowerCase();
    return activities.filter(a => a.name.toLowerCase().includes(lowerSearch));
  }, [activities, searchTerm]);

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
      <div 
        className="w-full h-full flex items-center cursor-text"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className={`bg-transparent text-sm w-full outline-none cursor-text focus-visible:ring-1 focus-visible:ring-brand-light rounded-sm ${
            !selectedActivity && !isOpen ? 'text-gray-400 italic font-normal' : 'text-gray-900 font-black'
          }`}
          value={isOpen ? searchTerm : (selectedActivity?.name || '')}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Seleccionar actividad"
        />
        {!isOpen && (
          <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        )}
      </div>

      {isOpen && (
        <div className={`absolute left-[-40px] z-[100] w-[280px] bg-white border border-gray-200 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
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
};

// -----------------------------------------------------------------
// INTERNAL COMPONENT: DateCell
// Standardizes the date picker with a visible icon and a hidden trigger.
// -----------------------------------------------------------------
const DateCell = ({ item, handleItemUpdate, bLine, formatSmartDate }) => {
  const dateInputRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <td className={`w-[110px] min-w-[110px] border-r border-gray-100 ${bLine} h-9 overflow-hidden relative`}>
      <button 
        onClick={handleClick}
        aria-label={`Cambiar fecha: ${item.date || 'Sin fecha'}`}
        className="flex items-center justify-center gap-1.5 h-full w-full hover:bg-white/10 transition-colors px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:z-10 group/datebtn"
      >
        <Calendar className={`w-3.5 h-3.5 transition-colors ${
          !item.date ? 'text-blue-500' : 'text-brand'
        } group-hover/datebtn:scale-110`} />
        <span className={`text-[12px] font-black transition-colors ${
          !item.date ? 'text-blue-600 italic' : 'text-gray-900'
        }`}>
          {item.date ? formatSmartDate(item.date).toUpperCase() : "FECHA"}
        </span>
      </button>
      <input 
        ref={dateInputRef}
        type="date"
        value={item.date || ""}
        onChange={(e) => handleItemUpdate(item, 'date', e.target.value)}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    </td>
  );
};

// -----------------------------------------------------------------
// INTERNAL COMPONENT: CustomerSearchInput
// Isolates search state/logic to avoid row inheritance issues.
// -----------------------------------------------------------------
const CustomerSearchInput = ({ item, handleItemUpdate, onCancel }) => {
  // We try to get the ID, but we allow rendering even if it's missing (for debugging and typing)
  const itemId = item?.id || item?.invoice_item_id;
  
  const [query, setQuery] = useState(item.temporary_name || '');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const isSavingLocal = useRef(false);

  useEffect(() => {
    if (query.length >= 2 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDirection(spaceBelow < 280 ? 'up' : 'down');
    }
  }, [query]);

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
        console.log(`[Search] Querying: "${q}"`);
        
        // Strategy: RPC with immediate direct fallback
        let data = null;
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('search_customers_v3', { query_text: q });
          if (!rpcErr && rpcData) {
             data = rpcData;
             console.log(`[Search] RPC success: ${data.length} results`);
          } else if (rpcErr) {
             console.warn("[Search] RPC failed/missing, falling back to direct query:", rpcErr.message);
          }
        } catch (e) {
          console.warn("[Search] RPC error, falling back:", e);
        }

        if (!data || data.length === 0) {
          const { data: directData, error: dirErr } = await supabase
            .from('customers')
            .select('*')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
            .limit(8);
          
          if (!dirErr && directData) {
            data = directData;
            console.log(`[Search] Direct fallback success: ${data.length} results`);
          } else if (dirErr) {
            console.error("[Search] Direct query failed:", dirErr.message);
            setError("Error en búsqueda");
          }
        }

        setResults(data || []);
      } catch (err) {
        console.error("[Search] Critical error:", err);
        setError("Error de conexión");
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 400); // Slightly more debouncing for stability

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSaveTemporary = async () => {
    if (isSavingLocal.current) return;
    isSavingLocal.current = true;
    console.log("[Search] Saving temporary name:", query);
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
        <div className={`absolute left-0 right-[-140px] z-[1002] bg-white border-2 border-brand/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ${
          direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
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
                  onMouseDown={async (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    isSavingLocal.current = true;
                    console.log("[Search] Selected:", c.first_name);
                    await handleItemUpdate(item, 'customer_id', c.id);
                    if (item.temporary_name) await handleItemUpdate(item, 'temporary_name', null);
                    onCancel();
                  }}
                  className="px-3 py-2.5 hover:bg-brand/5 cursor-pointer border-b border-gray-100 last:border-0 transition-colors flex justify-between items-start gap-3 group/res"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="text-[12px] font-black text-gray-900 group-hover/res:text-brand truncate">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{c.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                     <span className="text-[8px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.5 rounded uppercase">
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
};

export default function BillingGridRow({ 
  invoice, 
  activities = [], 
  staff = [], 
  selectedItemIds,
  onSelectItem,
  onSelectItems,
  onUpdate,
  onDeleteInvoice,
  onExtractItem,
  handleDissolveGroup
}) {
  const [expanded, setExpanded] = useState(true);
  const [searchingId, setSearchingId] = useState(null); 
  
  const items = invoice.invoice_items || [];
  const isSelectedGroup = items.length > 0 && items.every(it => selectedItemIds.has(it.id));
  const isPartialGroup = !isSelectedGroup && items.some(it => selectedItemIds.has(it.id));

  const handleSelectGroup = (e) => {
    e.stopPropagation();
    const allSelected = items.every(it => selectedItemIds.has(it.id));
    const ids = items.map(it => it.id);
    onSelectItems(ids, !allSelected);
  };

  const handleDeleteInvoice = () => {
    // We delegate the actual logic and confirmation to the parent
    onDeleteInvoice(invoice.id);
  };

  const handleDeleteItem = async (itemId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!itemId) {
      handleDeleteInvoice();
      return;
    }

    // For single item delete, we can either use a prompt or just do it.
    // Given the user wants to avoid ugly dialogs, I'll route this through a parent handler if possible
    // but since there's no onSelectItemDelete prop yet, I'll just remove the window.confirm for now
    // or better, I will use the parent's confirmation for this too if we refactor more.
    // For now, let's just make it call onUpdate after delete to keep it simple and clean.

    try {
      const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleAddChildItem = async (e, parentItem = null) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        customer_id: parentItem?.customer_id || null,
        date: null, // Force no date per user request
        quantity: 1,
        unit_price_thb: 0,
        total_thb: 0,
        status: 'Pending'
      });
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleItemUpdate = async (item, field, value) => {
    const finalId = item?.id || item?.invoice_item_id || item?._id;
    if (!finalId) return;

    try {
      const itemId = String(finalId);
      let updates = { [field]: value };

      // Logical calculated fields
      if (field === 'activity_id') {
        const act = activities.find(a => a.id === value);
        if (act) {
          const up = Number(act.price_thb) || 0;
          const q = Number(item.quantity) || 1;
          updates.unit_price_thb = up;
          updates.total_thb = up * q;
        }
      } else if (field === 'quantity') {
        const q = Number(value) || 0;
        const up = Number(item.unit_price_thb) || 0;
        updates.total_thb = q * up;
      } else if (field === 'unit_price_thb') {
        const up = Number(value) || 0;
        const q = Number(item.quantity) || 0;
        updates.total_thb = q * up;
      }

      const { error } = await supabase.from('invoice_items').update(updates).eq('id', itemId);
      if (error) throw error;
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const paidItems = items.filter(i => i.status === 'Paid');
  const totalCount = items.length;
   const isHybrid = totalCount <= 1 && !invoice._wasGroup; 
  
  const totalSum = items.reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const pendingSum = items.filter(i => i.status !== 'Paid').reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const isAllPaid = totalCount > 0 && paidItems.length === totalCount;
  const displayTotal = isAllPaid ? totalSum : pendingSum;

  const bizumOptions = [0, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500];

  let groupStatus = 'ROJO';
  let groupStatusLabel = 'POR PAGAR';
  let groupColorClass = 'bg-red-700/80 text-white border-red-800'; 
  let groupTextColor = 'text-red-400';

  if (totalCount > 0) {
    if (paidItems.length === totalCount) {
      groupStatus = 'VERDE';
      groupStatusLabel = 'PAGADA';
      groupColorClass = 'bg-emerald-500 text-white border-emerald-500';
      groupTextColor = 'text-emerald-500';
    } else if (paidItems.length > 0) {
      groupStatus = 'NARANJA';
      groupStatusLabel = 'PARCIAL';
      groupColorClass = 'bg-orange-500 text-white border-orange-500';
      groupTextColor = 'text-orange-500';
    }
  }

  const uniqueNames = [...new Set(items.map(it => it.customers?.first_name || it.temporary_name).filter(Boolean))];
  const groupDisplayName = uniqueNames.length > 0 ? uniqueNames.join(', ') : (invoice.customers?.first_name || invoice.invoice_items?.[0]?.temporary_name || 'Sin Nombre');


  // Smart Date Logic
  const formatSmartDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    
    return `${day} ${month} ${year}`;
  };

  // Shared cells rendering for visual parity
  const renderItemCells = (item, isHybridRow = false, bLine = '') => (
    <>
      {/* 3. FECHA - REDISEÑO TOTAL (COMPONENTE INDEPENDIENTE) */}
      <DateCell 
        item={item} 
        handleItemUpdate={handleItemUpdate} 
        bLine={bLine} 
        formatSmartDate={formatSmartDate} 
      />

      {/* 4. Nombre / Buscador */}
      <td className={`px-2 py-0.5 min-w-[160px] border-r border-gray-100 relative group/cell ${bLine}`}>
        {!item.customer_id && searchingId === item.id ? (
          <CustomerSearchInput 
            item={item} 
            handleItemUpdate={handleItemUpdate}
            onCancel={() => setSearchingId(null)} 
          />
        ) : (
          <div 
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!item.customer_id) setSearchingId(item.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (!item.customer_id) setSearchingId(item.id);
              }
            }}
            className="flex items-center gap-2 overflow-hidden cursor-text h-8 px-1 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:rounded"
            aria-label={item.customers?.first_name ? `Cliente: ${item.customers.first_name}` : "Vincular nuevo cliente"}
          >
             <span className={`text-[13px] font-bold truncate block ${item.customer_id ? 'text-gray-900' : 'text-blue-600 italic font-medium'}`}>
                {item.customers?.first_name || item.temporary_name || 'Vincular Cliente...'}
             </span>
             {item.customer_id && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemUpdate(item, 'customer_id', null);
                  }}
                  aria-label="Desvincular cliente"
                  className="hidden group-hover/cell:flex items-center text-gray-400 hover:text-red-600 p-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
             )}
          </div>
        )}
      </td>

      {/* 5. Apellidos */}
      <td className={`px-2 py-0.5 min-w-[140px] border-r border-gray-100 ${bLine}`}>
        <span className="text-[13px] text-slate-800 font-bold truncate block px-1">
          {item.customers?.last_name || (item.temporary_name ? "-" : "...")}
        </span>
      </td>

      {/* 6. Email */}
      <td className={`px-2 py-0.5 min-w-[160px] border-r border-gray-100 ${bLine}`}>
        <span className="text-[13px] text-slate-500 truncate block px-1">
          {item.customers?.email || (item.temporary_name ? "-" : "")}
        </span>
      </td>

      {/* 7. Actividad */}
      <td 
        className={`px-2 py-0.5 min-w-[180px] border-r border-gray-100 transition-all duration-200 group ${bLine}`}
        style={{ 
          backgroundColor: activities.find(a => a.id === item.activity_id)?.color + '4D' || 'transparent',
          borderLeft: item.activity_id ? `4px solid ${activities.find(a => a.id === item.activity_id)?.color}` : 'none'
        }}
      >
        <SmartActivitySelect 
          value={item.activity_id ?? ''}
          activities={activities}
          onChange={(val) => handleItemUpdate(item, 'activity_id', val)}
        />
      </td>

      {/* 8. Precio */}
      <td className={`px-2 py-0.5 w-[70px] min-w-[70px] border-r border-gray-100 ${bLine}`}>
        <input 
          type="number" 
          value={item.unit_price_thb ?? 0} 
          onChange={(e) => handleItemUpdate(item, 'unit_price_thb', e.target.value)}
          aria-label="Precio unitario"
          className="bg-transparent text-gray-900 font-black text-[12px] w-full text-right outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        />
      </td>

      {/* 9. Q */}
      <td className={`px-2 py-0.5 w-[50px] min-w-[50px] border-r border-gray-100 ${bLine}`}>
        <input 
          type="number" 
          value={item.quantity ?? 1} 
          onChange={(e) => handleItemUpdate(item, 'quantity', e.target.value)}
          aria-label="Cantidad"
          className="bg-transparent text-gray-600 font-bold text-[12px] w-full text-center outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm" 
        />
      </td>

      {/* 10. Total */}
      <td className={`px-2 py-0.5 w-[90px] min-w-[90px] text-right border-r border-gray-100 ${bLine}`}>
        <div className={`px-1 py-1 rounded border-2 text-[12px] font-black tracking-tight ${
          item.status === 'Paid' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {Number(item.total_thb ?? 0).toLocaleString()} ฿
        </div>
      </td>
      {/* 11. Estado */}
      <td className={`px-2 py-0.5 w-[100px] min-w-[100px] border-r border-gray-100 ${bLine}`}>
        <button 
          onClick={() => handleItemUpdate(item, 'status', item.status === 'Paid' ? 'Pending' : 'Paid')}
          aria-label={`Cambiar estado de pago. Actual: ${item.status === 'Paid' ? 'Pagado' : 'Pendiente'}`}
          className={`w-full py-1 rounded text-[10px] font-black border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {item.status === 'Paid' ? 'PAGADO' : 'PENDIENTE'}
        </button>
      </td>
      {/* 12. Medio */}
      <td className={`px-2 py-0.5 w-[100px] min-w-[100px] border-r border-gray-100 ${bLine}`}>
        <div className="relative group/select">
          <select 
             value={item.payment_method || ''} 
             onChange={(e) => handleItemUpdate(item, 'payment_method', e.target.value)}
             className={`appearance-none bg-transparent text-[11px] font-black uppercase text-center w-full px-1 py-1 rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
               !item.payment_method ? 'text-transparent' : 'text-gray-800'
             }`}
           >
             <option value="">CASH ฿</option>
             <option value="WISE BT">WISE BT</option>
             <option value="WISE CR">WISE CR</option>
             <option value="EUR BT">EUR BT</option>
             <option value="EUR CR">EUR CR</option>
           </select>
           <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-gray-500 group-hover/select:text-gray-700">
             <ChevronDown className="w-3 h-3" strokeWidth={4} />
           </div>
        </div>
      </td>
      {/* 13. Instr */}
      <td className={`px-2 py-0.5 w-[70px] min-w-[70px] border-r border-gray-100 ${bLine}`}>
        {(() => {
          const act = activities.find(a => a.id === item.activity_id);
          const cat = act?.category?.toLowerCase() || '';
          const isStaffDisabled = cat.includes('snorkeling') || cat.includes('snorkelling') || cat === 'retail';
          
          return (
            <select 
               value={item.instructor_id || ''} 
               onChange={(e) => handleItemUpdate(item, 'instructor_id', e.target.value || null)}
               disabled={isStaffDisabled}
               title={isStaffDisabled ? `Staff no disponible para ${act?.category}` : "Asignar Instructor"}
               className={`bg-transparent text-sm font-bold w-full text-center outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm transition-opacity ${
                 isStaffDisabled ? 'opacity-20 cursor-not-allowed text-gray-400' : 'text-cyan-700 opacity-100 cursor-pointer'
               }`}
             >
               <option value="">-</option>
               {staff.map(s => <option key={s.id} value={s.id}>{s.initials}</option>)}
             </select>
          );
        })()}
      </td>
      {/* 14. BIZUM */}
      <td className={`px-1 py-0.5 w-[60px] min-w-[60px] text-center border-r border-gray-100 transition-colors ${
        Number(item.bizum_deposit_eur || 0) > 0 ? 'bg-red-700' : ''
      } ${bLine}`}>
        <div className="relative group/bizum h-full flex items-center">
          <select 
             value={item.bizum_deposit_eur || 0} 
             onChange={(e) => handleItemUpdate(item, 'bizum_deposit_eur', Number(e.target.value))}
             disabled={!item.customer_id}
             className={`appearance-none bg-transparent font-black outline-none text-[11px] w-full text-center pr-3 transition-colors ${
               Number(item.bizum_deposit_eur || 0) === 0 ? 'text-transparent' : 'text-white'
             } disabled:opacity-30 cursor-pointer`}
           >
             {bizumOptions.map(val => <option key={val} value={val} className="text-gray-900 bg-white">{val}€</option>)}
           </select>
           <div className={`absolute inset-y-0 right-0 flex items-center pointer-events-none transition-opacity ${
             Number(item.bizum_deposit_eur || 0) === 0 ? 'opacity-0' : 'opacity-100'
           }`}>
             <ChevronDown className="w-3 h-3 text-white/90" />
           </div>
        </div>
      </td>
      {/* 15. COMISIÓN */}
      <td className={`px-2 py-0.5 w-[50px] min-w-[50px] border-r border-gray-100 text-center ${bLine}`}>
        <button 
          disabled={!item.activity_id}
          onClick={() => handleItemUpdate(item, 'is_comm', !item.is_comm)}
          className={`p-1.5 rounded-lg transition-all border ${
            item.activity_id 
              ? item.is_comm 
                ? 'bg-amber-500 text-white border-amber-600 shadow-inner' 
                : 'bg-white text-gray-200 border-gray-100 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
              : 'opacity-10 cursor-not-allowed border-transparent'
          }`}
          title={item.is_comm ? "Comisionable" : "Marcar Comisión"}
        >
          <Coins className={`w-4 h-4 ${item.is_comm ? 'fill-current' : ''}`} />
        </button>
      </td>
      {/* 16. Notas */}
      <td className={`px-2 py-0.5 w-auto border-r border-gray-100 ${bLine}`}>
        <input 
          type="text" placeholder="Notas..."
          defaultValue={item.notes || ''} 
          onBlur={(e) => handleItemUpdate(item, 'notes', e.target.value)}
          className="bg-transparent text-gray-900 text-[11px] font-bold w-full outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm truncate" 
        />
      </td>

      {/* 16. Action Icon */}
      <td className={`px-2 py-0.5 w-[80px] min-w-[80px] text-center ${bLine} ${isHybridRow ? '' : rb}`}>
        <div className="flex items-center justify-center gap-1">
          {(!isHybridRow || (isHybridRow && items.length > 1)) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onExtractItem(item.id, item.customer_id); }} 
              className="p-1 hover:bg-brand/10 text-brand/50 hover:text-brand rounded transition-colors"
              title="Extraer a nueva factura propia"
            >
              <LogOut className="w-3.5 h-3.5 rotate-[-90deg]" />
            </button>
          )}
          <button 
            onClick={(e) => handleDeleteItem(item.id, e)} 
            className="p-1 hover:bg-red-50 text-red-500/50 hover:text-red-600 rounded transition-colors" 
            title="Borrar Registro"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </>
  );

  // Configuración de Estilo del Grupo
  const mainGroupColor = '#4f4f4f'; 
  const lb = 'border-l-2 border-l-[var(--group-color)]'; 
  const rb = 'border-r-2 border-r-[var(--group-color)]'; 
  const tb = 'border-t-2 border-t-[var(--group-color)]'; 
  const bb = 'border-b-2 border-b-[var(--group-color)]'; 

  if (isHybrid) {
    const item = items[0] || { date: new Date().toLocaleDateString('en-CA'), customers: {} };
    const statusColor = groupStatus === 'VERDE' ? 'bg-emerald-500' : 
                        groupStatus === 'NARANJA' ? 'bg-orange-500' : 'bg-red-400';

    return (
      <tr 
        className="font-bold bg-white hover:bg-gray-50 group h-9 relative border-b border-gray-100"
        style={{ '--group-color': mainGroupColor }}
      >
        <td className="px-0 py-0 w-[48px] min-w-[48px] border-r border-gray-100 relative">
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`} />
          <div className="flex justify-center items-center h-full pl-1">
            <input 
              type="checkbox" 
              checked={selectedItemIds.has(item.id)} 
              onChange={() => onSelectItem(item.id)} 
              className="w-5 h-5 rounded cursor-pointer" 
            />
          </div>
        </td>
         <td className="px-0 py-0 w-[50px] min-w-[50px] border-r border-gray-100">
          <div className="flex justify-center items-center">
            <button onClick={(e) => handleAddChildItem(e, item)} className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded transition-all">
               <Plus className="w-4 h-4" />
            </button>
          </div>
        </td>
        {renderItemCells(item, true)}
      </tr>
    );
  }

  return (
    <>
      <tr 
        className="font-black transition-all cursor-pointer bg-[var(--group-color)] group h-10 relative z-10" 
        style={{ '--group-color': mainGroupColor }}
        onClick={() => setExpanded(!expanded)}
      >
        <td className={`px-0 py-0 w-[48px] min-w-[48px] relative ${lb} ${tb}`} onClick={e => e.stopPropagation()}>
           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${groupStatus === 'VERDE' ? 'bg-emerald-500' : groupStatus === 'NARANJA' ? 'bg-orange-500' : 'bg-red-400'}`} />
           <div className="flex justify-center items-center h-full pl-1">
             <input 
              type="checkbox" 
              checked={isSelectedGroup} 
              ref={el => el && (el.indeterminate = isPartialGroup)}
              onChange={handleSelectGroup} 
              className="w-5 h-5 rounded cursor-pointer" 
             />
           </div>
        </td>
        <td className={`w-[50px] min-w-[50px] ${tb}`}></td>
        <td colSpan={6} className={`px-4 py-0 text-center ${tb}`}>
           <span className="text-lg font-black text-white tracking-tight uppercase leading-tight">{groupDisplayName}</span>
        </td>
        <td className={`w-[50px] min-w-[50px] ${tb}`}></td>
        <td className={`px-3 py-0 w-[100px] min-w-[100px] text-right ${tb}`}>
           <span className={`font-black text-lg ${groupTextColor} leading-tight`}>{displayTotal.toLocaleString()} ฿</span>
        </td>
        <td className={`px-2 py-0 w-[110px] min-w-[110px] text-center ${tb}`}>
            <div className={`mx-1 py-1.5 rounded font-black text-xs uppercase tracking-wider shadow-lg leading-none ${groupColorClass}`}>
              {groupStatusLabel}
            </div>
        </td>
        <td className={`w-[110px] min-w-[110px] ${tb}`}></td>
        <td className={`w-[70px] min-w-[70px] ${tb}`}></td>
        <td className={`w-[60px] min-w-[60px] ${tb}`}></td>
        <td className={`w-[50px] min-w-[50px] ${tb}`}></td>
        <td className={`w-auto ${tb}`}></td>
        <td className={`px-2 py-0 w-[80px] min-w-[80px] text-center ${rb} ${tb}`} onClick={e => e.stopPropagation()}>
           <div className="flex items-center justify-center gap-1.5 px-2">
             <button 
               onClick={() => handleDissolveGroup(invoice.id)} 
               className="p-1.5 hover:bg-gray-900/10 text-gray-900 hover:text-black transition-all rounded"
               title="Desagrupar todos (romper grupo)"
             >
               <Unlink className="w-4 h-4" />
             </button>
             <button 
               onClick={handleDeleteInvoice} 
               className="p-1.5 hover:bg-red-50 text-red-600/50 hover:text-red-600 transition-all rounded"
               title="ELIMINAR FACTURA COMPLETA"
             >
               <Trash2 className="w-4 h-4" />
             </button>
           </div>
        </td>
      </tr>

      {expanded && items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const bLine = isLast ? bb : ''; 
        
        return (
          <tr 
            key={item.id} 
            className="font-bold bg-white hover:bg-gray-50 group h-9 border-b border-gray-100 transition-colors"
            style={{ '--group-color': mainGroupColor }}
          >
            <td className={`px-0 py-0 w-[48px] min-w-[48px] border-r border-gray-100 relative ${bLine}`}>
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Paid' ? 'bg-emerald-500' : 'bg-red-400'}`} />
               <div className="flex justify-center items-center h-full pl-1">
                  <input 
                    type="checkbox" 
                    checked={selectedItemIds.has(item.id)} 
                    onChange={() => onSelectItem(item.id)} 
                    className="w-5 h-5 rounded hover:opacity-100 transition-opacity cursor-pointer" 
                  />
               </div>
            </td>
             <td className={`w-[50px] min-w-[50px] border-r border-gray-100 ${bLine}`}>
              <div className="flex justify-center items-center">
                <button onClick={(e) => handleAddChildItem(e, item)} className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded transition-all">
                   <Plus className="w-4 h-4" />
                </button>
              </div>
            </td>
            {renderItemCells(item, false, bLine)}
          </tr>
        );
      })}
    </>
  );
}
