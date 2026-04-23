import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  Receipt, 
  Globe,
  Database,
  ShieldCheck,
  Building,
  Banknote
} from 'lucide-react';
import Staff from './Staff';
import Activities from './Activities';
import StaffPayouts from './StaffPayouts';
import StaffSettlement from './StaffSettlement';


const GeneralSettings = () => (
  <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Bussiness Info */}
      <div className="bg-surface-soft border border-surface-edge p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand/10 rounded-lg text-brand">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Centro de Buceo</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nombre Comercial</label>
            <input defaultValue="IHASIA" className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand transition-all outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Ubicación</label>
            <input defaultValue="Koh Tao, Tailandia" className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand transition-all outline-none" />
          </div>
        </div>
      </div>

      {/* Cloud & Sync */}
      <div className="bg-surface-soft border border-surface-edge p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Sistema & Sincronización</h3>
        </div>
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-surface-edge">
              <div>
                <p className="text-sm font-bold text-white">Estado de Supabase</p>
                <p className="text-xs text-emerald-400">Conectado y Sincronizado</p>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
           </div>
           <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-surface-edge">
              <div>
                <p className="text-sm font-bold text-white">Base de Datos</p>
                <p className="text-xs text-gray-500">PostgreSQL (v15.0)</p>
              </div>
              <Database className="w-6 h-6 text-brand" />
           </div>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'staff', label: 'Personal (Staff)', icon: Users },
    { id: 'catalog', label: 'Catálogo y Precios', icon: Receipt },
    { id: 'payouts', label: 'Liquidación Staff', icon: Banknote },
    { id: 'payout_rules', label: 'Tarifas Staff', icon: Receipt },

  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Container */}
      <div className="bg-surface-soft/30 pt-6 px-10 border-b border-surface-edge">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-2xl font-black tracking-tight text-white">Configuración</h1>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
                  isActive 
                    ? 'border-brand text-brand' 
                    : 'border-transparent text-gray-500 hover:text-white hover:border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-surface">
        <div className="w-full h-full">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'staff' && <Staff isNested />}
          {activeTab === 'catalog' && <Activities isNested />}
          {activeTab === 'payouts' && <StaffSettlement />}
          {activeTab === 'payout_rules' && <StaffPayouts />}

        </div>
      </div>
    </div>
  );
}
