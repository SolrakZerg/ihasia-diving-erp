import React from 'react';
import { ChevronRight, Trash2 as TrashIcon } from 'lucide-react';

export default function Carabao_Invoice_Table({
  dynamicInvoiceData,
  selectedInvoiceRows,
  setSelectedInvoiceRows,
  availableActivitiesForMonth,
  grandTotal
}) {
  return (
    <div className="border-2 border-gray-100 rounded-sm overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-[#8a8e6b] text-white text-[11px] font-black uppercase tracking-widest">
            <th className="px-6 py-4 w-[15%] border-r border-white/10">Code</th>
            <th className="px-6 py-4 w-[40%] border-r border-white/10">Description</th>
            <th className="px-6 py-4 text-center w-[8%] border-r border-white/10">Qty</th>
            <th className="px-6 py-4 text-center w-[15%] border-r border-white/10">Unit Price</th>
            <th className="px-6 py-4 text-right w-[22%]">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {dynamicInvoiceData.map((row, idx) => (
            <tr key={idx} className="text-sm font-bold h-12 hover:bg-gray-50 transition-colors group">
              <td className="border-r border-gray-100 print:hidden relative">
                <select 
                  value={row.type === 'manual' ? '' : row.id}
                  onChange={(e) => {
                    const newRows = [...selectedInvoiceRows];
                    const val = e.target.value;
                    if (val === 'tank_group') {
                      newRows[idx] = { id: 'tank_group', type: 'tank_group' };
                    } else if (val === '') {
                      newRows[idx] = { id: 'manual_' + Date.now(), type: 'manual', code: '---', desc: '', qty: '', price: '' };
                    } else {
                      newRows[idx] = { id: val, type: 'activity' };
                    }
                    setSelectedInvoiceRows(newRows);
                  }}
                  className="w-full h-full px-6 py-3 bg-transparent border-none focus:ring-0 font-black text-[#8a8e6b] cursor-pointer appearance-none uppercase"
                >
                  <option value="">---</option>
                  <option value="tank_group">Tanks</option>
                  {availableActivitiesForMonth.map(act => (
                    <option key={act.id} value={act.id}>{act.acronym || act.name.slice(0, 3)}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </div>
              </td>
              {/* Vista para imprimir (sin select) */}
              <td className="px-6 py-3 text-[#8a8e6b] font-black border-r border-gray-100 uppercase hidden print:table-cell">
                {row.code}
              </td>

              <td className="px-6 py-3 border-r border-gray-100">
                {row.type === 'manual' ? (
                  <input 
                    value={row.desc}
                    onChange={(e) => {
                      const newRows = [...selectedInvoiceRows];
                      newRows[idx] = { ...newRows[idx], desc: e.target.value };
                      setSelectedInvoiceRows(newRows);
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800"
                  />
                ) : row.desc}
              </td>
              <td className="px-6 py-3 text-center border-r border-gray-100">
                {row.type === 'manual' ? (
                  <input 
                    type="number"
                    value={row.qty}
                    onChange={(e) => {
                      const newRows = [...selectedInvoiceRows];
                      const val = e.target.value;
                      newRows[idx] = { ...newRows[idx], qty: val === '' ? '' : (parseFloat(val) || 0) };
                      setSelectedInvoiceRows(newRows);
                    }}
                    className="w-full bg-transparent border-none text-center focus:ring-0 text-gray-800 p-0 no-spinner"
                  />
                ) : row.qty}
              </td>
              <td className="px-6 py-3 text-center border-r border-gray-100">
                {row.type === 'manual' ? (
                  <input 
                    type="number"
                    value={row.price}
                    onChange={(e) => {
                      const newRows = [...selectedInvoiceRows];
                      const val = e.target.value;
                      newRows[idx] = { ...newRows[idx], price: val === '' ? '' : (parseFloat(val) || 0) };
                      setSelectedInvoiceRows(newRows);
                    }}
                    className="w-full bg-transparent border-none text-center focus:ring-0 text-gray-800 p-0 no-spinner"
                  />
                ) : row.price.toLocaleString()}
              </td>
              <td className="px-6 py-3 text-right font-black relative group/amount">
                {row.type === 'manual' && !row.desc ? '' : row.amount.toLocaleString()}
                <button 
                  onClick={() => {
                    const newRows = selectedInvoiceRows.filter((_, i) => i !== idx);
                    setSelectedInvoiceRows(newRows);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all print:hidden"
                  title="Quitar fila"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          <tr className="print:hidden">
             <td colSpan="5" className="p-2">
                <button 
                  onClick={() => setSelectedInvoiceRows([...selectedInvoiceRows, { id: 'manual_' + Date.now(), type: 'manual', code: '---', desc: '', qty: '', price: '' }])}
                  className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#8a8e6b] hover:text-[#8a8e6b] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  + Añadir Fila
                </button>
             </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="px-6 py-4 text-center">
              <p className="text-xl font-black text-gray-400 uppercase tracking-[0.2em] opacity-50">THANK YOU</p>
            </td>
            <td className="px-6 py-4 bg-[#8a8e6b] text-white font-black text-xs text-center uppercase tracking-widest border-y-2 border-l-2 border-[#8a8e6b]">TOTAL</td>
            <td className="px-6 py-4 bg-white border-y-2 border-r-2 border-[#8a8e6b] text-xl font-black text-right tracking-tighter whitespace-nowrap">
              <span className="text-[#8a8e6b] mr-1">฿</span> {grandTotal.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
