import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Award, Shield, MapPin, Hash, MessageSquare, UserPlus, Shirt } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { ROSTER_BCD_SIZES, ROSTER_SUIT_SIZES, ROSTER_FINS_SIZES, getRosterSizeColor, getRosterFinsColor, getRosterOptionStyle } from '../../../utils/rosterUtils';

export default function Customer_Edit({ customer, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!(customer && customer.id);

  useEffect(() => {
    if (isOpen && customer) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setFormData(prev => {
        if (prev && prev.id === customer.id) {
          return { ...customer, ...prev };
        }
        return { ...customer };
      });
    } else if (!isOpen) {
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
      // 1. Validación: No permitir dejar fechas vacías si ya tenían un valor previo
      const dateFields = ['booking_date', 'birth_date', 'insurance_expiry'];
      const fieldLabels = {
        booking_date: 'Fecha Reserva',
        birth_date: 'Fecha de Nacimiento',
        insurance_expiry: 'Vencimiento Seguro'
      };

      for (const field of dateFields) {
        const originalValue = customer?.[field];
        const newValue = formData[field];

        // Si originalmente tenía un valor y ahora se intenta borrar / dejar vacío
        if (originalValue && (!newValue || newValue.toString().trim() === '')) {
          throw new Error(`El campo "${fieldLabels[field]}" no puede dejarse vacío si ya contenía un valor.`);
        }
      }

      // 2. Clonamos el estado y excluimos campos de sólo lectura/generados/virtuales
      const updateData = { ...formData };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.hasBilling;
      delete updateData.activities;
      delete updateData.bcd;
      delete updateData.suit;
      delete updateData.fins;

      // 3. Sanitizamos campos de fecha vacíos opcionales convirtiéndolos a null
      dateFields.forEach(field => {
        if (updateData[field] === '') {
          updateData[field] = null;
        }
      });

      let submitError;
      if (isEditMode) {
        const { error } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customer.id);
        submitError = error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([updateData]);
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
      <div className="relative w-full max-w-2xl bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand">
              {isEditMode ? <User className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Buceador' : 'Nuevo Buceador'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {isEditMode ? 'Actualiza la información del perfil' : 'Introduce la información del nuevo perfil'}
              </p>
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

            {/* Section: Tallas de Equipamiento (Roster) */}
            <div className="space-y-4 md:col-span-2 border-t border-surface-edge pt-6">
              <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 px-1 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-emerald-400" /> Tallas de Equipamiento (Roster)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* BCD Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 px-1">
                    Talla BCD
                  </label>
                  <select
                    name="bcd_size"
                    value={formData.bcd_size || formData.bcd || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const copy = { ...prev, bcd_size: val };
                        delete copy.bcd;
                        return copy;
                      });
                    }}
                    className={`w-full border border-surface-edge rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none transition-all cursor-pointer ${getRosterSizeColor(formData.bcd_size || formData.bcd)}`}
                  >
                    <option value="" style={getRosterOptionStyle('')}>-- (Sin especificar)</option>
                    {ROSTER_BCD_SIZES.map(s => (
                      <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Traje / Suit Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 px-1">
                    Talla Traje (Suit)
                  </label>
                  <select
                    name="suit_size"
                    value={formData.suit_size || formData.suit || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const copy = { ...prev, suit_size: val };
                        delete copy.suit;
                        return copy;
                      });
                    }}
                    className={`w-full border border-surface-edge rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none transition-all cursor-pointer ${getRosterSizeColor(formData.suit_size || formData.suit)}`}
                  >
                    <option value="" style={getRosterOptionStyle('')}>-- (Sin especificar)</option>
                    {ROSTER_SUIT_SIZES.map(s => (
                      <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Aletas / Fins Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 px-1">
                    Talla / Tipo Aletas (Fins)
                  </label>
                  <select
                    name="fins_size"
                    value={formData.fins_size || formData.fins || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const copy = { ...prev, fins_size: val };
                        delete copy.fins;
                        return copy;
                      });
                    }}
                    className={`w-full border border-surface-edge rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none transition-all cursor-pointer ${getRosterFinsColor(formData.fins_size || formData.fins)}`}
                  >
                    <option value="" style={getRosterOptionStyle('')}>-- (Sin especificar)</option>
                    {ROSTER_FINS_SIZES.map(s => (
                      <option key={s} value={s} style={getRosterOptionStyle(s)} className="font-mono py-1 font-bold">{s}</option>
                    ))}
                  </select>
                </div>
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
            className="px-8 py-2.5 rounded-xl bg-brand text-white text-sm font-black shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditMode ? 'GUARDAR CAMBIOS' : 'CREAR BUCEADOR'}
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
