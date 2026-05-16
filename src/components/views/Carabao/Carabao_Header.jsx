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
    <div className="flex flex-col h-auto md:h-full bg-surface animate-in fade-in duration-700 md:overflow-hidden text-text-muted">
      <style>{noSpinnerStyle}</style>

      {/* Top Header */}
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] md:sticky top-0 py-4 sm:py-6 no-print print:hidden">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shrink-0">

          {/* Left: Logo and Name/Date Column */}
          <div className="flex flex-col md:flex-row items-center gap-5 shrink-0">
            <div className="flex items-center gap-5">
            <img
              src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png"
              alt="Carabao Logo"
              className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            />

            <div className="flex flex-col gap-1 items-center">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Carabao</h1>

              <div className="flex items-center gap-3">
                {/* Date Selector */}
                <div className="flex items-center bg-surface-soft/50 p-1 rounded-xl border border-surface-edge/30 w-fit shadow-inner">
                  <button
                    onClick={() => {
                      if (month === 1) {
                        setMonth(12);
                        setYear(prev => prev - 1);
                      } else {
                        setMonth(prev => prev - 1);
                      }
                    }}
                    className="p-2 hover:bg-surface-edge/30 rounded-lg text-text-header hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                    <select
                      value={month}
                      onChange={e => setMonth(parseInt(e.target.value))}
                      className="bg-transparent text-xs font-black text-white outline-none px-1.5 py-0.5 cursor-pointer appearance-none transition-colors text-center uppercase tracking-tighter"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i + 1} className="bg-[#1a1c2d]">{m.slice(0, 3)}</option>
                      ))}
                    </select>

                    <div className="w-px h-4 bg-surface-edge/30 mx-1" />

                    <select
                      value={year}
                      onChange={e => setYear(parseInt(e.target.value))}
                      className="bg-transparent text-xs font-black text-white outline-none px-1.5 py-0.5 cursor-pointer appearance-none transition-colors text-center"
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
                    className="p-2 hover:bg-surface-edge/30 rounded-lg text-text-header hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Actions (Settings/Print) next to Date */}
                <div className="flex items-center gap-2">
                  {activeTab === 'grid' && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-2.5 rounded-xl bg-surface-edge/10 border border-surface-edge/30 text-text-header hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
                      title="Configuración"
                    >
                      <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </button>
                  )}
                  {activeTab === 'invoice' && (
                    <button
                      onClick={() => window.print()}
                      className="p-2.5 rounded-xl bg-surface-edge/10 border border-surface-edge/30 text-text-header hover:text-white hover:bg-surface-edge/30 transition-all group shrink-0"
                      title="Imprimir"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right: Tabs */}
          <div className="flex bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'grid' ? 'bg-brand text-white shadow-lg' : 'text-text-header hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Resumen Actividad</span><span className="sm:hidden">Resumen</span>
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`px-3 sm:px-5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'invoice' ? 'bg-brand text-white shadow-lg' : 'text-text-header hover:text-white'}`}
            >
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Factura Carabao</span><span className="sm:hidden">Factura</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:overflow-hidden relative min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-surface">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
            </div>
          ) : activeTab === 'grid' ? (
            <div className="flex-1 overflow-x-auto md:overflow-y-hidden custom-scrollbar px-3 sm:px-6 py-4 md:py-2">
              <div className="flex flex-col lg:flex-row gap-6 justify-center items-center lg:items-start h-full px-2 sm:px-4">
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
