import { Coins, TrendingUp, TrendingDown, Package, Shirt, ShieldCheck, Edit2 } from 'lucide-react';

/**
 * Bote_Stats — Las 4 tarjetas de resumen superior del módulo Bote.
 * Componente puramente presentacional, sin lógica propia.
 *
 * Props:
 *  - initialBote         {number}
 *  - isEditingInitial    {boolean}
 *  - setIsEditingInitial {function}
 *  - updateInitialBote   {function}
 *  - incomeTshirts       {number}
 *  - incomeInsurances    {number}
 *  - totalExpenses       {number}
 *  - currentBalance      {number}
 *  - stats               {{ tshirts, insurances }}
 *  - month               {number}
 *  - months              {string[]}
 */
export default function Bote_Stats({
  initialBote,
  isEditingInitial,
  setIsEditingInitial,
  updateInitialBote,
  incomeTshirts,
  incomeInsurances,
  totalExpenses,
  currentBalance,
  stats,
  month,
  months,
  pendingAmount,
  apartarReal,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      {/* 1. Fondo Inicial (Amarillo) */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-amber-500 transition-all shadow-lg shadow-amber-500/5">
        <div>
          <p className="text-[13px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Package className="w-4 h-4" /> Fondo Inicial
          </p>
          <div className="mt-4 flex items-center justify-between group/val">
            {isEditingInitial ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  autoFocus
                  type="number"
                  value={initialBote}
                  onBlur={() => setIsEditingInitial(false)}
                  onChange={e => updateInitialBote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingInitial(false)}
                  className="text-3xl font-black text-white bg-white/5 border border-white/10 rounded-xl outline-none w-full px-3 py-1 no-spinner animate-in zoom-in-95 duration-200"
                />
              </div>
            ) : (
              <div
                onClick={() => setIsEditingInitial(true)}
                className="flex items-baseline gap-1 cursor-pointer group-hover:scale-105 transition-transform duration-300"
              >
                <h4 className="text-3xl font-black text-white">{Number(initialBote).toLocaleString()}</h4>
                <span className="text-sm font-black text-amber-500/80">฿</span>
                <Edit2 className="w-3 h-3 text-amber-500 opacity-0 group-hover/val:opacity-100 ml-2 transition-opacity" />
              </div>
            )}
          </div>
        </div>
        <p className="text-[9px] text-amber-500/60 mt-2 font-bold uppercase italic">
          Arrastrado de {months[month === 1 ? 11 : month - 2]}
        </p>
      </div>

      {/* 2. Bote Mensual (Ingresos) */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2.5rem] shadow-lg shadow-emerald-500/5 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
        <div>
          <p className="text-[13px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> BOTE {months[month - 1]?.toUpperCase()}
          </p>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-white">
              {(incomeTshirts + incomeInsurances).toLocaleString()}
              <span className="text-sm font-black text-emerald-500/50 ml-1">฿</span>
            </h4>
            <p className="text-[12px] text-emerald-500/60 mt-1 font-bold uppercase tracking-widest">Total a retirar de caja</p>
          </div>
        </div>
        <div className="space-y-2 mt-4 pt-4 border-t border-emerald-500/10">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-text-muted uppercase flex items-center gap-2">
              <Shirt className="w-3 h-3" /> Camisetas
            </span>
            <span className="text-[11px] font-black text-white/80">{(stats.tshirts * 160).toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-text-muted uppercase flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Seguros
            </span>
            <span className="text-[11px] font-black text-white/80">{(stats.insurances * 75).toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-emerald-500/5">
            <span className="text-[11px] font-black text-text-muted uppercase flex items-center gap-2">
              Dejado en Caja
            </span>
            <span className="text-[11px] font-black text-rose-400">{(pendingAmount || 0).toLocaleString()} ฿</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-emerald-500 uppercase flex items-center gap-2">
              Neto a Llevarse
            </span>
            <span className="text-[11px] font-black text-emerald-500">{(apartarReal || 0).toLocaleString()} ฿</span>
          </div>
        </div>
      </div>

      {/* 3. Gastos Material (Rojo) */}
      <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2.5rem] shadow-lg shadow-rose-500/5 flex flex-col justify-between group hover:border-rose-500/30 transition-all">
        <div>
          <p className="text-[13px] font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" /> Gastos Bote
          </p>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-white">
              {totalExpenses.toLocaleString()}
              <span className="text-sm font-black text-rose-400/50 ml-1">฿</span>
            </h4>
          </div>
        </div>
      </div>

      {/* 4. Saldo Total Final (Brand) */}
      <div className="bg-brand rounded-[2.5rem] p-8 shadow-2xl shadow-brand/30 relative overflow-hidden group border border-white/10">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-700" />
        <p className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-1 opacity-90 relative z-10">Saldo Total Final</p>
        <h2 className="text-4xl font-black text-white tracking-tighter relative z-10 drop-shadow-md">
          {currentBalance.toLocaleString()}
          <span className="text-lg font-black text-white/40 ml-1">฿</span>
        </h2>
        <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-[12px] font-black text-white uppercase relative z-10">
          <span className="opacity-80">Progreso Mes</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg">
            {((apartarReal || 0) - totalExpenses).toLocaleString()} ฿
          </span>
        </div>
      </div>

    </div>
  );
}
