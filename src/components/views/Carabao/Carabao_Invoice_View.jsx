import React, { useMemo, useEffect, useState } from 'react';
import { ChevronRight, Trash2 as TrashIcon, Ship, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import Carabao_Invoice_Sidebar from './Carabao_Invoice_Sidebar';
import useCarabaoInvoiceData from './useCarabaoInvoiceData';
import Carabao_Invoice_Table from './Carabao_Invoice_Table';
import Carabao_Invoice_Paper_Header from './Carabao_Invoice_Paper_Header';

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
    @page { 
      margin: 0; 
      size: A4 portrait;
    }
    
    html, body {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* LIMPIAR CONTENEDORES PADRE DEL ERP */
    #root, main, .carabao-main-container, .carabao-content-area {
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      box-shadow: none !important;
    }

    /* OCULTAR ELEMENTOS DE UI DE LA NAVEGACIÓN */
    aside, nav, header, footer, 
    .no-print, .print-hidden, .print\\:hidden, [class*="print:hidden"],
    button, .actions-bar, .sidebar-container, .navbar-container,
    .sidebar-collapse-btn { 
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      width: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    main { 
      margin: 0 !important; 
      padding: 0 !important; 
      display: block !important;
    }

    /* FACTURA IMPRIMIBLE: RÉPLICA EXACTA DE LA PANTALLA */
    .printable-invoice { 
      display: block !important;
      position: relative !important;
      width: 100% !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      border: none !important;
      border-top: 12px solid #8a8e6b !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* FORZAR COLORES EXACTOS EN TABLAS, FONDOS Y CABECERAS */
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
  const [showRightSidebar, setShowRightSidebar] = useState(() => {
    const saved = localStorage.getItem('carabao_sidebar_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('carabao_sidebar_collapsed', showRightSidebar);
  }, [showRightSidebar]);

  // Usar el Hook personalizado para toda la lógica de datos
  const {
    dynamicInvoiceData,
    availableActivitiesForMonth,
    grandTotal,
    remainingBalance
  } = useCarabaoInvoiceData({
    invoiceItems,
    allActivities,
    selectedInvoiceRows,
    setSelectedInvoiceRows,
    paidAmount
  });

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
        <div className="flex-1 flex flex-col overflow-auto custom-scrollbar py-4 bg-surface/50 print:p-0 print:overflow-visible print:bg-white">
          <div className="max-w-4xl mx-auto my-auto animate-in slide-in-from-bottom-8 duration-700 print:shadow-none print:max-w-none print:w-full print:m-0">
             <div className="bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden font-sans border-t-[12px] border-[#8a8e6b] print:shadow-none printable-invoice">
              <div className="p-12 space-y-12">
                {/* Header Section */}
                <Carabao_Invoice_Paper_Header 
                  ihasia={ihasia}
                  carabao={carabao}
                  month={month}
                  year={year}
                />

                {/* Main Table */}
                <Carabao_Invoice_Table 
                  dynamicInvoiceData={dynamicInvoiceData}
                  selectedInvoiceRows={selectedInvoiceRows}
                  setSelectedInvoiceRows={setSelectedInvoiceRows}
                  availableActivitiesForMonth={availableActivitiesForMonth}
                  grandTotal={grandTotal}
                />

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
