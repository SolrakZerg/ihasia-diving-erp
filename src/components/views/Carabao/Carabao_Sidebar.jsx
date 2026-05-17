import React, { useState, useMemo, useEffect } from 'react';
import { Settings as SettingsIcon, CheckCircle2, FileText, X as CloseIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { recalculateCarabaoSettlement } from '../../../lib/carabaoSettlement';
import EditableInput from '../../common/EditableInput';

export default function Carabao_Sidebar({ invoiceItems, allActivities, month, year, settlementId, paidAmount, setPaidAmount, setSettlementId, showSettings, setShowSettings, setAllActivities, totalAmount, fetchSettlement }) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fixedKeys = ['FD', 'DSD1', 'DSD2', 'SR1', 'SR2', 'OW', 'AOW', 'SD', 'S&R', 'DMT'];
  const multipliers = {
    FD: 500, SR1: 500, SR2: 1000, DSD1: 500, DSD2: 1000, SD: 1500, OW: 2500, AOW: 2500, 'S&R': 2000, CAN: 500, DMT: 18000
  }; const realTotal = totalAmount;
  const remainingBalance = realTotal - paidAmount;

  const saveSettlement = async (value) => {
    setIsSaving(true);
    const payload = {
      supplier_name: 'Carabao',
      month,
      year,
      paid_amount: value !== null ? value : paidAmount,
      total_amount: realTotal, // Guardamos el total real!
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

  const toggleActivityBilling = async (activityId, currentState) => {
    const { error } = await supabase
      .from('activities')
      .update({ is_supplier_billable: !currentState })
      .eq('id', activityId);

    if (!error) {
      setToast({ type: 'success', message: 'Estado de facturación actualizado.' });
      setAllActivities(prev => prev.map(a => a.id === activityId ? { ...a, is_supplier_billable: !currentState } : a));

      // Recalcular y recargar settlement
      await recalculateCarabaoSettlement(month, year);
      fetchSettlement();
    } else {
      setToast({ type: 'error', message: 'Error al actualizar el estado.' });
    }
  };

  const billableActivities = useMemo(() => {
    return allActivities.filter(a => (parseFloat(a.tanks_weight) > 0 || a.is_supplier_billable));
  }, [allActivities]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="flex-none w-72 flex flex-col gap-4">
      <div className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <img
            src="https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.png"
            alt="Carabao Watermark"
            className="w-24 h-24 object-contain grayscale brightness-200"
          />
        </div>

        <div className="space-y-6 relative z-10">
          {/* TOTAL SECTION */}
          <div>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Total THB (Real)</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {realTotal.toLocaleString()} <span className="text-sm font-black text-amber-500/40 ml-1">฿</span>
            </h2>
          </div>

          {/* PAID SECTION */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 group/paid">
            <div className="flex justify-between items-center mb-2">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Pagado:</p>
              {isSaving && <span className="text-[8px] text-emerald-500 animate-pulse font-black uppercase">Guardando...</span>}
            </div>
            <div className="relative">
              <EditableInput
                key={`${settlementId || 'new'}-${paidAmount}-${refreshKey}`}
                type="number"
                defaultValue={paidAmount != null ? paidAmount : 0}
                onSave={async (value) => {
                   const numVal = parseInt(value);
                   const finalVal = isNaN(numVal) ? 0 : numVal;
                   setPaidAmount(finalVal);
                   await saveSettlement(finalVal);
                   setRefreshKey(prev => prev + 1);
                }}
                className="w-full bg-transparent text-3xl font-black text-white outline-none !border-none !ring-0 focus:!ring-0 transition-colors no-spinner tracking-tighter"
                placeholder="0"
              />
              <span className="absolute right-0 bottom-2 text-emerald-500/40 font-black text-sm">฿</span>
            </div>
            <div className="h-0.5 w-full bg-emerald-500/20 rounded-full mt-1" />
          </div>

          {/* REMAINING SECTION */}
          <div className="pt-2">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Por Pagar:</p>
            <h2 className={`text-5xl font-black tracking-tighter transition-colors ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {remainingBalance.toLocaleString()} <span className="text-base font-black opacity-30 ml-1">฿</span>
            </h2>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-edge">
          <p className="text-[11px] text-text-muted font-bold leading-relaxed italic">
            Cálculo basado en la actividad real de <span className="text-white">{months[month - 1]}</span>.
          </p>
        </div>
      </div>

      <div className={`bg-surface-soft/50 border border-surface-edge/50 rounded-2xl p-4 flex items-center gap-4 transition-colors ${remainingBalance <= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
        <div className={`p-3 rounded-xl ${remainingBalance <= 0 ? 'bg-emerald-500/20' : 'bg-rose-400/10'}`}>
          {remainingBalance <= 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <FileText className="w-5 h-5 text-rose-400" />}
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase">Estado Mensual</p>
          <p className={`text-xs font-bold ${remainingBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {remainingBalance <= 0 ? 'Liquidación Completa' : 'Pendiente de Pago'}
          </p>
        </div>
      </div>

      {/* Invoice Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="bg-surface border border-surface-edge w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-surface-edge flex items-center justify-between bg-surface-soft/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-xl text-brand">
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white">Configuración de Facturación</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <CloseIcon className="w-6 h-6 text-text-dim" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <p className="text-text-muted text-sm mb-6 leading-relaxed">
                Selecciona qué actividades son facturables por Carabao. Esto afectará al total real calculado.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {billableActivities.map(activity => (
                  <div
                    key={activity.id}
                    onClick={() => toggleActivityBilling(activity.id, activity.is_supplier_billable)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${activity.is_supplier_billable
                      ? 'bg-brand/10 border-brand/30 ring-1 ring-brand/20'
                      : 'bg-surface-soft border-surface-edge hover:border-surface-edge/80'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${activity.is_supplier_billable ? 'bg-brand text-white' : 'bg-surface-edge text-text-header'
                        }`}>
                        {activity.acronym || '??'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${activity.is_supplier_billable ? 'text-white' : 'text-text-muted'}`}>
                          {activity.name}
                        </p>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">
                          {activity.tanks_weight} Tanks • {activity.tanks_weight * 500} THB
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${activity.is_supplier_billable ? 'border-brand bg-brand' : 'border-surface-edge'
                      }`}>
                      {activity.is_supplier_billable && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-surface-soft/30 border-t border-surface-edge flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/30' : 'bg-rose-500/90 border-rose-400/30'} text-white px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
