import { useState } from 'react';
import { Plus, Check, X, Edit2, Trash2 } from 'lucide-react';

export default function CRBT_LiquidationTable({ 
  partner, 
  total, 
  form, 
  setForm, 
  advances, 
  onAdd, 
  onDelete,
  onSaveInline
}) {
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineForm, setInlineForm] = useState({ day: '', amount: '', concept: '' });

  const startInlineEdit = (a) => {
    setInlineEditId(a.id);
    setInlineForm({ 
      day: a.date.split('-')[2], 
      amount: a.amount.toString(), 
      concept: a.concept 
    });
  };

  const cancelInline = () => {
    setInlineEditId(null);
  };

  const saveInline = (id) => {
    onSaveInline(id, partner, inlineForm);
    setInlineEditId(null);
  };

  return (
    <section className={`flex flex-col bg-[#1f2937] rounded-3xl border ${partner === 'CR' ? 'border-blue-500/20' : 'border-pink-500/20'} overflow-hidden shadow-xl`}>
      <div className={`${partner === 'CR' ? 'bg-blue-600' : 'bg-pink-600'} px-4 py-1.5 flex justify-between items-center`}>
        <h4 className="text-[12px] font-black text-white uppercase tracking-wider">{partner} Pagos Cash</h4>
        <div className="flex items-center gap-2">
           <span className="text-[18px] font-black text-white drop-shadow-lg">
             {total.toLocaleString()} <span className="text-xs font-black opacity-40 ml-0.5">฿</span>
           </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-[9px] font-black text-gray-500 uppercase">
              <th className="w-[50px] px-2 py-1 text-center">Día</th>
              <th className="w-[80px] px-1 py-1">OUT</th>
              <th className="px-1 py-1">Concepto</th>
              <th className="w-[80px] px-2 py-1 text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="bg-indigo-500/5">
              <td className="px-1 py-0.5">
                <input 
                  type="number" 
                  value={form.day} 
                  onChange={e => setForm({ ...form, day: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-black text-white p-1 rounded border border-white/10 text-center outline-none no-spinner" 
                />
              </td>
              <td className="px-0.5 py-0.5">
                <input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-black text-white p-1 rounded border border-white/10 text-center outline-none no-spinner" 
                  placeholder="0"
                />
              </td>
              <td className="px-0.5 py-0.5">
                <input 
                  type="text" 
                  value={form.concept} 
                  onChange={e => setForm({ ...form, concept: e.target.value })} 
                  className="w-full bg-white/5 text-[12px] font-bold text-gray-300 p-1 rounded border border-white/10 outline-none" 
                  placeholder="Nuevo..."
                />
              </td>
              <td className="px-2 py-0.5 text-right pr-4">
                <button onClick={() => onAdd(partner)} className={`p-1 rounded text-white shadow-lg transition-all active:scale-90 ${partner === 'CR' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                   <Plus className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
            {advances.filter(a => a.partner_id === partner).sort((a, b) => new Date(b.date) - new Date(a.date)).map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                {inlineEditId === a.id ? (
                  <>
                    <td className="px-1 py-1">
                      <input type="number" value={inlineForm.day} onChange={e=>setInlineForm({...inlineForm, day: e.target.value})} className="w-full bg-white/10 text-[12px] font-black text-white p-1 rounded border border-indigo-500/50 text-center outline-none no-spinner" />
                    </td>
                    <td className="px-0.5 py-1">
                      <input type="number" value={inlineForm.amount} onChange={e=>setInlineForm({...inlineForm, amount: e.target.value})} className="w-full bg-white/10 text-[12px] font-black text-white p-1 rounded border border-indigo-500/50 text-center outline-none no-spinner" />
                    </td>
                    <td className="px-0.5 py-1">
                      <input type="text" value={inlineForm.concept} onChange={e=>setInlineForm({...inlineForm, concept: e.target.value})} className="w-full bg-white/10 text-[12px] font-bold text-white p-1 rounded border border-indigo-500/50 outline-none" />
                    </td>
                    <td className="px-2 py-1 text-right pr-4">
                       <div className="flex items-center justify-end gap-1">
                          <button onClick={()=>saveInline(a.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelInline} className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"><X className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1.5 text-[12px] font-black text-gray-500 text-center">{a.date.split('-')[2]}</td>
                    <td className={`px-1 py-1.5 text-[12px] font-black ${partner === 'CR' ? 'text-blue-400' : 'text-pink-400'}`}>{a.amount.toLocaleString()}</td>
                    <td className="px-1 py-1.5 text-[12px] font-bold text-gray-400 truncate">{a.concept}</td>
                    <td className="px-2 py-1.5 text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startInlineEdit(a)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(a.id)} className="p-1 hover:bg-rose-500/10 rounded text-gray-500 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {advances.filter(a => a.partner_id === partner).length === 0 && (
              <tr><td colSpan="4" className="text-center py-4 text-[9px] font-black text-gray-700 uppercase tracking-widest">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
