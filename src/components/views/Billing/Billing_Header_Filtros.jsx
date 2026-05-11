import { Search, BookOpen, Users, CreditCard, Coins, Calendar, X as CloseIcon } from 'lucide-react';

export default function Billing_Header_Filtros({
  searchTerm,              setSearchTerm,
  activitySearch,          setActivitySearch,
  instructorSearch,        setInstructorSearch,
  paymentMethodSearch,     setPaymentMethodSearch,
  showOnlyCommissionable,  setShowOnlyCommissionable,
  showOnlyToday,           setShowOnlyToday,
  showOnlyUnpaid,          setShowOnlyUnpaid,
}) {
  return (
    <div className="flex-none w-[300px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
      {/* Cabecera */}
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-brand text-xs font-bold">
          <Search className="w-3.5 h-3.5" /> Filtros
        </span>
        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Búsqueda</span>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col p-2 gap-2 bg-surface-soft/30">

        {/* Buscador de clientes */}
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="NOMBRE O APELLIDO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1">
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Buscador de actividades */}
        <div className="relative group w-full">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="ACTIVIDAD (EJ. OPEN...)"
            value={activitySearch}
            onChange={(e) => setActivitySearch(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all shadow-inner tracking-widest uppercase"
          />
          {activitySearch && (
            <button onClick={() => setActivitySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1">
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Buscador de instructor */}
        <div className="relative group w-full">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="INSTRUCTOR..."
            value={instructorSearch}
            onChange={(e) => setInstructorSearch(e.target.value)}
            className="h-8 w-full bg-surface-soft/40 border border-gray-500 rounded-lg pl-8 pr-8 text-[9px] font-black text-white placeholder:text-gray-400 outline-none focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/5 transition-all shadow-inner tracking-widest uppercase"
          />
        </div>

        {/* Fila 1: Método de pago + toggle comisionable */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-surface-edge/20">
          <div className="relative group">
            <CreditCard className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors pointer-events-none ${paymentMethodSearch ? 'text-amber-400' : 'text-gray-500'}`} />
            <select
              value={paymentMethodSearch}
              onChange={(e) => setPaymentMethodSearch(e.target.value)}
              className={`h-8 w-full rounded-lg pl-8 pr-2 text-[9px] font-black outline-none transition-all border shadow-sm cursor-pointer appearance-none uppercase tracking-tighter ${
                paymentMethodSearch
                  ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                  : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
              }`}
            >
              <option value="" className="bg-slate-900 text-gray-400">PAGO (TODO)</option>
              <option value="WISE BT" className="bg-slate-900 text-white">WISE BT</option>
              <option value="WISE CR" className="bg-slate-900 text-white">WISE CR</option>
              <option value="EUR BT"  className="bg-slate-900 text-white">EUR BT</option>
              <option value="EUR CR"  className="bg-slate-900 text-white">EUR CR</option>
              <option value="BIZUM"   className="bg-slate-900 text-white">BIZUM</option>
            </select>
          </div>

          <button
            onClick={() => setShowOnlyCommissionable(!showOnlyCommissionable)}
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 whitespace-nowrap uppercase tracking-tighter ${
              showOnlyCommissionable
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
            }`}
          >
            <Coins className={`w-3 h-3 ${showOnlyCommissionable ? 'text-amber-400' : ''}`} />
            {showOnlyCommissionable ? 'COMISIONABLE' : 'TODOS'}
          </button>

          {/* Fila 2: Día + estado de pago */}
          <button
            onClick={() => setShowOnlyToday(!showOnlyToday)}
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 whitespace-nowrap uppercase tracking-tighter ${
              showOnlyToday
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className={`w-3 h-3 ${showOnlyToday ? 'text-blue-400' : ''}`} />
            {showOnlyToday ? 'HOY' : 'TODOS LOS DIAS'}
          </button>

          <button
            onClick={() => setShowOnlyUnpaid(!showOnlyUnpaid)}
            className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-[9px] font-black transition-all border shadow-sm h-8 whitespace-nowrap uppercase tracking-tighter ${
              showOnlyUnpaid
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-400'
                : 'bg-surface border-surface-edge text-gray-400 hover:text-white'
            }`}
          >
            <Search className={`w-3 h-3 ${showOnlyUnpaid ? 'text-amber-500' : ''}`} />
            {showOnlyUnpaid ? 'PENDIENTES' : 'TODOS LOS ESTADOS'}
          </button>
        </div>

      </div>
    </div>
  );
}
