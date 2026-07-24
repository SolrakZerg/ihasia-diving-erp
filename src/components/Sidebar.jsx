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
  UserRoundSearch,
  CreditCard
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


import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import { APP_VERSION } from '../version';

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
    { id: 'bizums', label: 'Bizums', icon: CreditCard },
    { id: 'insurance', label: 'Seguros Diarios', icon: ShieldCheck },
    { id: 'carabao', label: 'Carabao', icon: CarabaoIcon },
    { id: 'crbt', label: 'CRBT', icon: UsersRound },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <aside className={`fixed sm:sticky top-0 left-0 h-screen ${isCollapsed ? 'w-64 sm:w-20' : 'w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 bg-surface-soft border-r border-surface-edge flex flex-col transition-all duration-300 ease-in-out z-[150]`}>

      {/* Toggle Button (placed outside scroll container to avoid clipping) */}
      <button
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
        className={`hidden sm:flex sidebar-collapse-btn absolute -right-3 ${isCollapsed ? 'top-[40px]' : 'top-[96px]'} -translate-y-1/2 w-6 h-6 rounded-full bg-surface-edge border border-surface-edge items-center justify-center text-gray-300 hover:text-white hover:scale-110 transition-all z-50 shadow-lg focus-visible:ring-2 focus-visible:ring-brand`}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Scrollable Wrapper */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0">

        {/* Logo Header */}
        <div className={`p-4 flex items-center justify-center border-b border-surface-edge relative ${isCollapsed ? 'sm:h-20 h-48' : 'h-48'} flex-shrink-0`}>

          {/* Small Logo (visible when collapsed on desktop) */}
          <div className={`sidebar-logo-small ${isCollapsed ? 'hidden sm:block' : 'hidden'}`}>
            <img
              src={logos.small}
              alt="Logo"
              className="h-10 w-auto object-contain animate-in fade-in zoom-in duration-500 brightness-0 invert"
            />
          </div>

          {/* Full Logo (visible when not collapsed, or on mobile even if collapsed) */}
          <div className={`sidebar-logo-full ${isCollapsed ? 'sm:hidden block' : 'block'}`}>
            <div className="flex flex-col items-center gap-4">
              <img
                src={logos.full}
                alt="Ihasia Logo"
                className="h-28 w-auto object-contain animate-in fade-in slide-in-from-top-4 duration-500 brightness-0 invert"
              />
              <img
                src={logos.small}
                alt="Ihasia Name"
                className="h-10 w-auto object-contain animate-in fade-in slide-in-from-bottom-4 duration-700 brightness-0 invert opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2">
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

        {/* Footer Area (User & Logout) */}
        <div className="p-3 border-t border-surface-edge space-y-4 flex-shrink-0">
          <div className={`px-3 py-2 bg-surface rounded-xl border border-surface-edge overflow-hidden ${isCollapsed ? 'flex justify-center sm:justify-center' : ''}`}>
            {/* Small view (user icon) */}
            <div className={`sidebar-user-small ${isCollapsed ? 'block sm:block' : 'hidden'}`}>
              <User className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400`} />
            </div>
            {/* Full view (details) */}
            <div className={`sidebar-user-full ${isCollapsed ? 'hidden sm:hidden' : 'block'}`}>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Usuario Activo</p>
              <p className="text-sm font-bold text-white truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Cerrar Sesión"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center sm:justify-center' : 'gap-3'} p-3 rounded-xl text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/20 transition-all font-bold text-sm border border-transparent focus-visible:border-red-500/50`}
            title={isCollapsed ? 'Cerrar Sesión' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`sidebar-logout-text animate-in fade-in duration-300 ${isCollapsed ? 'hidden sm:hidden' : ''}`}>Cerrar Sesión</span>
          </button>
          <div className="text-[10px] text-gray-500 font-bold font-mono tracking-wider text-center mt-2">
            v{APP_VERSION}
          </div>
        </div>

      </div>
    </aside>
  );
}
