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
import StaffSettlement from './views/StaffSettlement';


// Mock views for now
const Logs = () => <div className="p-10 text-gray-400">Próximamente: Diario de Buceo</div>;
const Attendance = () => <div className="p-10 text-gray-400">Próximamente: Asistencia</div>;

export default function Dashboard({ user }) {
  const [activeView, setActiveView] = useState('overview');
  const [viewPayload, setViewPayload] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigateTo = (view, payload = null) => {
    setViewPayload(payload);
    setActiveView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Overview />;
      case 'customers': return <CustomerTable onNavigate={navigateTo} />;
      case 'insurance': return <InsuranceView initialSelectedIds={viewPayload} onNavigate={navigateTo} />;
      case 'logs': return <Logs />;
      case 'attendance': return <Attendance />;
      case 'settings': return <AdminSettings />;
      case 'billing': return <Billing />;
      case 'expenses': return <Expenses />;
      case 'ssi': return <SSIView />;
      case 'payouts': return <StaffSettlement />;

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
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
}
