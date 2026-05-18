import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Handshake,
  DollarSign,
  PiggyBank,
  Settings as SettingsIcon,
  Users,
  Receipt,
  Globe,
  Database,
  ShieldCheck,
  Building,
  Banknote,
  Coins,
  Ship,
  Mail,
  Phone,
  Globe2,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X as CloseIcon,
  Plus,
  Trash2,
  Pencil,
  TrendingUp as TrendingIcon
} from 'lucide-react';

import logoFull from '../../../assets/Logo_Ihasia.svg';
import logoSmall from '../../../assets/logo-version-movil-ihasia.webp';

import Staff_View from './Staff/Staff_View';
import Staff_fee_View from './Staff_fee/Staff_fee_View';
import Bote_View from './Bote/Bote_View';
import Estadisticas_View from './Estadisticas/Estadisticas_View';
import Activities from './Actividades/Activities_View';
import General_View from './General/General_View';
import GastosFijos_View from './GastosFijos/GastosFijos_View';


export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'fixed_expenses', label: 'Gastos Fijos', icon: DollarSign },
    { id: 'staff', label: 'Personal (Staff)', icon: Users },
    { id: 'payout_rules', label: 'Tarifas (Staff)', icon: Handshake },
    { id: 'catalog', label: 'Catálogo y Precios', icon: DollarSign },
    { id: 'bote', label: 'Gestión de Bote', icon: PiggyBank },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingIcon },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Container */}
      <div className="bg-surface-soft/30 pt-6 px-10 border-b border-surface-edge">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-brand" />
            Configuración
          </h1>
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
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold border-b-2 transition-all ${isActive
                  ? 'border-brand-light text-brand-light'
                  : 'border-transparent text-text-muted hover:text-white hover:border-surface-edge'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-light' : 'text-text-muted'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-surface">
        <div className="w-full h-full">
          {activeTab === 'general' && <General_View />}
          {activeTab === 'fixed_expenses' && <GastosFijos_View />}
          {activeTab === 'staff' && <Staff_View isNested />}
          {activeTab === 'catalog' && <Activities isNested />}
          {activeTab === 'bote' && <Bote_View />}
          {activeTab === 'payout_rules' && <Staff_fee_View />}
          {activeTab === 'analytics' && <Estadisticas_View />}
        </div>
      </div>
    </div>
  );
}
