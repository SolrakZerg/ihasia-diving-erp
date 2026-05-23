import React from 'react';
import { ShieldCheck, Mail, Settings } from 'lucide-react';

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
    <div className="mb-8 flex flex-col items-center lg:flex-row flex-wrap justify-between gap-6 flex-none lg:overflow-x-auto overflow-visible w-full">
      <div className="flex items-center justify-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 justify-center text-center">
            <ShieldCheck className="w-8 h-8 text-brand" />
            Seguros
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 bg-surface-soft border border-surface-edge rounded-2xl p-4 sm:p-2 shadow-inner w-full sm:w-auto">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-text-header font-bold mb-1">Pax Restantes</p>
          <p className={`text-3xl font-black ${paxBalance < 25 ? 'text-rose-400 animate-pulse' : 'text-brand'}`}>
            {paxBalance}
          </p>
        </div>

        <div className="hidden sm:block w-px h-12 bg-surface-edge mx-2"></div>

        <div className="flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
          <p className="text-xs uppercase tracking-wider text-text-header font-bold mb-1 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Destinatarios
          </p>
          <p className="text-sm font-semibold text-brand max-w-[200px] truncate" title={targetEmails}>
            {targetEmails || 'Sin configurar'}
          </p>
        </div>

        <div className="hidden sm:block w-px h-12 bg-surface-edge mx-2"></div>

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
          className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-edge/30 text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
          title="Ajustes de envío y recargo de plazas"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
