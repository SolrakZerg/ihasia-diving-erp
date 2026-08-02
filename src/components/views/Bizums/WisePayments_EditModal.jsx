import { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, User, Hash, FileText, ArrowDownLeft, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function WisePayments_EditModal({ payment, isOpen, onClose, onSaved }) {
  const [isRetained, setIsRetained] = useState(false);
  const [retainedPeople, setRetainedPeople] = useState(1);
  const [isSettled, setIsSettled] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setIsRetained(!!payment.is_retained);
      setRetainedPeople(payment.retained_people || payment.num_people || 1);
      setIsSettled(!!payment.is_settled);
      setIsProcessed(!!payment.is_processed);
      setNotes(payment.notes || '');
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        is_retained: isRetained,
        retained_people: isRetained ? Number(retainedPeople) : null,
        is_settled: isRetained ? isSettled : false,
        is_processed: isProcessed,
        notes: notes,
      };

      const { error } = await supabase
        .from('wise_payments')
        .update(updates)
        .eq('id', payment.id);

      if (error) throw error;

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error updating Wise payment:', err);
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface-soft border border-surface-edge rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-edge pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Editar Pago de Wise</h3>
              <p className="text-[11px] text-gray-400 font-mono">ID: #{payment.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Readonly Info Box */}
          <div className="bg-surface/50 border border-surface-edge rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-brand" /> Remitente:
              </span>
              <strong className="text-white capitalize">{payment.sender_name}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Importe:
              </span>
              <strong className="text-emerald-400 font-black">
                {payment.amount_raw} {payment.currency} ({payment.num_people} Pax)
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Fecha:
              </span>
              <span className="text-gray-300 font-mono">{formatDate(payment.created_at)}</span>
            </div>

            {payment.reference && (
              <div className="flex items-center justify-between border-t border-surface-edge/40 pt-1.5">
                <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> Referencia:
                </span>
                <span className="text-gray-300 truncate max-w-[220px]" title={payment.reference}>
                  {payment.reference}
                </span>
              </div>
            )}
          </div>

          {/* Editable Controls */}
          <div className="space-y-3.5 pt-1">
            
            {/* Control: Procesado */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-edge">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Marcar como Procesado
                </label>
                <p className="text-[10px] text-gray-400">Transferencia verificada en la app o contabilidad</p>
              </div>
              <input 
                type="checkbox"
                checked={isProcessed}
                onChange={(e) => setIsProcessed(e.target.checked)}
                className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-brand focus:ring-brand accent-brand cursor-pointer"
              />
            </div>

            {/* Control: Retención */}
            <div className="p-3 rounded-xl bg-surface border border-surface-edge space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Depósito Retenido (No presentado)
                  </label>
                  <p className="text-[10px] text-gray-400">Mueve el depósito a la pestaña de Depósitos Retenidos</p>
                </div>
                <input 
                  type="checkbox"
                  checked={isRetained}
                  onChange={(e) => setIsRetained(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Opciones adicionales si está retenido */}
              {isRetained && (
                <div className="pt-2 border-t border-surface-edge/60 space-y-3 animate-in fade-in duration-200">
                  {/* Selector de Pax Retenidos si tiene más de 1 Pax */}
                  {payment.num_people > 1 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                        Personas Retenidas (Pax):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: payment.num_people }).map((_, idx) => {
                          const paxVal = idx + 1;
                          const isSelected = Number(retainedPeople) === paxVal;
                          return (
                            <button
                              key={paxVal}
                              type="button"
                              onClick={() => setRetainedPeople(paxVal)}
                              className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                  : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white'
                              }`}
                            >
                              <span>{paxVal} Pax</span>
                              <span className="text-[10px] opacity-75">
                                {paxVal === payment.num_people ? '(Total)' : '(Parcial)'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Estado de Reparto entre Socios */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[11px] font-semibold text-gray-300">
                      Repartido entre socios:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSettled(!isSettled)}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        isSettled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {isSettled ? '✓ Repartido (Liquidado)' : '⏳ Pendiente de Repartir'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Campo: Notas */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                Notas Internas / Observaciones:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade notas aclaratorias sobre este pago..."
                className="w-full bg-surface border border-surface-edge rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-edge">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
