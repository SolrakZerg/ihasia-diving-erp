import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  Trash2, 
  Banknote, 
  PlusCircle,
  Loader2,
  Check,
  X,
  Pencil,
  ArrowUpDown,
  AlertCircle,
  Database,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export default function StaffPayouts() {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [payouts, setPayouts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPayouts = [...payouts].sort((a, b) => {
    let aVal, bVal;
    
    if (sortConfig.key === 'name') {
      aVal = a.activities?.name || a.concept_name || '';
      bVal = b.activities?.name || b.concept_name || '';
    } else if (sortConfig.key === 'type') {
      aVal = a.activity_id ? 'catalog' : 'manual';
      bVal = b.activity_id ? 'catalog' : 'manual';
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Add Form state
  const [formData, setFormData] = useState({
    activity_id: '',
    concept_name: '',
    amount_thb: '',
    type: 'catalog' // 'catalog' | 'custom'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [payoutsRes, activitiesRes] = await Promise.all([
      supabase.from('instructor_payouts').select('*, activities(name, category)').order('created_at'),
      supabase.from('activities').select('id, name, category').order('name')
    ]);

    if (payoutsRes.data) setPayouts(payoutsRes.data);
    if (activitiesRes.data) setActivities(activitiesRes.data);
    setLoading(false);
  };

  const savePayout = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      amount_thb: parseFloat(formData.amount_thb) || 0,
      activity_id: formData.type === 'catalog' ? formData.activity_id : null,
      concept_name: formData.type === 'custom' ? formData.concept_name : null
    };

    const { error } = await supabase.from('instructor_payouts').insert([payload]);

    if (!error) {
      setView('list');
      fetchData();
      setFormData({ activity_id: '', concept_name: '', amount_thb: '', type: 'catalog' });
    } else {
      alert('Error: ' + error.message);
    }
    setSaving(false);
  };

  const deletePayout = async (id) => {
    if (confirm('¿Borrar esta regla de pago?')) {
      await supabase.from('instructor_payouts').delete().eq('id', id);
      fetchData();
    }
  };

  const startEditing = (p) => {
    setEditingId(p.id);
    setEditData({ ...p });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('instructor_payouts')
      .update({ amount_thb: parseFloat(editData.amount_thb) || 0 })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchData();
    } else {
      alert("Error: " + error.message);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand animate-spin" />
    </div>
  );

  if (view === 'add') return (
    <div className="p-8 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setView('list')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 bg-surface-soft px-4 py-2 rounded-xl border border-surface-edge transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Cancelar
      </button>

      <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Añadir Regla de Pago</h2>
        <p className="text-gray-400 mb-8 text-sm">Define cuánto cobra el instructor por una actividad específica.</p>

        <form onSubmit={savePayout} className="space-y-6">
          <div className="flex gap-2 p-1 bg-surface rounded-xl border border-surface-edge mb-6">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'catalog'})}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'catalog' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Desde Catálogo
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'custom'})}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'custom' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Concepto Manual
            </button>
          </div>

          <div className="space-y-4">
            {formData.type === 'catalog' ? (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Seleccionar Actividad</label>
                <select 
                  required
                  value={formData.activity_id}
                  onChange={(e) => setFormData({...formData, activity_id: e.target.value})}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none"
                >
                  <option value="">Selecciona curso/actividad...</option>
                  {activities
                    .filter(act => 
                      !payouts.some(p => p.activity_id === act.id) && 
                      act.category !== 'Retail' && 
                      act.category !== 'Snorkeling'
                    )
                    .map(act => (
                    <option key={act.id} value={act.id}>{act.name} ({act.category})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nombre del Concepto</label>
                <input 
                  required
                  placeholder="Ej: Asistencia OW (1 día)"
                  value={formData.concept_name}
                  onChange={(e) => setFormData({...formData, concept_name: e.target.value})}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pago Instructor (THB)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount_thb}
                  onChange={(e) => setFormData({...formData, amount_thb: e.target.value})}
                  className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white font-black text-lg focus:border-brand outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand font-black italic">฿</span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-light py-4 rounded-xl font-black text-white shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Guardar Regla</>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-brand" /> Sueldos por Actividad
          </h2>
          <p className="text-gray-400 text-xs mt-1">Configura cuánto gana el staff por cada curso o tarea realizada.</p>
        </div>
        <button 
          onClick={() => setView('add')}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/20"
        >
          <Plus className="w-4 h-4" /> Nueva Regla
        </button>
      </div>

      <div className="bg-surface-soft rounded-2xl border border-surface-edge overflow-hidden shadow-xl flex flex-col min-h-[400px]">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-table-header/98 backdrop-blur-xl">
              <tr className="border-b border-surface-edge/50 shadow-sm">
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-surface-edge/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    Concepto / Actividad 
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'name' ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-2">
                    Tipo
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'type' ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('amount_thb')}
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-surface-edge/50 transition-colors group"
                >
                  <div className="flex items-center justify-end gap-2">
                    Cuota (THB)
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig.key === 'amount_thb' ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/50">
              {sortedPayouts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-gray-500 italic">No hay reglas de pago configuradas.</td>
                </tr>
              ) : sortedPayouts.map(p => (
                <tr key={p.id} className="group hover:bg-surface transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm">
                        {p.activities?.name || p.concept_name}
                      </span>
                      {p.activities?.category && (
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                          {p.activities.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${p.activity_id ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                      {p.activity_id ? 'Catálogo' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {editingId === p.id ? (
                      <div className="flex justify-end items-center gap-2">
                        <input 
                          type="number"
                          value={editData.amount_thb}
                          onChange={(e) => setEditData({...editData, amount_thb: e.target.value})}
                          className="w-24 bg-surface border border-surface-edge rounded px-2 py-1 text-right text-white font-black text-sm outline-none"
                        />
                        <button onClick={() => saveEdit(p.id)} className="p-1 text-emerald-400"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-500"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-white font-black text-lg">{p.amount_thb?.toLocaleString()} ฿</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId !== p.id && (
                        <>
                          <button onClick={() => startEditing(p)} className="p-1.5 bg-surface-edge/30 rounded-lg text-gray-400 hover:text-brand transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deletePayout(p.id)} className="p-1.5 bg-surface-edge/30 rounded-lg text-gray-400 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-surface-edge/10 border-t border-surface-edge flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          <p className="text-[11px] text-gray-500">Estos montos se usarán para calcular automáticamente la liquidación del staff en facturas y salidas.</p>
        </div>
      </div>
    </div>
  );
}
