import { ChevronDown, Coins, Trash2, LogOut } from 'lucide-react';
import Billing_GridRow_DateCell             from './Billing_GridRow_DateCell';
import Billing_GridRow_SmartActivitySelect  from './Billing_GridRow_SmartActivitySelect';
import Billing_GridRow_CustomerSearchInput  from './Billing_GridRow_CustomerSearchInput';
import Billing_GridRow_InstructorSelect    from './Billing_GridRow_InstructorSelect';
import EditableInput                        from '../../common/EditableInput';

// CSS class for the right-border accent driven by the parent row's CSS variable
const rb = 'border-r-4 border-r-[var(--group-color)]';

const BIZUM_OPTIONS = [25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500];

function getTranslucentBg(color) {
  if (!color) return 'transparent';
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, '0.3)');
  if (color.startsWith('#')) return color + '4D';
  return color;
}

export default function Billing_GridRow_ItemRow({
  item,
  isHybridRow = false,
  bLine = '',
  // Catalogs
  activities,
  categories,
  staff,
  // Selection state
  selectedItemIds,
  // Date context
  selectedMonth,
  selectedYear,
  setToast,
  // Search state (lives in parent BillingGridRow)
  searchingId,
  setSearchingId,
  // Handlers (live in parent BillingGridRow)
  handleItemUpdate,
  handleDeleteItem,
  handleAddChildItem,
  formatSmartDate,
  // Parent callbacks
  onSelectItem,
  onExtractItem,
  setConfirmConfig,
  // Needed for extract button visibility check
  itemsCount,
}) {
  const act           = activities.find(a => String(a.id) === String(item.activity_id));
  const categoryData  = categories.find(c => c.name === act?.category);
  const isStaffDisabled = categoryData ? categoryData.requires_staff === false : false;

  return (
    <>
      {/* 3. FECHA */}
      <Billing_GridRow_DateCell
        item={item}
        handleItemUpdate={handleItemUpdate}
        bLine={bLine}
        formatSmartDate={formatSmartDate}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setToast={setToast}
      />

      {/* 4. Nombre / Buscador */}
      <td className={`px-1 py-0 border-r border-gray-100 relative group/cell ${bLine}`}>
        {!item.customer_id && searchingId === item.id ? (
          <Billing_GridRow_CustomerSearchInput
            item={item}
            handleItemUpdate={handleItemUpdate}
            onCancel={() => setSearchingId(null)}
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => { if (!item.customer_id) setSearchingId(item.id); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (!item.customer_id) setSearchingId(item.id);
              }
            }}
            className="flex items-center gap-2 overflow-hidden cursor-text h-full px-1 outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:rounded"
            aria-label={item.customers?.first_name ? `Cliente: ${item.customers.first_name}` : "Vincular nuevo cliente"}
          >
            <span className={`text-[13px] font-bold truncate block ${item.customer_id ? 'text-gray-900' : 'text-blue-600 italic font-medium'}`}>
              {item.customers?.first_name || item.temporary_name || 'Vincular Cliente...'}
            </span>
            {item.customer_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (setConfirmConfig) {
                    setConfirmConfig({
                      show: true,
                      title: 'Desvincular Cliente',
                      message: `Estás a punto de desvincular a ${item.customers?.first_name || 'este cliente'} del registro. ¿Deseas continuar?`,
                      type: 'danger',
                      onConfirm: () => {
                        handleItemUpdate(item, 'customer_id', null);
                        setConfirmConfig(prev => ({ ...prev, show: false }));
                      }
                    });
                  }
                }}
                aria-label="Desvincular cliente"
                className="hidden group-hover/cell:flex items-center text-gray-400 hover:text-red-600 p-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </td>

      {/* 5. Apellidos */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <span className="text-[13px] text-slate-800 font-bold truncate block">
          {item.customers?.last_name || (item.temporary_name ? "-" : "...")}
        </span>
      </td>

      {/* 6. Email */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <span className="text-[12px] text-slate-500 truncate block">
          {item.customers?.email || (item.temporary_name ? "-" : "")}
        </span>
      </td>

      {/* 7. Actividad */}
      <td
        className={`px-1 py-0 border-r border-gray-100 transition-all duration-200 group relative ${bLine} focus-within:z-50`}
        style={{
          backgroundColor: getTranslucentBg(act?.color),
          borderLeft: item.activity_id && act?.color ? `4px solid ${act.color}` : 'none'
        }}
      >
        <Billing_GridRow_SmartActivitySelect
          value={item.activity_id ?? ''}
          activities={activities}
          onChange={(val) => handleItemUpdate(item, 'activity_id', val)}
        />
      </td>

      {/* 8. Precio */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <EditableInput
          type="number"
          defaultValue={item.unit_price_thb ?? 0}
          onSave={(val) => handleItemUpdate(item, 'unit_price_thb', val)}
          aria-label="Precio unitario"
          className="bg-transparent text-gray-900 font-black text-sm w-full h-6 text-right outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm py-0 no-spinner"
        />
      </td>

      {/* 9. Q */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <EditableInput
          type="number"
          defaultValue={item.quantity ?? ''}
          onSave={(val) => handleItemUpdate(item, 'quantity', val)}
          aria-label="Cantidad"
          className="bg-transparent text-gray-600 font-black text-sm w-full h-6 text-center outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm py-0 no-spinner"
        />
      </td>

      {/* 10. Total */}
      <td className={`px-1 py-0 text-right border-r border-gray-100 ${bLine}`}>
        <div className={`px-1 h-6 flex items-center justify-end rounded border-2 text-sm font-black tracking-tight whitespace-nowrap ${
          item.status === 'Paid'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {Number(item.total_thb ?? 0).toLocaleString()} ฿
        </div>
      </td>

      {/* 11. Estado */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <div
          className="relative group/status"
          onDoubleClick={(e) => {
            e.preventDefault();
            handleItemUpdate(item, 'status', item.status === 'Paid' ? 'Pending' : 'Paid');
          }}
        >
          <select
            value={item.status || 'Pending'}
            onChange={(e) => handleItemUpdate(item, 'status', e.target.value)}
            className={`w-full h-6 py-0 px-1 rounded text-[12px] font-black border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand appearance-none cursor-pointer text-center ${
              item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <option value="Paid"    style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>PAGADO</option>
            <option value="Pending" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>PENDIENTE</option>
          </select>
          <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none opacity-0 group-hover/status:opacity-100 transition-opacity">
            <ChevronDown className={`w-3 h-3 ${item.status === 'Paid' ? 'text-emerald-600' : 'text-red-400'}`} strokeWidth={4} />
          </div>
        </div>
      </td>

      {/* 12. Medio */}
      <td className={`px-1 py-0 border-r border-gray-100 ${bLine}`}>
        <div className="relative group/select">
          <select
            value={item.payment_method || ''}
            onChange={(e) => handleItemUpdate(item, 'payment_method', e.target.value || null)}
            className={`appearance-none bg-transparent text-[12px] font-black uppercase text-center w-full h-6 px-1 py-0 rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
              !item.payment_method ? 'text-transparent' : 'text-gray-800'
            }`}
          >
            <option value=""        style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}></option>
            <option value="WISE BT" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>WISE BT</option>
            <option value="WISE CR" style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>WISE CR</option>
            <option value="EUR BT"  style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>EUR BT</option>
            <option value="EUR CR"  style={{ color: '#1e293b', backgroundColor: '#f8fafc' }}>EUR CR</option>
          </select>
          <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-gray-500 group-hover/select:text-gray-700">
            <ChevronDown className="w-3 h-3" strokeWidth={4} />
          </div>
        </div>
      </td>

      {/* 13. Instructor */}
      <td className={`px-1 py-0 border-r border-gray-100 ${
        !item.instructor_id && !isStaffDisabled ? 'bg-red-500/10' : 'bg-white'
      } ${bLine}`}>
        <Billing_GridRow_InstructorSelect
          item={item}
          staff={staff}
          isStaffDisabled={isStaffDisabled}
          act={act}
          handleItemUpdate={handleItemUpdate}
        />
      </td>

      {/* 14. BIZUM */}
      <td
        className={`px-1 py-0 w-[60px] min-w-[60px] text-center border-r border-gray-100 cursor-pointer relative ${
          Number(item.bizum_deposit_eur || 0) > 0 ? 'bg-red-700' : 'bg-white'
        } ${bLine}`}
        onDoubleClick={(e) => { e.preventDefault(); handleItemUpdate(item, 'bizum_deposit_eur', null); }}
        title="Doble clic para resetear a 0€"
      >
        <select
          value={item.bizum_deposit_eur || ''}
          onChange={(e) => handleItemUpdate(item, 'bizum_deposit_eur', e.target.value ? Number(e.target.value) : null)}
          disabled={!item.customer_id}
          className={`appearance-none bg-transparent border-none font-black !outline-none focus:!ring-0 focus:!ring-transparent focus-visible:!outline-none text-[12px] w-full h-6 text-center pr-3 transition-colors cursor-pointer relative z-10 ${
            !item.bizum_deposit_eur ? 'text-transparent' : 'text-white'
          } disabled:opacity-30`}
        >
          <option value="" className="text-gray-900 bg-white"></option>
          {BIZUM_OPTIONS.map(val => (
            <option key={val} value={val} className="text-gray-900 bg-white">{val}€</option>
          ))}
        </select>
        <div className={`absolute inset-y-0 right-1 flex items-center pointer-events-none transition-opacity z-20 ${
          Number(item.bizum_deposit_eur || 0) === 0 ? 'opacity-0' : 'opacity-100'
        }`}>
          <ChevronDown className="w-3 h-3 text-white/90" />
        </div>
      </td>

      {/* 15. COMISIÓN */}
      <td className={`px-1 py-0 border-r border-gray-100 text-center ${bLine}`}>
        {(() => {
          const isCommDisabled = !item.activity_id || act?.is_commissionable === false;
          return (
            <button
              disabled={isCommDisabled}
              onClick={() => handleItemUpdate(item, 'is_comm', !item.is_comm)}
              className={`p-0.5 rounded-md transition-all border ${
                !isCommDisabled
                  ? item.is_comm
                    ? 'bg-amber-500 text-white border-amber-600 shadow-inner'
                    : 'bg-white text-gray-200 border-gray-100 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
                  : 'opacity-10 cursor-not-allowed border-transparent'
              }`}
              title={isCommDisabled ? "No disponible para esta actividad" : (item.is_comm ? "Comisionable" : "Marcar Comisión")}
            >
              <Coins className={`w-4 h-4 ${item.is_comm ? 'fill-current' : ''}`} />
            </button>
          );
        })()}
      </td>

      {/* 16. Notas */}
      <td className={`px-1 py-0 overflow-hidden border-r border-gray-100 ${bLine}`}>
        <input
          type="text"
          placeholder="..."
          defaultValue={item.notes || ''}
          onBlur={(e) => handleItemUpdate(item, 'notes', e.target.value)}
          className="bg-transparent text-gray-700 font-medium text-[12px] w-full h-6 outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-sm truncate py-0"
          title={item.notes || ''}
        />
      </td>

      {/* Acciones */}
      <td className={`px-1 py-0 text-center ${bLine} ${isHybridRow ? '' : rb}`}>
        <div className="flex items-center justify-center gap-1">
          {(!isHybridRow || (isHybridRow && itemsCount > 1)) && (
            <button
              onClick={(e) => { e.stopPropagation(); onExtractItem(item.id, item.customer_id); }}
              className="p-1 hover:bg-brand/10 text-brand/50 hover:text-brand rounded transition-colors"
              title="Extraer a nueva factura propia"
            >
              <LogOut className="w-3.5 h-3.5 rotate-[-90deg]" />
            </button>
          )}
          <button
            onClick={(e) => handleDeleteItem(item.id, e)}
            className="p-1 hover:bg-red-50 text-red-500/50 hover:text-red-600 rounded transition-colors"
            title="Borrar Registro"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </>
  );
}
