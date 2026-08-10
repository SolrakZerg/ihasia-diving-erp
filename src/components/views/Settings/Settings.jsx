import { useState } from 'react';
import {
  Handshake,
  DollarSign,
  PiggyBank,
  Settings as SettingsIcon,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp as TrendingIcon
} from 'lucide-react';

import Staff_View from './Staff/Staff_View';
import Staff_fee_View from './Staff_fee/Staff_fee_View';
import Bote_View from './Bote/Bote_View';
import Estadisticas_View from './Estadisticas/Estadisticas_View';
import Activities from './Actividades/Activities_View';
import General_View from './General/General_View';
import GastosFijos_View from './GastosFijos/GastosFijos_View';
import Backups_View from './Backups/Backups_View';
import { ShieldCheck } from 'lucide-react';


export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'fixed_expenses', label: 'Gastos Fijos', icon: DollarSign },
    { id: 'staff', label: 'Personal', icon: Users },
    { id: 'payout_rules', label: 'Tarifas', icon: Handshake },
    { id: 'catalog', label: 'Catálogo', icon: DollarSign },
    { id: 'bote', label: 'Bote', icon: PiggyBank },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingIcon },
    { id: 'backups', label: 'Copias de Seguridad', icon: ShieldCheck },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const ActiveIcon = tabs[activeIndex]?.icon;

  const goPrev = () => {
    const newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[newIndex].id);
  };
  const goNext = () => {
    const newIndex = (activeIndex + 1) % tabs.length;
    setActiveTab(tabs[newIndex].id);
  };

  return (
    <div className="settings-main-container flex flex-col h-auto md:h-full md:overflow-hidden overflow-y-auto relative">
      {/* Header Container */}
      <div className={`flex-shrink-0 bg-surface-soft/30 border-b border-surface-edge relative transition-all duration-300 ${isHeaderExpanded ? 'header-expanded' : 'header-collapsed'}`}>

        {/* Full Header Content */}
        <div className="header-full-content pt-6 px-10">
          <div className="max-w-7xl mx-auto mb-4">
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-brand" />
              Configuración
            </h1>
          </div>
          {/* Tab Navigation */}
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsHeaderExpanded(false); }}
                  className={`flex items-center gap-3 px-4 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${isActive
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

        {/* Compact Summary for Mobile Landscape */}
        <div className="header-summary-content hidden items-center justify-center px-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SettingsIcon className="w-4 h-4 text-brand" />
            <span className="text-xs font-black text-text-muted uppercase tracking-widest">Config</span>
            <div className="flex items-center gap-1 bg-surface-soft/50 rounded-xl border border-surface-edge/30 p-1">
              <button onClick={goPrev} className="p-1 hover:bg-surface-edge/30 rounded-lg text-text-muted hover:text-white transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="flex items-center gap-1.5 px-2 text-[11px] font-black text-brand-light uppercase tracking-wider">
                {ActiveIcon && <ActiveIcon className="w-3.5 h-3.5" />}
                {tabs[activeIndex]?.label}
              </span>
              <button onClick={goNext} className="p-1 hover:bg-surface-edge/30 rounded-lg text-text-muted hover:text-white transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Button for Mobile Landscape */}
        <button
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          className={`header-toggle-btn settings-toggle-btn hidden absolute right-4 w-8 h-8 rounded-xl bg-surface-edge hover:bg-brand text-gray-300 hover:text-white items-center justify-center transition-all z-[60] ${isHeaderExpanded ? 'bottom-2 top-auto translate-y-0' : 'top-1/2 -translate-y-1/2'}`}
          aria-label={isHeaderExpanded ? 'Colapsar cabecera' : 'Expandir cabecera'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHeaderExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 md:overflow-auto overflow-visible bg-surface">
        <div className="w-full h-full">
          {activeTab === 'general' && <General_View />}
          {activeTab === 'fixed_expenses' && <GastosFijos_View />}
          {activeTab === 'staff' && <Staff_View isNested />}
          {activeTab === 'catalog' && <Activities isNested />}
          {activeTab === 'bote' && <Bote_View />}
          {activeTab === 'payout_rules' && <Staff_fee_View />}
          {activeTab === 'analytics' && <Estadisticas_View />}
          {activeTab === 'backups' && <Backups_View />}
        </div>
      </div>
    </div>
  );
}
