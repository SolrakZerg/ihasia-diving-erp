import {
  Trash2,
  ArrowUpDown,
  Check,
  X,
  Pencil,
  Phone,
} from 'lucide-react';

/**
 * Staff_Table — Tabla principal con soporte de edición inline.
 *
 * Props:
 *  - isNested         {boolean}   Si el componente está embebido en Settings.
 *  - isExtendedView   {boolean}   Columnas adicionales (email, sueldo, comisión).
 *  - sortedStaff      {Array}     Lista de miembros ordenados.
 *  - staff            {Array}     Lista raw (para el empty state).
 *  - sortConfig       {object}    { key, direction }
 *  - handleSort       {function}  Cambia el orden por columna.
 *  - selectedIds      {Set}       IDs seleccionados.
 *  - toggleSelectAll  {function}  Selecciona / deselecciona todos.
 *  - toggleSelectOne  {function}  Selecciona / deselecciona uno.
 *  - editingId        {string|null} ID de la fila en edición.
 *  - editData         {object}    Valores actuales de la fila en edición.
 *  - setEditData      {function}  Actualiza editData.
 *  - saveEdit         {function}  Guarda los cambios inline.
 *  - cancelEdit       {function}  Cancela la edición.
 *  - toggleActive     {function}  Activa / desactiva un miembro.
 *  - startEditing     {function}  Inicia edición inline de un miembro.
 *  - deleteStaff      {function}  Solicita confirmación y borra.
 *  - onRowClick       {function}  Abre el drawer de detalle.
 */
export default function Staff_Table({
  isNested,
  isExtendedView,
  sortedStaff,
  staff,
  sortConfig,
  handleSort,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  editingId,
  editData,
  setEditData,
  saveEdit,
  cancelEdit,
  toggleActive,
  startEditing,
  deleteStaff,
  onRowClick,
}) {
  return (
    <div
      className={`bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500 ${isNested ? 'mx-2 mb-8' : ''}`}
      style={{ height: isNested ? 'calc(100vh - 350px)' : 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      <div className="overflow-auto flex-1 relative">
        <table className="w-full text-left border-collapse whitespace-nowrap">

          {/* ── THEAD ──────────────────────────────────────────────────────── */}
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
              <th className="px-4 py-4 text-center w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand"
                  checked={sortedStaff.length > 0 && selectedIds.size === sortedStaff.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th
                onClick={() => handleSort('first_name')}
                className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-surface-edge/50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  Nombre y Apellidos <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </div>
              </th>
              <th
                onClick={() => handleSort('initials')}
                className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2">
                  Iniciales <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </div>
              </th>

              {/* Columnas variables según modo */}
              {!isExtendedView && <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Teléfono</th>}
              {isExtendedView && (
                <>
                  <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Email</th>
                  <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Teléfono</th>
                </>
              )}

              <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">WhatsApp</th>
              <th
                onClick={() => handleSort('instructor_number')}
                className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2">
                  Nº Instructor <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </div>
              </th>
              <th
                onClick={() => handleSort('role')}
                className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2">
                  Rol <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </div>
              </th>

              {isExtendedView && (
                <>
                  <th
                    onClick={() => handleSort('base_salary')}
                    className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Sueldo Base <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('commission_rate')}
                    className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      % Com <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </div>
                  </th>
                </>
              )}

              <th
                onClick={() => handleSort('active')}
                className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
              >
                <div className="flex items-center justify-center gap-2">
                  Estado <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Acciones</th>
            </tr>
          </thead>

          {/* ── TBODY ──────────────────────────────────────────────────────── */}
          <tbody className="divide-y divide-surface-edge/50">
            {sortedStaff.map(member =>
              editingId === member.id ? (

                /* ── EDIT ROW ─────────────────────────────────────────────── */
                <tr
                  key={member.id}
                  className="bg-brand/5 border-l-2 border-brand"
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { e.preventDefault(); saveEdit(member.id); }
                    if (e.key === 'Escape') { cancelEdit(); }
                  }}
                >
                  <td className="px-4 py-2 text-center" />
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <input value={editData.first_name} onChange={e => setEditData({ ...editData, first_name: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-24" />
                      <input value={editData.last_name} onChange={e => setEditData({ ...editData, last_name: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input value={editData.initials} onChange={e => setEditData({ ...editData, initials: e.target.value.toUpperCase() })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-brand font-black w-16 mx-auto block text-center" />
                  </td>

                  {!isExtendedView ? (
                    <td className="px-4 py-1.5">
                      <div className="space-y-1">
                        <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full" placeholder="Tel" />
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-2">
                        <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full" />
                      </td>
                    </>
                  )}

                  <td className="px-4 py-2 text-center">
                    <div className="w-8 h-8 mx-auto bg-surface-edge/50 rounded-lg flex items-center justify-center opacity-30">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input value={editData.instructor_number} onChange={e => setEditData({ ...editData, instructor_number: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full text-center" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white">
                      <option value="Instructor">Instructor</option>
                      <option value="Dive Master">Dive Master</option>
                      <option value="Admin">Admin</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </td>

                  {isExtendedView && (
                    <>
                      <td className="px-4 py-2">
                        <input type="number" value={editData.base_salary} onChange={e => setEditData({ ...editData, base_salary: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full text-center" placeholder="฿" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={editData.commission_rate} onChange={e => setEditData({ ...editData, commission_rate: e.target.value })} className="bg-surface border border-surface-edge rounded px-2 py-1 text-sm text-white w-full text-center" placeholder="%" />
                      </td>
                    </>
                  )}

                  <td className="px-4 py-2 text-center">
                    <input type="checkbox" checked={editData.active} onChange={e => setEditData({ ...editData, active: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => saveEdit(member.id)} className="p-1.5 text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>

              ) : (

                /* ── VIEW ROW ─────────────────────────────────────────────── */
                <tr
                  key={member.id}
                  onClick={() => onRowClick(member)}
                  className={`hover:bg-brand/5 transition-all group cursor-pointer ${!member.active ? 'opacity-40 grayscale-[0.5]' : ''}`}
                >
                  <td className="px-4 py-2 text-center border-r border-surface-edge/10" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand" checked={selectedIds.has(member.id)} onChange={() => toggleSelectOne(member.id)} />
                  </td>
                  <td className="px-3 py-2 border-r border-surface-edge/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-[10px]">
                        {member.initials?.slice(0, 2)}
                      </div>
                      <p className="text-white font-semibold text-base capitalize">{member.first_name} {member.last_name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="bg-surface-edge text-white px-2.5 py-1 rounded-lg text-[11px] font-black border border-brand/20 shadow-sm shadow-brand/10 tracking-widest">
                      {member.initials}
                    </span>
                  </td>

                  {!isExtendedView && (
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {member.phone && <p className="text-sm text-brand/80 font-bold flex items-center gap-1.5"><Phone className="w-3 h-3" /> {member.phone}</p>}
                      </div>
                    </td>
                  )}
                  {isExtendedView && (
                    <>
                      <td className="px-3 py-2 text-sm text-cyan-500/80 font-medium font-mono">{member.email || '---'}</td>
                      <td className="px-3 py-2 text-center text-xs text-brand font-bold font-mono">{member.phone || '---'}</td>
                    </>
                  )}

                  <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <a
                      href={`https://wa.me/${member.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 shadow-sm"
                      title="Abrir WhatsApp"
                      aria-label={`Contactar por WhatsApp a ${member.first_name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-sm font-bold text-gray-200">
                    {member.instructor_number || '---'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      member.role === 'Admin' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                      member.role === 'Freelance' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      member.role === 'Instructor' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      'bg-brand/10 border-brand/30 text-brand'
                    }`}>
                      {member.role}
                    </span>
                  </td>

                  {isExtendedView && (
                    <>
                      <td className="px-3 py-3.5 text-center font-bold text-white text-sm">
                        {member.base_salary ? `${member.base_salary} ฿` : '---'}
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-amber-500 text-sm">
                        {member.commission_rate ? `${member.commission_rate}%` : '---'}
                      </td>
                    </>
                  )}

                  <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleActive(member)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                        member.active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          : 'bg-rose-400/10 border-rose-400/30 text-rose-400 hover:bg-rose-500 hover:text-white'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${member.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {member.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(member)} className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteStaff(member.id)} className="p-1.5 rounded-lg bg-rose-400/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Empty state */}
            {staff.length === 0 && (
              <tr>
                <td colSpan="12" className="py-20 text-center text-gray-400 italic">
                  No hay miembros registrados en el staff.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
