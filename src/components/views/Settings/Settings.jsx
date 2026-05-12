import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Settings as SettingsIcon, 
  Users, 
  Receipt, 
  Globe,
  Database,
  ShieldCheck,
  Building,
  Banknote,
  Coins,
  Ship,
  Mail,
  Phone,
  Globe2,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X as CloseIcon,
  Plus,
  Trash2,
  Pencil,
  TrendingUp as TrendingIcon
} from 'lucide-react';

import logoFull from '../../../../assets/Logo_Ihasia.svg';
import logoSmall from '../../../../assets/logo-version-movil-ihasia.webp';

import Staff_View from './Staff/Staff_View';
import Staff_fee_View from './Staff_fee/Staff_fee_View';
import Bote_View from './Bote/Bote_View';
import Estadisticas_View from './Estadisticas/Estadisticas_View';
import Activities from './Actividades/Activities';

const GeneralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entities, setEntities] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntities = async () => {
    try {
      const { data } = await supabase.from('business_entities').select('*').order('is_own_company', { ascending: false });
      if (data) setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEntityField = (id, field, value) => {
    setEntities(entities.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const saveEntity = async (entity) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_entities')
        .update({
          ...entity,
          updated_at: new Date().toISOString()
        })
        .eq('id', entity.id);
      
      if (error) throw error;
      showToast(`Datos de ${entity.name} guardados correctamente`);
    } catch (error) {
      console.error('Error saving entity:', error);
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (entityId, field, file) => {
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityId}-${field}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);

      // Update DB immediately
      const { error: updateError } = await supabase
        .from('business_entities')
        .update({ [field]: publicUrl })
        .eq('id', entityId);

      if (updateError) throw updateError;

      setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: publicUrl } : e));
      showToast('Imagen actualizada correctamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir la imagen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (entityId, field) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_entities')
        .update({ [field]: null })
        .eq('id', entityId);

      if (error) throw error;
      setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: null } : e));
      showToast('Imagen eliminada');
    } catch (error) {
      console.error('Error removing image:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-300 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl ${
          toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-surface-edge pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Información del Centro</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Gestión Legal y de Facturación</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {entities.map(entity => (
          <div key={entity.id} className={`bg-surface-soft border border-surface-edge rounded-3xl overflow-hidden shadow-2xl transition-all ${entity.is_own_company ? 'ring-2 ring-brand/20' : ''}`}>
            {/* Entity Header */}
            <div className={`px-6 py-4 flex justify-between items-center ${entity.is_own_company ? 'bg-brand/10' : 'bg-emerald-500/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${entity.is_own_company ? 'bg-brand text-white' : 'bg-emerald-500 text-white'}`}>
                  {entity.is_own_company ? <Building className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">{entity.name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {entity.is_own_company ? 'Sede Principal' : 'Proveedor de Servicios'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => saveEntity(entity)}
                disabled={saving}
                className={`p-2 rounded-xl transition-all ${entity.is_own_company ? 'hover:bg-brand text-brand hover:text-white' : 'hover:bg-emerald-500 text-emerald-400 hover:text-white'}`}
              >
                <Save className="w-5 h-5" />
              </button>
            </div>

            {/* Entity Form */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                {/* Legal Name & Tax ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre Legal</label>
                    <input 
                      value={entity.legal_name || ''} 
                      onChange={e => updateEntityField(entity.id, 'legal_name', e.target.value)}
                      className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TAX ID</label>
                    <input 
                      value={entity.tax_id || ''} 
                      onChange={e => updateEntityField(entity.id, 'tax_id', e.target.value)}
                      className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Brand Name (Optional) */}
                {entity.is_own_company && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sucursal / Brand</label>
                    <input 
                      value={entity.brand_name || ''} 
                      onChange={e => updateEntityField(entity.id, 'brand_name', e.target.value)}
                      className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                )}

                {/* Address Section */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center gap-2 border-b border-surface-edge/30 pb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dirección y Localización</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Dirección (Línea 1)</label>
                      <input 
                        placeholder="Ej: 50/15 Moo 3"
                        value={entity.address_line1 || ''} 
                        onChange={e => updateEntityField(entity.id, 'address_line1', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Barrio / Zona (Línea 2)</label>
                      <input 
                        placeholder="Ej: Chalok Ban Kao"
                        value={entity.address_line2 || ''} 
                        onChange={e => updateEntityField(entity.id, 'address_line2', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-4 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Ciudad</label>
                      <input 
                        placeholder="Koh Tao"
                        value={entity.city || ''} 
                        onChange={e => updateEntityField(entity.id, 'city', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Provincia</label>
                      <input 
                        placeholder="Surat Thani"
                        value={entity.province || ''} 
                        onChange={e => updateEntityField(entity.id, 'province', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">C.P.</label>
                      <input 
                        placeholder="84360"
                        value={entity.zip_code || ''} 
                        onChange={e => updateEntityField(entity.id, 'zip_code', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">País</label>
                      <input 
                        placeholder="Thailand"
                        value={entity.country || ''} 
                        onChange={e => updateEntityField(entity.id, 'country', e.target.value)}
                        className="w-full bg-black/20 border border-surface-edge rounded-xl px-3 py-2 text-xs text-white focus:border-brand transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="pt-2">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative group">
                        <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                        <input 
                          placeholder="Email"
                          value={entity.email || ''} 
                          onChange={e => updateEntityField(entity.id, 'email', e.target.value)}
                          className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                        <input 
                          placeholder="Teléfono"
                          value={entity.phone || ''} 
                          onChange={e => updateEntityField(entity.id, 'phone', e.target.value)}
                          className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Globe2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500 group-focus-within:text-brand transition-colors" />
                        <input 
                          placeholder="Web"
                          value={entity.website || ''} 
                          onChange={e => updateEntityField(entity.id, 'website', e.target.value)}
                          className="w-full bg-black/20 border border-surface-edge rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-brand outline-none transition-all"
                        />
                      </div>
                   </div>
                </div>

                {/* IMAGES SECTION */}
                <div className="pt-4 border-t border-surface-edge/30">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Logotipos e Imágenes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {/* LOGO */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Logo Principal</p>
                      <div className="relative aspect-square rounded-2xl bg-black/40 border-2 border-dashed border-surface-edge group/img overflow-hidden flex items-center justify-center hover:border-brand/50 transition-all cursor-pointer">
                        { (entity.logo_url || (entity.is_own_company ? logoFull : null)) ? (
                          <>
                            <img 
                              src={entity.logo_url || (entity.is_own_company ? logoFull : null)} 
                              alt="Logo" 
                              className={`w-full h-full object-contain p-4 ${!entity.logo_url && entity.is_own_company ? 'brightness-0 invert opacity-50' : ''}`} 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              {entity.logo_url ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeImage(entity.id, 'logo_url'); }}
                                  className="p-2 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[8px] font-black text-white uppercase px-2 py-1 bg-brand rounded">Local (Sugerido)</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-500 group-hover/img:text-brand transition-colors">
                            <Upload className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Subir Logo</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(entity.id, 'logo_url', e.target.files[0])}
                        />
                      </div>
                    </div>

                    {/* SECONDARY IMAGE */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Imagen Secundaria</p>
                      <div className="relative aspect-square rounded-2xl bg-black/40 border-2 border-dashed border-surface-edge group/img overflow-hidden flex items-center justify-center hover:border-brand/50 transition-all cursor-pointer">
                        { (entity.secondary_image_url || (entity.is_own_company ? logoSmall : null)) ? (
                          <>
                            <img 
                              src={entity.secondary_image_url || (entity.is_own_company ? logoSmall : null)} 
                              alt="Secondary" 
                              className={`w-full h-full object-contain p-4 ${!entity.secondary_image_url && entity.is_own_company ? 'brightness-0 invert opacity-50' : ''}`} 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              {entity.secondary_image_url ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeImage(entity.id, 'secondary_image_url'); }}
                                  className="p-2 bg-rose-500 rounded-lg text-white hover:scale-110 transition-transform"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[8px] font-black text-white uppercase px-2 py-1 bg-brand rounded">Local (Sugerido)</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-500 group-hover/img:text-brand transition-colors">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[8px] font-black uppercase">Subir Imagen</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(entity.id, 'secondary_image_url', e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FixedExpensesSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [toast, setToast] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', icon: 'Euro', color: 'text-gray-400' });

  // Icon mapping for dynamic rendering
  const iconMap = { Building, Ship, ShieldCheck, Banknote, Coins, Receipt, Globe, Database, Mail, Phone, MapPin, Globe2 };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await supabase.from('fixed_expenses').select('*').order('name');
      if (data) setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateExpense = async (id, field, value) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update({ [field]: field === 'amount' ? Number(value) : value, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      showToast('Gasto actualizado correctamente');
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      showToast('Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('fixed_expenses').insert([{
        ...newExpense,
        amount: Number(newExpense.amount)
      }]);
      if (error) throw error;
      showToast('Nuevo gasto añadido');
      setIsAdding(false);
      setNewExpense({ name: '', amount: '', icon: 'Euro', color: 'text-gray-400' });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      showToast('Error al añadir', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id, name) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${name}"?`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
      if (error) throw error;
      showToast('Gasto eliminado');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Error al eliminar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-300 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl ${
          toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Gastos Fijos Mensuales</h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Configuración de importes para el Dashboard</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isAdding ? 'bg-surface-edge text-gray-400' : 'bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105'
          }`}
        >
          {isAdding ? <><CloseIcon className="w-4 h-4"/> Cancelar</> : <><Plus className="w-4 h-4"/> Añadir Nuevo</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface-soft border-2 border-brand/30 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre del Gasto</label>
              <input 
                type="text" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                placeholder="Ej: Internet Fibra"
                className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:border-brand outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Importe Mensual (THB)</label>
              <input 
                type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                placeholder="0"
                className="w-full bg-surface border border-surface-edge rounded-2xl px-5 py-4 text-white focus:border-brand outline-none transition-all font-black text-xl font-mono"
              />
            </div>
          </div>
          <button 
            onClick={addExpense} disabled={saving}
            className="w-full bg-brand hover:bg-brand-light text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Nuevo Gasto Fijo'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {expenses.map((item) => {
          const Icon = iconMap[item.icon] || Banknote;
          return (
            <div key={item.id} className="bg-surface-soft border border-surface-edge rounded-3xl p-6 shadow-xl space-y-4 relative group">
              <button 
                onClick={() => deleteExpense(item.id, item.name)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{item.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Importe THB mensual</p>
                </div>
              </div>

              <div className="relative group/input">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-gray-600 font-black">฿</span>
                </div>
                <input 
                  type="number"
                  defaultValue={item.amount}
                  onBlur={(e) => {
                    if (Number(e.target.value) !== Number(item.amount)) {
                      updateExpense(item.id, 'amount', e.target.value);
                    }
                  }}
                  className="w-full bg-black/40 border-2 border-surface-edge rounded-2xl py-4 pl-10 pr-16 text-xl font-black text-white focus:border-brand transition-all outline-none no-spinner font-mono"
                />
                <div className="absolute inset-y-2 right-2 flex items-center">
                  <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 text-[10px] font-black text-gray-500 uppercase">
                    Fijo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-brand shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed font-bold">
          <strong className="text-white block mb-1">GESTIÓN DINÁMICA DE GASTOS</strong>
          Ahora puedes añadir tantos gastos fijos como necesites. Estos valores se utilizan automáticamente en el Dashboard para calcular tus proyecciones de beneficios mensuales.
        </p>
      </div>
    </div>
  );
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'fixed_expenses', label: 'Gastos Fijos', icon: Banknote },
    { id: 'staff', label: 'Personal (Staff)', icon: Users },
    { id: 'catalog', label: 'Catálogo y Precios', icon: Receipt },
    { id: 'bote', label: 'Gestión de Bote', icon: Coins },
    { id: 'payout_rules', label: 'Tarifas Staff', icon: Receipt },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingIcon },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Container */}
      <div className="bg-surface-soft/30 pt-6 px-10 border-b border-surface-edge">
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-2xl font-black tracking-tight text-white">Configuración</h1>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
                  isActive 
                    ? 'border-brand text-brand' 
                    : 'border-transparent text-gray-500 hover:text-white hover:border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-surface">
        <div className="w-full h-full">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'fixed_expenses' && <FixedExpensesSettings />}
          {activeTab === 'staff' && <Staff_View isNested />}
          {activeTab === 'catalog' && <Activities isNested />}
          {activeTab === 'bote' && <Bote_View />}
          {activeTab === 'payout_rules' && <Staff_fee_View />}
          {activeTab === 'analytics' && <Estadisticas_View />}
        </div>
      </div>
    </div>
  );
}
