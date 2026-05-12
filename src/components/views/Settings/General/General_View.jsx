import React from 'react';
import { useGeneralData } from './useGeneralData';
import General_EntityCard from './General_EntityCard';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const General_View = () => {
  const {
    loading,
    saving,
    entities,
    toast,
    updateEntityField,
    saveEntity,
    handleFileUpload,
    removeImage
  } = useGeneralData();

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-300 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl ${
          toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-surface-edge pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Información del Centro</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Gestión Legal y de Facturación</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {entities.map(entity => (
          <General_EntityCard 
            key={entity.id} 
            entity={entity} 
            saving={saving}
            updateEntityField={updateEntityField}
            saveEntity={saveEntity}
            handleFileUpload={handleFileUpload}
            removeImage={removeImage}
          />
        ))}
      </div>
    </div>
  );
};

export default General_View;
