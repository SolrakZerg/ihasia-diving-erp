import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Trash2, Target, User, Search, 
  CheckCircle2, X, Plus, Unlink, LogOut, Calendar,
  Coins, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SmartActivitySelect = ({ value, activities = [], onChange, placeholder = "Elegir Actividad..." }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);

  const selectedActivity = activities.find(a => String(a.id) === String(localValue));
  
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

      {isOpen && (
        <div className={`absolute left-0 z-[100] w-[280px] bg-white border border-gray-200 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
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
    <td className={`w-[110px] min-w-[110px] border-r border-gray-100 ${bLine} h-[30px] overflow-hidden relative py-0`}>
      <button 
        onClick={handleClick}
        aria-label={`Cambiar fecha: ${item.date || 'Sin fecha'}`}
        className="flex items-center justify-center gap-1.5 h-full w-full hover:bg-white/10 transition-colors px-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:z-10 group/datebtn"
      >
        <Calendar className={`w-3.5 h-3.5 transition-colors ${
          !item.date ? 'text-red-500 animate-pulse' : 'text-brand'
        } group-hover/datebtn:scale-110`} />
        <span className={`text-[12px] font-black transition-all whitespace-nowrap ${
          !item.date ? 'text-red-600 animate-pulse bg-red-50 px-1.5 py-0.5 rounded border border-red-200' : 'text-gray-900'
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
      const scrollContainer = containerRef.current.closest('.custom-scrollbar');
      
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const spaceBelowInContainer = containerRect.bottom - rect.bottom;
        // If there's less than 320px inside the scrollable area, flip up
        setDirection(spaceBelowInContainer < 320 ? 'up' : 'down');
      } else {
        // Fallback to window
        const spaceBelow = window.innerHeight - rect.bottom;
        setDirection(spaceBelow < 350 ? 'up' : 'down');
      }
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
                  onClick={async (e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    if (isSavingLocal.current) {
                      console.log("[Search] Already saving, skipping click");
                      return;
                    }
                    isSavingLocal.current = true;
                    
                    console.log("[Search] SELECTING CUSTOMER:", c.first_name, c.id);
                    
                    try {
                      // Atomic update
                      await handleItemUpdate(item, { 
                        customer_id: c.id, 
                        temporary_name: null,
                        _customer: c 
                      });
                      console.log("[Search] Update successful for:", c.first_name);
                    } catch (err) {
                      console.error("[Search] Update FAILED:", err);
                      alert("Error al vincular: " + err.message);
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
                    <div className="text-[11px] text-slate-500 truncate">{c.email}</div>
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
};

export default function BillingGridRow({ 
  invoice, 
  activities = [], 
  categories = [], 
  staff = [], 
  selectedItemIds,
  onSelectItem,
  onToggleGroup,
  onSelectItems,
  onUpdate,
  onDeleteInvoice,
  onExtractItem,
  handleDissolveGroup,
  setConfirmConfig
}) {
  const storageKey = `billing-group-expanded-${invoice.id}`;
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === 'true' : true;
  });

  const toggleExpanded = () => {
    setExpanded(prev => {
      const newVal = !prev;
      localStorage.setItem(storageKey, String(newVal));
      return newVal;
    });
  };

  const [searchingId, setSearchingId] = useState(null); 
  
  const itemsProp = invoice.invoice_items || [];
  const [localItems, setLocalItems] = useState(itemsProp);

  // Sincronizar con los datos reales cuando cambian de forma externa
  useEffect(() => {
    setLocalItems(itemsProp);
  }, [itemsProp]);

  const items = localItems;
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

    // Pedimos confirmación siempre antes de borrar
    if (setConfirmConfig) {
      setConfirmConfig({
        show: true,
        title: 'Borrar Registro',
        message: items.length === 1 
          ? 'Este es el último registro de la factura. Si lo borras, se eliminará la factura completa. ¿Deseas continuar?'
          : '¿Estás seguro de que deseas eliminar este registro?',
        type: 'danger',
        onConfirm: async () => {
          try {
            // Si es el último item, borramos la factura entera
            if (items.length === 1) {
              const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
              if (error) throw error;
            } else {
              // Si hay más items, solo borramos este
              const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
              if (error) throw error;
            }
            
            if (onUpdate) onUpdate();
            setConfirmConfig(prev => ({ ...prev, show: false }));
          } catch (err) {
            console.error('Error deleting:', err);
            alert("Error al borrar: " + err.message);
          }
        }
      });
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

  const handleItemUpdate = async (item, fieldOrUpdates, value) => {
    const finalId = item?.id || item?.invoice_item_id || item?._id;
    if (!finalId) return;

    try {
      const itemId = String(finalId);
      let updates = typeof fieldOrUpdates === 'object' ? { ...fieldOrUpdates } : { [fieldOrUpdates]: value };

      // Logical calculated fields (if quantity or price changes)
      if (updates.activity_id) {
        const act = activities.find(a => String(a.id) === String(updates.activity_id));
        if (act) {
          const up = Number(act.price_thb) || 0;
          const q = Number(item.quantity ?? 1);
          updates.unit_price_thb = up;
          updates.total_thb = up * q;
          
          const isCommAllowed = act.is_commissionable;
          if (!isCommAllowed) {
            updates.is_comm = false;
          }

          // CLEANUP: If the new activity category doesn't require staff, clear instructor_id
          const categoryData = categories.find(c => c.name === act.category);
          const isStaffDisabled = categoryData ? categoryData.requires_staff === false : false;
          if (isStaffDisabled) {
            updates.instructor_id = null;
          }
        }
      } else if (updates.quantity !== undefined) {
        const q = Number(updates.quantity) || 0;
        const up = Number(item.unit_price_thb) || 0;
        updates.total_thb = q * up;
      } else if (updates.unit_price_thb !== undefined) {
        const up = Number(updates.unit_price_thb) || 0;
        const q = Number(item.quantity ?? 1);
        updates.total_thb = q * up;
      }

      // 1. SMART OPTIMISTIC UPDATE
      // If we are linking a customer, we inject the object so the UI reflects it immediately
      let optimisticItemUpdates = { ...updates };
      if (updates._customer) {
        optimisticItemUpdates.customers = updates._customer;
        delete updates._customer; // Don't send internal helper to DB
      }

      setLocalItems(prev => prev.map(it => 
        String(it.id) === String(itemId) ? { ...it, ...optimisticItemUpdates } : it
      ));

      // 2. DATABASE UPDATE
      console.log("[DB] Updating item", itemId, "with", updates);
      const { error } = await supabase.from('invoice_items').update(updates).eq('id', itemId);
      
      if (error) {
        console.error("[DB] Error updating item:", error);
        throw error;
      }
      
      console.log("[DB] Update confirmed for", itemId);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating item:', err);
      if (onUpdate) onUpdate(); 
    }
  };

  const paidItems = items.filter(i => i.status === 'Paid');
  const totalCount = items.length;
   const isHybrid = totalCount <= 1 && !invoice._wasGroup; 
  
  const totalSum = items.reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const pendingSum = items.filter(i => i.status !== 'Paid').reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const isAllPaid = totalCount > 0 && paidItems.length === totalCount;
  const displayTotal = isAllPaid ? totalSum : pendingSum;

  const bizumOptions = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500];

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

  let groupDisplayName = 'Sin Nombre';
  
  const entities = items.map(it => ({
    id: it.customer_id || `temp-${it.temporary_name}`,
    firstName: it.customers?.first_name || it.temporary_name,
    lastName: it.customers?.last_name || ''
  })).filter(e => e.firstName);

  const uniqueEntities = [];
  const seenIds = new Set();
  for (const e of entities) {
    if (!seenIds.has(e.id)) {
      seenIds.add(e.id);
      uniqueEntities.push(e);
    }
  }

  if (uniqueEntities.length === 1) {
    groupDisplayName = `${uniqueEntities[0].firstName} ${uniqueEntities[0].lastName}`.trim();
  } else if (uniqueEntities.length > 1) {
    groupDisplayName = uniqueEntities.map(e => e.firstName).join(', ');
  } else {
    groupDisplayName = invoice.customers?.first_name 
      ? `${invoice.customers.first_name} ${invoice.customers.last_name || ''}`.trim() 
      : 'Sin Nombre';
  }
  
  const isAnyInstructorMissing = items.some(item => {
    const act = activities.find(a => String(a.id) === String(item.activity_id));
    const categoryData = categories.find(c => c.name === act?.category);
    const isStaffDisabled = categoryData ? categoryData.requires_staff === false : false;
    return !item.instructor_id && !isStaffDisabled && item.activity_id;
  });

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
  const renderItemCells = (item, isHybridRow = false, bLine = '') => {
    const act = activities.find(a => String(a.id) === String(item.activity_id));
    const categoryData = categories.find(c => c.name === act?.category);
    const isStaffDisabled = categoryData ? categoryData.requires_staff === false : false;

    return (
      <>
        {/* 3. FECHA - REDISEÑO TOTAL (COMPONENTE INDEPENDIENTE) */}
        <DateCell 
          item={item} 
          handleItemUpdate={handleItemUpdate} 
          bLine={bLine} 
          formatSmartDate={formatSmartDate} 
        />

        {/* 4. Nombre / Buscador */}
        <td className={`px-1 py-0 border-r border-gray-100 relative group/cell ${bLine}`}>
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
              className="flex items-center gap-2 overflow-hidden cursor-text h-full px-1 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:rounded"
              aria-label={item.customers?.first_name ? `Cliente: ${item.customers.first_name}` : "Vincular nuevo cliente"}
            >
               <span className={`text-[13px] font-bold truncate block ${item.customer_id ? 'text-gray-900' : 'text-blue-600 italic font-medium'}`}>
                  {item.customers?.first_name || item.temporary_name || 'Vincular Cliente...'}
               </span>
               {item.customer_id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setConfirmConfig) {
                        setConfirmConfig({
                          show: true,
                          title: 'Desvincular Cliente',
                          message: `Estás a punto de desvincular a ${item.customers?.first_name || 'este cliente'} del registro. ¿Deseas continuar?`,
                          type: 'danger',
                          onConfirm: () => {
                            handleItemUpdate(item, 'customer_id', null);
                            setConfirmConfig(prev => ({ ...prev, show: false }));
                          }
                        });
                      }
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
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <span className="text-[13px] text-slate-800 font-bold truncate block">
            {item.customers?.last_name || (item.temporary_name ? "-" : "...")}
          </span>
        </td>

        {/* 6. Email */}
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <span className="text-[12px] text-slate-500 truncate block">
            {item.customers?.email || (item.temporary_name ? "-" : "")}
          </span>
        </td>

        {/* 7. Actividad */}
        <td 
          className={`px-1 py-0 border-r border-gray-100 transition-all duration-200 group relative ${bLine} focus-within:z-50`}
          style={{ 
            backgroundColor: act?.color ? act.color + '4D' : 'transparent',
            borderLeft: item.activity_id && act?.color 
              ? `4px solid ${act.color}` 
              : 'none'
          }}
        >
          <SmartActivitySelect 
            value={item.activity_id ?? ''}
            activities={activities}
            onChange={(val) => handleItemUpdate(item, 'activity_id', val)}
          />
        </td>

        {/* 8. Precio */}
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <input 
            type="number" 
            value={item.unit_price_thb ?? 0} 
            onChange={(e) => handleItemUpdate(item, 'unit_price_thb', e.target.value)}
            aria-label="Precio unitario"
            className="bg-transparent text-gray-900 font-black text-sm w-full h-6 text-right outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </td>

        {/* 9. Q */}
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <input 
            type="number" 
            value={item.quantity ?? 1} 
            onChange={(e) => handleItemUpdate(item, 'quantity', e.target.value)}
            aria-label="Cantidad"
            className="bg-transparent text-gray-600 font-black text-sm w-full h-6 text-center outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm py-0" 
          />
        </td>

        {/* 10. Total */}
        <td className={`px-1 py-0 text-right border-r border-gray-100 ${bLine}`}>
          <div className={`px-1 h-6 flex items-center justify-end rounded border-2 text-sm font-black tracking-tight whitespace-nowrap ${
            item.status === 'Paid' 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {Number(item.total_thb ?? 0).toLocaleString()} ฿
          </div>
        </td>
        {/* 11. Estado */}
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <div 
            className="relative group/status"
            onDoubleClick={(e) => {
              e.preventDefault();
              handleItemUpdate(item, 'status', item.status === 'Paid' ? 'Pending' : 'Paid');
            }}
          >
            <select 
              value={item.status || 'Pending'} 
              onChange={(e) => handleItemUpdate(item, 'status', e.target.value)}
              className={`w-full h-6 py-0 px-1 rounded text-[12px] font-black border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand appearance-none cursor-pointer text-center ${
                item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <option value="Paid" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>PAGADO</option>
              <option value="Pending" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>PENDIENTE</option>
            </select>
            <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none opacity-0 group-hover/status:opacity-100 transition-opacity">
              <ChevronDown className={`w-3 h-3 ${item.status === 'Paid' ? 'text-emerald-600' : 'text-red-400'}`} strokeWidth={4} />
            </div>
          </div>
        </td>
        {/* 12. Medio */}
        <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
          <div className="relative group/select">
             <select 
               value={item.payment_method || ''} 
               onChange={(e) => handleItemUpdate(item, 'payment_method', e.target.value || null)}
               className={`appearance-none bg-transparent text-[12px] font-black uppercase text-center w-full h-6 px-1 py-0 rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                 !item.payment_method ? 'text-transparent' : 'text-gray-800'
               }`}
             >
               <option value="" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}></option>
               <option value="WISE BT" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>WISE BT</option>
               <option value="WISE CR" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>WISE CR</option>
               <option value="EUR BT" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>EUR BT</option>
               <option value="EUR CR" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>EUR CR</option>
             </select>
             <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-gray-500 group-hover/select:text-gray-700">
               <ChevronDown className="w-3 h-3" strokeWidth={4} />
             </div>
          </div>
        </td>
        {/* 13. Instr */}
        <td className={`px-1 py-0 border-r border-gray-100 ${
          !item.instructor_id && !isStaffDisabled ? 'bg-red-500/10' : 'bg-white'
        } ${bLine}`}>
          <div className="relative group/instr flex items-center justify-center h-full">
            {!item.instructor_id && !isStaffDisabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Falta Instructor" />
              </div>
            )}
              <select 
                value={item.instructor_id || ''} 
                onChange={(e) => handleItemUpdate(item, 'instructor_id', e.target.value || null)}
                disabled={isStaffDisabled}
                title={isStaffDisabled ? `Staff no disponible para ${act?.category}` : "Asignar Instructor"}
                className={`bg-transparent text-sm font-black w-full h-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm transition-opacity py-0 relative z-10 ${
                  isStaffDisabled ? 'opacity-20 cursor-not-allowed text-gray-400' : 
                  (!item.instructor_id && !isStaffDisabled) ? 'text-red-600 animate-pulse appearance-none' : 'text-cyan-700 opacity-100 cursor-pointer'
                }`}
              >
                <option value="" className="text-gray-400"></option>
                {staff.filter(s => s.active || s.id === item.instructor_id).map(s => <option key={s.id} value={s.id} className="text-gray-900">{s.initials}</option>)}
              </select>
          </div>
        </td>
        {/* 14. BIZUM */}
        <td 
          className={`px-1 py-0 w-[60px] min-w-[60px] text-center border-r border-gray-100 cursor-pointer relative ${
            Number(item.bizum_deposit_eur || 0) > 0 ? 'bg-red-700' : 'bg-white'
          } ${bLine}`}
          onDoubleClick={(e) => {
            e.preventDefault();
            handleItemUpdate(item, 'bizum_deposit_eur', null);
          }}
          title="Doble clic para resetear a 0€"
        >
          <select 
            value={item.bizum_deposit_eur || ''} 
            onChange={(e) => handleItemUpdate(item, 'bizum_deposit_eur', e.target.value ? Number(e.target.value) : null)}
            disabled={!item.customer_id}
            className={`appearance-none bg-transparent border-none font-black !outline-none focus:!ring-0 focus:!ring-transparent focus-visible:!outline-none text-[12px] w-full h-6 text-center pr-3 transition-colors cursor-pointer relative z-10 ${
              !item.bizum_deposit_eur ? 'text-transparent' : 'text-white'
            } disabled:opacity-30`}
          >
            <option value="" className="text-gray-900 bg-white"></option>
            {bizumOptions.map(val => <option key={val} value={val} className="text-gray-900 bg-white">{val}€</option>)}
          </select>
          <div className={`absolute inset-y-0 right-1 flex items-center pointer-events-none transition-opacity z-20 ${
            Number(item.bizum_deposit_eur || 0) === 0 ? 'opacity-0' : 'opacity-100'
          }`}>
            <ChevronDown className="w-3 h-3 text-white/90" />
          </div>
        </td>
        {/* 15. COMISIÓN */}
        <td className={`px-1 py-0 border-r border-gray-100 text-center ${bLine}`}>
          {(() => {
            const isCommDisabled = !item.activity_id || act?.is_commissionable === false;
            
            return (
              <button 
                disabled={isCommDisabled}
                onClick={() => handleItemUpdate(item, 'is_comm', !item.is_comm)}
                className={`p-0.5 rounded-md transition-all border ${
                  !isCommDisabled
                    ? item.is_comm 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-inner' 
                      : 'bg-white text-gray-200 border-gray-100 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
                    : 'opacity-10 cursor-not-allowed border-transparent'
                }`}
                title={isCommDisabled ? "No disponible para esta actividad" : (item.is_comm ? "Comisionable" : "Marcar Comisión")}
              >
                <Coins className={`w-4 h-4 ${item.is_comm ? 'fill-current' : ''}`} />
              </button>
            );
          })()}
        </td>
        {/* 16. Notas */}
        <td className={`px-1 py-0 overflow-hidden border-r border-gray-100 ${bLine}`}>
          <input 
            type="text" placeholder="..."
            defaultValue={item.notes || ''} 
            onBlur={(e) => handleItemUpdate(item, 'notes', e.target.value)}
            className="bg-transparent text-gray-700 font-medium text-[12px] w-full h-6 outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm truncate py-0" 
            title={item.notes || ''}
          />
        </td>

        {/* Acciones */}
        <td className={`px-1 py-0 text-center ${bLine} ${isHybridRow ? '' : rb}`}>
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
  };

  // Configuración de Estilo del Grupo
  const mainGroupColor = '#4f4f4f'; 
  const lb = 'border-l-4 border-l-[var(--group-color)]'; 
  const rb = 'border-r-4 border-r-[var(--group-color)]'; 
  const tb = 'border-t-4 border-t-[var(--group-color)]'; 
  const bb = 'border-b-4 border-b-[var(--group-color)]'; 

  if (isHybrid) {
    const item = items[0] || { date: new Date().toLocaleDateString('en-CA'), customers: {} };
    const statusColor = groupStatus === 'VERDE' ? 'bg-emerald-500' : 
                        groupStatus === 'NARANJA' ? 'bg-orange-500' : 'bg-red-400';

    return (
      <tr 
        className="font-bold bg-white hover:bg-gray-50 group h-[30px] leading-none relative border-b border-gray-100 focus-within:z-[100]"
        style={{ '--group-color': mainGroupColor }}
      >
        <td 
          className="px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100 relative cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`} />
          <div className="flex justify-center items-center h-full pl-1">
            <input 
              type="checkbox" 
              checked={selectedItemIds.has(item.id)} 
              onChange={(e) => onToggleGroup(e)} 
              className="w-5 h-5 rounded cursor-pointer accent-brand" 
            />
          </div>
        </td>
         <td className="px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100">
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
        className="font-black transition-all cursor-pointer bg-[var(--group-color)] group h-[30px] relative z-10 focus-within:z-[100]" 
        style={{ '--group-color': mainGroupColor }}
        onClick={toggleExpanded}
      >
        <td 
          className={`px-0 py-0 w-[35px] min-w-[35px] relative cursor-default hover:bg-white/5 ${lb} ${tb}`}
          onClick={(e) => e.stopPropagation()}
        >
           <div className={`absolute left-0 top-0 bottom-0 w-2 ${groupStatus === 'VERDE' ? 'bg-emerald-500' : groupStatus === 'NARANJA' ? 'bg-orange-500' : 'bg-red-400'}`} />
           <div className="flex justify-center items-center h-full pl-1">
             <input 
              type="checkbox" 
              checked={isSelectedGroup} 
              ref={el => el && (el.indeterminate = isPartialGroup)}
              onChange={(e) => onToggleGroup(e)} 
              className="w-5 h-5 rounded cursor-pointer accent-brand" 
             />
           </div>
        </td>
        <td className={`w-[35px] min-w-[35px] ${tb}`}>
          <div className="flex justify-center items-center h-full">
            <div className={`text-white/70 transition-transform duration-300 ${expanded ? 'rotate-0' : 'rotate-180'}`}>
              <ChevronUp className="w-5 h-5" />
            </div>
          </div>
        </td>
        {/* Fecha */}
        <td className={`px-1 py-0 ${tb}`}></td>
        {/* colspan: nombre(1) + apellidos(1) + email(1) = 3 cols */}
        <td colSpan={3} className={`px-2 py-0 text-left overflow-hidden ${tb}`}>
           <span className="text-[15px] font-bold text-white tracking-tight uppercase leading-tight truncate block w-full">{groupDisplayName}</span>
        </td>
        {/* Actividad */}
        <td className={`px-1 py-0 ${tb}`}></td>
        {/* Precio + Q + Total combinados → 1 celda alineada derecha */}
        <td colSpan={3} className={`px-3 py-0 text-right ${tb}`}>
           <span className={`font-bold text-[15px] ${groupTextColor} leading-tight`}>{displayTotal.toLocaleString()} ฿</span>
        </td>
        <td className={`px-0 py-0 w-[90px] min-w-[90px] text-center px-1 ${tb}`}>
            <div className={`h-6 flex items-center justify-center rounded font-black text-xs uppercase tracking-wider shadow-lg leading-none ${groupColorClass}`}>
              {groupStatusLabel}
            </div>
        </td>
        <td className={`w-[80px] min-w-[80px] ${tb}`}></td>
        <td className={`w-[60px] min-w-[60px] ${tb}`}>
          {isAnyInstructorMissing && (
            <div className="flex items-center justify-center h-full">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Falta instructor en grupo" />
            </div>
          )}
        </td>
        <td className={`w-[55px] min-w-[55px] ${tb}`}></td>
        <td className={`w-[45px] min-w-[45px] ${tb}`}></td>
        <td className={`w-auto ${tb}`}></td>
        <td className={`px-2 py-0 w-[80px] min-w-[80px] text-center ${rb} ${tb}`} onClick={e => e.stopPropagation()}>
           <div className="flex items-center justify-center gap-1.5 px-2">
             <button 
               onClick={() => handleDissolveGroup(invoice.id)} 
               className="p-1 hover:bg-gray-900/10 text-gray-900 hover:text-black transition-all rounded"
               title="Desagrupar todos (romper grupo)"
             >
               <Unlink className="w-4 h-4" />
             </button>
             <button 
               onClick={handleDeleteInvoice} 
               className="p-1 hover:bg-red-50 text-red-600/50 hover:text-red-600 transition-all rounded"
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
            className="font-bold bg-white hover:bg-gray-50 group h-[30px] leading-none border-b border-gray-100 transition-colors relative focus-within:z-[100]"
            style={{ '--group-color': mainGroupColor }}
          >
            <td className={`px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100 relative ${bLine}`}>
               <div className={`absolute left-0 top-0 bottom-0 w-2 ${item.status === 'Paid' ? 'bg-emerald-500' : 'bg-red-400'}`} />
               <div className="flex justify-center items-center h-full pl-1">
                  <input 
                    type="checkbox" 
                    checked={selectedItemIds.has(item.id)} 
                    onChange={() => onSelectItem(item.id)} 
                    className="w-5 h-5 rounded hover:opacity-100 transition-opacity cursor-pointer" 
                  />
               </div>
            </td>
             <td className={`px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100 ${bLine}`}>
              <div className="flex justify-center items-center h-full">
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
