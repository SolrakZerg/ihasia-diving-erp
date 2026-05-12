import { Pencil, Trash2, ArrowUpDown, AlertCircle } from 'lucide-react';
import EditableInput from '../../../common/EditableInput';

/**
 * Staff_fee_Table — Tabla de reglas de pago con edición inline del importe.
 */
export default function Staff_fee_Table({
  sortedPayouts,
  sortConfig,
  handleSort,
  editingId,
  saveEdit,
  cancelEdit,
  startEditing,
  deletePayout,
}) {
  return (
    <div className="bg-surface-soft rounded-2xl border border-surface-edge overflow-hidden shadow-xl flex flex-col min-h-[400px]">
      {/* CSS para quitar spinners de inputs tipo number */}
      <style dangerouslySetInnerHTML={{ __html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}} />

      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          {/* ... thead ... */}
          <thead className="sticky top-0 z-10 bg-table-header/98 backdrop-blur-xl">
            <tr className="border-b border-surface-edge/50 shadow-sm">
              <SortableTh label="Concepto / Actividad" colKey="name" sortConfig={sortConfig} handleSort={handleSort} />
              <SortableTh label="Tipo" colKey="type" sortConfig={sortConfig} handleSort={handleSort} center />
              <SortableTh label="Cuota (THB)" colKey="amount_thb" sortConfig={sortConfig} handleSort={handleSort} right />
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-20">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-edge/50">
            {sortedPayouts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-500 italic">
                  No hay reglas de pago configuradas.
                </td>
              </tr>
            ) : sortedPayouts.map(p => (
              <tr key={p.id} className="group hover:bg-surface transition-colors">
                {/* Concepto / Actividad */}
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

                {/* Tipo badge */}
                <td className="px-6 py-3 text-center">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                    p.activity_id
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                  }`}>
                    {p.activity_id ? 'Catálogo' : 'Manual'}
                  </span>
                </td>

                {/* Importe — editable inline con EditableInput */}
                <td className="px-6 py-3 text-right">
                  {editingId === p.id ? (
                    <div className="flex justify-end items-center">
                      <EditableInput
                        defaultValue={p.amount_thb}
                        onSave={(val) => saveEdit(p.id, val)}
                        onCancel={cancelEdit}
                        type="number"
                        className="w-24 bg-surface border border-surface-edge rounded px-2 py-1 text-right text-white font-black text-sm outline-none focus:border-brand"
                      />
                    </div>
                  ) : (
                    <span className="text-white font-black text-lg">{p.amount_thb?.toLocaleString()} ฿</span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-6 py-3 text-right">
                  {editingId !== p.id && (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(p)}
                        className="p-1.5 bg-surface-edge/30 rounded-lg text-gray-400 hover:text-brand transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePayout(p.id)}
                        className="p-1.5 bg-surface-edge/30 rounded-lg text-gray-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer informativo */}
      <div className="p-4 bg-surface-edge/10 border-t border-surface-edge flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-gray-500 shrink-0" />
        <p className="text-[11px] text-gray-500">
          Estos montos se usarán para calcular automáticamente la liquidación del staff en facturas y salidas.
        </p>
      </div>
    </div>
  );
}

/** Subcomponente interno: cabecera de columna ordenable */
function SortableTh({ label, colKey, sortConfig, handleSort, center, right }) {
  const active = sortConfig.key === colKey;
  const align = center ? 'justify-center' : right ? 'justify-end' : 'justify-start';
  const thAlign = center ? 'text-center' : right ? 'text-right' : '';
  return (
    <th
      onClick={() => handleSort(colKey)}
      className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-surface-edge/50 transition-colors group ${thAlign}`}
    >
      <div className={`flex items-center gap-2 ${align}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 transition-opacity ${active ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
      </div>
    </th>
  );
}
