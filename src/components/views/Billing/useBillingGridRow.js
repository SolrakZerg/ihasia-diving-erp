import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { recalculateCarabaoSettlement } from '../../../lib/carabaoSettlement';
import { useUndo } from '../../../context/UndoContext';
import { buildDeleteItemRowAction, buildAddChildItemAction, buildItemUpdateAction } from './billingUndoActions';

export function useBillingGridRow({
  invoice,
  activities = [],
  categories = [],
  staff = [],
  selectedItemIds,
  setToast,
  onSelectItem,
  onSelectItems,
  onUpdate,
  onDeleteInvoice,
  setConfirmConfig,
  uiConfig,
}) {
  const { pushAction } = useUndo();

  // ── ESTADO LOCAL ──────────────────────────────────────────────────────────
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

  // ── SELECCIÓN Y SEÑALIZACIÓN GRUPAL ──────────────────────────────────────
  const isSelectedGroup = items.length > 0 && items.every(it => selectedItemIds.has(it.id));
  const isPartialGroup  = !isSelectedGroup && items.some(it => selectedItemIds.has(it.id));

  const handleSelectGroup = (e) => {
    e.stopPropagation();
    const allSelected = items.every(it => selectedItemIds.has(it.id));
    const ids = items.map(it => it.id);
    onSelectItems(ids, !allSelected);
  };

  // ── ELIMINACIÓN DE FACTURA O REGISTRO INDIVIDUAL ──────────────────────────
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
            const itemToDelete = items.find(it => String(it.id) === String(itemId));
            if (!itemToDelete) return;

            const cleanItem = { ...itemToDelete };
            delete cleanItem.activities;
            delete cleanItem.staff;
            delete cleanItem.customers;

            const isLastItem = items.length === 1;
            let invoiceData = null;

            if (isLastItem) {
              const { data: invData, error: fetchInvErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoice.id)
                .single();
              if (fetchInvErr) throw fetchInvErr;
              invoiceData = invData;
            }

            if (isLastItem) {
              const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from('invoice_items').delete().eq('id', itemId);
              if (error) throw error;
            }

            const targetDateStr = itemToDelete.date || invoice.created_at;
            if (targetDateStr) {
              const dateObj = new Date(targetDateStr);
              if (!isNaN(dateObj.getTime())) {
                recalculateCarabaoSettlement(dateObj.getMonth() + 1, dateObj.getFullYear());
              }
            }

            const customerName = itemToDelete.customers?.first_name || itemToDelete.temporary_name || 'Sin nombre';

            pushAction(buildDeleteItemRowAction(itemId, invoice.id, isLastItem, cleanItem, invoiceData, targetDateStr, customerName, onUpdate));

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

  // ── INSERCIÓN DE NUEVO REGISTRO HIJO EN LA FACTURA ────────────────────────
  const handleAddChildItem = async (e, parentItem = null) => {
    if (e) e.stopPropagation();
    try {
      const { data, error } = await supabase.from('invoice_items').insert({
        invoice_id:     invoice.id,
        customer_id:    parentItem?.customer_id || null,
        date:           null,
        quantity:       null,
        unit_price_thb: 0,
        total_thb:      0,
        status:         'Pending',
      }).select().single();
      if (error) throw error;

      const targetDateStr = invoice.created_at || new Date().toISOString();
      const dateObj = new Date(targetDateStr);
      if (!isNaN(dateObj.getTime())) {
        recalculateCarabaoSettlement(dateObj.getMonth() + 1, dateObj.getFullYear());
      }

      const customerName = parentItem?.customers?.first_name || parentItem?.temporary_name || 'Sin nombre';
      const cleanInsertData = { ...data };

      pushAction(buildAddChildItemAction(data.id, cleanInsertData, targetDateStr, customerName, onUpdate));

      onUpdate();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  // ── ACTUALIZACIÓN DE CAMPOS INDIVIDUALES DE LA FACTURA ────────────────────
  const handleItemUpdate = async (item, fieldOrUpdates, value) => {
    const finalId = item?.id || item?.invoice_item_id || item?._id;
    if (!finalId) return;

    try {
      const itemId = String(finalId);
      let updates = typeof fieldOrUpdates === 'object' ? { ...fieldOrUpdates } : { [fieldOrUpdates]: value };

      if (updates.activity_id !== undefined) {
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
        } else {
          updates.activity_id = null;
          updates.unit_price_thb = 0;
          updates.total_thb = 0;
          updates.is_comm = false;
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

      // Optimización visual instantánea (Optimistic Update)
      let optimisticItemUpdates = { ...updates };
      if (updates._customer) {
        optimisticItemUpdates.customers = updates._customer;
        delete updates._customer;
      }

      setLocalItems(prev => prev.map(it =>
        String(it.id) === String(itemId) ? { ...it, ...optimisticItemUpdates } : it
      ));

      // Obtenemos los valores antiguos para el sistema Undo modularizado
      const oldValues = {};
      Object.keys(updates).forEach(k => {
        oldValues[k] = item[k];
      });

      // Construcción del Toast hiper-detallado de deshacer/rehacer
      const customerName = item.customers?.first_name || item.temporary_name || 'Sin nombre';
      let actionDesc = {
        undo: `Modificación en factura de ${customerName}`,
        redo: `Modificación en factura de ${customerName}`
      };

      if (updates.customer_id !== undefined) {
        const oldCustName = item.customers ? `${item.customers.first_name || ''} ${item.customers.last_name || ''}`.trim() : (item.temporary_name || 'Ninguno');
        const newCustName = updates._customer ? `${updates._customer.first_name || ''} ${updates._customer.last_name || ''}`.trim() : 'Ninguno';
        actionDesc = {
          undo: `Cliente de factura restaurado a '${oldCustName}' (era '${newCustName}')`,
          redo: `Cliente de factura cambiado a '${newCustName}' (era '${oldCustName}')`
        };
      } else if (typeof fieldOrUpdates === 'string') {
        const field = fieldOrUpdates;
        const oldVal = oldValues[field];
        const newVal = updates[field];

        if (field === 'unit_price_thb') {
          actionDesc = {
            undo: `Precio de factura de ${customerName} restaurado a ${oldVal || 0} ฿ (era ${newVal || 0} ฿)`,
            redo: `Precio de factura de ${customerName} cambiado a ${newVal || 0} ฿ (era ${oldVal || 0} ฿)`
          };
        } else if (field === 'status') {
          const oldLabel = oldVal === 'Paid' ? 'PAGADO' : 'PENDIENTE';
          const newLabel = newVal === 'Paid' ? 'PAGADO' : 'PENDIENTE';
          actionDesc = {
            undo: `Estado de factura de ${customerName} restaurado a ${oldLabel} (era ${newLabel})`,
            redo: `Estado de factura de ${customerName} cambiado a ${newLabel} (era ${oldLabel})`
          };
        } else if (field === 'quantity') {
          actionDesc = {
            undo: `Cantidad de factura de ${customerName} restaurada a ${oldVal || 0} (era ${newVal || 0})`,
            redo: `Cantidad de factura de ${customerName} cambiada a ${newVal || 0} (era ${oldVal || 0})`
          };
        } else if (field === 'payment_method') {
          actionDesc = {
            undo: `Método de pago de ${customerName} restaurado a '${oldVal || 'Ninguno'}' (era '${newVal || 'Ninguno'}')`,
            redo: `Método de pago de ${customerName} cambiado a '${newVal || 'Ninguno'}' (era '${oldVal || 'Ninguno'}')`
          };
        } else if (field === 'is_comm') {
          const oldComm = oldVal ? 'SÍ' : 'NO';
          const newComm = newVal ? 'SÍ' : 'NO';
          actionDesc = {
            undo: `Comisión de ${customerName} restaurada a ${oldComm} (era ${newComm})`,
            redo: `Comisión de ${customerName} cambiada a ${newComm} (era ${oldComm})`
          };
        } else if (field === 'instructor_id') {
          const getInitials = (id) => {
            if (!id) return 'Ninguno';
            const s = staff.find(member => String(member.id) === String(id));
            return s ? s.initials : 'Ninguno';
          };
          const oldInitials = getInitials(oldVal);
          const newInitials = getInitials(newVal);
          actionDesc = {
            undo: `Instructor de ${customerName} restaurado a ${oldInitials} (era ${newInitials})`,
            redo: `Instructor de ${customerName} cambiado a ${newInitials} (era ${oldInitials})`
          };
        } else if (field === 'activity_id') {
          const getName = (id) => {
            if (!id) return 'Ninguna';
            const act = activities.find(a => String(a.id) === String(id));
            return act ? act.name : 'Ninguna';
          };
          const oldName = getName(oldVal);
          const newName = getName(newVal);
          actionDesc = {
            undo: `Actividad de ${customerName} restaurada a '${oldName}' (era '${newName}')`,
            redo: `Actividad de ${customerName} cambiada a '${newName}' (era '${oldName}')`
          };
        } else if (field === 'temporary_name') {
          actionDesc = {
            undo: `Nombre provisional restaurado a '${oldVal || 'Ninguno'}' (era '${newVal || 'Ninguno'}')`,
            redo: `Nombre provisional cambiado a '${newVal || 'Ninguno'}' (era '${oldVal || 'Ninguno'}')`
          };
        } else if (field === 'notes') {
          actionDesc = {
            undo: `Notas de ${customerName} restauradas a '${oldVal || 'vacío'}' (eran '${newVal || 'vacío'}')`,
            redo: `Notas de ${customerName} cambiadas a '${newVal || 'vacío'}' (eran '${oldVal || 'vacío'}')`
          };
        } else {
          actionDesc = {
            undo: `Campo '${field}' restaurado a '${oldVal || ''}' (era '${newVal || ''}') en factura de ${customerName}`,
            redo: `Campo '${field}' cambiado a '${newVal || ''}' (era '${oldVal || ''}') en factura de ${customerName}`
          };
        }
      }

      // Persistimos en base de datos
      const { error } = await supabase.from('invoice_items').update(updates).eq('id', itemId);
      if (error) throw error;

      const targetDateStr = updates.date || item.date || invoice.created_at;

      // Pila de deshacer
      pushAction(buildItemUpdateAction(itemId, updates, oldValues, targetDateStr, actionDesc, onUpdate));

      // Recalcular liquidación de Carabao si aplica
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

  // ── UTILIDADES DE FORMATO DE FECHA ────────────────────────────────────────
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

  // ── CÁLCULOS Y DERIVACIONES DE GRUPO ──────────────────────────────────────
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

  return {
    expanded,
    toggleExpanded,
    searchingId,
    setSearchingId,
    items,
    isSelectedGroup,
    isPartialGroup,
    handleSelectGroup,
    handleDeleteInvoice,
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
  };
}
