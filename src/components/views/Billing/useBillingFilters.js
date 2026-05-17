import { useMemo } from 'react';

export function useBillingFilters({
  invoices,
  sortBy,
  showOnlyUnpaid,
  showOnlyToday,
  selectedDay,
  searchTerm,
  activitySearch,
  instructorSearch,
  paymentMethodSearch,
  showOnlyCommissionable,
  selectedMonth,
  selectedYear,
  arrivalsDate,
}) {
  const displayedInvoices = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const s = searchTerm.toLowerCase().trim();

    return [...invoices]
      .filter(inv => {
        const items = inv.invoice_items || [];
        if (!items.length) return true;

        // Comprobación de mes y año
        const isThisMonth = items.some(it => {
          if (!it.date) return true;
          const [y, m] = it.date.split('-').map(Number);
          return y === selectedYear && (m - 1) === selectedMonth;
        });
        if (!isThisMonth) return false;

        // Filtrado por día específico
        if (selectedDay) {
          const targetDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
          if (!items.some(it => it.date === targetDate)) return false;
        }

        // Búsqueda de clientes/nombres
        if (s !== '') {
          const matches = items.some(it => {
            const parts = [
              it.customers?.first_name, it.customers?.last_name, it.customers?.email, it.temporary_name,
              inv.customers?.first_name, inv.customers?.last_name, inv.customers?.email
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return parts.some(p => p.includes(s));
          });
          if (!matches) return false;
        }

        // Búsqueda de actividad
        if (activitySearch && activitySearch.trim() !== '') {
          const actS = activitySearch.toLowerCase().trim();
          const matchesAct = items.some(it => {
            const actParts = [
              it.activities?.name,
              it.activities?.acronym,
              it.activities?.category
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return actParts.some(p => p.includes(actS));
          });
          if (!matchesAct) return false;
        }

        // Filtrar "Solo Hoy"
        if (showOnlyToday) {
          if (!items.some(it => it.date === today)) return false;
        }

        // Filtrar "Solo Pendientes"
        if (showOnlyUnpaid) {
          if (!items.some(it => it.status !== 'Paid')) return false;
        }

        // Búsqueda de Instructor
        if (instructorSearch && instructorSearch.trim() !== '') {
          const instS = instructorSearch.toLowerCase().trim();
          const matchesInst = items.some(it => {
            const instParts = [
              it.staff?.first_name,
              it.staff?.last_name,
              it.staff?.initials
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return instParts.some(p => p.includes(instS));
          });
          if (!matchesInst) return false;
        }

        // Búsqueda de Método de pago / Bizum
        if (paymentMethodSearch && paymentMethodSearch.trim() !== '') {
          const payS = paymentMethodSearch.toLowerCase().trim();
          const matchesPay = items.some(it => {
            if (payS === 'bizum') return Number(it.bizum_deposit_eur || 0) > 0;
            const method = (it.payment_method || '').toLowerCase();
            return method.includes(payS);
          });
          if (!matchesPay) return false;
        }

        // Filtrar "Comisionables"
        if (showOnlyCommissionable) {
          if (!items.some(it => it.is_comm === true)) return false;
        }

        return true;
      })
      .map(inv => {
        const originalCount = inv.invoice_items?.length || 0;
        let items = [...(inv.invoice_items || [])];

        if (showOnlyUnpaid) {
          items = items.filter(i => i.status !== 'Paid');
        }

        if (s !== '') {
          items = items.filter(it => {
            const parts = [
              it.customers?.first_name, it.customers?.last_name, it.customers?.email, it.temporary_name,
              inv.customers?.first_name, inv.customers?.last_name, inv.customers?.email
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return parts.some(p => p.includes(s));
          });
        }

        const actS = activitySearch.toLowerCase().trim();
        if (actS !== '') {
          items = items.filter(it => {
            const actParts = [
              it.activities?.name, it.activities?.acronym, it.activities?.category
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return actParts.some(p => p.includes(actS));
          });
        }

        if (instructorSearch && instructorSearch.trim() !== '') {
          const instS = instructorSearch.toLowerCase().trim();
          items = items.filter(it => {
            const instParts = [
              it.staff?.first_name,
              it.staff?.last_name,
              it.staff?.initials
            ].filter(Boolean).map(v => String(v).toLowerCase());
            return instParts.some(p => p.includes(instS));
          });
        }

        if (paymentMethodSearch && paymentMethodSearch.trim() !== '') {
          const payS = paymentMethodSearch.toLowerCase().trim();
          items = items.filter(it => {
            if (payS === 'bizum') return Number(it.bizum_deposit_eur || 0) > 0;
            return (it.payment_method || '').toLowerCase().includes(payS);
          });
        }

        if (showOnlyCommissionable) {
          items = items.filter(it => it.is_comm === true);
        }

        return { 
          ...inv, 
          _wasGroup: originalCount > 1, 
          invoice_items: items 
        };
      })
      .filter(inv => inv.invoice_items.length > 0)
      .sort((a, b) => {
        // Criterios de ordenamiento
        if (sortBy === 'date') {
          const getMin = (inv) => { 
            const d = (inv.invoice_items || []).map(i => i.date).filter(Boolean); 
            return d.length ? d.sort()[0] : null; 
          };
          const dA = getMin(a), dB = getMin(b);
          if (!dA && dB) return 1;
          if (dA && !dB) return -1;
          if (dA && dB && dA !== dB) return dA.localeCompare(dB);
          return String(a.id).localeCompare(String(b.id));
        }
        
        if (sortBy === 'status') {
          const uA = a.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          const uB = b.invoice_items?.filter(i => i.status !== 'Paid').length || 0;
          if (uB !== uA) return uB - uA;
          return String(a.id).localeCompare(String(b.id));
        }
        
        // Por defecto: Nombre del cliente
        const nA = a.customers?.first_name || a.invoice_items?.[0]?.temporary_name || '';
        const nB = b.customers?.first_name || b.invoice_items?.[0]?.temporary_name || '';
        if (nA.localeCompare(nB) !== 0) return nA.localeCompare(nB);
        return String(a.id).localeCompare(String(b.id));
      });
  }, [
    invoices,
    sortBy,
    showOnlyUnpaid,
    showOnlyToday,
    selectedDay,
    searchTerm,
    activitySearch,
    instructorSearch,
    paymentMethodSearch,
    showOnlyCommissionable,
    selectedMonth,
    selectedYear,
    arrivalsDate
  ]);

  return {
    displayedInvoices
  };
}
