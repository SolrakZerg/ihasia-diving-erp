import { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Phone, Award, Hash, CreditCard } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function Bizums_EditModal({ bizum, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!(bizum && bizum.id);

  useEffect(() => {
    if (isOpen && bizum) {
      setFormData({ ...bizum });
    } else if (isOpen && !bizum) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        booking_date: today,
        num_people: 1,
        is_paid: false,
        is_returned: false,
      });
    } else if (!isOpen) {
      setFormData({});
    }
  }, [bizum, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.customer_name || !formData.customer_name.trim()) {
        throw new Error('El campo "Nombre y Apellidos" es obligatorio.');
      }
      if (!formData.booking_date) {
        throw new Error('El campo "Fecha Reserva" es obligatorio.');
      }

      const payload = {
        booking_date: formData.booking_date,
        customer_name: formData.customer_name.trim(),
        num_people: Number(formData.num_people || 1),
        activity: formData.activity ? formData.activity.trim() : null,
        bizum_phone: formData.bizum_phone ? formData.bizum_phone.trim() : null,
        whatsapp_phone: formData.whatsapp_phone ? formData.whatsapp_phone.trim() : null,
        is_paid: !!formData.is_paid,
        is_returned: !!formData.is_returned,
        notes: formData.notes ? formData.notes.trim() : null,
      };

      let submitError;
      if (isEditMode) {
        const { error } = await supabase
          .from('bizums')
          .update(payload)
          .eq('id', bizum.id);
        submitError = error;
      } else {
        const { error } = await supabase
          .from('bizums')
          .insert([payload]);
        submitError = error;
      }

      if (submitError) throw submitError;

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/20 text-brand border border-brand/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Reserva Bizum' : 'Nueva Reserva Bizum'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {isEditMode ? 'Modifica los datos del depósito registrado' : 'Introduce la información del depósito Bizum'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup
              label="Nombre y Apellidos"
              name="customer_name"
              value={formData.customer_name || ''}
              onChange={handleChange}
              icon={User}
              required
            />

            <InputGroup
              label="Fecha Reserva"
              name="booking_date"
              type="date"
              value={formData.booking_date || ''}
              onChange={handleChange}
              icon={Calendar}
              required
            />

            <InputGroup
              label="Número de Personas (Pax)"
              name="num_people"
              type="number"
              min="1"
              value={formData.num_people || 1}
              onChange={handleChange}
              icon={Hash}
            />

            <InputGroup
              label="Actividad"
              name="activity"
              value={formData.activity || ''}
              onChange={handleChange}
              icon={Award}
              placeholder="Ej. Open Water, Bautizo..."
            />

            <InputGroup
              label="Teléfono Bizum"
              name="bizum_phone"
              value={formData.bizum_phone || ''}
              onChange={handleChange}
              icon={Phone}
              placeholder="Ej. +34623181447"
            />

            <InputGroup
              label="Teléfono WhatsApp"
              name="whatsapp_phone"
              value={formData.whatsapp_phone || ''}
              onChange={handleChange}
              icon={Phone}
              placeholder="Ej. +34623181447"
            />
          </div>

          {/* Checkboxes */}
          <div className="pt-2 border-t border-surface-edge grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300 select-none">
              <input
                type="checkbox"
                name="is_paid"
                checked={!!formData.is_paid}
                onChange={handleChange}
                className="w-4 h-4 rounded border-surface-edge text-brand focus:ring-brand"
              />
              <span>Marcado como PAGADO</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300 select-none">
              <input
                type="checkbox"
                name="is_returned"
                checked={!!formData.is_returned}
                onChange={handleChange}
                className="w-4 h-4 rounded border-surface-edge text-brand focus:ring-brand"
              />
              <span>Marcado como DEVUELTO</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-surface-edge bg-surface-soft/30 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-cancel text-xs">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-brand text-white text-xs font-black shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR RESERVA'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, icon: Icon, required, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 px-0.5">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full bg-surface-soft border border-surface-edge rounded-xl ${
            Icon ? 'pl-9' : 'pl-3'
          } pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand/50 transition-all`}
          {...props}
        />
      </div>
    </div>
  );
}
