import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, AlertTriangle, Trash2, Unlink, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { recalculateCarabaoSettlement } from '../../../lib/carabaoSettlement';
import Billing_GridRow_ItemRow from './Billing_GridRow_ItemRow';

export default function Billing_GridRow({
  invoice,
  activities = [],
  categories = [],
  staff = [],
  selectedItemIds,
  selectedMonth,
  selectedYear,
  setToast,
  onSelectItem,
  onToggleGroup,
  onSelectItems,
  onUpdate,
  onDeleteInvoice,
  onExtractItem,
  handleDissolveGroup,
  setConfirmConfig,
  uiConfig,
}) {
  // ── Estado local ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    setLocalItems(itemsProp);
  }, [itemsProp]);

  const items = localItems;

  // ── Selección ─────────────────────────────────────────────────────────────
  const isSelectedGroup = items.length > 0 && items.every(it => selectedItemIds.has(it.id));
  const isPartialGroup  = !isSelectedGroup && items.some(it => selectedItemIds.has(it.id));

  const handleSelectGroup = (e) => {
    e.stopPropagation();
    const allSelected = items.every(it => selectedItemIds.has(it.id));
    const ids = items.map(it => it.id);
    onSelectItems(ids, !allSelected);
  };

  // ── Handlers de factura ───────────────────────────────────────────────────
  const handleDeleteInvoice = () => onDeleteInvoice(invoice.id);

  const handleDeleteItem = async (itemId, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    if (!itemId) { handleDeleteInvoice(); return; }

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
            if (items.length === 1) {
              const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
              if (error) throw error;
            }

            const targetDateStr = items.find(i => String(i.id) === String(itemId))?.date || invoice.created_at;
            if (targetDateStr) {
              const dateObj = new Date(targetDateStr);
              if (!isNaN(dateObj.getTime())) {
                recalculateCarabaoSettlement(dateObj.getMonth() + 1, dateObj.getFullYear());
              }
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
        invoice_id:     invoice.id,
        customer_id:    parentItem?.customer_id || null,
        date:           null,
        quantity:       null,
        unit_price_thb: 0,
        total_thb:      0,
        status:         'Pending',
      });
      if (error) throw error;

      const targetDateStr = invoice.created_at || new Date().toISOString();
      const dateObj = new Date(targetDateStr);
      if (!isNaN(dateObj.getTime())) {
        recalculateCarabaoSettlement(dateObj.getMonth() + 1, dateObj.getFullYear());
      }

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

      if (updates.activity_id) {
        const act = activities.find(a => String(a.id) === String(updates.activity_id));
        if (act) {
          const up = Number(act.price_thb) || 0;
          const q  = Number(item.quantity) || 0;
          updates.unit_price_thb = up;
          updates.total_thb      = up * q;

          if (!act.is_commissionable) updates.is_comm = false;

          const categoryData = categories.find(c => c.name === act.category);
          if (categoryData?.requires_staff === false) updates.instructor_id = null;
        }
      } else if (updates.quantity !== undefined) {
        const rawVal = updates.quantity;
        const q = (rawVal === '' || rawVal === null) ? null : (Number(rawVal) || 0);
        updates.quantity = q;
        const up = Number(item.unit_price_thb) || 0;
        updates.total_thb = (q || 0) * up;
      } else if (updates.unit_price_thb !== undefined) {
        const up = Number(updates.unit_price_thb) || 0;
        const q  = Number(item.quantity) || 0;
        updates.total_thb = q * up;
      }

      // Optimistic update
      let optimisticItemUpdates = { ...updates };
      if (updates._customer) {
        optimisticItemUpdates.customers = updates._customer;
        delete updates._customer;
      }

      setLocalItems(prev => prev.map(it =>
        String(it.id) === String(itemId) ? { ...it, ...optimisticItemUpdates } : it
      ));

      const { error } = await supabase.from('invoice_items').update(updates).eq('id', itemId);
      if (error) throw error;

      const targetDateStr = updates.date || item.date || invoice.created_at;
      if (targetDateStr) {
        const dateObj = new Date(targetDateStr);
        if (!isNaN(dateObj.getTime())) {
          recalculateCarabaoSettlement(dateObj.getMonth() + 1, dateObj.getFullYear());
        }
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating item:', err);
      if (onUpdate) onUpdate();
    }
  };

  // ── Utilidades ────────────────────────────────────────────────────────────
  const formatSmartDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day    = String(date.getDate()).padStart(2, '0');
    const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const month  = months[date.getMonth()];
    const year   = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  // ── Cálculos de grupo ─────────────────────────────────────────────────────
  const paidItems  = items.filter(i => i.status === 'Paid');
  const totalCount = items.length;
  const isHybrid   = totalCount <= 1 && !invoice._wasGroup;

  const totalSum   = items.reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const pendingSum = items.filter(i => i.status !== 'Paid').reduce((acc, it) => acc + Number(it.total_thb || 0), 0);
  const isAllPaid  = totalCount > 0 && paidItems.length === totalCount;
  const displayTotal = isAllPaid ? totalSum : pendingSum;

  let groupStatus      = 'ROJO';
  let groupStatusLabel = 'POR PAGAR';
  let gBg              = uiConfig?.pending_bg    || '#b91c1c';
  let gTextColor       = uiConfig?.pending_text  || '#ffffff';
  let gStyle           = uiConfig?.pending_style || 'font-black uppercase tracking-widest';

  if (totalCount > 0) {
    if (paidItems.length === totalCount) {
      groupStatus      = 'VERDE';
      groupStatusLabel = 'PAGADA';
      gBg       = uiConfig?.paid_bg    || '#10b981';
      gTextColor = uiConfig?.paid_text  || '#ffffff';
      gStyle     = uiConfig?.paid_style || 'font-black uppercase tracking-widest';
    } else if (paidItems.length > 0) {
      groupStatus      = 'NARANJA';
      groupStatusLabel = 'PARCIAL';
      gBg       = uiConfig?.partial_bg    || '#f59e0b';
      gTextColor = uiConfig?.partial_text  || '#ffffff';
      gStyle     = uiConfig?.partial_style || 'font-black uppercase tracking-widest';
    }
  }

  // Nombre del grupo
  const entities = items.map(it => ({
    id:        it.customer_id || `temp-${it.temporary_name}`,
    firstName: it.customers?.first_name || it.temporary_name,
    lastName:  it.customers?.last_name  || '',
  })).filter(e => e.firstName);

  const uniqueEntities = [];
  const seenIds = new Set();
  for (const e of entities) {
    if (!seenIds.has(e.id)) { seenIds.add(e.id); uniqueEntities.push(e); }
  }

  let groupDisplayName = 'Sin Nombre';
  if (uniqueEntities.length === 1) {
    groupDisplayName = `${uniqueEntities[0].firstName} ${uniqueEntities[0].lastName}`.trim();
  } else if (uniqueEntities.length > 1) {
    groupDisplayName = uniqueEntities.map(e => e.firstName).join(', ');
  } else if (invoice.customers?.first_name) {
    groupDisplayName = `${invoice.customers.first_name} ${invoice.customers.last_name || ''}`.trim();
  }

  const isAnyInstructorMissing = items.some(item => {
    const act          = activities.find(a => String(a.id) === String(item.activity_id));
    const categoryData = categories.find(c => c.name === act?.category);
    return !item.instructor_id && categoryData?.requires_staff !== false && item.activity_id;
  });

  // ── Config de colores dinámicos desde uiConfig ────────────────────────────
  const cfg = uiConfig || {
    bg_open: '#234181', bg_closed: '#545b6b',
    title_open: 'text-white', title_closed: 'text-gray-300',
    amount_paid_open: 'text-white', amount_paid_closed: 'text-emerald-400',
    amount_partial_open: 'text-white', amount_partial_closed: 'text-orange-400',
    amount_pending_open: 'text-white', amount_pending_closed: 'text-red-400',
  };

  const mainGroupColor  = expanded ? cfg.bg_open : cfg.bg_closed;
  const groupTitleClass = expanded ? cfg.title_open : cfg.title_closed;
  const lb = 'border-l-4 border-l-[var(--group-color)]';
  const rb = 'border-r-4 border-r-[var(--group-color)]';
  const tb = 'border-t-4 border-t-[var(--group-color)]';
  const bb = 'border-b-4 border-b-[var(--group-color)]';

  // Props comunes para Billing_GridRow_ItemRow
  const sharedItemRowProps = {
    activities, categories, staff,
    selectedItemIds,
    selectedMonth, selectedYear, setToast,
    searchingId, setSearchingId,
    handleItemUpdate, handleDeleteItem, handleAddChildItem, formatSmartDate,
    onSelectItem, onExtractItem, setConfirmConfig,
    itemsCount: items.length,
  };

  // ── MODO HÍBRIDO (1 solo item, sin agrupación visual) ─────────────────────
  if (isHybrid) {
    const item        = items[0] || { date: new Date().toLocaleDateString('en-CA'), customers: {} };
    const statusColor = groupStatus === 'VERDE' ? 'bg-emerald-500' : groupStatus === 'NARANJA' ? 'bg-orange-500' : 'bg-red-400';

    return (
      <tr
        className="font-bold bg-white hover:bg-gray-50 group h-[30px] leading-none relative border-b border-gray-100 focus-within:z-[100]"
        style={{ '--group-color': mainGroupColor }}
      >
        <td className="px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100 relative cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`} />
          <div className="flex justify-center items-center h-full pl-1">
            <input type="checkbox" checked={selectedItemIds.has(item.id)} onChange={(e) => onToggleGroup(e)} className="w-5 h-5 rounded cursor-pointer accent-brand" />
          </div>
        </td>
        <td className="px-0 py-0 w-[35px] min-w-[35px] border-r border-gray-100">
          <div className="flex justify-center items-center">
            <button onClick={(e) => handleAddChildItem(e, item)} className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </td>
        <Billing_GridRow_ItemRow item={item} isHybridRow={true} bLine="" {...sharedItemRowProps} />
      </tr>
    );
  }

  // ── MODO GRUPO (múltiples items o _wasGroup) ──────────────────────────────
  return (
    <>
      {/* Fila de cabecera del grupo */}
      <tr
        className="font-black transition-all cursor-pointer bg-[var(--group-color)] group h-[30px] relative z-10 focus-within:z-[100]"
        style={{ '--group-color': mainGroupColor }}
        onClick={toggleExpanded}
      >
        <td className={`px-0 py-0 w-[35px] min-w-[35px] relative cursor-default hover:bg-white/5 ${lb} ${tb}`} onClick={(e) => e.stopPropagation()}>
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
        <td className={`px-1 py-0 ${tb}`}></td>
        <td colSpan={3} className={`px-2 py-0 text-left overflow-hidden ${tb}`}>
          <span className={`text-[15px] font-bold tracking-tight uppercase leading-tight truncate block w-full ${groupTitleClass}`}>
            {groupDisplayName}
          </span>
        </td>
        <td className={`px-1 py-0 ${tb}`}></td>
        <td className={`px-1 py-0 ${tb}`}></td>
        <td className={`px-1 py-0 ${tb}`}></td>
        <td className={`px-1 py-0 text-right ${tb}`}>
          <div
            className={`px-1 h-6 flex items-center justify-end rounded border-2 text-sm tracking-tight whitespace-nowrap transform translate-y-[-2px] ${gStyle}`}
            style={{ backgroundColor: gBg, borderColor: gBg, color: gTextColor }}
          >
            {displayTotal.toLocaleString()} ฿
          </div>
        </td>
        <td className={`px-0 py-0 w-[90px] min-w-[90px] text-center px-1 ${tb}`}>
          <div
            className={`h-6 flex items-center justify-center rounded text-xs uppercase shadow-lg leading-none transform translate-y-[-2px] ${gStyle}`}
            style={{ backgroundColor: gBg, borderColor: gBg, color: gTextColor }}
          >
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
              className="p-1 hover:bg-white/10 text-white/50 hover:text-white transition-all rounded"
              title="Desagrupar todos (romper grupo)"
            >
              <Unlink className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteInvoice}
              className="p-1 hover:bg-white/10 text-white/50 hover:text-red-400 transition-all rounded"
              title="ELIMINAR FACTURA COMPLETA"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Filas de items expandidas */}
      <AnimatePresence mode="popLayout">
        {expanded && items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const bLine  = isLast ? bb : '';

          return (
            <motion.tr
              key={item.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 400, damping: 40, delay: idx * 0.03 }}
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
                    className="w-5 h-5 rounded hover:opacity-100 transition-opacity cursor-pointer accent-brand"
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
              <Billing_GridRow_ItemRow item={item} isHybridRow={false} bLine={bLine} {...sharedItemRowProps} />
            </motion.tr>
          );
        })}
      </AnimatePresence>
    </>
  );
}
