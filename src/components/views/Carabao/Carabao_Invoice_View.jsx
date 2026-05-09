import React, { useMemo, useEffect, useState } from 'react';
import { ChevronRight, Trash2 as TrashIcon, Ship, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import Carabao_Invoice_Sidebar from './Carabao_Invoice_Sidebar';

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
  @media print {
    /* RESET ABSOLUTO */
    @page { 
      margin: 0; 
      size: auto;
    }
    
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* OCULTAR TODO LO QUE NO SEA LA FACTURA */
    nav, aside, header, footer, 
    .no-print, .print-hidden, .print\\:hidden,
    button, .actions-bar, .sidebar-container, .navbar-container { 
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* POSICIONAR LA FACTURA */
    main { 
      margin: 0 !important; 
      padding: 0 !important; 
      display: block !important;
    }

    .printable-invoice { 
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 40px !important;
      box-shadow: none !important;
      border: none !important;
      background: white !important;
    }

    /* FORZAR COLORES EN TABLAS Y BLOQUES */
    .printable-invoice * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

export default function Carabao_Invoice_View({ 
  invoiceItems, 
  allActivities, 
  month, 
  year, 
  ihasia, 
  carabao, 
  selectedInvoiceRows, 
  setSelectedInvoiceRows,
  settlementId,
  paidAmount
}) {
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const fixedKeys = ['FD', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));
    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const pGroup = (a?.payout_group || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        return pGroup === cleanK;
      });
      return { key, label: key, activityIds: matches.map(m => m.id) };
    });
  }, [allActivities]);

  const billableActivities = useMemo(() => {
    return allActivities.filter(a => (parseFloat(a.tanks_weight) > 0 || a.is_supplier_billable));
  }, [allActivities]);

  const availableActivitiesForMonth = useMemo(() => {
    const qtyMap = {};
    invoiceItems.forEach(item => {
      if (item.activity_id) {
        qtyMap[item.activity_id] = (qtyMap[item.activity_id] || 0) + Number(item.quantity ?? 1);
      }
    });
    return allActivities.filter(a => {
      const isBillable = a.is_supplier_billable && qtyMap[a.id] > 0;
      if (!isBillable) return false;
      const actId = String(a.id);
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      const key = fixedCol?.key;
      const isTankGroup = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(key);
      return !isTankGroup;
    });
  }, [invoiceItems, allActivities, fixedColumns]);

  // Lógica de datos de factura (Automática por defecto pero editable)
  const dynamicInvoiceData = useMemo(() => {
    let tankGroupQty = 0;
    const pool = [];
    
    const monthQtyMap = {};
    invoiceItems.forEach(item => {
      const actId = item.activity_id;
      if (actId) monthQtyMap[actId] = (monthQtyMap[actId] || 0) + Number(item.quantity ?? 1);
    });

    billableActivities.filter(a => a.is_supplier_billable).forEach(act => {
      const actId = String(act.id);
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      const key = fixedCol?.key;
      const qty = monthQtyMap[act.id] || 0;

      const isTankGroup = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(key);

      if (isTankGroup) {
        const tankMultiplier = (key === 'DSD2' || key === 'SR2') ? 2 : 1;
        tankGroupQty += (qty * tankMultiplier);
      } else {
        pool.push({
          id: act.id,
          code: act.acronym || act.name.slice(0,3),
          desc: act.name,
          qty: qty,
          price: (parseFloat(act.tanks_weight) || 0) * 500,
          amount: qty * (parseFloat(act.tanks_weight) || 0) * 500,
          type: 'activity'
        });
      }
    });

    const finalPool = [...pool];
    if (tankGroupQty >= 0) {
      finalPool.unshift({
        id: 'tank_group',
        code: 'Tanks',
        desc: 'Tanks (FD + DSD + SR)',
        qty: tankGroupQty,
        price: 500,
        amount: tankGroupQty * 500,
        type: 'tank_group'
      });
    }



    // Mapear los seleccionados a sus datos reales
    return selectedInvoiceRows.map(row => {
      if (!row.id) return { id: '', code: '---', desc: '', qty: 0, price: 0, amount: 0 };
      
      if (row.type === 'manual') {
        const qty = row.qty === '' ? '' : (row.qty || 0);
        const price = row.price === '' ? '' : (row.price || 0);
        return {
          id: row.id,
          code: row.code || '---',
          desc: row.desc || '',
          qty: qty,
          price: price,
          amount: (parseFloat(qty) || 0) * (parseFloat(price) || 0),
          type: 'manual'
        };
      }
      
      let baseData = {};
      if (row.type === 'tank_group') {
        baseData = finalPool.find(p => p.type === 'tank_group');
      } else {
        baseData = finalPool.find(p => p.id === row.id) || { id: row.id, code: '???', desc: 'No encontrado', qty: 0, price: 0, amount: 0 };
      }
      
      // Aplicar offset si es tank_group
      if (row.type === 'tank_group') {
        const tanksToRemove = row.tanksToRemove || 0;
        const qty = Math.max(0, baseData.qty - tanksToRemove);
        const amount = qty * baseData.price;
        return { ...baseData, qty, amount, tanksToRemove };
      }
      
      return baseData;
    }).filter(Boolean);
  }, [invoiceItems, selectedInvoiceRows, fixedColumns, billableActivities, availableActivitiesForMonth]);

  const grandTotal = useMemo(() => {
    return dynamicInvoiceData.reduce((acc, row) => acc + row.amount, 0);
  }, [dynamicInvoiceData]);

  const remainingBalance = grandTotal - paidAmount;

  // Inicializar plantilla por defecto si no hay configuración guardada
  useEffect(() => {
    if (allActivities.length > 0 && selectedInvoiceRows.length === 0) {
      const findId = (key) => {
        const col = fixedColumns.find(c => c.key === key);
        return col?.activityIds[0];
      };

      const hasSR = availableActivitiesForMonth.some(a => a.acronym === 'S&R' || a.name.includes('Rescue'));
      const hasDMT = availableActivitiesForMonth.some(a => a.acronym === 'DMT' || a.name.includes('Divemaster'));

      const defaultTemplate = [
        { id: 'tank_group', type: 'tank_group' },
        { id: findId('OW'), type: 'activity' },
        { id: findId('AOW'), type: 'activity' },
        { id: findId('SD'), type: 'activity' }
      ];

      if (hasSR) defaultTemplate.push({ id: findId('S&R'), type: 'activity' });
      if (hasDMT) defaultTemplate.push({ id: findId('DMT'), type: 'activity' });

      const finalTemplate = defaultTemplate.filter(r => r.id || r.type === 'tank_group');
      if (finalTemplate.length > 0) {
        setSelectedInvoiceRows(finalTemplate);
      }
    }
  }, [allActivities, fixedColumns, availableActivitiesForMonth, selectedInvoiceRows.length, setSelectedInvoiceRows]);

  // Guardar configuración de filas (JSON) sin afectar al total real contable
  useEffect(() => {
    if (selectedInvoiceRows.length > 0 && settlementId) {
      const timer = setTimeout(async () => {
        // Filtrar filas manuales vacías (sin descripción) para no guardarlas en la BD
        const filteredRows = selectedInvoiceRows.filter(row => {
          if (row.type === 'manual' && (!row.desc || !row.desc.trim())) return false;
          return true;
        });

        const payload = {
          invoice_config: filteredRows,
          updated_at: new Date().toISOString()
        };
        await supabase.from('supplier_settlements').update(payload).eq('id', settlementId);
      }, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [selectedInvoiceRows, settlementId]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const tanksToRemove = selectedInvoiceRows.find(r => r.type === 'tank_group')?.tanksToRemove || 0;

  const updateTanksToRemove = (val) => {
    const newRows = selectedInvoiceRows.map(r => 
      r.type === 'tank_group' ? { ...r, tanksToRemove: val } : r
    );
    setSelectedInvoiceRows(newRows);
  };

  return (
    <>
      <style>{noSpinnerStyle}</style>
      <div className="flex-1 flex overflow-hidden relative print:bg-white print:p-0 print:overflow-visible">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto custom-scrollbar py-8 bg-surface/50 print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700 print:shadow-none print:max-w-none print:w-full print:m-0">
             {/* Acciones de Factura */}
             <div className="flex justify-end gap-4 mb-6 print:hidden">
              <button 
                onClick={() => window.print()}
                className="bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                <FileText className="w-4 h-4" /> Imprimir / PDF
              </button>
           </div>

           <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden font-sans border-t-[12px] border-[#8a8e6b] print:border-t-0 print:shadow-none printable-invoice">
              <div className="p-12 space-y-12">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                  <div className="space-y-6 flex-1 pr-8">
                    {/* Own Logo */}
                    <div className="w-40 h-40 flex items-center justify-start overflow-hidden">
                      {ihasia?.logo_url ? (
                        <img 
                          src={ihasia.logo_url} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                          style={{ filter: 'none', opacity: 1 }} 
                        />
                      ) : (
                        <Ship className="w-16 h-16 text-emerald-800" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-black uppercase tracking-tighter text-gray-800">{ihasia?.legal_name || 'Ihasia Diving Koh Tao Co., Ltd.'}</h2>
                      <p className="text-sm font-bold text-gray-500">{ihasia?.brand_name || 'Head Office'}</p>
                      <p className="text-sm font-bold text-gray-500">
                        {ihasia?.address_line1} {ihasia?.address_line2 ? `, ${ihasia.address_line2}` : ''}
                      </p>
                      <p className="text-sm font-bold text-gray-500">
                        {ihasia?.city}{ihasia?.province ? `, ${ihasia.province}` : ''}{ihasia?.zip_code ? `, ${ihasia.zip_code}` : ''}
                      </p>
                      <p className="text-sm font-black text-emerald-800 pt-1">TAX ID: {ihasia?.tax_id || '0843556002348'}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-6 w-64">
                    {/* Invoice Meta */}
                    <div className="bg-[#8a8e6b] text-white rounded-sm overflow-hidden shadow-md">
                       <div className="grid grid-cols-2 text-center">
                         <div className="border-r border-white/20 py-2">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Invoice No.</p>
                           <p className="text-base font-black">{(month < 10 ? '0' : '') + month}/{year.toString().slice(-2)}</p>
                         </div>
                         <div className="py-2">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Date</p>
                           <p className="text-base font-black">
                             {new Date(year, month, 0).toLocaleDateString('es-ES')}
                           </p>
                         </div>
                       </div>
                    </div>

                    {/* Pay To Box */}
                    <div className="text-left">
                      <div className="bg-[#8a8e6b] text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                        Pay To:
                      </div>
                      <div className="bg-gray-100 p-4 border-x border-b border-gray-200">
                        <p className="text-lg font-black text-gray-800 leading-tight mb-1">{carabao?.legal_name || 'Carabao Diving Koh Tao'}</p>
                        <p className="text-xs font-bold text-gray-500">{carabao?.address_line1}</p>
                        <p className="text-xs font-bold text-gray-500">{carabao?.address_line2}{carabao?.zip_code ? `, ${carabao.zip_code}` : ''}</p>
                        <p className="text-xs font-bold text-gray-500">{carabao?.city}</p>
                        <p className="text-xs font-bold text-gray-500">{carabao?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Table */}
                <div className="border-2 border-gray-100 rounded-sm overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-[#8a8e6b] text-white text-[11px] font-black uppercase tracking-widest">
                        <th className="px-6 py-4 w-[15%] border-r border-white/10">Code</th>
                        <th className="px-6 py-4 w-[40%] border-r border-white/10">Description</th>
                        <th className="px-6 py-4 text-center w-[8%] border-r border-white/10">Qty</th>
                        <th className="px-6 py-4 text-center w-[15%] border-r border-white/10">Unit Price</th>
                        <th className="px-6 py-4 text-right w-[22%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dynamicInvoiceData.map((row, idx) => (
                        <tr key={idx} className="text-sm font-bold h-12 hover:bg-gray-50 transition-colors group">
                          <td className="border-r border-gray-100 print:hidden relative">
                            <select 
                              value={row.type === 'manual' ? '' : row.id}
                              onChange={(e) => {
                                const newRows = [...selectedInvoiceRows];
                                const val = e.target.value;
                                if (val === 'tank_group') {
                                  newRows[idx] = { id: 'tank_group', type: 'tank_group' };
                                } else if (val === '') {
                                  newRows[idx] = { id: 'manual_' + Date.now(), type: 'manual', code: '---', desc: '', qty: '', price: '' };
                                } else {
                                  newRows[idx] = { id: val, type: 'activity' };
                                }
                                setSelectedInvoiceRows(newRows);
                              }}
                              className="w-full h-full px-6 py-3 bg-transparent border-none focus:ring-0 font-black text-[#8a8e6b] cursor-pointer appearance-none uppercase"
                            >
                              <option value="">---</option>
                              <option value="tank_group">Tanks</option>
                              {availableActivitiesForMonth.map(act => (
                                <option key={act.id} value={act.id}>{act.acronym || act.name.slice(0, 3)}</option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                              <ChevronRight className="w-3 h-3 rotate-90" />
                            </div>
                          </td>
                          {/* Vista para imprimir (sin select) */}
                          <td className="px-6 py-3 text-[#8a8e6b] font-black border-r border-gray-100 uppercase hidden print:table-cell">
                            {row.code}
                          </td>

                          <td className="px-6 py-3 border-r border-gray-100">
                            {row.type === 'manual' ? (
                              <input 
                                value={row.desc}
                                onChange={(e) => {
                                  const newRows = [...selectedInvoiceRows];
                                  newRows[idx] = { ...newRows[idx], desc: e.target.value };
                                  setSelectedInvoiceRows(newRows);
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 text-gray-800"
                              />
                            ) : row.desc}
                          </td>
                          <td className="px-6 py-3 text-center border-r border-gray-100">
                            {row.type === 'manual' ? (
                              <input 
                                type="number"
                                value={row.qty}
                                onChange={(e) => {
                                  const newRows = [...selectedInvoiceRows];
                                  newRows[idx] = { ...newRows[idx], qty: parseFloat(e.target.value) || 0 };
                                  setSelectedInvoiceRows(newRows);
                                }}
                                className="w-full bg-transparent border-none text-center focus:ring-0 text-gray-800 p-0 no-spinner"
                              />
                            ) : row.qty}
                          </td>
                          <td className="px-6 py-3 text-center border-r border-gray-100">
                            {row.type === 'manual' ? (
                              <input 
                                type="number"
                                value={row.price}
                                onChange={(e) => {
                                  const newRows = [...selectedInvoiceRows];
                                  newRows[idx] = { ...newRows[idx], price: parseFloat(e.target.value) || 0 };
                                  setSelectedInvoiceRows(newRows);
                                }}
                                className="w-full bg-transparent border-none text-center focus:ring-0 text-gray-800 p-0 no-spinner"
                              />
                            ) : row.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right font-black relative group/amount">
                            {row.type === 'manual' && !row.desc ? '' : row.amount.toLocaleString()}
                            <button 
                              onClick={() => {
                                const newRows = selectedInvoiceRows.filter((_, i) => i !== idx);
                                setSelectedInvoiceRows(newRows);
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all print:hidden"
                              title="Quitar fila"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="print:hidden">
                         <td colSpan="5" className="p-2">
                            <button 
                              onClick={() => setSelectedInvoiceRows([...selectedInvoiceRows, { id: 'manual_' + Date.now(), type: 'manual', code: '---', desc: '', qty: '', price: '' }])}
                              className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#8a8e6b] hover:text-[#8a8e6b] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                            >
                              + Añadir Fila
                            </button>
                         </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center">
                          <p className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] opacity-50">THANK YOU</p>
                        </td>
                        <td className="px-6 py-4 bg-[#8a8e6b] text-white font-black text-xs text-center uppercase tracking-widest">TOTAL</td>
                        <td className="px-6 py-4 bg-white border-y-2 border-r-2 border-[#8a8e6b] text-xl font-black text-right tracking-tighter whitespace-nowrap">
                          <span className="text-[#8a8e6b] mr-1">฿</span> {grandTotal.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer Contact */}
                <div className="pt-12 text-center space-y-4">
                  <p className="text-xs font-bold text-gray-400 italic max-w-md mx-auto leading-relaxed">
                    For questions concerning this invoice, please contact<br/>
                    {ihasia?.legal_name.split(' ')[0]}, {ihasia?.phone}, {ihasia?.email}
                  </p>
                  <p className="text-sm font-black text-brand tracking-widest border-t border-gray-100 pt-4 w-fit mx-auto">
                    {ihasia?.website}
                  </p>
                </div>
              </div>
           </div>
         </div>
       </div>

        {/* Right Sidebar (Modularized) */}
        <Carabao_Invoice_Sidebar 
          showRightSidebar={showRightSidebar}
          setShowRightSidebar={setShowRightSidebar}
          tanksToRemove={tanksToRemove}
          updateTanksToRemove={updateTanksToRemove}
          remainingBalance={remainingBalance}
          paidAmount={paidAmount}
          grandTotal={grandTotal}
        />
      </div>
    </>
  );
}
