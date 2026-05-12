import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

/**
 * Staff_AddForm — Formulario de alta de nuevo miembro del staff.
 *
 * Props:
 *  - formData         {object}   Valores del formulario.
 *  - setFormData      {function} Actualizador del formulario.
 *  - saveNewStaff     {function} onSubmit con lógica de guardado.
 *  - saving           {boolean}  Muestra spinner mientras se guarda.
 *  - generateInitials {function} Genera iniciales a partir de nombre + apellido.
 *  - onCancel         {function} Vuelve al listado.
 */
export default function Staff_AddForm({
  formData,
  setFormData,
  saveNewStaff,
  saving,
  generateInitials,
  onCancel,
}) {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full overflow-auto h-full">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 bg-surface-soft px-4 py-2 rounded-xl border border-surface-edge transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al listado
      </button>

      <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6">Nuevo Miembro de Staff</h1>

        <form onSubmit={saveNewStaff} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nombre */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nombre</label>
              <input
                required
                value={formData.first_name}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, first_name: val, initials: generateInitials(val, formData.last_name) });
                }}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Apellidos</label>
              <input
                required
                value={formData.last_name}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, last_name: val, initials: generateInitials(formData.first_name, val) });
                }}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>

            {/* Iniciales */}
            <div>
              <label className="block text-xs font-black text-brand uppercase tracking-widest mb-2">Iniciales (Únicas)</label>
              <input
                required
                value={formData.initials}
                onChange={e => setFormData({ ...formData, initials: e.target.value.toUpperCase() })}
                className="w-full bg-surface border border-brand/50 rounded-xl px-4 py-3 text-brand font-black"
              />
            </div>

            {/* Rol */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Rol / Puesto</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="Instructor">Instructor</option>
                <option value="Dive Master">Dive Master</option>
                <option value="Admin">Admin / Recepción</option>
                <option value="Barco">Staff Barco</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Teléfono</label>
              <input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* Número Instructor */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Número Instructor (SSI/PADI)</label>
              <input
                value={formData.instructor_number}
                onChange={e => setFormData({ ...formData, instructor_number: e.target.value })}
                className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 bg-surface/50 p-4 rounded-xl border border-surface-edge self-end">
              <input
                type="checkbox"
                id="active_check"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
              />
              <label htmlFor="active_check" className="text-sm font-bold text-white cursor-pointer select-none">
                Personal Activo (aparecerá en facturación)
              </label>
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand py-4 rounded-xl font-black text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
          >
            {saving
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><UserPlus className="w-5 h-5" /> Registrar Staff</>}
          </button>
        </form>
      </div>
    </div>
  );
}
