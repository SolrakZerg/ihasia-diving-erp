import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Loader2, 
  Calendar,
  AlertCircle,
  TrendingDown,
  Settings,
  TrendingUp,
  CreditCard,
  Receipt,
  Info,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

// Reutilizamos el icono de SSI
const SSIIcon = ({ className }) => (
  <div 
    className={className}
    style={{
      backgroundColor: 'currentColor',
      maskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      WebkitMaskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/ssi2.svg)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      transform: 'scale(1.3)',
      filter: 'brightness(1.2)'
    }}
  />
);

export default function TestSSIView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState([]);
  
  // Date states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [manualPaid, setManualPaid] = useState(0);
  const [adjNext, setAdjNext] = useState(0); 
  const [adjPrev, setAdjPrev] = useState(0); 
  const FIXED_ADJ_PRICE = 1067;
  const adjustmentsTotal = (adjNext * FIXED_ADJ_PRICE) - (adjPrev * FIXED_ADJ_PRICE);

  const [settlementId, setSettlementId] = useState(null);
  const [totalSsi, setTotalSsi] = useState(0);

  // Las 5 actividades que SIEMPRE deben salir (según tus nombres en DB)
  const MUST_SHOW_NAMES = [
    'React Right & Rescue',
    'DG y Sod',
    'Dive Master Materiales',
    'Pro Registro',
    'DM Bundle'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, allActivities]);

  // Recalcular el Total SSI cuando cambian los datos o los ajustes
  useEffect(() => {
    if (!loading) {
      const calculatedTotal = data.reduce((sum, item) => sum + item.total_fila, 0);
      setTotalSsi(calculatedTotal + adjustmentsTotal);
    }
  }, [data, adjustmentsTotal, loading]);

  const fetchInitialData = async () => {
    // Cargar todas las actividades para saber cuáles son de SSI
    const { data: activities } = await supabase
      .from('activities')
      .select('id, name, acronym, ssi_cost_thb, color, is_ssi_active')
      .order('name');
    
    if (activities) {
      setAllActivities(activities);
    }
  };

  const fetchData = async (isUpdate = false) => {
    if (!isUpdate) setLoading(true);
    const mm = selectedMonth + 1;
    const yy = selectedYear;

    try {
      // 1. Cargar Totales de la tabla de pruebas
      const { data: settlement } = await supabase
        .from('test_supplier_settlements')
        .select('*')
        .eq('year', yy)
        .eq('month', mm)
        .maybeSingle();

      if (settlement) {
        setSettlementId(settlement.id);
        setManualPaid(settlement.paid_amount || 0);
        setAdjNext(settlement.adj_next || 0);
      } else {
        setSettlementId(null);
        setManualPaid(0);
        setAdjNext(0);
      }

      // 2. Cargar adjPrev del mes anterior
      const prevDate = new Date(yy, selectedMonth - 1, 1);
      const { data: prevSettlement } = await supabase
        .from('test_supplier_settlements')
        .select('adj_next')
        .eq('year', prevDate.getFullYear())
        .eq('month', prevDate.getMonth() + 1)
        .maybeSingle();
      
      setAdjPrev(prevSettlement?.adj_next || 0);

      // 3. Cargar Desglose de la tabla de pruebas
      const { data: breakdown } = await supabase
        .from('test_ssi_monthly_breakdown')
        .select('*')
        .eq('year', yy)
        .eq('month', mm);

      // 4. Combinar con las actividades
      const ssiActivities = allActivities.filter(a => a.is_ssi_active || MUST_SHOW_NAMES.includes(a.name));
      const result = [];

      ssiActivities.forEach(act => {
        const bdItem = breakdown?.find(b => b.activity_id === act.id);
        const sysQty = bdItem?.system_quantity || 0;
        const manAdj = bdItem?.manual_adjustment || 0;
        const realQty = sysQty + manAdj;
        const cost = parseFloat(act.ssi_cost_thb) || 0;
        const total = realQty * cost;

        const isMustShow = MUST_SHOW_NAMES.includes(act.name);

        // REGLA: Mostrar si cantidad > 0 O si es una de las 5 fijas
        if (realQty > 0 || isMustShow || manAdj !== 0) {
          result.push({
            id: act.id,
            name: act.name,
            acronym: act.acronym,
            color: act.color,
            system_quantity: sysQty,
            manual_adjustment: manAdj,
            unidades_reales: realQty,
            unit_cost: cost,
            total_fila: total
          });
        }
      });

      // Ordenar por lista predefinida de IDs
      const PREDEFINED_ORDER = [
        '744d63b8-bab2-464c-b536-04597de66bc0', // OW
        'd232f6fe-8943-4225-8f23-2f7a3eac1b99', // AOW
        '77d5e1e6-a593-4778-94f8-56696e2a6562', // SD
        'dd4ac678-c288-4465-ad7e-432fc5bb8ab3', // KIT
        'b4e2ea56-cd18-43d1-991d-58371859e6fe', // S&R
        '120aa12e-9bca-4e81-a1ca-3208ef6a2a5b', // R&R
        'fe0002f2-e4ec-4e70-87f0-3f5aa2647e7c', // SR&RR
        '61a5beb1-affe-4f2b-990b-ae595112fec3', // DG + SOD
        '156f7e85-0fa9-4cf1-912a-ca58e1c9fa41', // DM_mat
        '9ecc9f7f-703b-498e-94f3-8f8f35ae6c24', // PRO_reg
        '1c1f7c02-d535-4a4f-ad34-d90e309f0a7f', // SR RR DG SOD
        '7c7b3c3c-9242-49bb-b94e-d8328b7a6cb6', // DM + 3 espc
        'DSD_3', // Fallback string
        'dab5b623-6d22-4154-8bda-cacfa5ba344a', // DSD_2
        '501e735a-3863-444b-a0b3-b9821b4339d6', // EAN
        'fe6a5598-5bbb-4b46-8449-69bb91afb507', // EAN_aa
        'b838e71f-be1a-4aff-977b-c9b22ce02d59', // Deep Adv
        '34fa46af-1ccb-4e93-884c-a440cac189f3'  // Update RR
      ];

      result.sort((a, b) => {
        let indexA = PREDEFINED_ORDER.indexOf(a.id);
        let indexB = PREDEFINED_ORDER.indexOf(b.id);

        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;

        if (indexA !== indexB) {
          return indexA - indexB;
        }
        return a.name.localeCompare(b.name);
      });

      setData(result);

      // El total se calcula en el useEffect automático

    } catch (error) {
      console.error('Error fetching test SSI data:', error);
    }
    setLoading(false);
  };

  const handleManualAdjustmentChange = async (activityId, newValue) => {
    const val = parseInt(newValue) || 0;
    
    // Optimistic update
    setData(prev => prev.map(item => {
      if (item.id === activityId) {
        const newReal = item.system_quantity + val;
        return {
          ...item,
          manual_adjustment: val,
          unidades_reales: newReal,
          total_fila: newReal * item.unit_cost
        };
      }
      return item;
    }));

    // Guardar en la base de datos (test_ssi_monthly_breakdown)
    await supabase
      .from('test_ssi_monthly_breakdown')
      .upsert({
        year: selectedYear,
        month: selectedMonth + 1,
        activity_id: activityId,
        manual_adjustment: val
      }, { onConflict: 'year,month,activity_id' });
    
    // El trigger en la BD actualizará el total en test_supplier_settlements
    // Recargamos los datos para estar seguros
    setTimeout(() => fetchData(true), 500);
  };

  const saveSettlement = async (next, manual) => {
    const payload = {
      supplier_name: 'SSI',
      year: selectedYear,
      month: selectedMonth + 1,
      paid_amount: manual,
      adj_next: next,
      updated_at: new Date().toISOString()
    };

    if (settlementId) {
      await supabase.from('test_supplier_settlements').update(payload).eq('id', settlementId);
    } else {
      const { data } = await supabase.from('test_supplier_settlements').insert(payload).select().single();
      if (data) setSettlementId(data.id);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden relative">
      {/* COMPACT HEADER */}
      <div className="flex-shrink-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge/50 z-[50] h-[200px]">
        <div className="max-w-[1700px] mx-auto px-8 h-full flex items-center justify-center gap-24">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-10">
              <div className="flex flex-col">
                <SSIIcon className="h-16 w-16 text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">MODO SHADOW (PRUEBAS)</span>
              </div>
            </div>

            {/* DATE SELECTOR */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-soft/50 p-1 rounded-2xl border border-surface-edge/30 w-fit shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center px-2 gap-1 border-x border-surface-edge/30">
                  <span className="text-sm font-black text-white px-2 py-1 uppercase">
                    {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][selectedMonth]} {selectedYear}
                  </span>
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-surface-edge/30 rounded-xl text-gray-400 hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* STATS WIDGETS */}
          <div className="flex gap-4">
               <div className="bg-amber-500/5 border border-amber-400/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                  <span className="text-[11px] font-black text-amber-400/60 uppercase tracking-[0.2em] mb-2">TOTAL SSI</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {totalSsi.toLocaleString()} <span className="text-sm font-black text-amber-400/40 ml-1 italic font-mono">฿</span>
                  </span>
               </div>

               <div className="bg-emerald-500/5 border border-emerald-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                  <span className="text-[11px] font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-2">PAGADO</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {manualPaid.toLocaleString()} <span className="text-sm font-black text-emerald-500/40 ml-1 italic font-mono">฿</span>
                  </span>
               </div>
               
               <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[200px]">
                  <span className="text-[11px] font-black text-rose-400/60 uppercase tracking-[0.2em] mb-2">POR PAGAR</span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                     {(totalSsi - manualPaid).toLocaleString()} <span className="text-sm font-black text-rose-400/40 ml-1 italic font-mono">฿</span>
                  </span>
               </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8 flex justify-center">
        <div className="flex gap-6 max-w-[1200px] w-full h-full max-h-[calc(100vh-250px)]">
          
          {/* Table Container */}
          <div className="flex-1 bg-surface-soft border border-surface-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="py-2.5 px-6 border-b border-surface-edge bg-surface-soft/50 flex justify-between items-center flex-none">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-indigo-400" /> Desglose de Certificaciones (Modo Shadow)
               </h3>
               <div className="flex items-center gap-2 text-[9px] text-amber-500 font-bold bg-surface-edge/20 px-3 py-1 rounded-full border border-surface-edge/30">
                 <Info className="w-3 h-3" /> Datos automáticos por BD + Ajustes manuales
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-[#1a1c2d]/98 backdrop-blur-xl border-b border-surface-edge/50 h-[40px]">
                    <th className="pl-8 pr-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest align-middle w-40">Acr.</th>
                    <th className="px-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest align-middle">Curso</th>
                    <th className="px-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center align-middle w-24">Cant. Sist.</th>
                    <th className="px-[10px] py-0 text-[10px] font-black text-amber-500 uppercase tracking-widest text-center align-middle w-24">Ajuste Manual</th>
                    <th className="px-[10px] py-0 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center align-middle w-24">Und. Reales</th>
                    <th className="px-[10px] py-0 text-[11px] font-black text-white/50 uppercase tracking-[0.2em] text-right align-middle w-24">P. Unit.</th>
                    <th className="px-[10px] py-0 text-[11px] font-black text-brand uppercase tracking-[0.2em] text-right align-middle w-32">Total ฿</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-edge/10">
                  {loading ? (
                    <tr><td colSpan="7" className="py-32 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto opacity-30" /></td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan="7" className="py-32 text-center text-gray-500 italic text-sm">No hay datos para este mes.</td></tr>
                  ) : (
                    data.map(act => (
                      <tr key={act.id} className="hover:bg-brand/5 border-b border-surface-edge/30 transition-colors group">
                        <td className="pl-8 pr-[10px] py-2.5 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50" style={{ backgroundColor: act.color || '#334155' }} />
                          <span className="text-[16px] font-black tracking-tight leading-none" style={{ color: act.color || '#ffffff' }}>
                            {act.acronym || '-'}
                          </span>
                        </td>
                        <td className="px-[10px] py-2.5">
                          <span className="text-[15px] text-gray-300 font-bold tracking-tight">
                            {act.name}
                          </span>
                        </td>
                        <td className="px-[10px] py-2.5 text-center">
                          <span className="inline-flex items-center justify-center bg-surface-edge/30 min-w-[34px] h-9 rounded-lg text-[15px] font-black text-gray-500 font-mono">
                             {act.system_quantity}
                          </span>
                        </td>
                        <td className="px-[10px] py-2.5 text-center">
                          <input
                            type="number"
                            value={act.manual_adjustment || ''}
                            placeholder="0"
                            onChange={(e) => handleManualAdjustmentChange(act.id, e.target.value)}
                            className="w-16 bg-surface-edge/60 text-center h-9 rounded-lg text-[15px] font-black text-amber-400 border border-amber-500/30 shadow-sm font-mono focus:border-amber-500 outline-none"
                          />
                        </td>
                        <td className="px-[10px] py-2.5 text-center">
                          <span className="inline-flex items-center justify-center bg-surface-edge/60 min-w-[34px] h-9 rounded-lg text-[15px] font-black text-white border border-surface-edge shadow-sm font-mono">
                             {act.unidades_reales}
                          </span>
                        </td>
                        <td className="px-[10px] py-2.5 text-right">
                          <span className="text-[14px] font-bold text-gray-400 font-mono italic">{act.unit_cost.toLocaleString()}</span>
                        </td>
                        <td className="px-[10px] py-2.5 text-right">
                          <span className="text-[16px] font-black font-mono tracking-tighter text-amber-400">
                             {act.total_fila.toLocaleString()} ฿
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Adjustments */}
          <div className="w-64 flex flex-col gap-4">
             {/* AJUSTES MANUALES */}
             <div className="bg-surface-soft border border-surface-edge rounded-3xl p-5 shadow-xl flex flex-col gap-6">
                <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Settings className="w-4 h-4 text-zinc-500" /> AJUSTES SSI
                </h4>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                      <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                         <Zap className="w-4 h-4 text-indigo-400" /> ADELANTO (PRÓX. MES)
                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/20 p-3 rounded-[2rem] border border-surface-edge/30 shadow-inner">
                        <input
                          type="number"
                          value={adjNext || ''}
                          placeholder="0"
                          onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setAdjNext(val);
                             saveSettlement(val, manualPaid);
                          }}
                          className="w-full bg-transparent text-3xl font-black text-indigo-400 font-mono text-center tracking-tighter outline-none"
                        />
                      </div>
                  </div>

                  <div className="h-px bg-surface-edge/20 mx-2" />

                  <div className="flex flex-col opacity-90">
                      <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                         <TrendingDown className="w-4 h-4 text-cyan-400" /> AJUSTE (MES ANTERIOR)
                      </span>
                      <div className="flex items-center gap-4 bg-surface-edge/10 p-3 rounded-[2rem] border border-surface-edge/10">
                         <span className="text-3xl font-black text-cyan-400/50 font-mono flex-1 text-center tracking-tighter">{adjPrev}</span>
                      </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-edge/20 mt-2">
                   <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                      <span className="text-[13px] font-black text-zinc-400 uppercase tracking-wider">Impacto Total</span>
                      <span className={`text-lg font-black ${adjustmentsTotal >= 0 ? 'text-indigo-400' : 'text-cyan-400'} font-mono`}>
                        {adjustmentsTotal > 0 ? '+' : ''}{adjustmentsTotal.toLocaleString()} ฿
                      </span>
                   </div>
                </div>
             </div>

              {/* LIQUIDACIÓN MENSUAL */}
              <div className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                 <div className="w-fit mx-auto flex flex-col gap-6 w-full max-w-[240px]">
                    
                    {/* PAGADO */}
                    <div className="flex flex-col gap-4 items-center">
                       <h4 className="text-[13px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <CreditCard className="w-4 h-4 text-emerald-400" /> PAGADO
                       </h4>
                       <div className="w-full bg-surface-edge/20 border-2 border-surface-edge/30 rounded-2xl py-3 px-2 focus-within:border-emerald-500/50 focus-within:bg-emerald-500/5 transition-all">
                          <div className="flex justify-center items-baseline gap-2">
                             <input
                               type="number"
                               value={manualPaid || ''}
                               placeholder="0"
                               onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setManualPaid(val);
                                  saveSettlement(adjNext, val);
                               }}
                               className="bg-transparent border-none p-0 !outline-none !ring-0 text-2xl font-black text-emerald-400 font-mono text-right w-24"
                             />
                             <span className="text-emerald-400/50 font-black text-2xl font-mono w-4">฿</span>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-surface-edge/20" />

                    {/* POR PAGAR */}
                    <div className="flex flex-col gap-2 items-center">
                       <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" /> POR PAGAR
                       </span>
                       <div className="flex justify-center items-baseline gap-2">
                          <span className={`text-2xl font-black font-mono text-right w-24 ${(totalSsi - manualPaid) === 0 ? 'text-emerald-500/50' : 'text-rose-400'}`}>
                             {(totalSsi - manualPaid).toLocaleString()}
                          </span>
                          <span className="text-rose-400/50 font-black text-2xl font-mono w-4">฿</span>
                       </div>
                    </div>

                    <div className="h-px bg-surface-edge/20" />

                    {/* TOTAL */}
                    <div className="flex flex-col gap-2 items-center">
                       <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-amber-400" /> TOTAL
                       </span>
                       <div className="flex justify-center items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono text-right w-24">
                             {totalSsi.toLocaleString()}
                          </span>
                          <span className="text-amber-400/50 font-black text-2xl font-mono w-4">฿</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
