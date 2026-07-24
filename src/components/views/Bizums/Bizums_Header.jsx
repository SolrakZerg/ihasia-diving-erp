import { Search, Plus, CreditCard, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Bizums_Header({
  totalCount,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onAddClick,
}) {
  return (
    <div className="bg-surface border-b border-surface-edge p-4 sm:p-6 space-y-4">
      {/* Top row: Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Gestión de Bizums</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Control de reservas con depósito por Bizum y seguimiento de devoluciones
            </p>
          </div>
        </div>

        <button
          onClick={onAddClick}
          className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          NUEVA RESERVA
        </button>
      </div>

      {/* Bottom row: Tabs + Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-surface-soft border border-surface-edge rounded-xl max-w-fit">
          <button
            onClick={() => onTabChange('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Reservas Activas
          </button>
          <button
            onClick={() => onTabChange('returned')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'returned'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Historial Devueltas
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar por cliente, teléfono, actividad..."
            className="w-full bg-surface-soft border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
