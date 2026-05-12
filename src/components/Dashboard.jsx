import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Overview from './views/Overview';
import Customers_View from './views/Customers/Customers_View';
import InsuranceView from './views/Insurance/InsuranceView';
import SettingsView from './views/Settings/Settings';
import Billing from './views/Billing/Billing';
import Expenses from './views/Expenses/Expenses_View';
import SSIView from './views/SSI/SSIView';
import StaffSettlement from './views/StaffSettlement';
import PartnersPayouts from './views/PartnersPayouts';
import Carabao_Header from './views/Carabao/Carabao_Header';



export default function Dashboard({ user }) {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('active-view') || 'overview';
  });
  const [viewPayload, setViewPayload] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Overview />;
      case 'customers': return <Customers_View onNavigate={navigateTo} />;
      case 'insurance': return <InsuranceView initialSelectedIds={viewPayload} onNavigate={navigateTo} />;
      case 'settings': return <SettingsView />;
      case 'billing': return <Billing isSidebarCollapsed={isSidebarCollapsed} />;
      case 'expenses': return <Expenses />;
      case 'ssi': return <SSIView />;
      case 'staff-settlement': return <StaffSettlement />;
      case 'partners-payouts': return <PartnersPayouts />;
      case 'supplier-payout': return <Carabao_Header />;
      case 'staff-payouts': return <Activities />; // This was likely meant for payout rules, using Activities or similar as placeholder or check actual mapping
      case 'activities': return <Activities />;

      default: return <Overview />;
    }
  };

  return (
    <div className="flex bg-surface min-h-screen">
      {/* Dynamic Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={(view) => navigateTo(view, null)} 
        user={user} 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
}
