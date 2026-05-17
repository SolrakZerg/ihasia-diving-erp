import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, AlertTriangle, Trash2, Unlink, Plus } from 'lucide-react';
import Billing_GridRow_ItemRow from './Billing_GridRow_ItemRow';
import { useBillingGridRow } from './useBillingGridRow';

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
  // Instanciamos el gancho personalizado especializado
  const rowData = useBillingGridRow({
    invoice,
    activities,
    categories,
    staff,
    selectedItemIds,
    setToast,
    onSelectItem,
    onSelectItems,
    onUpdate,
    onDeleteInvoice,
    setConfirmConfig,
    uiConfig,
  });

  const {
    expanded,
    toggleExpanded,
    searchingId,
    setSearchingId,
    items,
    isSelectedGroup,
    isPartialGroup,
    handleDeleteInvoice: handleDeleteInvoiceRow,
    handleDeleteItem,
    handleAddChildItem,
    handleItemUpdate,
    formatSmartDate,
    isHybrid,
    displayTotal,
    groupStatus,
    groupStatusLabel,
    gBg,
    gTextColor,
    gStyle,
    groupDisplayName,
    isAnyInstructorMissing,
  } = rowData;

  // Configuración de colores dinámicos desde uiConfig
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
              onClick={handleDeleteInvoiceRow}
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
