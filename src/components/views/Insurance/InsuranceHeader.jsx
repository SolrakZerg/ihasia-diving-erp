import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Settings } from 'lucide-react';

export default function InsuranceHeader({ 
  onNavigate, 
  paxBalance, 
  targetEmails, 
  durationDays, 
  contractTitle, 
  setSettingsForm, 
  setShowSettingsModal 
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 flex-none">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('customers')}
          className="w-10 h-10 rounded-full bg-surface-soft border border-surface-edge flex items-center justify-center text-gray-400 hover:text-white transition-all transform hover:-translate-x-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand" />
            Seguros Diarios
          </h1>
          <p className="text-gray-400">Automatización y envío de PDFs a la aseguradora</p>
        </div>
      </div>

      <div className="flex items-center gap-8 bg-surface-soft border border-surface-edge rounded-2xl p-4 shadow-inner">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Pax Restantes</p>
          <p className={`text-3xl font-black ${paxBalance < 25 ? 'text-rose-500 animate-pulse' : 'text-brand'}`}>
            {paxBalance}
          </p>
        </div>
        
        <div className="w-px h-12 bg-surface-edge mx-2"></div>
        
        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Destinatarios
          </p>
          <p className="text-sm font-semibold text-brand max-w-[200px] truncate" title={targetEmails}>
            {targetEmails || 'Sin configurar'}
          </p>
        </div>
        
        <div className="w-px h-12 bg-surface-edge mx-2"></div>
        
        <button
          onClick={() => {
            setSettingsForm({ 
              emails: targetEmails, 
              addPax: 0, 
              durationDays: durationDays, 
              contractTitle: contractTitle,
              paxBalance: paxBalance 
            });
            setShowSettingsModal(true);
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
          title="Ajustes de envío y recargo de plazas"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
