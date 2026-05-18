import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Award, Shield, MapPin, Hash, MessageSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function Customer_Edit({ customer, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customer) {
      setFormData({ ...customer });
    } else {
      setFormData({});
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', customer.id);

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
      <div className="relative w-full max-w-2xl bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Buceador</h2>
              <p className="text-xs text-gray-500 font-medium">Actualiza la información del perfil</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all shadow-inner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section: Básicos */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-1">Información Básica</h3>
              <InputGroup label="Nombre" name="first_name" value={formData.first_name || ''} onChange={handleChange} icon={User} required />
              <InputGroup label="Apellidos" name="last_name" value={formData.last_name || ''} onChange={handleChange} icon={User} />
              <InputGroup label="Email" name="email" value={formData.email || ''} onChange={handleChange} icon={Mail} type="email" required />
              <InputGroup label="Teléfono" name="phone" value={formData.phone || ''} onChange={handleChange} icon={Phone} />
            </div>

            {/* Section: Buceo */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 px-1">Perfil de Buceo</h3>
              <InputGroup label="Nivel/Certificación" name="certification_level" value={formData.certification_level || ''} onChange={handleChange} icon={Award} />
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Total Buceos" name="total_dives" value={formData.total_dives || ''} onChange={handleChange} type="number" />
                <InputGroup label="Último Buceo" name="last_dive_date" value={formData.last_dive_date || ''} onChange={handleChange} type="date" />
              </div>
              <InputGroup label="Pasaporte" name="passport_number" value={formData.passport_number || ''} onChange={handleChange} icon={Hash} />
            </div>

            {/* Section: Logística */}
            <div className="space-y-4 md:col-span-2 border-t border-surface-edge pt-6">
              <h3 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1 px-1">Reserva y Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Actividad Reservada" name="booked_activity" value={formData.booked_activity || ''} onChange={handleChange} icon={MessageSquare} />
                <InputGroup label="Fecha Reserva" name="booking_date" value={formData.booking_date || ''} onChange={handleChange} type="date" />
              </div>
              <InputGroup label="Dirección / Hotel" name="address" value={formData.address || ''} onChange={handleChange} icon={MapPin} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Contacto Emergencia" name="emergency_contact" value={formData.emergency_contact || ''} onChange={handleChange} icon={Phone} />
                <InputGroup label="Vencimiento Seguro" name="insurance_expiry" value={formData.insurance_expiry || ''} onChange={handleChange} type="date" />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-surface-edge bg-surface-soft/30 flex items-center justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-brand text-white text-sm font-black shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, icon: Icon, required, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 px-1">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input 
          className={`w-full bg-surface-soft border border-surface-edge rounded-xl ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/40 transition-all`}
          {...props}
        />
      </div>
    </div>
  );
}
