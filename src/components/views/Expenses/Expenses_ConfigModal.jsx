import React from 'react';
import { Tag, User, X, Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import EditableInput from '../../common/EditableInput';
import AdvancedColorPicker from '../../common/AdvancedColorPicker';

const Expenses_ConfigModal = ({
   showConfigModal,
   setShowConfigModal,
   configTab,
   setConfigTab,
   categories,
   startEditingCat,
   cancelEditingCat,
   handleDeleteCategory,
   editingCat,
   catForm,
   setCatForm,
   colorPresets,
   handleAddCategory,
   promoterForm,
   setPromoterForm,
   promoters,
   fetchData,
   setConfirmConfig
}) => {
   if (!showConfigModal) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
         <div className="bg-surface-soft border border-surface-edge w-full max-w-xl rounded-[40px] overflow-hidden shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex h-[750px]">
               {/* Sidebar Tabs */}
               <div className="w-48 bg-surface border-r border-surface-edge flex flex-col p-4 gap-2">
                  <h3 className="text-xs font-black text-text-header/60 uppercase tracking-wider px-4 mb-4 mt-2">Ajustes</h3>
                  {[
                     { id: 'categories', label: 'Categorías', icon: Tag },
                     { id: 'promoters', label: 'Promotores', icon: User }
                  ].map(tab => (
                     <button key={tab.id} onClick={() => setConfigTab(tab.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${configTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-header hover:text-white hover:bg-surface-edge/30'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                     </button>
                  ))}
                  <button onClick={() => { cancelEditingCat(); setShowConfigModal(false); }} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-black text-danger hover:bg-danger/10 transition-all">
                     <X className="w-5 h-5" /> Cerrar
                  </button>
               </div>

               {/* Content Area */}
               <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                  {configTab === 'categories' && (
                     <div className="flex flex-col h-full space-y-4">
                        {/* Categories List */}
                        <div className="grid grid-cols-1 gap-2 items-start flex-1 overflow-y-auto custom-scrollbar pr-2">
                           {categories.length === 0 ? <p className="text-sm text-text-header/60 italic text-center py-4">No hay categorías configuradas.</p> : null}
                           {categories.map((c) => (
                              <div key={c.id} className="flex items-center justify-between py-2 px-3.5 bg-surface rounded-2xl border border-surface-edge group hover:border-surface-edge/80 transition-colors">
                                 <div className="flex items-center gap-3 flex-1 mr-4 min-w-0">
                                    <AdvancedColorPicker
                                       color={c.color}
                                       onChange={async (newColor) => {
                                          await supabase.from('expense_categories').update({ color: newColor }).eq('id', c.id);
                                          fetchData(false);
                                       }}
                                       align="left"
                                    />
                                    <EditableInput
                                       defaultValue={c.name}
                                       onSave={async (newValue) => {
                                          await supabase.from('expense_categories').update({ name: newValue }).eq('id', c.id);
                                          fetchData(false);
                                       }}
                                       className="text-sm font-black text-white bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors flex-1 min-w-0"
                                    />
                                 </div>
                                 <button onClick={() => handleDeleteCategory(c.id, c.name)} className="p-2 text-text-header hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-surface-edge/50 my-4" />

                        {/* Add Form */}
                        <div className="p-6 rounded-[32px] border bg-surface border-surface-edge">
                           <div className="space-y-5">
                              <div className="flex gap-3 items-center">
                                 <AdvancedColorPicker
                                    color={catForm.color}
                                    onChange={(color) => setCatForm({ ...catForm, color })}
                                    align="left"
                                 />
                                 <input
                                    value={catForm.name}
                                    onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                    placeholder="Nombre (Ej: Alquiler, Barcos...)"
                                    className="flex-1 bg-surface-soft border border-surface-edge rounded-2xl px-4 py-2.5 text-sm text-white focus:border-brand focus:outline-none transition-all"
                                 />
                              </div>

                              <button
                                 onClick={handleAddCategory}
                                 disabled={!catForm.name.trim()}
                                 className="btn-accept w-full justify-center text-sm uppercase tracking-wider py-3.5 rounded-2xl"
                              >
                                 Crear Categoría
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {configTab === 'promoters' && (
                     <div className="flex flex-col h-full space-y-4">
                        {/* List */}
                        <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                           {promoters.length === 0 ? <p className="text-sm text-text-header/60 italic text-center py-4">No hay promotores configuradas.</p> : null}
                           {promoters.map(p => (
                              <div key={p.id} className="flex items-center justify-between py-1 px-4 bg-surface rounded-2xl border border-surface-edge group">
                                 <div className="flex items-center gap-4 flex-1 mr-4 min-w-0">
                                    <EditableInput
                                       defaultValue={p.name}
                                       onSave={async (newValue) => {
                                          await supabase.from('external_promoters').update({ name: newValue }).eq('id', p.id);
                                          fetchData(false);
                                       }}
                                       className="text-sm font-black text-white bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors flex-1 min-w-0"
                                    />
                                    <EditableInput
                                       defaultValue={p.phone || ''}
                                       placeholder="Sin teléfono"
                                       onSave={async (newValue) => {
                                          await supabase.from('external_promoters').update({ phone: newValue }).eq('id', p.id);
                                          fetchData(false);
                                       }}
                                       className="text-xs text-text-header/60 font-mono tracking-tighter bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors w-24 text-right"
                                    />
                                 </div>
                                 <button onClick={() => {
                                    setConfirmConfig({
                                       show: true,
                                       title: 'Borrar Promotor',
                                       message: `¿Seguro que quieres borrar al promotor "${p.name}"?`,
                                       type: 'danger',
                                       onConfirm: async () => {
                                          await supabase.from('external_promoters').delete().eq('id', p.id);
                                          fetchData(false);
                                          setConfirmConfig(prev => ({ ...prev, show: false }));
                                       }
                                    });
                                 }} className="p-2 text-text-header hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-surface-edge/50 my-4" />

                        {/* Add Form */}
                        <div className="p-6 rounded-[32px] border bg-surface border-surface-edge">
                           <div className="space-y-5">
                              <input 
                                 placeholder="Nombre del promotor (Ej: Taxi 42, Hotel X)..." 
                                 value={promoterForm.name} 
                                 onChange={e => setPromoterForm({ ...promoterForm, name: e.target.value })} 
                                 className="w-full bg-surface-soft border border-surface-edge rounded-2xl px-4 py-2.5 text-sm text-white focus:border-brand focus:outline-none transition-all" 
                              />
                              <input 
                                 placeholder="Teléfono..." 
                                 value={promoterForm.phone} 
                                 onChange={e => setPromoterForm({ ...promoterForm, phone: e.target.value })} 
                                 className="w-full bg-surface-soft border border-surface-edge rounded-2xl px-4 py-2.5 text-sm text-white focus:border-brand focus:outline-none transition-all" 
                              />
                              <button 
                                 onClick={async () => { if (promoterForm.name) { await supabase.from('external_promoters').insert([promoterForm]); setPromoterForm({ name: '', phone: '' }); fetchData(false); } }} 
                                 disabled={!promoterForm.name.trim()}
                                 className="btn-accept w-full justify-center text-sm uppercase tracking-wider py-3.5 rounded-2xl"
                              >
                                 Añadir Promotor
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </div>
      </div>
   );
};

export default Expenses_ConfigModal;
