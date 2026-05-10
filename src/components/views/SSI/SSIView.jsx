import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SSIHeader from './SSIHeader';
import SSITable from './SSITable';
import SSISidebar from './SSISidebar';
import SSIConfigModal from './SSIConfigModal';

export default function TestSSIView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeActivityIds, setActiveActivityIds] = useState(null);
  
  // Date states
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [manualPaid, setManualPaid] = useState(0);
  const [mesAnterior, setMesAnterior] = useState(0); 
  const [saldoMesAnterior, setSaldoMesAnterior] = useState(0); 
  const FIXED_ADJ_PRICE = 1067;
  const adjustmentsTotal = (mesAnterior * FIXED_ADJ_PRICE) - (saldoMesAnterior * FIXED_ADJ_PRICE);

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
      .select('id, name, acronym, ssi_cost_thb, color, is_ssi_active, category, ssi_order')
      .order('ssi_order', { ascending: true })
      .order('name');
    
    if (activities) {
      setAllActivities(activities);
      const activeIds = activities.filter(a => a.is_ssi_active).map(a => a.id);
      setActiveActivityIds(activeIds);
    }
  };

  const fetchData = async (isUpdate = false) => {
    if (!isUpdate) setLoading(true);
    const mm = selectedMonth + 1;
    const yy = selectedYear;

    try {
      // 1. Cargar Totales de la fila del MES ACTUAL
      const { data: settlement } = await supabase
        .from('supplier_settlements')
        .select('*')
        .eq('supplier_name', 'SSI')
        .eq('year', yy)
        .eq('month', mm)
        .maybeSingle();

      if (settlement) {
        setSettlementId(settlement.id);
        setManualPaid(settlement.paid_amount || 0);
        setSaldoMesAnterior(settlement.mes_anterior || 0); // El ajuste de este mes
      } else {
        setSettlementId(null);
        setManualPaid(0);
        setSaldoMesAnterior(0);
      }

      // 2. Cargar Adelanto (mes_anterior de la fila del MES SIGUIENTE)
      const nextDate = new Date(yy, selectedMonth + 1, 1);
      const { data: nextSettlement } = await supabase
        .from('supplier_settlements')
        .select('mes_anterior')
        .eq('supplier_name', 'SSI')
        .eq('year', nextDate.getFullYear())
        .eq('month', nextDate.getMonth() + 1)
        .maybeSingle();
      
      setMesAnterior(nextSettlement?.mes_anterior || 0); // El adelanto para el mes que viene

      // 3. Cargar Desglose de la tabla de producción
      const { data: breakdown } = await supabase
        .from('ssi_monthly_breakdown')
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

    // Guardar en la base de datos (ssi_monthly_breakdown)
    await supabase
      .from('ssi_monthly_breakdown')
      .upsert({
        year: selectedYear,
        month: selectedMonth + 1,
        activity_id: activityId,
        manual_adjustment: val
      }, { onConflict: 'year,month,activity_id' });
    
    // El trigger en la BD actualizará el total en supplier_settlements
    // Recargamos los datos para estar seguros
    setTimeout(() => fetchData(true), 500);
  };

  const saveSettlement = async (next, manual) => {
    // 1. Guardar Pagado en el MES ACTUAL
    const currentPayload = {
      supplier_name: 'SSI',
      year: selectedYear,
      month: selectedMonth + 1,
      paid_amount: manual,
      updated_at: new Date().toISOString()
    };

    if (settlementId) {
      await supabase.from('supplier_settlements').update(currentPayload).eq('id', settlementId);
    } else {
      const { data } = await supabase.from('supplier_settlements').insert(currentPayload).select().single();
      if (data) setSettlementId(data.id);
    }

    // 2. Guardar Adelanto (mes_anterior) en el MES SIGUIENTE
    const nextDate = new Date(selectedYear, selectedMonth + 1, 1);
    const nextPayload = {
      supplier_name: 'SSI',
      year: nextDate.getFullYear(),
      month: nextDate.getMonth() + 1,
      mes_anterior: next,
      updated_at: new Date().toISOString()
    };

    // Buscamos si ya existe la fila del mes siguiente
    const { data: nextRow } = await supabase
      .from('supplier_settlements')
      .select('id')
      .eq('supplier_name', 'SSI')
      .eq('year', nextPayload.year)
      .eq('month', nextPayload.month)
      .maybeSingle();

    if (nextRow) {
      await supabase.from('supplier_settlements').update({ mes_anterior: next }).eq('id', nextRow.id);
    } else {
      await supabase.from('supplier_settlements').insert(nextPayload);
    }

    console.log('DEBUG - Saved settlement (Current and Next month)');
    
    // Forzar recuento del mes actual para que aplique el nuevo total_amount
    setTimeout(() => {
      supabase.rpc('func_recount_ssi_month', { p_year: selectedYear, p_month: selectedMonth + 1 });
      fetchData(true);
    }, 500);
  };

  const saveConfig = async (orderedActivities) => {
    // 1. Reset all ssi_active flags
    await supabase.from('activities').update({ is_ssi_active: false }).is('is_ssi_active', true);

    // 2. Update each one with its order!
    for (let i = 0; i < orderedActivities.length; i++) {
      const act = orderedActivities[i];
      await supabase.from('activities').update({ 
        is_ssi_active: act.isSelected, 
        ssi_order: i 
      }).eq('id', act.id);
    }

    // Update local state to reflect changes immediately
    setAllActivities(prev => prev.map(a => {
      const match = orderedActivities.find(o => o.id === a.id);
      return match ? { 
        ...a, 
        is_ssi_active: match.isSelected, 
        ssi_order: orderedActivities.indexOf(match) 
      } : a;
    }));
    
    setActiveActivityIds(orderedActivities.filter(a => a.isSelected).map(a => a.id));
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
      <SSIHeader 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        totalSsi={totalSsi}
        manualPaid={manualPaid}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        setShowConfigModal={setShowConfigModal}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8 flex justify-center">
        <div className="flex gap-6 max-w-[1200px] w-full h-full max-h-[calc(100vh-250px)]">
          
          <SSITable 
            loading={loading}
            data={data}
            handleManualAdjustmentChange={handleManualAdjustmentChange}
          />

          <SSISidebar 
            mesAnterior={mesAnterior}
            saldoMesAnterior={saldoMesAnterior}
            manualPaid={manualPaid}
            totalSsi={totalSsi}
            adjustmentsTotal={adjustmentsTotal}
            setMesAnterior={setMesAnterior}
            setManualPaid={setManualPaid}
            saveSettlement={saveSettlement}
          />
        </div>
      </div>

      <SSIConfigModal 
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        allActivities={allActivities}
        activeActivityIds={activeActivityIds}
        saveConfig={saveConfig}
      />
    </div>
  );
}
