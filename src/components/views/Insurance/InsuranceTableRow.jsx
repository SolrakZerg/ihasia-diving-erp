import React from 'react';
import { Calendar, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import EditableInput from '../../common/EditableInput';

const getActivityBadgeClasses = (activity) => {
  if (!activity) return 'text-brand bg-brand/10 border-brand/20';
  const a = activity.toLowerCase();
  if (a.includes('try dive') || a.includes('bautizo')) {
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }
  if (a.includes('open water') || a.includes('owd')) {
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  }
  if (a.includes('advanced') || a.includes('aowd')) {
    return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  }
  if (a.includes('rescue')) {
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  }
  if (a.includes('fun dive') || a.includes('fundive') || a.includes('ocio')) {
    return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  }
  if (a.includes('refresh') || a.includes('refresher')) {
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }
  if (a.includes('ssi course')) {
    return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
  }
  return 'text-brand bg-brand/10 border-brand/20';
};

export default function InsuranceTableRow({
  customer,
  index,
  paxBalance,
  isDuplicate,
  isSelected,
  toggleSelectCustomer,
  editingId,
  setEditingId,
  updateCustomerField,
  handleRemoveCustomer,
  onSendSingleToRoster
}) {
  return (
    <tr className={`hover:bg-brand/5 transition-colors group ${isSelected ? 'bg-sky-500/10' : ''}`}>
      <td className="px-2 py-3 text-center w-[36px]">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectCustomer(customer.id)}
          className="w-4 h-4 rounded border-surface-edge bg-surface-soft text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
        />
      </td>
      <td className="hidden sm:table-cell px-3 py-3 text-center text-brand font-mono text-[15px] font-bold min-w-[50px]">
        {paxBalance - index}
      </td>
      <td className="px-2 py-3 min-w-[190px] max-w-[300px]">
        <div className="flex flex-col justify-center min-w-0">
          {editingId === customer.id ? (
            <div className="flex gap-1 font-bold text-white text-[15px] capitalize">
              <EditableInput
                defaultValue={customer.first_name || ''}
                onSave={(val) => {
                  updateCustomerField(customer.id, 'first_name', val);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors max-w-[100px]"
                placeholder="Nombre"
                autoFocus
              />
              <EditableInput
                defaultValue={customer.last_name || ''}
                onSave={(val) => {
                  updateCustomerField(customer.id, 'last_name', val);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-1 outline-none transition-colors max-w-[150px]"
                placeholder="Apellidos"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              {isDuplicate && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" title="Posible registro duplicado (mismo pasaporte o nombre muy similar)" />
              )}
              <p className={`font-bold text-[15px] capitalize truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[300px] ${isDuplicate ? 'text-rose-400 font-extrabold' : 'text-white'}`}>
                {(customer.first_name || '') + ' ' + (customer.last_name || '')}
              </p>
              <button
                onClick={() => setEditingId(customer.id)}
                className="p-1 text-text-muted hover:text-brand hover:bg-brand/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Corregir nombre"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {customer.booking_date && (
              <p className="text-[11px] text-cyan-500/80 font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(customer.booking_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '')}
                {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 md:hidden flex-shrink-0 ml-1" />
                )}
                <span className="text-text-muted md:hidden ml-1 uppercase">
                  · {customer.gender?.[0] || '-'}
                </span>
              </p>
            )}
            {customer.booked_activity && (
              <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm border ${getActivityBadgeClasses(customer.booked_activity)}`}>
                {customer.booked_activity}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="hidden md:table-cell px-2 py-3 text-center min-w-[85px]">
        {customer.insurance_expiry && new Date(customer.insurance_expiry) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
          <span className="text-[12px] text-rose-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider inline-flex whitespace-nowrap mx-auto">
            <AlertCircle className="w-3 h-3" /> Activo
          </span>
        )}
      </td>

      <td className="hidden md:table-cell px-2 py-3 text-center text-text-muted font-bold uppercase text-sm min-w-[50px]">
        {customer.gender?.[0] || '-'}
      </td>

      <td className="px-1 py-3 text-center min-w-[90px]">
        <EditableInput
          defaultValue={customer.passport_number || ''}
          onSave={(val) => updateCustomerField(customer.id, 'passport_number', val)}
          className="bg-transparent border border-transparent hover:border-surface-edge/40 focus:border-brand rounded px-0 outline-none transition-colors w-full text-center font-mono text-[15px] text-brand-light font-bold tracking-wider"
          placeholder="N/A"
        />
      </td>

      <td className="px-2 md:pr-4 py-3 text-center min-w-[35px]">
        <div className="flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1.5">
          <button
            type="button"
            onClick={() => onSendSingleToRoster && onSendSingleToRoster(customer)}
            className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/15 rounded-lg transition-colors border border-sky-500/20"
            title="Mandar solo este cliente al Roster"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveCustomer(customer.id)}
            className="p-1 text-text-muted hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
            title="Quitar de la lista"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
