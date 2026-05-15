import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Dashboard_View from './views/Dashboard/Dashboard_View';
import Customers_View from './views/Customers/Customers_View';
import InsuranceView from './views/Insurance/InsuranceView';
import SettingsView from './views/Settings/Settings';
import Billing from './views/Billing/Billing';
import Expenses from './views/Expenses/Expenses_View';
import SSIView from './views/SSI/SSIView';
import StaffSettlement from './views/Nominas/Nominas_View';
import CRBT_View from './views/CRBT/CRBT_View';
import Carabao_Header from './views/Carabao/Carabao_Header';
import { ChevronRight } from 'lucide-react';


export default function Dashboard({ user }) {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('active-view') || 'overview';
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
      case 'overview': return <Dashboard_View />;
      case 'customers': return <Customers_View onNavigate={navigateTo} />;
      case 'insurance': return <InsuranceView initialSelectedIds={viewPayload} onNavigate={navigateTo} />;
      case 'settings': return <SettingsView />;
      case 'billing': return <Billing isSidebarCollapsed={isSidebarCollapsed} />;
      case 'expenses': return <Expenses />;
      case 'ssi': return <SSIView />;
      case 'staff-settlement': return <StaffSettlement />;
      case 'partners-payouts': return <CRBT_View />;
      case 'supplier-payout': return <Carabao_Header />;
      case 'staff-payouts': return <Activities />; // This was likely meant for payout rules, using Activities or similar as placeholder or check actual mapping
      case 'activities': return <Activities />;

      default: return <Dashboard_View />;
    }
  };

  return (
    <div className="flex bg-surface min-h-screen">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="sm:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
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
          className="sm:hidden fixed top-4 left-0 z-[100] p-2 bg-brand rounded-r-lg text-white shadow-lg border border-l-0 border-surface-edge"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
