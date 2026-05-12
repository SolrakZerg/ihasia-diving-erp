import React from 'react';
import { 
  Building, Ship, ShieldCheck, Banknote, Coins, Receipt, 
  Globe, Database, Mail, Phone, MapPin, Globe2, 
  Plus, X as CloseIcon, AlertCircle, CheckCircle2, Trash2 
} from 'lucide-react';
import { useGastosFijosData } from './useGastosFijosData';
import EditableInput from '../../../common/EditableInput';

const GastosFijos_View = () => {
  const {
    loading,
    saving,
    expenses,
    toast,
    isAdding,
    setIsAdding,
    newExpense,
    setNewExpense,
    updateExpense,
    addExpense,
    deleteExpense
  } = useGastosFijosData();

  // Icon mapping for dynamic rendering
  const iconMap = { Building, Ship, ShieldCheck, Banknote, Coins, Receipt, Globe, Database, Mail, Phone, MapPin, Globe2 };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-300 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl ${
          toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Gastos Fijos Mensuales</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Configuración de importes para el Dashboard</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isAdding ? 'bg-surface-edge text-gray-400' : 'bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105'
          }`}
        >
          {isAdding ? <><CloseIcon className="w-4 h-4"/> Cancelar</> : <><Plus className="w-4 h-4"/> Añadir Nuevo</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface-soft border-2 border-brand/30 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre del Gasto</label>
              <input 
                type="text" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                placeholder="Ej: Internet Fibra"
                className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:border-brand outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Importe Mensual (THB)</label>
              <input 
                type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="0"
                className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:border-brand outline-none transition-all font-black text-xl font-mono"
              />
            </div>
          </div>
          <button 
            onClick={addExpense} disabled={saving}
            className="w-full bg-brand hover:bg-brand-light text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Nuevo Gasto Fijo'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {expenses.map((item) => {
          const Icon = iconMap[item.icon] || Banknote;
          return (
            <div key={item.id} className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl space-y-4 relative group">
              <button 
                onClick={() => deleteExpense(item.id, item.name)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{item.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Importe THB mensual</p>
                </div>
              </div>

              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-gray-600 font-black">฿</span>
                </div>
                <EditableInput 
                  type="number"
                  defaultValue={item.amount}
                  onSave={(val) => updateExpense(item.id, 'amount', val)}
                  className="w-full bg-black/40 border-2 border-surface-edge rounded-2xl py-4 pl-10 pr-16 text-xl font-black text-white focus:border-brand transition-all outline-none no-spinner font-mono"
                />
                <div className="absolute inset-y-2 right-2 flex items-center">
                  <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 text-[10px] font-black text-gray-500 uppercase">
                    Fijo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-brand shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed font-bold">
          <strong className="text-white block mb-1">GESTIÓN DINÁMICA DE GASTOS</strong>
          Ahora puedes añadir tantos gastos fijos como necesites. Estos valores se utilizan automáticamente en el Dashboard para calcular tus proyecciones de beneficios mensuales.
        </p>
      </div>
    </div>
  );
};

export default GastosFijos_View;
