import { useState } from 'react';
import { Plus, Check, X, Trash2, AlertCircle } from 'lucide-react';
import ConfirmModal from '../../common/ConfirmModal';
import EditableInput from '../../common/EditableInput';

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
  const [confirmConfig, setConfirmConfig] = useState({ show: false, id: null });
  const [localToast, setLocalToast] = useState(null);

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
    <section className={`flex flex-col bg-[#1f2937] rounded-3xl border ${partner === 'CR' ? 'border-blue-500/20' : 'border-pink-500/20'} overflow-hidden shadow-xl relative`}>
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
                <button onClick={async () => {
                  if (!form.amount || !form.concept) {
                    setLocalToast({ message: 'Falta cantidad o concepto', type: 'error' });
                    setTimeout(() => setLocalToast(null), 3000);
                    return;
                  }
                  const success = await onAdd(partner);
                  if (success) {
                    setLocalToast({ message: '¡Registro guardado con éxito!', type: 'success' });
                    setTimeout(() => setLocalToast(null), 3000);
                  }
                }} className={`p-1 rounded text-white shadow-lg transition-all active:scale-90 ${partner === 'CR' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
            {advances.filter(a => a.partner_id === partner).sort((a, b) => new Date(b.date) - new Date(a.date)).map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-1 py-0.5">
                  <EditableInput
                    type="number"
                    defaultValue={a.date.split('-')[2]}
                    onSave={async (val) => {
                      const success = await onSaveInline(a.id, partner, { day: val, amount: a.amount, concept: a.concept });
                      if (success) {
                        setLocalToast({ message: '¡Actualizado con éxito!', type: 'success' });
                        setTimeout(() => setLocalToast(null), 3000);
                      }
                    }}
                    className="w-full bg-transparent text-[12px] font-black text-gray-500 text-center outline-none no-spinner"
                  />
                </td>
                <td className="px-0.5 py-0.5">
                  <EditableInput
                    type="number"
                    defaultValue={a.amount.toString()}
                    onSave={async (val) => {
                      const success = await onSaveInline(a.id, partner, { day: a.date.split('-')[2], amount: val, concept: a.concept });
                      if (success) {
                        setLocalToast({ message: '¡Actualizado con éxito!', type: 'success' });
                        setTimeout(() => setLocalToast(null), 3000);
                      }
                    }}
                    className={`w-full bg-transparent text-[12px] font-black outline-none no-spinner text-center ${partner === 'CR' ? 'text-blue-400' : 'text-pink-400'}`}
                  />
                </td>
                <td className="px-0.5 py-0.5">
                  <EditableInput
                    type="text"
                    defaultValue={a.concept}
                    onSave={async (val) => {
                      const success = await onSaveInline(a.id, partner, { day: a.date.split('-')[2], amount: a.amount, concept: val });
                      if (success) {
                        setLocalToast({ message: '¡Actualizado con éxito!', type: 'success' });
                        setTimeout(() => setLocalToast(null), 3000);
                      }
                    }}
                    className="w-full bg-transparent text-[12px] font-bold text-gray-400 outline-none truncate"
                  />
                </td>
                <td className="px-2 py-0.5 text-right pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setConfirmConfig({ show: true, id: a.id })} className="p-1 hover:bg-rose-500/10 rounded text-gray-500 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {advances.filter(a => a.partner_id === partner).length === 0 && (
              <tr><td colSpan="4" className="text-center py-4 text-[9px] font-black text-gray-700 uppercase tracking-widest">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={confirmConfig.show}
        title="Borrar Adelanto"
        message="¿Estás seguro de que quieres eliminar este registro de pago?"
        type="danger"
        onConfirm={() => {
          onDelete(confirmConfig.id);
          setConfirmConfig({ show: false, id: null });
        }}
        onCancel={() => setConfirmConfig({ show: false, id: null })}
      />

      {localToast && (
        <div className={`absolute bottom-4 left-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl border shadow-xl ${localToast.type === 'error' ? 'bg-rose-500/90 border-rose-500 text-rose-100' : 'bg-emerald-500 border-emerald-500 text-emerald-100'
          }`}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-widest">{localToast.message}</span>
        </div>
      )}
    </section>
  );
}
