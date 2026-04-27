import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  Trash2, 
  UserCheck, 
  Mail, 
  Phone, 
  IdCard,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Pencil,
  ArrowUpDown,
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle
} from 'lucide-react';
import StaffDetailDrawer from './StaffDetailDrawer';

export default function Staff({ isNested = false }) {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sorting & Selection
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // View & Drawer
  const [isExtendedView, setIsExtendedView] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', type: 'danger', onConfirm: null });

  // Add Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    initials: '',
    email: '',
    phone: '',
    instructor_number: '',
    role: 'Instructor'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('active', { ascending: false });

    if (!error) setStaff(data);
    setLoading(false);
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedStaff = [...staff].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    aVal = aVal.toString().toLowerCase();
    bVal = bVal.toString().toLowerCase();

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const saveNewStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('staff').insert([formData]);

    if (!error) {
      setView('list');
      setFormData({ first_name: '', last_name: '', initials: '', email: '', phone: '', instructor_number: '', role: 'Instructor' });
      fetchData();
    } else {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  const startEditing = (member) => {
    setEditingId(member.id);
    setEditData({ ...member });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('staff')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        initials: editData.initials,
        email: editData.email,
        phone: editData.phone,
        instructor_number: editData.instructor_number,
        role: editData.role,
        active: editData.active
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchData(false);
    } else {
      alert("Error: " + error.message);
    }
  };

  const deleteStaff = async (id) => {
    setConfirmConfig({
      show: true,
      title: 'Eliminar Personal',
      message: '¿Estás seguro de que quieres eliminar permanentemente a este miembro del staff? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('staff').delete().eq('id', id);
        fetchData(false);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedStaff.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedStaff.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleRowClick = (member) => {
    if (editingId) return; // Don't open drawer while editing inline
    setSelectedStaff(member);
    setIsDrawerOpen(true);
  };

  const handleBulkDelete = async () => {
    setConfirmConfig({
      show: true,
      title: 'Borrado Masivo',
      message: `¿Estás seguro de que deseas eliminar a los ${selectedIds.size} miembros seleccionados? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
        await supabase.from('staff').delete().in('id', Array.from(selectedIds));
        setSelectedIds(new Set());
        fetchData(false);
      }
    });
  };

  const generateInitials = (first, last) => {
    if (!first || !last) return '';
    return (first[0] + last[0]).toUpperCase();
  };

  if (loading && staff.length === 0) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand animate-spin" />
    </div>
  );

  if (view === 'add') return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full overflow-auto h-full">
      <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 bg-surface-soft px-4 py-2 rounded-xl border border-surface-edge transition-all">
        <ArrowLeft className="w-4 h-4" /> Volver al listado
      </button>

      <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6">Nuevo Miembro de Staff</h1>
        <form onSubmit={saveNewStaff} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nombre</label>
              <input required value={formData.first_name} onChange={e => {
                const val = e.target.value;
                setFormData({...formData, first_name: val, initials: generateInitials(val, formData.last_name)});
              }} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Apellidos</label>
              <input required value={formData.last_name} onChange={e => {
                const val = e.target.value;
                setFormData({...formData, last_name: val, initials: generateInitials(formData.first_name, val)});
              }} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black text-brand uppercase tracking-widest mb-2">Iniciales (Únicas)</label>
              <input required value={formData.initials} onChange={e => setFormData({...formData, initials: e.target.value.toUpperCase()})} className="w-full bg-surface border border-brand/50 rounded-xl px-4 py-3 text-brand font-black" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Rol / Puesto</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand outline-none transition-all appearance-none cursor-pointer">
                <option value="Instructor">Instructor</option>
                <option value="Dive Master">Dive Master</option>
                <option value="Admin">Admin / Recepción</option>
                <option value="Barco">Staff Barco</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Teléfono</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Número Instructor (SSI/PADI)</label>
              <input value={formData.instructor_number} onChange={e => setFormData({...formData, instructor_number: e.target.value})} className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-brand outline-none transition-all" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-brand py-4 rounded-xl font-black text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Registrar Staff</>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`${isNested ? 'p-0' : 'p-6 lg:p-10'} mx-auto w-full flex flex-col h-full overflow-hidden transition-all duration-500 ${isExtendedView ? 'max-w-none' : 'max-w-7xl'}`}>
      {/* Header */}
      {!isNested && (
        <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">Gestión de Personal</h1>
            <p className="text-gray-400 text-xs mt-1">Control de instructores, dive masters y personal de apoyo.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-sm font-bold">
                <Trash2 className="w-4 h-4" /> Borrar ({selectedIds.size})
              </button>
            )}
            <button 
              onClick={() => setIsExtendedView(!isExtendedView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${isExtendedView ? 'bg-brand/20 border-brand text-brand' : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white'}`}
              title={isExtendedView ? "Vista Compacta" : "Vista Extendida"}
            >
              {isExtendedView ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
              <span>{isExtendedView ? 'Compacto' : 'Extendido'}</span>
            </button>
            <button onClick={() => setView('add')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-all text-sm font-bold shadow-lg shadow-brand/20">
              <Plus className="w-4 h-4" /> Nuevo Miembro
            </button>
          </div>
        </div>
      )}

      {isNested && (
        <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-end gap-4 p-8 pb-0">
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-sm font-bold">
                <Trash2 className="w-4 h-4" /> Borrar ({selectedIds.size})
              </button>
            )}
            <button 
              onClick={() => setIsExtendedView(!isExtendedView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${isExtendedView ? 'bg-brand/20 border-brand text-brand' : 'bg-surface-soft border-surface-edge text-gray-400 hover:text-white'}`}
              title={isExtendedView ? "Vista Compacta" : "Vista Extendida"}
            >
              {isExtendedView ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
              <span>{isExtendedView ? 'Compacto' : 'Extendido'}</span>
            </button>
            <button onClick={() => setView('add')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-all text-sm font-bold shadow-lg shadow-brand/20">
              <Plus className="w-4 h-4" /> Nuevo Miembro
            </button>
          </div>
        </div>
      )}

      {/* Table Wrapper */}
      <div className={`bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500 ${isNested ? 'mx-8 mb-8' : ''}`} style={{ height: isNested ? 'calc(100vh - 350px)' : 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
                <th className="px-4 py-4 text-center w-10">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand" checked={sortedStaff.length > 0 && selectedIds.size === sortedStaff.length} onChange={toggleSelectAll} />
                </th>
                <th onClick={() => handleSort('first_name')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                  <div className="flex items-center gap-2">Nombre y Apellidos <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('initials')} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                  <div className="flex items-center justify-center gap-2">Iniciales <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                {!isExtendedView && <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Teléfono</th>}
                {isExtendedView && (
                  <>
                    <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Email</th>
                    <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Teléfono</th>
                  </>
                )}
                <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">WhatsApp</th>
                <th onClick={() => handleSort('instructor_number')} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                   <div className="flex items-center justify-center gap-2">Nº Instructor <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('role')} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                   <div className="flex items-center justify-center gap-2">Rol <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                {isExtendedView && (
                  <>
                    <th onClick={() => handleSort('base_salary')} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                      <div className="flex items-center justify-center gap-2">Sueldo Base <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('commission_rate')} className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                      <div className="flex items-center justify-center gap-2">% Com <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                    </th>
                  </>
                )}
                <th className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/50">
              {sortedStaff.map(member => (
                editingId === member.id ? (
                  <tr key={member.id} className="bg-brand/5 border-l-2 border-brand">
                    <td className="px-4 py-2 text-center"></td>
                    <td className="px-4 py-2">
                       <div className="flex gap-2">
                        <input value={editData.first_name} onChange={e=>setEditData({...editData, first_name: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-24" />
                        <input value={editData.last_name} onChange={e=>setEditData({...editData, last_name: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-32" />
                       </div>
                    </td>
                    <td className="px-4 py-2">
                       <input value={editData.initials} onChange={e=>setEditData({...editData, initials: e.target.value.toUpperCase()})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-brand font-black w-16 mx-auto block text-center" />
                    </td>
                    
                    {!isExtendedView ? (
                      <td className="px-4 py-1.5">
                        <div className="space-y-1">
                          <input value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-[10px] text-white w-full" placeholder="Tel" />
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <input value={editData.email} onChange={e=>setEditData({...editData, email: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-full" />
                        </td>
                        <td className="px-4 py-2">
                          <input value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-full" />
                        </td>
                      </>
                    )}

                    <td className="px-4 py-2 text-center">
                      <div className="w-8 h-8 mx-auto bg-surface-edge/50 rounded-lg flex items-center justify-center opacity-30">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    
                    <td className="px-4 py-2">
                       <input value={editData.instructor_number} onChange={e=>setEditData({...editData, instructor_number: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-full text-center" />
                    </td>
                    
                    <td className="px-4 py-2 text-center">
                       <select value={editData.role} onChange={e=>setEditData({...editData, role: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white">
                          <option value="Instructor">Instructor</option>
                          <option value="Dive Master">Dive Master</option>
                          <option value="Admin">Admin</option>
                          <option value="Freelance">Freelance</option>
                       </select>
                    </td>

                    {isExtendedView && (
                      <>
                        <td className="px-4 py-2">
                          <input type="number" value={editData.base_salary} onChange={e=>setEditData({...editData, base_salary: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-full text-center" placeholder="฿" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={editData.commission_rate} onChange={e=>setEditData({...editData, commission_rate: e.target.value})} className="bg-surface border border-surface-edge rounded px-2 py-1 text-xs text-white w-full text-center" placeholder="%" />
                        </td>
                      </>
                    )}

                    <td className="px-4 py-2 text-right">
                       <div className="flex justify-end gap-1">
                        <button onClick={() => saveEdit(member.id)} className="p-1.5 text-emerald-400 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ) : (
                  <tr 
                    key={member.id} 
                    onClick={() => handleRowClick(member)}
                    className="hover:bg-brand/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-2 text-center border-r border-surface-edge/10" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand" checked={selectedIds.has(member.id)} onChange={() => toggleSelectOne(member.id)} />
                    </td>
                    <td className="px-6 py-2 border-r border-surface-edge/5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-[10px]">
                           {member.initials?.slice(0, 2)}
                         </div>
                         <div>
                           <p className="text-white font-semibold text-base capitalize">{member.first_name} {member.last_name}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className="bg-surface-edge text-white px-2.5 py-1 rounded-lg text-[11px] font-black border border-brand/20 shadow-sm shadow-brand/10 tracking-widest">
                        {member.initials}
                      </span>
                    </td>
                    {!isExtendedView && (
                      <td className="px-6 py-2">
                        <div className="space-y-1">
                          {member.phone && <p className="text-sm text-brand/80 font-bold flex items-center gap-1.5"><Phone className="w-3 h-3" /> {member.phone}</p>}
                        </div>
                      </td>
                    )}
                    {isExtendedView && (
                      <>
                        <td className="px-6 py-2 text-sm text-cyan-500/80 font-medium font-mono">
                          {member.email || '---'}
                        </td>
                        <td className="px-6 py-2 text-center text-xs text-brand font-bold font-mono">
                          {member.phone || '---'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <a 
                        href={`https://wa.me/${member.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
                        title="Abrir WhatsApp"
                        aria-label={`Contactar por WhatsApp a ${member.first_name}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </td>
                    <td className="px-6 py-2 text-center font-mono text-sm font-bold text-gray-200">
                      {member.instructor_number || '---'}
                    </td>
                    <td className="px-6 py-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${member.role === 'Admin' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : member.role === 'Freelance' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : member.role === 'Instructor' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-brand/10 border-brand/30 text-brand'}`}>
                        {member.role}
                      </span>
                    </td>
                    {isExtendedView && (
                      <>
                        <td className="px-6 py-3.5 text-center font-bold text-white text-sm">
                          {member.base_salary ? `${member.base_salary} ฿` : '---'}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-amber-500 text-sm">
                          {member.commission_rate ? `${member.commission_rate}%` : '---'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(member)} className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteStaff(member.id)} className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {staff.length === 0 && (
                <tr>
                   <td colSpan="11" className="py-20 text-center text-gray-400 italic">No hay miembros registrados en el staff.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmConfig.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-soft border border-surface-edge w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${confirmConfig.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-brand/10 text-brand'}`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">{confirmConfig.title}</h3>
              </div>
              <p className="text-gray-400 font-bold ml-16">{confirmConfig.message}</p>
            </div>
            <div className="bg-surface-edge/20 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}
                className="px-4 py-2 rounded-xl text-sm font-black text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className={`px-5 py-2 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
                  confirmConfig.type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-brand hover:bg-brand-light shadow-brand/20'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <StaffDetailDrawer 
        member={selectedStaff}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
