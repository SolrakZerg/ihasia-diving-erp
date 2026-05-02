import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Ship,
  FileText,
  LayoutGrid,
  UsersRound,
  Settings as SettingsIcon,
  X as CloseIcon,
  CheckCircle2,
  Calendar,
  Trash2 as TrashIcon,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

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

export default function SupplierPayout() {
  const [activeTab, setActiveTab] = useState('grid');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [settlementId, setSettlementId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [ihasia, setIhasia] = useState(null);
  const [carabao, setCarabao] = useState(null);
  const [showInvoiceSettings, setShowInvoiceSettings] = useState(false);
  const [selectedInvoiceRows, setSelectedInvoiceRows] = useState([]); 

  const fixedKeys = ['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];

  const fixedColumns = useMemo(() => {
    if (!allActivities.length) return fixedKeys.map(key => ({ key, label: key, activityIds: [] }));
    return fixedKeys.map(key => {
      const matches = allActivities.filter(a => {
        const acro = (a?.acronym || '').toUpperCase().trim();
        const name = (a?.name || '').toUpperCase().trim();
        const cleanK = key.toUpperCase().trim();
        if (cleanK === 'FD') return acro.startsWith('FD') || name.startsWith('FUNDIVE');
        if (cleanK === 'SR1') return name.includes('REFRESH') && (name.includes('1') || !name.includes('2'));
        if (cleanK === 'SR2') return name.includes('REFRESH') && name.includes('2');
        if (cleanK === 'DSD1') return (name.includes('BAUTIZO') || name.includes('DSD')) && (name.includes('1') || !name.includes('2'));
        if (cleanK === 'DSD2') return (name.includes('BAUTIZO') || name.includes('DSD')) && name.includes('2');
        if (cleanK === 'OW') return acro === 'OW' || name.includes('OPEN WATER');
        if (cleanK === 'AOW') return acro === 'AOW' || name.includes('ADVANCED');
        if (cleanK === 'CAN') return acro === 'CAN' || acro === 'CAN2' || name.includes('CAN');
        if (cleanK === 'DMT') return acro === 'DMT' || acro === 'DM' || name.includes('DIVEMASTER') || name.startsWith('DM ') || name === 'DM';
        return acro === cleanK || name === cleanK;
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
  }, [allActivities, invoiceItems, fixedColumns]);

  // Resetear y cargar plantilla por defecto cuando cambia el mes/año o cargan las actividades
  useEffect(() => {
    // SOLO inicializamos si NO hay filas seleccionadas (es decir, es un mes nuevo sin config guardada)
    if (allActivities.length > 0 && selectedInvoiceRows.length === 0 && !loading) {
      const findId = (key) => {
        const col = fixedColumns.find(c => c.key === key);
        return col?.activityIds[0];
      };

      // Verificar si hay actividad de S&R o DMT este mes
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
  }, [month, year, allActivities, fixedColumns, selectedInvoiceRows.length, availableActivitiesForMonth, loading]);

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
        if (data.invoice_config && data.invoice_config.length > 0) {
          setSelectedInvoiceRows(data.invoice_config);
        }
      } else {
        setSettlementId(null);
        setPaidAmount(0);
        setSelectedInvoiceRows([]); // Esto disparará la inicialización por defecto
      }
    };
    fetchSettlement();
  }, [month, year]);

  const saveSettlement = async (value, customConfig = null) => {
    setIsSaving(true);
    const payload = {
      supplier_name: 'Carabao',
      month,
      year,
      paid_amount: value !== null ? value : paidAmount,
      total_amount: grandTotal,
      invoice_config: customConfig || selectedInvoiceRows,
      updated_at: new Date().toISOString()
    };

    if (settlementId) {
      await supabase.from('supplier_settlements').update(payload).eq('id', settlementId);
    } else {
      const { data } = await supabase
        .from('supplier_settlements')
        .insert(payload)
        .select()
        .single();
      if (data) setSettlementId(data.id);
    }
    setIsSaving(false);
  };


  const fetchInitialData = async () => {
    const { data: activitiesData } = await supabase.from('activities').select('*').order('name');
    if (activitiesData) setAllActivities(activitiesData);

    const { data: entitiesData } = await supabase.from('business_entities').select('*');
    if (entitiesData) {
      setIhasia(entitiesData.find(e => e.is_own_company));
      setCarabao(entitiesData.find(e => e.name.toLowerCase().includes('carabao')));
    }
  };

  const toggleActivityBilling = async (activityId, currentState) => {
    const { error } = await supabase
      .from('activities')
      .update({ is_supplier_billable: !currentState })
      .eq('id', activityId);
    
    if (!error) {
      setAllActivities(prev => prev.map(a => 
        a.id === activityId ? { ...a, is_supplier_billable: !currentState } : a
      ));
    }
  };

  const fetchMonthlyData = async () => {
    setLoading(true);
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    
    const { data } = await supabase.from('invoice_items')
      .select('*, activities(id, name, category, acronym, tanks_weight, is_supplier_billable)')
      .gte('date', firstDay)
      .lte('date', lastDay);
      
    setInvoiceItems(data || []);
    setLoading(false);
  };


  const multipliers = {
    FD: 500, SR1: 500, SR2: 1000, DSD1: 500, DSD2: 1000, SD: 1500, OW: 2500, AOW: 2500, 'S&R': 2000, CAN: 500, DMT: 18000
  };

  const matrixData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data = {};
    for (let i = 1; i <= daysInMonth; i++) data[i] = { items: {}, total: 0 };
    
    invoiceItems.forEach(item => {
      if (!item.date) return;
      const d = parseInt(item.date.split('-')[2]);
      const actId = String(item.activity_id || '');
      let colKey = null;
      const fixedCol = fixedColumns.find(c => c.activityIds.map(String).includes(actId));
      if (fixedCol) colKey = fixedCol.key;
      
      if (!colKey || !data[d]) return;
      const qty = Number(item.quantity ?? 1);
      data[d].items[colKey] = (data[d].items[colKey] || 0) + qty;
      
      const mult = multipliers[colKey] || 0;
      data[d].dailyMoney = (data[d].dailyMoney || 0) + (qty * mult);

      if (['FD', 'CAN', 'DSD1', 'DSD2', 'SR1', 'SR2'].includes(colKey)) {
        const tankMultiplier = (colKey === 'DSD2' || colKey === 'SR2') ? 2 : 1;
        data[d].totalTanksGroup = (data[d].totalTanksGroup || 0) + (qty * tankMultiplier);
      }
    });
    return data;
  }, [invoiceItems, month, year, fixedColumns]);


  // Lógica de datos de factura (Automática por defecto pero editable)
  const dynamicInvoiceData = useMemo(() => {
    const activityMap = {};
    let tankGroupQty = 0;

    invoiceItems.forEach(item => {
      const act = item.activities;
      if (!act || !act.is_supplier_billable) return;
      
      if (!activityMap[act.id]) {
        activityMap[act.id] = {
          id: act.id,
          name: act.name,
          acronym: act.acronym,
          tanks_weight: parseFloat(act.tanks_weight || 0),
          qty: 0
        };
      }
      activityMap[act.id].qty += Number(item.quantity ?? 1);
    });

    // Calculamos los totales de todo lo que sea billable (tenga o no qty)
    const pool = [];
    
    // Primero, preparamos un mapa de QTYs reales del mes
    const monthQtyMap = {};
    invoiceItems.forEach(item => {
      const actId = item.activity_id;
      if (actId) monthQtyMap[actId] = (monthQtyMap[actId] || 0) + Number(item.quantity ?? 1);
    });

    // Ahora creamos el pool basado en billableActivities
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
    if (tankGroupQty >= 0) { // Siempre incluimos el grupo de tanques en el pool si existe
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

    // Mapear los seleccionados a sus datos reales (buscando en el pool completo)
    return selectedInvoiceRows.map(row => {
      if (!row.id) return { id: '', code: '---', desc: '', qty: 0, price: 0, amount: 0 };
      if (row.type === 'tank_group') return finalPool.find(p => p.type === 'tank_group');
      return finalPool.find(p => p.id === row.id) || { id: row.id, code: '???', desc: 'No encontrado', qty: 0, price: 0, amount: 0 };
    }).filter(Boolean);
  }, [invoiceItems, selectedInvoiceRows, fixedColumns, billableActivities]);


  const grandTotal = useMemo(() => {
    return dynamicInvoiceData.reduce((acc, row) => acc + row.amount, 0);
  }, [dynamicInvoiceData]);

  // Guardar configuración cuando cambian las filas o el total
  useEffect(() => {
    if (selectedInvoiceRows.length > 0 && settlementId) {
      const timer = setTimeout(() => {
        saveSettlement(paidAmount, selectedInvoiceRows);
      }, 1000); // Debounce de 1 segundo para no saturar la BD
      return () => clearTimeout(timer);
    }
  }, [selectedInvoiceRows, grandTotal]);

  const remainingBalance = grandTotal - paidAmount;

  if (loading && !invoiceItems.length) return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface animate-in fade-in duration-700 overflow-hidden text-slate-300">
      <style>{noSpinnerStyle}</style>
      
      {/* Top Header (CALCO EXACTO DE PARTNERSPAYOUTS) - NO PRINT */}
      <div className="bg-surface-soft/50 border-b border-surface-edge px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 no-print print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 rounded-2xl text-brand border border-brand/20">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">Carabao Diving</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-none mt-1">Gestión de Tanques & Facturación</p>
          </div>
        </div>

        {/* Tabs style calco */}
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

        {/* HYBRID DATE SELECTOR */}
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

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-2">
          
          {activeTab === 'grid' ? (
            /* 100% STYLE CLONE OF THE GRID CONTAINER */
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
              <div className="flex gap-6 justify-center items-start min-w-max h-full px-4">
                
                {/* Table 1: ACTIVIDAD CONSOLIDADA (CALCO 100%) */}
                <div className="flex-none w-fit max-w-[850px] bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-full">
                  <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <table className="w-fit text-left border-collapse table-fixed">
                      <thead className="sticky top-0 z-30 bg-surface-soft/98 backdrop-blur-xl h-[70px]">
                        <tr className="border-b border-surface-edge">
                          <th className="p-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-12 bg-surface-soft">Día</th>
                            {fixedColumns.map((col) => (
                              <React.Fragment key={col.key}>
                                <th className="p-0 text-[16px] font-black text-gray-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[40px] min-w-[40px]">
                                  <div className="w-full h-full flex flex-col items-center justify-center leading-[0.9] py-1">
                                    {col.label.split('').map((char, i) => <span key={i}>{char}</span>)}
                                  </div>
                                </th>
                                {col.key === 'SR2' && (
                                  <th className="p-0 text-[18px] font-black text-emerald-400 uppercase tracking-tighter text-center border-l border-surface-edge/30 w-[40px] min-w-[40px] bg-emerald-500/10">
                                    T
                                  </th>
                                )}
                              </React.Fragment>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-edge/40">
                        {/* TOTALS ROW AT TOP */}
                        <tr className="bg-surface-edge/20 font-black h-9 border-b-2 border-surface-edge">
                          <td className="p-0 text-center text-gray-500 text-[10px] uppercase">TOT</td>
                            {fixedColumns.map(col => (
                              <React.Fragment key={col.key}>
                                <td className="p-0 text-center border-l border-surface-edge/10 text-sm text-brand w-[40px] min-w-[40px]">
                                  {Object.values(matrixData).reduce((acc, d) => acc + (d.items[col.key] || 0), 0)}
                                </td>
                                {col.key === 'SR2' && (
                                  <td className="p-0 text-center border-l border-surface-edge/10 text-base text-emerald-400 bg-emerald-500/20 w-[40px] min-w-[40px]">
                                    {Object.values(matrixData).reduce((acc, d) => acc + (d.totalTanksGroup || 0), 0)}
                                  </td>
                                )}
                              </React.Fragment>
                            ))}
                        </tr>

                        {Object.keys(matrixData).map(day => (
                          <tr key={day} className="group hover:bg-white/5 transition-colors h-9">
                            <td className="p-0 text-center font-black text-gray-600 text-sm">{day}</td>
                            {fixedColumns.map((col, idx) => {
                               const count = matrixData[day].items[col.key] || 0;
                               const isSR2 = col.key === 'SR2';
                               return (
                                 <React.Fragment key={col.key}>
                                   <td className="p-0 border-l border-surface-edge/10 text-center w-[40px] min-w-[40px]">
                                     <span className={`text-base font-black ${count > 0 ? 'text-white' : 'text-gray-800'}`}>
                                       {count || ''}
                                     </span>
                                   </td>
                                   {isSR2 && (
                                     <td className="p-0 border-l border-surface-edge/10 text-center w-[40px] min-w-[40px] bg-emerald-500/20">
                                       <span className={`text-base font-black ${matrixData[day].totalTanksGroup > 0 ? 'text-emerald-400' : 'text-gray-800'}`}>
                                         {matrixData[day].totalTanksGroup || ''}
                                       </span>
                                     </td>
                                   )}
                                 </React.Fragment>
                               );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-30 bg-surface-soft border-t-2 border-surface-edge shadow-[0_-4px_10px_rgba(0,0,0,0.3)] font-black">
                        {/* ONLY AMOUNTS ROW AT BOTTOM */}
                        <tr className="h-12 bg-black/20">
                          <td className="p-0 text-center text-emerald-500 text-xs uppercase tracking-widest">Total</td>
                          {fixedColumns.map(col => {
                            const columnItems = invoiceItems.filter(item => {
                              const actId = String(item.activity_id || '');
                              return col.activityIds.map(String).includes(actId);
                            });
                            const columnAmount = columnItems.reduce((sum, item) => {
                              const qty = Number(item.quantity ?? 1);
                              const mult = multipliers[col.key] || 0;
                              return sum + (qty * mult);
                            }, 0);
                            return (
                              <React.Fragment key={col.key}>
                                <td className="p-0 text-center border-l border-surface-edge/10 text-[10px] text-emerald-400 w-[40px] min-w-[40px]">
                                  {columnAmount > 0 ? columnAmount.toLocaleString() : ''}
                                </td>
                                {col.key === 'SR2' && (
                                  <td className="p-0 text-center border-l border-surface-edge/10 text-[10px] text-emerald-400 bg-emerald-500/20 w-[40px] min-w-[40px]">
                                    {(Object.values(matrixData).reduce((acc, d) => acc + (d.totalTanksGroup || 0), 0) * 500).toLocaleString()}
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* SUMMARY WIDGET - ORIGINAL DESIGN WITH NEW COLORS */}
                <div className="flex-none w-72 flex flex-col gap-4">
                  <div className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Ship className="w-24 h-24 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      {/* TOTAL SECTION */}
                      <div>
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Total THB</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                          {grandTotal.toLocaleString()} <span className="text-sm font-black text-amber-500/40 ml-1">฿</span>
                        </h2>
                      </div>

                      {/* PAID SECTION */}
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group/paid">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Pagado:</p>
                          {isSaving && <span className="text-[8px] text-emerald-500 animate-pulse font-black uppercase">Guardando...</span>}
                        </div>
                        <div className="relative">
                          <input 
                            type="number"
                            value={paidAmount || ''}
                            onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                            onBlur={(e) => saveSettlement(parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent text-3xl font-black text-white outline-none !border-none !ring-0 focus:!ring-0 transition-colors no-spinner tracking-tighter"
                            placeholder="0"
                          />
                          <span className="absolute right-0 bottom-2 text-emerald-500/40 font-black text-sm">฿</span>
                        </div>
                        <div className="h-0.5 w-full bg-emerald-500/20 rounded-full mt-1" />
                      </div>

                      {/* REMAINING SECTION */}
                      <div className="pt-2">
                        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Por Pagar:</p>
                        <h2 className={`text-5xl font-black tracking-tighter transition-colors ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {remainingBalance.toLocaleString()} <span className="text-base font-black opacity-30 ml-1">฿</span>
                        </h2>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-surface-edge">
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic">
                        Cálculo basado en la actividad de <span className="text-gray-300">{months[month-1]}</span>.
                      </p>
                    </div>
                  </div>

                  <div className={`bg-surface-soft/50 border border-surface-edge/50 rounded-2xl p-4 flex items-center gap-4 transition-colors ${remainingBalance <= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
                    <div className={`p-3 rounded-xl ${remainingBalance <= 0 ? 'bg-emerald-500/20' : 'bg-rose-400/10'}`}>
                      {remainingBalance <= 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <FileText className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase">Estado Mensual</p>
                      <p className={`text-xs font-bold ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {remainingBalance <= 0 ? 'Liquidación Completa' : 'Pendiente de Pago'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* FACTURA VIEW (REPLICA) */
            <div className="flex-1 overflow-auto custom-scrollbar py-8 bg-surface/50 print:bg-white print:p-0 print:overflow-visible">
              <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700 print:shadow-none print:max-w-none print:w-full print:m-0">
                 {/* Acciones de Factura */}
                 <div className="flex justify-end gap-4 mb-6 print:hidden">
                    <button 
                      onClick={() => setShowInvoiceSettings(true)}
                      className="bg-surface-soft hover:bg-surface-edge text-gray-400 p-2 rounded-xl transition-all border border-surface-edge shadow-lg"
                      title="Configurar Actividades en Factura"
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </button>
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
                              <th className="px-6 py-4 w-[10%] border-r border-white/10">Code</th>
                              <th className="px-6 py-4 w-[45%] border-r border-white/10">Description</th>
                              <th className="px-6 py-4 text-center w-[8%] border-r border-white/10">Qty</th>
                              <th className="px-6 py-4 text-center w-[15%] border-r border-white/10">Unit Price</th>
                              <th className="px-6 py-4 text-right w-[22%]">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dynamicInvoiceData.map((row, idx) => (
                              <tr key={idx} className="text-sm font-bold h-12 hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-1 border-r border-gray-100 print:hidden relative">
                                  <select 
                                    value={row.id}
                                    onChange={(e) => {
                                      const newRows = [...selectedInvoiceRows];
                                      const val = e.target.value;
                                      if (val === 'tank_group') {
                                        newRows[idx] = { id: 'tank_group', type: 'tank_group' };
                                      } else {
                                        newRows[idx] = { id: val, type: 'activity' };
                                      }
                                      setSelectedInvoiceRows(newRows);
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 font-black text-[#8a8e6b] cursor-pointer appearance-none uppercase"
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

                                <td className="px-6 py-3 border-r border-gray-100">{row.desc}</td>
                                <td className="px-6 py-3 text-center border-r border-gray-100">{row.qty}</td>
                                <td className="px-6 py-3 text-center border-r border-gray-100">{row.price.toLocaleString()}</td>
                                <td className="px-6 py-3 text-right font-black relative group/amount">
                                  {row.amount.toLocaleString()}
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
                                    onClick={() => setSelectedInvoiceRows([...selectedInvoiceRows, { id: '', type: 'activity' }])}
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
                        <p className="text-xs font-bold text-gray-400 italic italic max-w-md mx-auto leading-relaxed">
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
          )}
        </div>
      </div>

      {/* Invoice Settings Modal */}
      {showInvoiceSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInvoiceSettings(false)}></div>
          <div className="bg-surface border border-surface-edge w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-surface-edge flex items-center justify-between bg-surface-soft/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-xl text-brand">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white">Configuración de Factura</h3>
              </div>
              <button onClick={() => setShowInvoiceSettings(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <CloseIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Selecciona qué actividades quieres tener disponibles para elegir en la factura. 
                Solo se muestran las que tienen tanques asignados.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {billableActivities.map(activity => (
                  <div 
                    key={activity.id}
                    onClick={() => toggleActivityBilling(activity.id, activity.is_supplier_billable)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      activity.is_supplier_billable 
                        ? 'bg-brand/10 border-brand/30 ring-1 ring-brand/20' 
                        : 'bg-surface-soft border-surface-edge hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        activity.is_supplier_billable ? 'bg-brand text-white' : 'bg-surface-edge text-gray-500'
                      }`}>
                        {activity.acronym || '??'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${activity.is_supplier_billable ? 'text-white' : 'text-gray-400'}`}>
                          {activity.name}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                          {activity.tanks_weight} Tanks • {activity.tanks_weight * 500} THB
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      activity.is_supplier_billable ? 'border-brand bg-brand' : 'border-gray-600'
                    }`}>
                      {activity.is_supplier_billable && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-surface-soft/30 border-t border-surface-edge flex justify-end">
              <button 
                onClick={() => setShowInvoiceSettings(false)}
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
              >
                Cerrar y Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
