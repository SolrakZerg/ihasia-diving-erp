import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Plus, 
  Trash2, 
  Database, 
  Euro, 
  Coins, 
  Waves,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Pencil,
  Check,
  X,
  Tag,
  ArrowUpDown,
  Timer
} from 'lucide-react';

export default function Activities({ isNested = false }) {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [activities, setActivities] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Inline Editing
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Sorting & Selection
  const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(37.5);

  // Categories Engine
  const [showCatModal, setShowCatModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState({ name: '', color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' });

  // Add Form state
  const [formData, setFormData] = useState({
    name: '',
    price_thb: '',
    price_eur: '',
    tanks_weight: '0',
    instructor_payout_thb: '0',
    ssi_cost_thb: '0',
    category: 'Course',
    color: '',
    acronym: '',
    duration_days: '0'
  });

  // Available tailwind color combinations for categories
  const colorPresets = [
    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [actRes, rateRes, catRes] = await Promise.all([
      supabase.from('activities').select('*').order('category').order('price_thb', { ascending: false }),
      supabase.from('exchange_rates').select('*').limit(1).single(),
      supabase.from('settings').select('*').eq('key', 'catalog_categories').single()
    ]);
    
    if (actRes.data) setActivities(actRes.data);
    if (rateRes.data) {
      setExchangeRate(parseFloat(rateRes.data.rate));
      setNewRate(parseFloat(rateRes.data.rate));
    }
    
    if (catRes.data && catRes.data.value) {
      const parsedCat = JSON.parse(catRes.data.value);
      setCategories(parsedCat);
      if (parsedCat.length > 0 && formData.category === 'Curso') {
        setFormData(prev => ({...prev, category: parsedCat[0].name}));
      }
    } else {
      // Inject defaults if empty
      const defaults = [
        { name: 'Course', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
        { name: 'Pro', color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
        { name: 'Fun Dive', color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
        { name: 'Snorkeling', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
        { name: 'Fee', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
        { name: 'Retail', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
      ];
      await supabase.from('settings').upsert({ key: 'catalog_categories', value: JSON.stringify(defaults) });
      setCategories(defaults);
      setFormData(prev => ({...prev, category: 'Course'}));
    }
    
    setLoading(false);
  };

  const updateExchangeRate = async () => {
    try {
      const rateNum = parseFloat(newRate);
      if (isNaN(rateNum) || rateNum <= 0) return;

      const { data: currentRate } = await supabase.from('exchange_rates').select('id').limit(1).single();
      
      if (currentRate) {
        await supabase.from('exchange_rates').update({ rate: rateNum }).eq('id', currentRate.id);
      } else {
        await supabase.from('exchange_rates').insert({ rate: rateNum, from_currency: 'EUR', to_currency: 'THB' });
      }
      
      setExchangeRate(rateNum);
      setIsEditingRate(false);
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleThbChange = (thb, isEdit = false) => {
    const value = parseFloat(thb) || 0;
    const eur = (value / exchangeRate).toFixed(2);
    if (isEdit) {
      setEditData({...editData, price_thb: thb, price_eur: eur});
    } else {
      setFormData({...formData, price_thb: thb, price_eur: eur});
    }
  };

  const saveActivity = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('activities').insert([
      {
        name: formData.name,
        price_thb: parseFloat(formData.price_thb) || 0,
        price_eur: parseFloat(formData.price_eur) || 0,
        tanks_weight: parseFloat(formData.tanks_weight) || 0,
        instructor_payout_thb: parseFloat(formData.instructor_payout_thb) || 0,
        ssi_cost_thb: parseFloat(formData.ssi_cost_thb) || 0,
        category: formData.category,
        color: formData.color,
        acronym: formData.acronym,
        duration_days: parseFloat(formData.duration_days) || 0
      }
    ]);

    if (!error) {
      setView('list');
      fetchData();
      setFormData({ name: '', price_thb: '', price_eur: '', tanks_weight: '0', instructor_payout_thb: '0', ssi_cost_thb: '0', category: categories[0]?.name || '', color: '', acronym: '', duration_days: '0' });
    } else {
      alert('Error guardando: ' + error.message);
    }
    setSaving(false);
  };

  const deleteActivity = async (id) => {
    if (confirm('¿Seguro que quieres borrar este elemento permanentemente?')) {
      await supabase.from('activities').delete().eq('id', id);
      setSelectedIds(new Set());
      fetchData(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`¿Seguro que quieres borrar estos ${selectedIds.size} elementos? Esta acción no se puede deshacer.`)) {
      const idsToDelete = Array.from(selectedIds);
      await supabase.from('activities').delete().in('id', idsToDelete);
      setSelectedIds(new Set());
      fetchData(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedActivities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedActivities.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const startEditing = (act) => {
    setEditingId(act.id);
    setEditData({
      name: act.name,
      price_thb: act.price_thb?.toString() || '0',
      price_eur: act.price_eur?.toString() || '0',
      tanks_weight: act.tanks_weight?.toString() || '0',
      instructor_payout_thb: act.instructor_payout_thb?.toString() || '0',
      ssi_cost_thb: act.ssi_cost_thb?.toString() || '0',
      category: act.category || categories[0]?.name || '',
      color: act.color || '',
      acronym: act.acronym || '',
      duration_days: act.duration_days?.toString() || '0'
    });
  };

  const saveEdit = async (id) => {
    const { error } = await supabase.from('activities').update({
      name: editData.name,
      price_thb: parseFloat(editData.price_thb) || 0,
      price_eur: parseFloat(editData.price_eur) || 0,
      tanks_weight: parseFloat(editData.tanks_weight) || 0,
      instructor_payout_thb: parseFloat(editData.instructor_payout_thb) || 0,
      ssi_cost_thb: parseFloat(editData.ssi_cost_thb) || 0,
      category: editData.category,
      color: editData.color,
      acronym: editData.acronym,
      duration_days: parseFloat(editData.duration_days) || 0
    }).eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchData(false);
    } else {
      alert("Error: " + error.message);
    }
  };

  const saveCategoriesConfig = async (newCats) => {
    await supabase.from('settings').upsert({ key: 'catalog_categories', value: JSON.stringify(newCats) });
    setCategories(newCats);
  };

  const handleAddCategory = () => {
    if (!catForm.name.trim()) return;
    const newCats = [...categories, { name: catForm.name.trim(), color: catForm.color }];
    saveCategoriesConfig(newCats);
    setCatForm({ name: '', color: colorPresets[0] });
  };

  const handleDeleteCategory = (catName) => {
    if (confirm(`¿Eliminar categoría '${catName}'? Esto NO borrará los items asociados, pero perderán su color.`)) {
      const newCats = categories.filter(c => c.name !== catName);
      saveCategoriesConfig(newCats);
    }
  };

  const getCategoryColor = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : 'bg-surface/50 text-gray-400 border border-surface-edge';
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 text-brand animate-spin" />
    </div>
  );

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedActivities = [...activities].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    // Treat numeric sorting if key is price or tanks
    if (['price_thb', 'price_eur', 'tanks_weight'].includes(sortConfig.key)) {
       aVal = Number(aVal);
       bVal = Number(bVal);
    } else {
       aVal = aVal.toString().toLowerCase();
       bVal = bVal.toString().toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (view === 'add') return (
    <div className="flex flex-col h-full bg-background overflow-auto p-4 sm:p-10">
      <div className="max-w-3xl mx-auto w-full">
        <button 
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors bg-surface-soft w-fit px-4 py-2 rounded-xl border border-surface-edge hover:border-brand/30"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>

        <div className="bg-surface-soft border border-surface-edge p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Añadir Nuevo</h1>
          <p className="text-gray-400 mb-8">Registra un nuevo curso, fun dive o producto para la venta.</p>

          <form onSubmit={saveActivity} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Nombre de la Actividad</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Open Water Diver"
                    className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Acrónimo</label>
                  <input 
                    type="text" 
                    value={formData.acronym}
                    onChange={(e) => setFormData({...formData, acronym: e.target.value})}
                    placeholder="Ej: OWD"
                    className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5 hover:text-brand transition-colors"><Coins className="w-4 h-4"/> Precio en THB (฿)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.price_thb}
                    onChange={(e) => handleThbChange(e.target.value)}
                    placeholder="9000"
                    className="w-full bg-surface border border-brand/30 rounded-xl px-4 py-3 text-white font-mono focus:border-brand focus:outline-none shadow-[0_0_15px_-3px_rgba(0,163,255,0.1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Euro className="w-4 h-4"/> Precio en EUR (€) <span className="text-[10px] opacity-70 normal-case">(Conversor Auto)</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    disabled
                    value={formData.price_eur}
                    className="w-full bg-surface-edge/30 border border-surface-edge/50 rounded-xl px-4 py-3 text-gray-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5 hover:text-brand transition-colors"><Waves className="w-4 h-4"/> Coste Tanques</label>
                  <input 
                    type="number" 
                    required
                    value={formData.tanks_weight}
                    onChange={(e) => setFormData({...formData, tanks_weight: e.target.value})}
                    placeholder="0"
                    className="w-full bg-surface border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-300 mb-2 uppercase tracking-wide flex items-center gap-1.5 hover:text-amber-200 transition-colors">Sueldo Instructor (฿)</label>
                  <input 
                    type="number" 
                    value={formData.instructor_payout_thb}
                    onChange={(e) => setFormData({...formData, instructor_payout_thb: e.target.value})}
                    placeholder="0"
                    className="w-full bg-surface border border-amber-500/20 rounded-xl px-4 py-3 text-white focus:border-amber-300 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-rose-300 mb-2 uppercase tracking-wide flex items-center gap-1.5 hover:text-rose-200 transition-colors">Coste SSI (฿)</label>
                  <input 
                    type="number" 
                    value={formData.ssi_cost_thb}
                    onChange={(e) => setFormData({...formData, ssi_cost_thb: e.target.value})}
                    placeholder="0"
                    className="w-full bg-surface border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:border-rose-300 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5"><Tag className="w-4 h-4"/> Categoría</label>
                <select 
                  className="w-full bg-surface-soft border border-surface-edge rounded-xl px-4 py-3 text-white focus:border-brand focus:outline-none appearance-none font-medium text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Otro">Otra Categoría (Manual)...</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wide flex items-center gap-1.5 hover:text-indigo-300 transition-colors"><Timer className="w-4 h-4"/> Duración (Días)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    required
                    value={formData.duration_days}
                    onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                    placeholder="0.5"
                    className="w-32 bg-surface border border-indigo-500/30 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-400 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-500 leading-tight">
                    <span className="font-bold text-indigo-400">Pista:</span> Use <span className="text-white font-mono">.5</span> para indicar que el último día acaba al mediodía (Mañana). Ej: OW = 2.5
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">Color de Actividad (Fondo en Tabla)</label>
                <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-xl border border-surface-edge">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, color: ''})}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${!formData.color ? 'bg-white text-gray-900 border-white' : 'bg-surface-edge text-gray-400 border-surface-edge hover:text-white'}`}
                  >
                    Sin Color
                  </button>
                  {/* Reuse colors extracted from Sheets image logic */}
                  {[
                    {name: 'Verde', hex: '#bbf7d0'},
                    {name: 'Azul', hex: '#bfdbfe'},
                    {name: 'Salmón', hex: '#fecaca'},
                    {name: 'Morado', hex: '#e9d5ff'},
                    {name: 'Amarillo', hex: '#fef3c7'},
                    {name: 'Naranja', hex: '#ffedd5'},
                    {name: 'Gris', hex: '#f3f4f6'},
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData({...formData, color: c.hex})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <input 
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="#HEX"
                    className="ml-auto w-20 bg-surface-soft border border-surface-edge rounded-lg px-2 text-[10px] text-white font-mono focus:border-brand outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-edge mt-8">
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-brand hover:bg-brand-light text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 text-lg tracking-wide"
              >
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 'Confirmar Guardado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isNested ? 'p-0' : 'p-6 lg:p-10'} mx-auto w-full flex flex-col h-full overflow-hidden transition-all duration-500 max-w-7xl`}>
      {/* Header and Toolbar */}
      {!isNested && (
        <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">Catálogo de Precios</h1>
             <div className="flex items-center gap-2 mt-1">
               <AlertCircle className="w-3.5 h-3.5 text-gray-400"/> 
               <p className="text-xs text-gray-400 flex items-center gap-1">
                 Precios EUR autocalculados al cambio base: 
                 {isEditingRate ? (
                   <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                     <input 
                       type="number" 
                       value={newRate} 
                       onChange={(e) => setNewRate(e.target.value)}
                       className="w-16 bg-brand/10 border border-brand/30 rounded px-1.5 py-0 text-white font-bold text-xs outline-none focus:border-brand"
                       autoFocus
                     />
                     <button onClick={updateExchangeRate} className="p-0.5 bg-brand rounded hover:bg-brand-light transition-colors"><Check className="w-3 h-3 text-white"/></button>
                     <button onClick={() => {setIsEditingRate(false); setNewRate(exchangeRate)}} className="p-0.5 bg-gray-600 rounded hover:bg-gray-500 transition-colors"><X className="w-3 h-3 text-white"/></button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setIsEditingRate(true)}
                     className="text-white bg-surface-edge px-2 py-1 rounded-lg flex items-center gap-2 group cursor-pointer hover:bg-brand/20 transition-all border border-transparent hover:border-brand/30 shadow-sm" 
                   >
                     <span className="font-bold">1€ = {exchangeRate} ฿</span>
                     <Pencil className="w-3 h-3 text-brand opacity-60 group-hover:opacity-100 transition-opacity" />
                   </button>
                 )}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm font-bold shadow-sm animate-in fade-in"
              >
                <Trash2 className="w-4 h-4" /> Borrar Lote ({selectedIds.size})
              </button>
            )}
            <button 
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-edge bg-surface-soft text-gray-300 hover:text-white hover:border-brand/40 transition-colors text-sm font-bold shadow-sm"
            >
              <Settings className="w-4 h-4" /> Categorías
            </button>
            <button 
              onClick={() => setView('add')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-colors text-sm font-bold shadow-lg shadow-brand/20"
            >
              <Plus className="w-4 h-4" /> Añadir Artículo
            </button>
          </div>
        </div>
      )}

      {isNested && (
        <div className="flex-shrink-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 pb-0">
          <div>
             <div className="flex items-center gap-2 mt-1">
               <AlertCircle className="w-3.5 h-3.5 text-gray-400"/> 
               <p className="text-xs text-gray-400 flex items-center gap-1">
                 Precios EUR autocalculados: 
                 {isEditingRate ? (
                   <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                     <input 
                       type="number" 
                       value={newRate} 
                       onChange={(e) => setNewRate(e.target.value)}
                       className="w-16 bg-brand/10 border border-brand/30 rounded px-1.5 py-0 text-white font-bold text-xs outline-none focus:border-brand"
                       autoFocus
                     />
                     <button onClick={updateExchangeRate} className="p-0.5 bg-brand rounded hover:bg-brand-light transition-colors"><Check className="w-3 h-3 text-white"/></button>
                     <button onClick={() => {setIsEditingRate(false); setNewRate(exchangeRate)}} className="p-0.5 bg-gray-600 rounded hover:bg-gray-500 transition-colors"><X className="w-3 h-3 text-white"/></button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setIsEditingRate(true)}
                     className="text-white bg-surface-edge px-2 py-0.5 rounded-lg flex items-center gap-2 group cursor-pointer hover:bg-brand/20 transition-all border border-transparent hover:border-brand/30 shadow-sm" 
                   >
                     <span className="font-bold">1€ = {exchangeRate} ฿</span>
                     <Pencil className="w-2.5 h-2.5 text-brand opacity-60 group-hover:opacity-100 transition-opacity" />
                   </button>
                 )}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm font-bold shadow-sm animate-in fade-in">
                <Trash2 className="w-4 h-4" /> Borrar Lote ({selectedIds.size})
              </button>
            )}
            <button onClick={() => setShowCatModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-edge bg-surface-soft text-gray-300 hover:text-white hover:border-brand/40 transition-colors text-sm font-bold shadow-sm">
              <Settings className="w-4 h-4" /> Categorías
            </button>
            <button onClick={() => setView('add')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white transition-colors text-sm font-bold shadow-lg shadow-brand/20">
              <Plus className="w-4 h-4" /> Añadir Artículo
            </button>
          </div>
        </div>
      )}

      {/* Main Table Area with Scrolling */}
      <div 
        className={`bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500 ${isNested ? 'mx-8 mb-8' : ''}`}
        style={{ height: isNested ? 'calc(100vh - 350px)' : 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
                <th className="px-4 py-2 text-center w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                    checked={sortedActivities.length > 0 && selectedIds.size === sortedActivities.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('name')} className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-surface-edge/50 transition-colors group text-left">
                  <div className="flex items-center gap-2">Artículo / Concepto <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('category')} className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                  <div className="flex items-center justify-center gap-2">Categoría <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('price_thb')} className="px-[15px] py-2 text-sm font-black text-brand uppercase tracking-widest text-right cursor-pointer hover:bg-brand/10 transition-colors group">
                  <div className="flex items-center justify-end gap-2">THB <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('price_eur')} className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-surface-edge/50 transition-colors group">
                  <div className="flex items-center justify-end gap-2">EUR <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('instructor_payout_thb')} className="px-[15px] py-2 text-sm font-black text-amber-300 uppercase tracking-widest text-right cursor-pointer hover:bg-amber-400/10">Sueldo</th>
                <th onClick={() => handleSort('ssi_cost_thb')} className="px-[15px] py-2 text-sm font-black text-rose-300 uppercase tracking-widest text-right cursor-pointer hover:bg-rose-400/10 text-right">SSI</th>
                <th className="px-0 py-2 text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group w-[30px] min-w-[30px]">
                  <div className="flex items-center justify-center"><Waves className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /></div>
                </th>
                <th onClick={() => handleSort('duration_days')} className="px-2 py-2 text-center cursor-pointer hover:bg-indigo-500/10 transition-colors group w-[50px] min-w-[50px]">
                  <div className="flex items-center justify-center"><Timer className="w-4 h-4 text-indigo-400 opacity-70 group-hover:opacity-100" /></div>
                </th>
                <th className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-center w-16">Color</th>
                <th className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-right w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-edge/50">
              {sortedActivities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-500 italic">
                    Catálogo vacío. Añade artículos para comenzar.
                  </td>
                </tr>
              ) : sortedActivities.map((activity) => (
                editingId === activity.id ? (
                    <tr key={activity.id} className="bg-brand/10 border-l-2 border-brand ring-1 ring-brand/30">
                      <td className="px-2 py-1"></td>
                      <td className="px-2 py-1">
                         <div className="flex gap-1.5">
                            <input value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="flex-1 min-w-[140px] bg-surface border border-surface-edge rounded-lg px-2.5 py-1.5 text-[13px] text-white focus:border-brand focus:outline-none" placeholder="Nombre" />
                            <input value={editData.acronym} onChange={e=>setEditData({...editData, acronym: e.target.value})} className="w-14 bg-surface border border-surface-edge rounded-lg px-2 py-1.5 text-[12px] text-white font-black uppercase focus:border-brand focus:outline-none text-center" placeholder="Acr." />
                         </div>
                      </td>
                      <td className="px-2 py-1 text-center">
                         <select value={editData.category} onChange={e=>setEditData({...editData, category: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-1.5 py-1.5 text-[11px] text-white focus:border-brand focus:outline-none w-full max-w-[110px]">
                            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            <option value={editData.category}>{editData.category} (Old)</option>
                         </select>
                      </td>
                      <td className="px-2 py-1 text-right">
                         <input value={editData.price_thb} onChange={e=>handleThbChange(e.target.value, true)} className="bg-surface border border-brand/50 rounded-lg px-2 py-1.5 text-[13px] text-brand font-mono font-bold focus:border-brand focus:outline-none w-20 text-right" placeholder="THB" />
                      </td>
                      <td className="px-2 py-1 text-right">
                         <div className="text-[11px] text-gray-500 font-mono w-16 text-right pr-2">
                           {(editData.price_thb / exchangeRate).toFixed(0)}€
                         </div>
                      </td>
                      <td className="px-2 py-1 text-right">
                         <input value={editData.instructor_payout_thb} onChange={e=>setEditData({...editData, instructor_payout_thb: e.target.value})} className="bg-surface border border-amber-300/30 rounded-lg px-2 py-1.5 text-[13px] text-amber-100 w-[70px] text-right focus:border-amber-300 outline-none font-mono" />
                      </td>
                      <td className="px-2 py-1 text-right border-r border-surface-edge/10">
                         <input value={editData.ssi_cost_thb} onChange={e=>setEditData({...editData, ssi_cost_thb: e.target.value})} className="bg-surface border border-rose-300/30 rounded-lg px-2 py-1.5 text-[13px] text-rose-100 w-[70px] text-right focus:border-rose-300 outline-none font-mono" />
                      </td>
                      <td className="px-1 py-1 text-center w-[30px]">
                         <input value={editData.tanks_weight} onChange={e=>setEditData({...editData, tanks_weight: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-0.5 py-1.5 text-[12px] text-white focus:border-brand focus:outline-none w-full text-center" placeholder="0" />
                      </td>
                      <td className="px-1 py-1 text-center w-[50px]">
                         <input value={editData.duration_days} onChange={e=>setEditData({...editData, duration_days: e.target.value})} className="bg-surface border border-indigo-500/30 rounded-lg px-0.5 py-1.5 text-[12px] text-indigo-200 focus:border-indigo-400 focus:outline-none w-full text-center font-bold" step="0.5" type="number" />
                      </td>
                      <td className="px-2 py-1 text-center">
                         <input 
                           type="color" 
                           value={editData.color?.startsWith('#') ? editData.color : '#ffffff'} 
                           onChange={e => setEditData({...editData, color: e.target.value})}
                           className="w-8 h-8 rounded-xl bg-transparent border-none cursor-pointer p-0 overflow-hidden"
                         />
                      </td>
                      <td className="px-2 py-1 text-right flex justify-end items-center gap-1.5">
                         <button onClick={()=>saveEdit(activity.id)} title="Guardar" className="p-2 text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl shadow-sm"><Check className="w-4 h-4 stroke-[3]" /></button>
                         <button onClick={()=>setEditingId(null)} title="Cancelar" className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"><X className="w-4 h-4" /></button>
                      </td>
                    </tr>
                ) : (
                  /* VIEW MODE ROW */
                  <tr key={activity.id} className="hover:bg-brand/5 transition-colors group">
                    <td className="px-4 py-2 text-center border-r border-surface-edge/10">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                        checked={selectedIds.has(activity.id)}
                        onChange={() => toggleSelectOne(activity.id)}
                      />
                    </td>
                    <td className="px-[15px] py-2 border-r border-surface-edge/5">
                      <div className="flex items-center gap-3">
                         <span className="font-bold text-gray-200 text-[16px]">{activity.name}</span>
                         {activity.acronym && (
                           <span className="text-[12px] font-black bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/20 uppercase">
                             {activity.acronym}
                           </span>
                         )}
                      </div>
                    </td>
                    <td className="px-[15px] py-2 text-center">
                      <span className={`text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block ${getCategoryColor(activity.category)}`}>
                        {activity.category || 'Undef'}
                      </span>
                    </td>
                    <td className="px-[15px] py-2 text-right font-mono text-white font-bold text-[17px]">
                      {activity.price_thb?.toLocaleString() || 0} ฿
                    </td>
                    <td className="px-[15px] py-2 text-right font-mono text-gray-500 text-[15px]">
                      €{(activity.price_thb / exchangeRate).toFixed(2)}
                    </td>
                    <td className="px-[15px] py-2 text-right font-mono text-amber-300 font-bold text-[16px]">
                      {activity.instructor_payout_thb?.toLocaleString() || 0}
                    </td>
                    <td className="px-[15px] py-2 text-right font-mono text-rose-300 text-[16px] font-bold border-r border-surface-edge/5">
                      {activity.ssi_cost_thb?.toLocaleString() || 0}
                    </td>
                    <td className="px-0 py-2 text-center w-[30px]">
                      <span className={`text-[13px] font-bold ${activity.tanks_weight > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {activity.tanks_weight > 0 ? activity.tanks_weight : '-'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center w-[50px]">
                      <span className={`text-[14px] font-black font-mono ${activity.duration_days > 0 ? 'text-indigo-400' : 'text-gray-600'}`}>
                        {activity.duration_days > 0 ? activity.duration_days : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-center">
                      <div className="flex justify-center">
                        <div 
                          className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                          style={{ backgroundColor: activity.color || 'transparent' }}
                          title={activity.color || 'Sin color'}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right flex justify-end">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(activity)} 
                          className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-brand hover:bg-brand/10 transition-all"
                          title="Editar registros"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteActivity(activity.id)} 
                          className="p-1.5 rounded-lg bg-surface-edge/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CATEGORY MANAGER MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-edge shadow-brand/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-surface-edge flex justify-between items-center bg-surface-soft/50">
               <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-brand" /> Editor de Categorías</h3>
                  <p className="text-xs text-gray-400 mt-1">Configura las etiquetas de color para clasificar tu catálogo.</p>
               </div>
               <button onClick={() => setShowCatModal(false)} className="p-2 text-gray-400 hover:text-white bg-surface-edge/50 hover:bg-surface-edge rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-auto flex-1">
              {/* Existing Categories */}
              <div className="space-y-3 mb-8">
                <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Categorías Activas</h4>
                {categories.length === 0 ? <p className="text-sm text-gray-500 italic">No hay categorías configuradas.</p> : null}
                {categories.map(cat => (
                  <div key={cat.name} className="flex justify-between items-center bg-surface-soft border border-surface-edge p-3 rounded-xl hover:border-surface-edge/80 transition-colors group">
                     <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cat.color}`}>
                       {cat.name}
                     </span>
                     <button onClick={() => handleDeleteCategory(cat.name)} className="text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
              </div>

              {/* Add New Category */}
              <div className="bg-surface px-4 py-5 rounded-xl border border-surface-edge">
                <h4 className="text-[10px] text-brand uppercase font-black tracking-widest mb-4">Añadir Nueva Categoría</h4>
                <div className="space-y-4">
                  <input 
                    value={catForm.name} onChange={e=>setCatForm({...catForm, name: e.target.value})}
                    placeholder="Ej: Alojamiento" className="w-full bg-surface-soft border border-surface-edge rounded-lg px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((colorClass, idx) => (
                      <button 
                        key={idx} onClick={() => setCatForm({...catForm, color: colorClass})}
                        className={`w-7 h-7 rounded-full ${colorClass.split(' ')[0]} border transition-transform ${catForm.color === colorClass ? 'scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={handleAddCategory} disabled={!catForm.name.trim()}
                    className="w-full bg-surface-edge hover:bg-surface-edge/80 text-white text-sm font-bold py-2 rounded-lg mt-2 disabled:opacity-50 transition-colors"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
