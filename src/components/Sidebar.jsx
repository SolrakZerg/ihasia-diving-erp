import { 
  BarChart3, 
  Users, 
  Calendar, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Waves,
  User,
  ShieldCheck,
  Wallet,
  Receipt,
  Zap,
  Banknote
} from 'lucide-react';

import logoFull from '../assets/Logo_Ihasia.svg';
import logoSmall from '../assets/logo-version-movil-ihasia.webp';

export default function Sidebar({ activeView, onViewChange, user, onLogout, isCollapsed, onToggleCollapse }) {
  const menuItems = [
    { id: 'overview', label: 'Panel Principal', icon: BarChart3 },
    { id: 'billing', label: 'Facturas', icon: Wallet },
    { id: 'payouts', label: 'Sueldos Staff', icon: Banknote },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'ssi', label: 'Pagos SSI', icon: Zap },
    { id: 'customers', label: 'Buceadores', icon: Users },
    { id: 'insurance', label: 'Seguros Diarios', icon: ShieldCheck },
    { id: 'logs', label: 'Diario de Buceo', icon: Waves },
    { id: 'attendance', label: 'Asistencia', icon: Calendar },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface-soft border-r border-surface-edge flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-40`}>
      <div className={`p-4 flex items-center justify-center border-b border-surface-edge relative ${isCollapsed ? 'h-20' : 'h-48'}`}>
        {isCollapsed ? (
          <img src={logoSmall} alt="Logo" className="w-10 h-10 object-contain animate-in fade-in zoom-in duration-500 brightness-0 invert" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img 
              src={logoFull} 
              alt="Ihasia Logo" 
              className="h-28 w-auto object-contain animate-in fade-in slide-in-from-top-4 duration-500 brightness-0 invert" 
            />
            <img 
              src={logoSmall} 
              alt="Ihasia Name" 
              className="h-10 w-auto object-contain animate-in fade-in slide-in-from-bottom-4 duration-700 brightness-0 invert opacity-90" 
            />
          </div>
        )}
        
        {/* Toggle Button */}
        <button 
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-edge border border-surface-edge flex items-center justify-center text-gray-300 hover:text-white hover:scale-110 transition-all z-50 shadow-lg focus-visible:ring-2 focus-visible:ring-brand"
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
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all group relative border border-transparent focus-visible:border-brand-light focus-visible:bg-brand/10 ${
                isActive 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-gray-300 hover:bg-surface hover:text-white focus-visible:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-brand-light'}`} />
                {!isCollapsed && <span className="font-semibold text-sm animate-in slide-in-from-left-2 duration-300">{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-brand text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
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
            <User className="w-5 h-5 text-gray-400" />
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
