import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  TrendingUp, 
  Users, 
  Waves, 
  Receipt, 
  PlusCircle, 
  Database,
  Calendar
} from 'lucide-react';

export default function Overview() {
  const [diverCount, setDiverCount] = useState(0);

  useEffect(() => {
    async function getStats() {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      setDiverCount(count || 0);
    }
    getStats();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Panel de Control</h1>
          <p className="text-gray-400">Bienvenido al centro de operaciones. Aquí tienes un resumen del centro.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand/20">
            <PlusCircle className="w-5 h-5" />
            Nueva Factura
          </button>
          <button className="bg-surface-soft border border-surface-edge hover:border-brand/50 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
            <Database className="w-5 h-5" />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={TrendingUp} label="Ventas Hoy" value="45,200 ฿" trend="+12.5%" />
        <StatCard icon={Users} label="Buceadores Totales" value={diverCount} subValue="Sincronizados" />
        <StatCard icon={Waves} label="Tanques Usados" value="34" color="text-cyan-400" />
        <StatCard icon={Receipt} label="Facturas Pendientes" value="3" color="text-amber-400" />
      </div>

      {/* Dynamic Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-surface-soft rounded-2xl border border-surface-edge p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              Actividades Activas
            </h2>
            <div className="text-gray-500 italic text-center py-20 bg-surface/50 rounded-xl border border-dashed border-surface-edge">
              No hay registros activos. Empieza añadiendo un cliente o factura.
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <section className="bg-surface-soft rounded-2xl border border-surface-edge p-6">
            <h2 className="text-lg font-bold mb-4">Staff en Servicio</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-surface-edge">
                <span className="font-medium">Admin</span>
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Online</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, trend, color = "text-brand" }) {
  return (
    <div className="bg-surface-soft p-6 rounded-2xl border border-surface-edge hover:border-brand/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-surface ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && <span className="text-green-500 text-sm font-bold">{trend}</span>}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {subValue && <p className="text-gray-500 text-xs mt-1">{subValue}</p>}
      </div>
    </div>
  );
}
