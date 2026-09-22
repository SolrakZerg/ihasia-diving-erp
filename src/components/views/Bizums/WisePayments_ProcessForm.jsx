import { 
  User, 
  CreditCard, 
  Phone, 
  BookOpen, 
  Users, 
  Clipboard, 
  Sparkles, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Loader2,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { cleanPhone } from './Bizums_Utils';
import WisePayments_MiniCalendar from './WisePayments_MiniCalendar';
import WisePayments_EditSection from './WisePayments_EditSection';

export default function WisePayments_ProcessForm({
  payment,
  selectedDate,
  onSelectDate,
  currentMonth,
  onChangeMonth,
  clientName,
  onChangeClientName,
  phone,
  onChangePhone,
  onPasteClipboard,
  activity,
  onChangeActivity,
  isEnglish,
  onChangeIsEnglish,
  isMultipleActivities,
  onToggleMultipleActivities,
  activityLines = [],
  onAddLine,
  onRemoveLine,
  onLineChange,
  totalAssignedPax,
  isPaxCountValid = true,
  previewMessage,
  calendarError,
  loadingCalendar,
  onAllActions,
  onWhatsappOnly,
  onCalendarOnly,
  notes,
  onChangeNotes,
  isEditMode = false,
  combinedActivitiesText,
  activityAcronymText,
  isProcessed,
  onChangeIsProcessed,
  isRetained,
  onChangeIsRetained,
  retainedPeople,
  onChangeRetainedPeople,
  isSettled,
  onChangeIsSettled,
  savingEdit,
  onSaveEdit
}) {
  return (
    <div className="p-4 sm:p-5 space-y-3 max-h-[88vh] overflow-y-auto custom-scrollbar flex-1">
      
      {/* 1. CALENDARIO VISUAL INTERACTIVO */}
      <WisePayments_MiniCalendar
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        currentMonth={currentMonth}
        onChangeMonth={onChangeMonth}
      />

      {/* 2. CLIENTE (en una sola línea) */}
      <div className="flex items-center gap-2.5">
        <label className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-1.5 shrink-0 w-20 sm:w-24">
          <User className="w-4 h-4 text-brand" /> Cliente:
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => onChangeClientName(e.target.value)}
          placeholder="Nombre del cliente o Empresa"
          className="flex-1 min-w-0 bg-surface-soft border border-surface-edge rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold placeholder-gray-500 focus:outline-none focus:border-brand transition-all"
        />
        <div className="w-36 sm:w-40 shrink-0 flex items-center justify-end gap-1.5">
          <span className="px-2 py-1 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-xs">
            {payment.num_people} PAX
          </span>
          <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            WISE BT
          </span>
        </div>
      </div>

      {/* 3. TELÉFONO (en una sola línea) */}
      <div className="flex items-center gap-2.5">
        <label className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-1.5 shrink-0 w-20 sm:w-24">
          <Phone className="w-4 h-4 text-emerald-400" /> Teléfono:
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => onChangePhone(cleanPhone(e.target.value))}
          onBlur={(e) => onChangePhone(cleanPhone(e.target.value))}
          placeholder="+34 600 000 000"
          className="flex-1 min-w-0 bg-surface-soft border border-surface-edge rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all font-mono font-bold"
        />
        <div className="w-36 sm:w-40 shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onPasteClipboard}
            className="text-xs text-brand hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-brand/10 hover:bg-brand/20 px-3 py-2 rounded-xl border border-brand/25 transition-all"
            title="Pegar portapapeles"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Pegar</span>
          </button>
        </div>
      </div>

      {/* Selector de Actividad e Idioma */}
      <div className="space-y-2 pt-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-400" /> Curso / Actividad:
          </label>
          {payment.num_people > 1 && (
            <button
              type="button"
              onClick={onToggleMultipleActivities}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              {isMultipleActivities ? 'Misma actividad para todos' : '¿Actividades distintas?'}
            </button>
          )}
        </div>

        {!isMultipleActivities || payment.num_people === 1 ? (
          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={activity}
              onChange={(e) => onChangeActivity(e.target.value)}
              className="w-full bg-surface-soft border border-surface-edge rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand transition-all cursor-pointer font-bold"
            >
              <option value="OW">OW</option>
              <option value="OW 2">OW 2</option>
              <option value="AA">AA</option>
              <option value="DSD">DSD</option>
              <option value="SR">SR</option>
              <option value="FD">FD</option>
            </select>

            <div className="grid grid-cols-2 p-1 bg-surface-soft border border-surface-edge rounded-xl gap-1">
              <button
                type="button"
                onClick={() => onChangeIsEnglish(true)}
                className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEnglish
                    ? 'bg-brand text-white shadow-md shadow-brand/20 font-black'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                Inglés
              </button>
              <button
                type="button"
                onClick={() => onChangeIsEnglish(false)}
                className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isEnglish
                    ? 'bg-brand text-white shadow-md shadow-brand/20 font-black'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                Español
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-3 bg-surface-soft/40 border border-amber-500/30 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-surface-edge/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Asigna Pax por actividad:
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 ${
                  totalAssignedPax === (payment.num_people || 1)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
                }`}>
                  {totalAssignedPax === (payment.num_people || 1) ? '✓' : '⚠️'} {totalAssignedPax} de {payment.num_people || 1} Pax
                </span>
              </div>
              <div className="flex p-0.5 bg-surface border border-surface-edge rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => onChangeIsEnglish(true)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEnglish
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  Inglés
                </button>
                <button
                  type="button"
                  onClick={() => onChangeIsEnglish(false)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEnglish
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            {/* Tabla de líneas de actividad */}
            <div className="space-y-1.5 pt-0.5">
              {activityLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-surface/80 p-1.5 rounded-xl border border-surface-edge">
                  <span className="text-[11px] font-black text-gray-400 pl-1 shrink-0">Pax:</span>
                  <input
                    type="number"
                    min="1"
                    max={payment.num_people || 1}
                    value={line.count}
                    onChange={(e) => onLineChange(idx, 'count', e.target.value)}
                    className="w-14 bg-surface-soft border border-surface-edge rounded-lg py-1 text-center text-xs font-black text-white focus:outline-none focus:border-brand font-mono"
                  />
                  <select
                    value={line.code}
                    onChange={(e) => onLineChange(idx, 'code', e.target.value)}
                    className="flex-1 bg-surface-soft border border-surface-edge rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand font-bold cursor-pointer"
                  >
                    <option value="OW">OW</option>
                    <option value="OW 2">OW 2</option>
                    <option value="AA">AA</option>
                    <option value="DSD">DSD</option>
                    <option value="SR">SR</option>
                    <option value="FD">FD</option>
                  </select>
                  {activityLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveLine(idx)}
                      className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                      title="Eliminar grupo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {totalAssignedPax < (payment.num_people || 1) && (
              <button
                type="button"
                onClick={onAddLine}
                className="w-full py-1.5 px-3 bg-surface hover:bg-surface-soft border border-surface-edge text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5 text-brand" />
                <span>Añadir otra actividad</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vista previa del mensaje */}
      <div className="bg-surface/70 border border-surface-edge/70 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-gray-300 space-y-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand block">Vista previa ({isEnglish ? 'Inglés' : 'Español'}):</span>
        <p className="line-clamp-2 italic text-gray-200 leading-relaxed text-xs sm:text-sm">"{previewMessage}"</p>
      </div>

      {/* Notas Internas / Observaciones */}
      <div>
        <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <FileText className="w-3.5 h-3.5 text-brand" /> Notas Internas / Observaciones:
        </label>
        <textarea
          rows={2}
          value={notes || ''}
          onChange={(e) => onChangeNotes && onChangeNotes(e.target.value)}
          placeholder="Añade notas aclaratorias sobre este pago..."
          className="w-full bg-surface-soft border border-surface-edge rounded-xl p-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all resize-none"
        />
      </div>

      {calendarError && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm text-center font-medium">
          {calendarError}
        </div>
      )}

      {!isPaxCountValid && (
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-bold animate-pulse">
          ⚠️ Debes asignar los {payment?.num_people || 1} Pax de la reserva (actualmente hay {totalAssignedPax}).
        </div>
      )}

      {/* LAS 3 ACCIONES DIRECTAS DE BIZUM */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onAllActions}
          disabled={loadingCalendar || !isPaxCountValid}
          className="w-full py-3 px-4 rounded-xl bg-brand text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingCalendar ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-amber-300" />
              <span>WhatsApp y Calendario</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onWhatsappOnly}
            disabled={!isPaxCountValid}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Solo Enviar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onCalendarOnly}
            disabled={loadingCalendar || !isPaxCountValid}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loadingCalendar ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando en Calendar...</span>
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4" />
                <span>Solo Crear en Calendario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECCIÓN EXTRA EN MODO EDICIÓN */}
      {isEditMode && (
        <WisePayments_EditSection
          payment={payment}
          clientName={clientName}
          selectedDate={selectedDate}
          activity={activity}
          combinedActivitiesText={combinedActivitiesText}
          activityAcronymText={activityAcronymText}
          isProcessed={isProcessed}
          onChangeIsProcessed={onChangeIsProcessed}
          isRetained={isRetained}
          onChangeIsRetained={onChangeIsRetained}
          retainedPeople={retainedPeople}
          onChangeRetainedPeople={onChangeRetainedPeople}
          isSettled={isSettled}
          onChangeIsSettled={onChangeIsSettled}
          savingEdit={savingEdit}
          onSaveEdit={onSaveEdit}
        />
      )}

    </div>
  );
}
