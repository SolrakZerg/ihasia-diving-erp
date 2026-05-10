import React, { useState, useEffect } from 'react';
import { LayoutGrid, FileText, ChevronLeft, ChevronRight, Settings as SettingsIcon, Printer } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import Carabao_Table from './Carabao_Table';
import Carabao_Invoice_View from './Carabao_Invoice_View';
import Carabao_Sidebar from './Carabao_Sidebar';

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
`;

export default function Carabao_Header() {
  const [activeTab, setActiveTab] = useState('grid');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [settlementId, setSettlementId] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedInvoiceRows, setSelectedInvoiceRows] = useState([]);
  const [ihasia, setIhasia] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [carabao, setCarabao] = useState(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMonthlyData();
  }, [month, year]);

  useEffect(() => {
    fetchSettlement();
  }, [month, year]);

  const fetchInitialData = async () => {
    const { data: activitiesData } = await supabase.from('activities').select('*').order('name');
    if (activitiesData) setAllActivities(activitiesData);

    const { data: entitiesData } = await supabase.from('business_entities').select('*');
    if (entitiesData) {
      setIhasia(entitiesData.find(e => e.is_own_company));
      setCarabao(entitiesData.find(e => e.name.toLowerCase().includes('carabao')));
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    const mm = String(month).padStart(2, '0');
    const firstDay = `${year}-${mm}-01`;
    const lastDay = `${year}-${mm}-${new Date(year, month, 0).getDate()}`;
    
    const { data } = await supabase.from('invoice_items')
      .select('*, activities(id, name, category, acronym, tanks_weight, is_supplier_billable, payout_group)')
      .gte('date', firstDay)
      .lte('date', lastDay);
      
    setInvoiceItems(data || []);
    setLoading(false);
  };

  const fetchSettlement = async () => {
    const { data } = await supabase
      .from('supplier_settlements')
      .select('*')
      .eq('supplier_name', 'Carabao')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    
    if (data) {
      setSettlementId(data.id);
      setPaidAmount(data.paid_amount);
      setTotalAmount(data.total_amount || 0);
      if (data.invoice_config && data.invoice_config.length > 0) {
        setSelectedInvoiceRows(data.invoice_config);
      }
    } else {
      setSettlementId(null);
      setPaidAmount(0);
      setTotalAmount(0);
      setSelectedInvoiceRows([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700 overflow-hidden text-slate-300">
      <style>{noSpinnerStyle}</style>
      
      {/* Top Header */}
      <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 no-print print:hidden">
        <div className="flex items-center gap-4">
          <img 
            src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png" 
            alt="Carabao Logo" 
            className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]" 
          />
          <div>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">Carabao Diving</h1>
          </div>
        </div>

        {/* Tabs & Settings */}
        <div className="flex items-center gap-3">
          {activeTab === 'grid' && (
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-surface hover:bg-surface-edge text-gray-400 p-2.5 rounded-xl transition-all border border-surface-edge shadow-lg"
              title="Configurar Actividades Facturables"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}

          {activeTab === 'invoice' && (
            <button 
              onClick={() => window.print()}
              className="bg-surface hover:bg-surface-edge text-gray-400 p-2.5 rounded-xl transition-all border border-surface-edge shadow-lg"
              title="Imprimir / PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex bg-surface p-1.5 rounded-2xl border border-surface-edge shadow-inner">
          <button 
            onClick={() => setActiveTab('grid')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'grid' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Resumen Actividad
          </button>
          <button 
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'invoice' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" /> Factura Carabao
          </button>
        </div>
      </div>

        {/* Date Selector */}
        <div className="flex items-center bg-surface p-1 rounded-2xl border border-surface-edge shadow-inner">
            <button 
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear(prev => prev - 1);
                } else {
                  setMonth(prev => prev - 1);
                }
              }}
              className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
              <select 
                value={month} 
                onChange={e => setMonth(parseInt(e.target.value))}
                className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center uppercase tracking-tighter"
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
                ))}
              </select>
              
              <div className="w-px h-4 bg-surface-edge/30 mx-1" />

              <select 
                value={year} 
                onChange={e => setYear(parseInt(e.target.value))}
                className="bg-transparent text-sm font-black text-white outline-none px-2 py-1 cursor-pointer appearance-none hover:opacity-70 transition-opacity text-center"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-[#1a1c2d]">{y}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear(prev => prev + 1);
                } else {
                  setMonth(prev => prev + 1);
                }
              }}
              className="p-2 hover:bg-surface-edge/50 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-surface">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
            </div>
          ) : activeTab === 'grid' ? (
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar px-6 py-2">
              <div className="flex gap-6 justify-center items-start min-w-max h-full px-4">
                <Carabao_Table 
                  invoiceItems={invoiceItems} 
                  month={month} 
                  year={year}
                  allActivities={allActivities}
                />
                <Carabao_Sidebar 
                  invoiceItems={invoiceItems}
                  allActivities={allActivities}
                  month={month}
                  year={year}
                  settlementId={settlementId}
                  paidAmount={paidAmount}
                  setPaidAmount={setPaidAmount}
                  setSettlementId={setSettlementId}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                  setAllActivities={setAllActivities}
                  totalAmount={totalAmount}
                  fetchSettlement={fetchSettlement}
                />
              </div>
            </div>
          ) : (
            <Carabao_Invoice_View 
              invoiceItems={invoiceItems}
              allActivities={allActivities}
              month={month}
              year={year}
              ihasia={ihasia}
              carabao={carabao}
              selectedInvoiceRows={selectedInvoiceRows}
              setSelectedInvoiceRows={setSelectedInvoiceRows}
              settlementId={settlementId}
              paidAmount={paidAmount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
