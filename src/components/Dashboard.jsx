import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import Overview from './views/Overview';
import Activities from './views/Activities';
import CustomerTable from './views/CustomerTable';
import InsuranceView from './views/InsuranceView';
import AdminSettings from './views/AdminSettings';
import Billing from './views/Billing';
import Expenses from './views/Expenses';
import SSIView from './views/SSIView';
import TestSSIView from './views/SSI/test_SSIView';
import StaffSettlement from './views/StaffSettlement';
import PartnersPayouts from './views/PartnersPayouts';
import SupplierPayout from './views/SupplierPayout';



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
      case 'customers': return <CustomerTable onNavigate={navigateTo} />;
      case 'insurance': return <InsuranceView initialSelectedIds={viewPayload} onNavigate={navigateTo} />;
      case 'settings': return <AdminSettings />;
      case 'billing': return <Billing isSidebarCollapsed={isSidebarCollapsed} />;
      case 'expenses': return <Expenses />;
      case 'ssi': return <SSIView />;
      case 'test-ssi': return <TestSSIView />;
      case 'staff-settlement': return <StaffSettlement />;
      case 'partners-payouts': return <PartnersPayouts />;
      case 'supplier-payout': return <SupplierPayout />;
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
