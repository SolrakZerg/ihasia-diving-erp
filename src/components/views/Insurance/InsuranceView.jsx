import React from 'react';
import { useInsuranceData } from './useInsuranceData';
import InsuranceHeader from './InsuranceHeader';
import InsuranceTable from './InsuranceTable';
import InsuranceSidebar from './InsuranceSidebar';
import { Settings, Mail, ShieldCheck, Calendar, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function InsuranceView({ initialSelectedIds, onNavigate }) {
  const {
    loading,
    processing,
    paxBalance,
    targetEmails,
    durationDays,
    contractTitle,
    customers,
    searchTerm,
    setSearchTerm,
    toast,
    updateCustomerField,
    editingId,
    setEditingId,
    showSettingsModal,
    setShowSettingsModal,
    settingsForm,
    setSettingsForm,
    historyBatches,
    addSearchQuery,
    setAddSearchQuery,
    addResults,
    isSearching,
    loadTodayCustomers,
    handleSaveSettings,
    handleRemoveCustomer,
    handleGenerateAndSend,
    handleAddDirectly,
    filteredCustomers
  } = useInsuranceData(initialSelectedIds);

  const handleViewPDF = async (pdf_url) => {
    const { data } = await supabase.storage.from('insurance_pdfs').createSignedUrl(pdf_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="p-2 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col">
      
      <InsuranceHeader 
        onNavigate={onNavigate}
        paxBalance={paxBalance}
        targetEmails={targetEmails}
        durationDays={durationDays}
        contractTitle={contractTitle}
        setSettingsForm={setSettingsForm}
        setShowSettingsModal={setShowSettingsModal}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 relative items-start">
        
        <InsuranceTable 
          customers={customers}
          paxBalance={paxBalance}

          addSearchQuery={addSearchQuery}
          setAddSearchQuery={setAddSearchQuery}
          isSearching={isSearching}
          addResults={addResults}
          handleAddDirectly={handleAddDirectly}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loading={loading}
          filteredCustomers={filteredCustomers}
          loadTodayCustomers={loadTodayCustomers}
          processing={processing}
          onNavigate={onNavigate}
          editingId={editingId}
          setEditingId={setEditingId}
          updateCustomerField={updateCustomerField}
          handleRemoveCustomer={handleRemoveCustomer}
          handleGenerateAndSend={handleGenerateAndSend}
        />

        <InsuranceSidebar 
          historyBatches={historyBatches}
          onViewPDF={handleViewPDF}
        />
      </div>

      {/* Settings Modal (Mantenido aquí para no complicar con más archivos) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-edge shadow-brand/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand" /> 
              Configuración de Seguros
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Correos de destino
                </label>
                <input 
                  type="text" 
                  value={settingsForm.emails}
                  onChange={(e) => setSettingsForm({...settingsForm, emails: e.target.value})}
                  placeholder="admin@ejemplo.com, otro@ejec.com"
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-xs text-text-muted mt-2">Pudes separar varios correos con comas.</p>
              </div>

              <div className="p-4 rounded-xl bg-brand/5 border border-brand/20">
                <label className="block text-xs uppercase tracking-wider text-brand font-bold mb-2">
                  Recargar Plazas de Seguro (PAX)
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      min="0"
                      value={settingsForm.addPax || ''}
                      onChange={(e) => setSettingsForm({...settingsForm, addPax: parseInt(e.target.value) || 0})}
                      placeholder="Ej: Sumar 100 plazas..."
                      className="w-full bg-surface border border-brand/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Plazas restantes (PAX)
                  </label>
                  <input 
                    type="number" 
                    value={settingsForm.paxBalance}
                    onChange={(e) => setSettingsForm({...settingsForm, paxBalance: parseInt(e.target.value) || 0})}
                    className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Días de duración
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={settingsForm.durationDays || 30}
                    onChange={(e) => setSettingsForm({...settingsForm, durationDays: parseInt(e.target.value) || 30})}
                    className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-text-muted font-bold mb-2">
                  Cabecera (Contrato de Seguro Activo)
                </label>
                <input 
                  type="text" 
                  value={settingsForm.contractTitle || ''}
                  onChange={(e) => setSettingsForm({...settingsForm, contractTitle: e.target.value})}
                  placeholder="Ej: EFF. 18/10/2024-2025 ( 200 Pax )"
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-surface-edge transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand text-white hover:bg-brand-light flex items-center gap-2 transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl border ${
            toast.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
              : 'bg-brand/10 border-brand/30 text-brand-light'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 flex-shrink-0" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
