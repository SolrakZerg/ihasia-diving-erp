import {
  BarChart3,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Waves,
  User,
  ShieldCheck,
  Rows3,
  DollarSign,
  Zap,
  Handshake,
  UsersRound,
  Ship,
  UserRoundSearch
} from 'lucide-react';

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

const CarabaoIcon = ({ className }) => (
  <div
    className={className}
    style={{
      backgroundColor: 'currentColor',
      maskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.svg)',
      WebkitMaskImage: 'url(https://mowoxxyusicasgxouhxv.supabase.co/storage/v1/object/public/business-assets/logo_carabao.svg)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      transform: 'scale(1.3)'
    }}
  />
);

import logoFullFallback from '../assets/Logo_Ihasia.svg';
import logoSmallFallback from '../assets/logo-version-movil-ihasia.webp';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Sidebar({ activeView, onViewChange, user, onLogout, isCollapsed, onToggleCollapse, isMobileOpen, onMobileToggle }) {
  const [logos, setLogos] = useState({ full: null, small: null });

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const { data } = await supabase
        .from('business_entities')
        .select('logo_url, secondary_image_url')
        .eq('is_own_company', true)
        .single();

      if (data) {
        setLogos({
          full: data.logo_url,
          small: data.secondary_image_url
        });
      }
    } catch (error) {
      console.error('Error fetching sidebar logos:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: BarChart3 },
    { id: 'billing', label: 'Facturas', icon: Rows3 },
    { id: 'nominas', label: 'Nominas', icon: Handshake },
    { id: 'expenses', label: 'Gastos', icon: DollarSign },
    { id: 'ssi', label: 'SSI', icon: SSIIcon },
    { id: 'customers', label: 'Buceadores', icon: UserRoundSearch },
    { id: 'insurance', label: 'Seguros Diarios', icon: ShieldCheck },
    { id: 'carabao', label: 'Carabao', icon: CarabaoIcon },
    { id: 'crbt', label: 'CRBT', icon: UsersRound },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <aside className={`fixed sm:sticky top-0 left-0 h-screen ${isCollapsed ? 'w-64 sm:w-20' : 'w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 bg-surface-soft border-r border-surface-edge flex flex-col transition-all duration-300 ease-in-out z-[150]`}>
      <div className={`p-4 flex items-center justify-center border-b border-surface-edge relative ${isCollapsed ? 'sm:h-20 h-48' : 'h-48'}`}>

        {/* Small Logo (visible when collapsed on desktop) */}
        <div className={isCollapsed ? 'hidden sm:block' : 'hidden'}>
          <img
            src={logos.small || logoSmallFallback}
            alt="Logo"
            className="w-10 h-10 object-contain animate-in fade-in zoom-in duration-500 brightness-0 invert"
          />
        </div>

        {/* Full Logo (visible when not collapsed, or on mobile even if collapsed) */}
        <div className={isCollapsed ? 'sm:hidden block' : 'block'}>
          <div className="flex flex-col items-center gap-4">
            <img
              src={logos.full || logoFullFallback}
              alt="Ihasia Logo"
              className="h-28 w-auto object-contain animate-in fade-in slide-in-from-top-4 duration-500 brightness-0 invert"
            />
            <img
              src={logos.small || logoSmallFallback}
              alt="Ihasia Name"
              className="h-10 w-auto object-contain animate-in fade-in slide-in-from-bottom-4 duration-700 brightness-0 invert opacity-90"
            />
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-edge border border-surface-edge items-center justify-center text-gray-300 hover:text-white hover:scale-110 transition-all z-50 shadow-lg focus-visible:ring-2 focus-visible:ring-brand"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'sm:justify-center justify-between' : 'justify-between'} p-3 rounded-xl transition-all group relative border border-transparent focus-visible:border-brand-light focus-visible:bg-brand/10 ${isActive
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'text-gray-300 hover:bg-surface hover:text-white focus-visible:text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`${isCollapsed ? 'sm:w-6 sm:h-6 w-5 h-5' : 'w-5 h-5'} flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-brand-light'}`} />
                <span className={`font-semibold text-sm animate-in slide-in-from-left-2 duration-300 ${isCollapsed ? 'sm:hidden' : ''}`}>
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight className={`w-4 h-4 ${isCollapsed ? 'sm:hidden' : ''}`} />}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="hidden sm:block absolute left-full ml-4 px-2 py-1 bg-brand text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-edge space-y-4">
        <div className={`px-3 py-2 bg-surface rounded-xl border border-surface-edge overflow-hidden ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <User className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400`} />
          ) : (
            <>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Usuario Activo</p>
              <p className="text-sm font-bold text-white truncate">{user?.email}</p>
            </>
          )}
        </div>
        <button
          onClick={onLogout}
          aria-label="Cerrar Sesión"
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/20 transition-all font-bold text-sm border border-transparent focus-visible:border-red-500/50`}
          title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
