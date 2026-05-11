import { Target } from 'lucide-react';

export default function Billing_Header_Finanzas({ stats }) {
  return (
    <div className="flex-none w-[200px] flex flex-col border border-surface-edge rounded-xl bg-surface-soft shadow-md overflow-hidden shrink-0">
      {/* Cabecera */}
      <div className="bg-surface border-b border-surface-edge px-3 flex items-center justify-between h-[25px] min-h-[25px] gap-2">
        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
          <Target className="w-3.5 h-3.5" /> Finanzas
        </span>
        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Global</span>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col p-3 px-4 justify-between bg-surface-soft/30 gap-1.5">

        {/* Totales principales */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-[12px] uppercase font-black tracking-tight">Facturado:</span>
            <span className="text-amber-500 font-black text-[16px]">
              {stats.facturado.toLocaleString()} <span className="text-[12px] opacity-40">฿</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-500 text-[12px] uppercase font-black tracking-tight">Cobrado:</span>
            <span className="text-emerald-500 font-black text-[16px]">
              {stats.cobrado.toLocaleString()} <span className="text-[12px] opacity-40">฿</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-rose-400 text-[12px] uppercase font-black tracking-tight">Pendiente:</span>
            <span className="text-rose-400 font-black text-[16px]">
              {stats.pendiente.toLocaleString()} <span className="text-[12px] opacity-40">฿</span>
            </span>
          </div>
        </div>

        {/* Desglose por método de pago */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 py-1.5 border-y border-surface-edge/20">
          <div>
            <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">Wise BT</span>
            <span className="text-pink-400 font-black text-[16px]">
              {stats.wiseBT.toLocaleString()} <span className="text-[10px] opacity-50">฿</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">Wise CR</span>
            <span className="text-blue-400 font-black text-[16px]">
              {stats.wiseCR.toLocaleString()} <span className="text-[10px] opacity-50">฿</span>
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">EUR BT</span>
            <span className="text-pink-400 font-black text-[16px]">
              {stats.eurBT.toLocaleString()} <span className="text-[10px] opacity-50">฿</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-[12px] uppercase font-black block leading-none">EUR CR</span>
            <span className="text-blue-400 font-black text-[16px]">
              {stats.eurCR.toLocaleString()} <span className="text-[10px] opacity-50">฿</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
