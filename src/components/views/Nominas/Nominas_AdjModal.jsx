import React from 'react';
import { X } from 'lucide-react';

export default function Nominas_AdjModal({ 
  adjModal, 
  setAdjModal, 
  handleAdjUpdate, 
  month, 
  year 
}) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (!adjModal.open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1a1c2d]/90 border border-surface-edge/50 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
        <div className="p-8 border-b border-surface-edge/30 bg-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white leading-none">Ajuste Manual</h3>
            <p className="text-sm font-black text-brand uppercase tracking-[0.2em] mt-3">Día {adjModal.day} · {months[month-1]} {year}</p>
          </div>
          <button onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cantidad del Extra</label>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-brand transition-colors">฿</span>
              <input 
                type="number" 
                autoFocus
                value={adjModal.amount} 
                onChange={(e) => setAdjModal(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-6 pl-12 text-4xl font-black text-white outline-none focus:border-brand/50 focus:bg-brand/5 transition-all appearance-none"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Concepto o Motivo</label>
            <textarea 
              value={adjModal.concept} 
              onChange={(e) => setAdjModal(prev => ({ ...prev, concept: e.target.value }))}
              className="w-full bg-surface-edge/20 border border-surface-edge/50 rounded-[20px] p-6 text-base font-bold text-gray-300 outline-none focus:border-brand/50 focus:bg-brand/5 transition-all min-h-[140px] resize-none placeholder:text-gray-700"
              placeholder="Escribe aquí el motivo del ajuste..."
            />
          </div>
        </div>

        <div className="p-6 bg-white/5 flex gap-4">
          <button 
            onClick={() => setAdjModal({ open: false, day: null, amount: 0, concept: '' })}
            className="flex-1 px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              handleAdjUpdate(adjModal.day, adjModal.amount, adjModal.concept);
              setAdjModal({ open: false, day: null, amount: 0, concept: '' });
            }}
            className="flex-[2] px-6 py-5 rounded-2xl font-black text-base uppercase tracking-widest bg-brand text-[#1a1c2d] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
