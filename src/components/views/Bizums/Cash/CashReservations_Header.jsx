import { Search, Banknote, Clock, CheckCircle2, Layers, Plus } from 'lucide-react';

export default function CashReservations_Header({
  totalCount,
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onNewReservationClick,
}) {
  return (
    <div className="bg-surface-soft/20 border border-surface-edge rounded-2xl p-4 sm:p-6 space-y-4 mb-4">
      {/* Top row: Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Reservas en Efectivo (Cash)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {totalCount} {totalCount === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Gestión de reservas en cash, sincronizadas con Google Calendar y candado antifantasmas
            </p>
          </div>
        </div>

        <button
          onClick={onNewReservationClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs tracking-wider uppercase hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded ml-1 font-mono">Alt + B</span>
        </button>
      </div>

      {/* Bottom row: Tabs + Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center p-1 bg-surface-soft border border-surface-edge rounded-xl max-w-fit">
          <button
            onClick={() => onTabChange('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pendientes
          </button>
          <button
            onClick={() => onTabChange('imported')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'imported'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Facturadas
          </button>
          <button
            onClick={() => onTabChange('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-brand text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Todas
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar por cliente, teléfono o actividad..."
            className="w-full bg-surface-soft border border-surface-edge rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
