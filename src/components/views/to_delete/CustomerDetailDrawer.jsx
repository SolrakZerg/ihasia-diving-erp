import { X, Phone, Mail, MapPin, Calendar, Award, Activity, Heart, Globe, CreditCard, Hash } from 'lucide-react';

export default function CustomerDetailDrawer({ customer, isOpen, onClose }) {
  const normalizeLevel = (level) => {
    if (!level) return 'Buceador';
    const l = level.trim().toLowerCase();
    if (l === 'advance' || l === 'advanced') return 'Advanced Open Water';
    if (l.includes('instructor') || l.includes('master')) return 'Pro (Inst/DM)';
    return level;
  };

  if (!customer) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-lg bg-surface border-l border-surface-edge z-50 transform transition-transform duration-500 ease-out shadow-2xl overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-surface/80 backdrop-blur-xl border-b border-surface-edge p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand/20">
              {customer.first_name?.[0]}{customer.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{customer.first_name} {customer.last_name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand font-bold tracking-widest uppercase">Buceador</span>
                <span className="text-gray-600">•</span>
                <span className="text-[10px] text-gray-400 font-medium">
                  ID: #{customer.id?.toString().slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all shadow-inner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          
          {/* Quick Actions - NOW AT THE TOP */}
          <div className="grid grid-cols-2 gap-4">
            <a 
              href={`https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-3 rounded-2xl font-bold hover:bg-[#25D366]/20 transition-all shadow-lg shadow-[#25D366]/5"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
            <a 
              href={`mailto:${customer.email}`}
              className="flex items-center justify-center gap-2 bg-brand/10 border border-brand/30 text-brand py-3 rounded-2xl font-bold hover:bg-brand/20 transition-all shadow-lg shadow-brand/5"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>

          {/* Quick Registration Meta */}
          <div className="flex items-center justify-between bg-surface-soft/30 p-4 rounded-2xl border border-surface-edge/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fecha de Registro (Tailandia)</p>
              <div className="flex items-center gap-2 text-white font-bold">
                <Calendar className="w-4 h-4 text-brand" />
                <span>
                  {new Date(customer.created_at).toLocaleDateString('es-ES', { 
                    timeZone: 'Asia/Bangkok', day: '2-digit', month: 'long', year: 'numeric' 
                  })}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-brand">
                  {new Date(customer.created_at).toLocaleTimeString('es-ES', { 
                    timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Origen</p>
              <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-lg border border-brand/20 font-bold uppercase">
                {customer.form_origin || 'Web Form'}
              </span>
            </div>
          </div>

          {/* Section: Personal Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-soft/50 p-6 rounded-2xl border border-surface-edge">
              <DetailItem label="Pasaporte / ID" value={customer.passport_number} icon={Hash} />
              <DetailItem label="Género" value={customer.gender} icon={Activity} />
              <DetailItem label="Fecha de Nacimiento" value={customer.birth_date} icon={Calendar} />
              <DetailItem label="Teléfono / WhatsApp" value={customer.phone} icon={Phone} />
            </div>
          </section>

          {/* Section: Diving Experience */}
          <section>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Experiencia de Buceo
            </h3>
            <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DetailItem label="Total de Buceos" value={customer.total_dives || '0'} />
                <DetailItem label="Último Buceo" value={customer.last_dive_date} icon={Calendar} />
              </div>
              <div className="pt-4 border-t border-amber-500/10">
                <DetailItem label="Nivel / Certificación" value={normalizeLevel(customer.certification_level)} fullWidth />
              </div>
            </div>
          </section>

          {/* Section: Logistics & Emergency */}
          <section>
            <h3 className="text-sm font-bold text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Logística y Emergencia
            </h3>
            <div className="space-y-6 bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20">
              <DetailItem label="Dirección Local / Hotel" value={customer.address} icon={MapPin} fullWidth />
              <DetailItem 
                label="Contacto de Emergencia" 
                value={customer.emergency_contact} 
                icon={Phone} 
                fullWidth 
                valueClassName="text-cyan-400 font-bold"
              />
              <DetailItem label="Cómo nos conoció" value={customer.lead_source} fullWidth />
            </div>
          </section>

          {/* Booking Info Banner */}
          <div className="bg-gradient-to-r from-brand/20 to-brand/5 border border-brand/20 p-6 rounded-3xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-brand font-bold text-xs uppercase tracking-tighter mb-1">Reserva Actual</p>
              <h4 className="text-white text-xl font-bold mb-2">{customer.booked_activity}</h4>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Programado para: {customer.booking_date}</span>
              </div>
            </div>
            <Activity className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-brand/10 group-hover:scale-110 transition-transform duration-700" />
          </div>

        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value, icon: Icon, fullWidth = false, secondaryValue, valueClassName = "text-white" }) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-500" />}
        <span className={`text-sm font-medium ${valueClassName}`}>
          {value || '---'}
        </span>
        {secondaryValue && (
          <span className="text-[8px] bg-brand/10 text-brand px-1.5 py-0.5 rounded uppercase font-bold">
            {secondaryValue}
          </span>
        )}
      </div>
    </div>
  );
}
