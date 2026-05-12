import { X, Phone, Mail, Calendar, CreditCard, Hash, ShieldCheck, UserCheck, Banknote, Percent, Activity } from 'lucide-react';

/**
 * Staff_Details — Panel lateral deslizante con la ficha completa de un miembro del staff.
 *
 * Props:
 *  - member  {object}   Datos del miembro seleccionado.
 *  - isOpen  {boolean}  Controla si el drawer está visible.
 *  - onClose {function} Cierra el drawer.
 */
export default function Staff_Details({ member, isOpen, onClose }) {
  if (!member) return null;

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand/20">
              {member.first_name?.[0]}{member.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{member.first_name} {member.last_name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand font-bold tracking-widest uppercase">{member.role}</span>
                <span className="text-gray-600">•</span>
                <span className="text-[10px] text-gray-400 font-medium tracking-tighter">ID: {member.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar detalle de personal"
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all shadow-inner focus-visible:ring-2 focus-visible:ring-brand-light outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-10">

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href={`https://wa.me/${member.phone?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-3 rounded-2xl font-bold hover:bg-[#25D366]/20 transition-all shadow-lg shadow-[#25D366]/5"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`mailto:${member.email}`}
              className="flex items-center justify-center gap-2 bg-brand/10 border border-brand/30 text-brand py-3 rounded-2xl font-bold hover:bg-brand/20 transition-all shadow-lg shadow-brand/5"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          </div>

          {/* Registration Info */}
          <div className="flex items-center justify-between bg-surface-soft/30 p-4 rounded-2xl border border-surface-edge/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Miembro desde</p>
              <div className="flex items-center gap-2 text-white font-bold">
                <Calendar className="w-4 h-4 text-brand" />
                <span>
                  {new Date(member.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Estado</p>
              <span className={`text-[10px] px-2 py-1 rounded-lg border font-black uppercase ${member.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                {member.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Section: Professional Info */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Información Profesional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-soft/50 p-6 rounded-2xl border border-surface-edge">
              <DetailItem label="Iniciales" value={member.initials} icon={UserCheck} valueClassName="text-brand font-black" />
              <DetailItem label="Rol / Puesto" value={member.role} icon={Activity} />
              <DetailItem label="Número Instructor" value={member.instructor_number} icon={Hash} />
              <DetailItem label="Nº de Registro" value={member.id.toString().slice(0, 8)} icon={CreditCard} />
            </div>
          </section>

          {/* Section: Financial Config */}
          <section>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Configuración Financiera
            </h3>
            <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/20 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DetailItem label="Sueldo Base" value={member.base_salary ? `${member.base_salary} ฿` : '0 ฿'} icon={Banknote} valueClassName="text-white font-bold" />
                <DetailItem label="Tasa Comisión" value={member.commission_rate ? `${member.commission_rate}%` : '0%'} icon={Percent} valueClassName="text-amber-400 font-bold" />
              </div>
            </div>
          </section>

          {/* Section: Contact */}
          <section>
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Datos de Contacto
            </h3>
            <div className="space-y-6 bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20">
              <DetailItem label="Teléfono / WhatsApp" value={member.phone} icon={Phone} fullWidth />
              <DetailItem label="Correo Electrónico" value={member.email} icon={Mail} fullWidth valueClassName="text-cyan-400" />
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value, icon: Icon, fullWidth = false, valueClassName = 'text-white' }) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400/50" />}
        <span className={`text-sm font-medium ${valueClassName}`}>{value || '---'}</span>
      </div>
    </div>
  );
}
