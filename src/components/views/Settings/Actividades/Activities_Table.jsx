import { Search, Settings, Plus, ArrowUpDown, Milk, Timer, Coins, WavesArrowDown, Shirt, Pencil, Trash2, Check, X } from 'lucide-react';
import AdvancedColorPicker from '../../../common/AdvancedColorPicker';

function getBadgeStyle(colorStr) {
  if (!colorStr) return { className: 'bg-surface/50 text-gray-400 border border-surface-edge' };
  if (colorStr.startsWith('bg-')) return { className: colorStr };
  return { className: 'text-white border border-white/20 shadow-sm', style: { backgroundColor: colorStr } };
}

function getAcronymBadgeStyle(activity, getCategoryColor) {
  const color = activity.color || getCategoryColor(activity.category);
  if (!color) {
    return { className: 'bg-brand/10 text-brand px-1.5 py-0.5 rounded border border-brand/20' };
  }
  if (color.startsWith('bg-')) {
    return { className: `px-1.5 py-0.5 rounded ${color}` };
  }
  
  let bgStyle = 'rgba(59, 130, 246, 0.1)';
  let textStyle = 'rgba(59, 130, 246, 1)';
  let borderStyle = 'rgba(59, 130, 246, 0.2)';
  
  if (color.startsWith('rgba')) {
    bgStyle = color.replace(/,([^,]*)\)$/, ', 0.1)');
    borderStyle = color.replace(/,([^,]*)\)$/, ', 0.2)');
    textStyle = color;
  } else if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      bgStyle = `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, 0.1)`;
      borderStyle = `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, 0.2)`;
      textStyle = `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, 1)`;
    }
  } else if (color.startsWith('#')) {
    let c = color.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const hexVal = parseInt(c.join(''), 16);
    const r = (hexVal >> 16) & 255;
    const g = (hexVal >> 8) & 255;
    const b = hexVal & 255;
    bgStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
    borderStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    textStyle = `rgba(${r}, ${g}, ${b}, 1)`;
  }
  
  return {
    className: 'px-1.5 py-0.5 rounded border shadow-sm',
    style: {
      backgroundColor: bgStyle,
      borderColor: borderStyle,
      color: textStyle
    }
  };
}


export default function Activities_Table({
  isNested,
  searchTerm, setSearchTerm,
  setShowCatModal, setView,
  filteredAndSortedActivities,
  selectedIds, toggleSelectAll, toggleSelectOne,
  handleSort,
  editingId, setEditingId,
  editData, setEditData,
  handleThbChange,
  exchangeRate,
  categories,
  payoutGroups,
  saveEdit, startEditing, deleteActivity,
  getCategoryColor
}) {
  return (
    <div 
      className={`bg-surface-soft rounded-2xl border border-surface-edge shadow-xl flex flex-col overflow-hidden transition-all duration-500 ${isNested ? 'mx-8 mb-8' : ''}`}
      style={{ height: isNested ? 'calc(100vh - 400px)' : 'calc(100vh - 260px)', minHeight: '500px' }}
    >
      {/* INNER TOOLBAR (Visible when nested or as secondary search) */}
      <div className="flex-none p-4 border-b border-surface-edge/50 flex items-center justify-between bg-surface-soft/50">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-surface-edge">
               <Search className="w-3.5 h-3.5 text-gray-500" />
               <input 
                 type="text" placeholder="Buscar actividad..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                 className="bg-transparent border-none text-[11px] font-bold text-white outline-none w-40"
               />
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => setShowCatModal(true)} className="p-2 rounded-xl bg-surface-edge/20 text-gray-400 hover:text-white transition-all group" title="Gestionar Categorías">
               <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </button>
            {isNested && (
              <button onClick={() => setView('add')} className="bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20 transition-all">
                 <Plus className="w-3.5 h-3.5" /> Nuevo
              </button>
            )}
         </div>
      </div>
      <div className="overflow-auto flex-1 relative">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-surface-edge bg-table-header/98 backdrop-blur-xl shadow-sm">
            <th className="px-4 py-2 text-center w-10">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-600 bg-surface-edge text-brand focus:ring-brand"
                checked={filteredAndSortedActivities.length > 0 && selectedIds.size === filteredAndSortedActivities.length}
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
              <th onClick={() => handleSort('ssi_cost_thb')} className="px-[15px] py-2 text-sm font-black text-rose-300 uppercase tracking-widest text-right cursor-pointer hover:bg-rose-400/10 text-right">SSI</th>
              <th className="px-[15px] py-2 text-sm font-black text-gray-500 uppercase tracking-widest text-center">Com.</th>
              <th className="px-0 py-2 text-center cursor-pointer hover:bg-surface-edge/50 transition-colors group w-[30px] min-w-[30px]">
                <div className="flex items-center justify-center"><Milk className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /></div>
              </th>
              <th onClick={() => handleSort('duration_days')} className="px-2 py-2 text-center cursor-pointer hover:bg-indigo-500/10 transition-colors group w-[50px] min-w-[50px]">
                <div className="flex items-center justify-center"><Timer className="w-4 h-4 text-indigo-400 opacity-70 group-hover:opacity-100" /></div>
              </th>
              <th className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-center w-16">Grupo</th>
              <th className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-center w-16">Color</th>
              <th className="px-[15px] py-2 text-sm font-black text-slate-400 uppercase tracking-widest text-right w-20">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-edge/50">
            {filteredAndSortedActivities.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-6 py-20 text-center text-gray-500 italic">
                  No se encontraron artículos.
                </td>
              </tr>
            ) : filteredAndSortedActivities.map((activity) => (
              editingId === activity.id ? (
                  <tr key={activity.id} className="bg-brand/10 border-l-2 border-brand ring-1 ring-brand/30">
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1">
                       <div className="flex gap-1.5">
                          <input value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="flex-1 min-w-[140px] bg-surface border border-surface-edge rounded-lg px-2.5 py-1.5 text-[13px] text-white focus:border-brand focus:outline-none" placeholder="Nombre" />
                          <input value={editData.acronym} onChange={e=>setEditData({...editData, acronym: e.target.value})} className="w-14 bg-surface border border-surface-edge rounded-lg px-2 py-1.5 text-[12px] text-white font-black focus:border-brand focus:outline-none text-center" placeholder="Acr." />
                       </div>
                    </td>
                    <td className="px-2 py-1 text-center">
                       <select value={editData.category} onChange={e=>setEditData({...editData, category: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-1.5 py-1.5 text-[11px] text-white focus:border-brand focus:outline-none w-full max-w-[110px]">
                          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
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
                    <td className="px-2 py-1 text-right border-r border-surface-edge/10">
                       <input value={editData.ssi_cost_thb} onChange={e=>setEditData({...editData, ssi_cost_thb: e.target.value})} className="bg-surface border border-rose-300/30 rounded-lg px-2 py-1.5 text-[13px] text-rose-100 w-[70px] text-right focus:border-rose-300 outline-none font-mono" />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <button onClick={() => setEditData({...editData, is_commissionable: !editData.is_commissionable})} className={`p-1 rounded ${editData.is_commissionable ? 'text-amber-500 bg-amber-500/10' : 'text-gray-600'}`} title="Comisión">
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditData({...editData, is_ssi_active: !editData.is_ssi_active})} className={`p-1 rounded ${editData.is_ssi_active ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-600'}`} title="SSI Active">
                          <WavesArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditData({...editData, tshirt_included: !editData.tshirt_included})} className={`p-1 rounded ${editData.tshirt_included ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-gray-600'}`} title="Camiseta incluida">
                          <Shirt className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-1 py-1 text-center w-[30px]">
                       <input value={editData.tanks_weight} onChange={e=>setEditData({...editData, tanks_weight: e.target.value})} className="bg-surface border border-surface-edge rounded-lg px-0.5 py-1.5 text-[12px] text-white focus:border-brand focus:outline-none w-full text-center" placeholder="0" />
                    </td>
                    <td className="px-1 py-1 text-center w-[50px]">
                       <input value={editData.duration_days} onChange={e=>setEditData({...editData, duration_days: e.target.value})} className="bg-surface border border-indigo-500/30 rounded-lg px-0.5 py-1.5 text-[12px] text-indigo-200 focus:border-indigo-400 focus:outline-none w-full text-center font-bold" step="0.5" type="number" />
                    </td>
                    <td className="px-2 py-1 text-center">
                       <select value={editData.payout_group} onChange={e=>setEditData({...editData, payout_group: e.target.value})} className="bg-surface border border-emerald-500/30 rounded-lg px-1.5 py-1.5 text-[11px] text-emerald-100 focus:border-emerald-400 focus:outline-none w-full max-w-[80px]">
                          <option value="">-</option>
                          {payoutGroups.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </td>
                    <td className="px-2 py-1 text-center">
                       <AdvancedColorPicker 
                         color={editData.color} 
                         onChange={color => setEditData({...editData, color})}
                         align="right"
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
                         <span 
                           className={`text-[12px] font-black ${getAcronymBadgeStyle(activity, getCategoryColor).className}`}
                           style={getAcronymBadgeStyle(activity, getCategoryColor).style}
                         >
                           {activity.acronym}
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-[15px] py-2 text-center">
                    <span 
                      className={`text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block ${getBadgeStyle(getCategoryColor(activity.category)).className}`}
                      style={getBadgeStyle(getCategoryColor(activity.category)).style}
                    >
                      {activity.category || 'Undef'}
                    </span>
                  </td>
                  <td className="px-[15px] py-2 text-right font-mono text-white font-bold text-[17px]">
                    {activity.price_thb?.toLocaleString() || 0} ฿
                  </td>
                  <td className="px-[15px] py-2 text-right font-mono text-gray-500 text-[15px]">
                    €{(activity.price_thb / exchangeRate).toFixed(2)}
                  </td>
                  <td className="px-[15px] py-2 text-right font-mono text-rose-300 text-[16px] font-bold border-r border-surface-edge/5">
                    {activity.ssi_cost_thb?.toLocaleString() || 0}
                  </td>
                  <td className="px-[15px] py-2 text-center">
                    <div className="flex flex-col gap-0.5 items-center">
                      {activity.is_commissionable && <Coins className="w-3.5 h-3.5 text-amber-500" title="Comisionable" />}
                      {activity.is_ssi_active && <WavesArrowDown className="w-3.5 h-3.5 text-emerald-500" title="Activo en SSI" />}
                      {activity.tshirt_included && <Shirt className="w-3.5 h-3.5 text-fuchsia-400" title="Incluye camiseta" />}
                      {!activity.is_commissionable && !activity.is_ssi_active && !activity.tshirt_included && <span className="text-gray-700">-</span>}
                    </div>
                  </td>
                  <td className="px-0 py-2 text-center w-[30px]">
                    <span className={`text-[13px] font-bold ${activity.tanks_weight > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {activity.tanks_weight > 0 ? activity.tanks_weight : '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center w-[50px]">
                    <span className={`text-[14px] font-black font-mono ${activity.duration_days > 0 ? 'text-indigo-400' : 'text-gray-600'}`}>
                      {activity.duration_days > 0 ? activity.duration_days : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                     <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${activity.payout_group ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-gray-700 border-transparent'}`}>
                       {activity.payout_group || '-'}
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
  );
}
