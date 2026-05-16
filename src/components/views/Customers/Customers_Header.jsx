import { Search, Filter, LayoutList, LayoutGrid, UserRoundSearch } from 'lucide-react';

export default function Customers_Header({
  totalCount,
  currentPage,
  totalPages,
  searchTerm,
  handleSearchChange,
  isSearching,
  isExtendedView,
  setIsExtendedView,
  isFilterOpen,
  setIsFilterOpen,
  activeDateFilter,
  showDuplicates,
  handleDateFilterChange,
  toggleDuplicates,
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      {/* Title + Subtitle */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
          <UserRoundSearch className="w-8 h-8 text-brand" />
          Clientes
        </h1>
        <p className="text-text-muted">
          {totalCount.toLocaleString('es-ES')} registros en total · Página {currentPage + 1} de {totalPages || 1}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 relative">

        {/* Search */}
        <div className="relative group flex-1 md:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="bg-surface-soft border border-surface-edge rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 w-full md:w-64 transition-all shadow-inner"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Extended View Toggle */}
        <button
          onClick={() => setIsExtendedView(!isExtendedView)}
          className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
            isExtendedView
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
              : 'bg-surface-soft border-surface-edge text-text-muted hover:text-white hover:border-brand/30'
          }`}
          title={isExtendedView ? 'Vista Compacta' : 'Vista Extendida'}
        >
          {isExtendedView ? <LayoutList className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">
            {isExtendedView ? 'Compacto' : 'Extendido'}
          </span>
        </button>

        {/* Filter Button + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
              activeDateFilter !== 'all' || isFilterOpen
                ? 'bg-brand/10 border-brand/50 text-brand'
                : 'bg-surface-soft border-surface-edge text-text-muted hover:text-white hover:border-brand/30'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Filtros</span>
            {activeDateFilter !== 'all' && (
              <span className="flex w-2 h-2 rounded-full bg-brand animate-pulse" />
            )}
          </button>

          {/* Filter Dropdown */}
          {isFilterOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-surface/95 backdrop-blur-xl border border-surface-edge rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-surface-edge bg-surface-soft/50">
                <h3 className="text-xs font-bold text-text-header uppercase tracking-widest">Filtros Avanzados</h3>
              </div>
              <div className="p-2 space-y-1">
                <FilterButton
                  label="🔍 Todos los registros"
                  active={activeDateFilter === 'all' && !showDuplicates}
                  onClick={() => handleDateFilterChange('all')}
                />
                <div className="h-px bg-surface-edge/50 my-1 mx-2" />
                <FilterButton
                  label="👯 Ver Duplicados"
                  active={showDuplicates}
                  onClick={toggleDuplicates}
                />
                <div className="h-px bg-surface-edge/50 my-1 mx-2" />
                <FilterButton
                  label="📌 Solo Hoy"
                  active={activeDateFilter === 'today'}
                  onClick={() => handleDateFilterChange('today')}
                />
                <FilterButton
                  label="🗓️ Ventana (Ayer, Hoy, Mañana)"
                  active={activeDateFilter === '3days'}
                  onClick={() => handleDateFilterChange('3days')}
                />
                <FilterButton
                  label="🌊 Esta Semana"
                  active={activeDateFilter === 'week'}
                  onClick={() => handleDateFilterChange('week')}
                />
              </div>
              {(activeDateFilter !== 'all' || showDuplicates) && (
                <div className="p-3 bg-brand/5 border-t border-brand/10">
                  <button
                    onClick={() => {
                      handleDateFilterChange('all');
                    }}
                    className="w-full py-2 text-[10px] font-bold text-brand uppercase hover:underline"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Subcomponente local ──────────────────────────────────────────────────────

function FilterButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
        active
          ? 'bg-brand text-white shadow-md shadow-brand/20'
          : 'text-text-muted hover:bg-surface-edge hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
