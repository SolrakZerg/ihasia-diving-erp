import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Dashboard_View from './views/Dashboard/Dashboard_View';
import Customers_View from './views/Customers/Customers_View';
import Insurance_View from './views/Insurance/InsuranceView';
import Settings_View from './views/Settings/Settings';
import Billing_View from './views/Billing/Billing_View';
import Expenses_View from './views/Expenses/Expenses_View';
import SSI_View from './views/SSI/SSI_View';
import Nominas_View from './views/Nominas/Nominas_View';
import CRBT_View from './views/CRBT/CRBT_View';
import Carabao_View from './views/Carabao/Carabao_Header';
import Bizums_View from './views/Bizums/Bizums_View';
import { ChevronRight } from 'lucide-react';
import { UndoProvider } from '../context/UndoContext';


export default function Dashboard({ user }) {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('active-view') || 'dashboard';
  });
  const [viewPayload, setViewPayload] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebar-collapsed', String(newVal));
      return newVal;
    });
  };

  const navigateTo = (view, payload = null) => {
    setViewPayload(payload);
    setActiveView(view);
    localStorage.setItem('active-view', view);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard_View />;
      case 'customers': return <Customers_View onNavigate={navigateTo} />;
      case 'bizums': return <Bizums_View />;
      case 'insurance': return <Insurance_View initialSelectedIds={viewPayload} onNavigate={navigateTo} />;
      case 'settings': return <Settings_View />;
      case 'billing': return <Billing_View isSidebarCollapsed={isSidebarCollapsed} />;
      case 'expenses': return <Expenses_View />;
      case 'ssi': return <SSI_View />;
      case 'nominas': return <Nominas_View />;
      case 'crbt': return <CRBT_View />;
      case 'carabao': return <Carabao_View />;

      default: return <Dashboard_View />;
    }
  };

  return (
    <UndoProvider currentView={activeView} navigateTo={navigateTo}>
      <div className="flex bg-surface min-h-screen">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sm:hidden mobile-backdrop fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}



      {/* Dynamic Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={(view) => navigateTo(view, null)} 
        user={user} 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto h-screen">
        {renderView()}
      </main>

      {/* Mobile Toggle Button */}
      {!isMobileOpen && (
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="sm:hidden mobile-toggle fixed top-4 left-0 z-[100] pl-1 pr-2 py-1.5 bg-surface-soft/30 hover:bg-brand/20 backdrop-blur-sm rounded-r-lg text-brand-light/60 hover:text-white shadow-md border border-l-0 border-surface-edge/30 transition-all duration-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
    </UndoProvider>
  );
}
