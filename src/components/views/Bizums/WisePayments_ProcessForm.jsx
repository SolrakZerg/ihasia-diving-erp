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
  Loader2 
} from 'lucide-react';
import WisePayments_MiniCalendar from './WisePayments_MiniCalendar';

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
  paxActivities,
  onPaxActivityChange,
  previewMessage,
  calendarError,
  loadingCalendar,
  onAllActions,
  onWhatsappOnly,
  onCalendarOnly
}) {
  return (
    <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
      
      {/* 1. CALENDARIO VISUAL INTERACTIVO */}
      <WisePayments_MiniCalendar
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        currentMonth={currentMonth}
        onChangeMonth={onChangeMonth}
      />

      {/* Datos de Wise: Titular / Cliente Editable y Badges */}
      <div className="bg-surface-soft/50 border border-surface-edge rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-4 h-4 text-brand shrink-0" /> Titular / Cliente Reserva:
          </label>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-xs">
              {payment.num_people} PAX
            </span>
            <span className="px-2.5 py-0.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              WISE BT
            </span>
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={clientName}
            onChange={(e) => onChangeClientName(e.target.value)}
            placeholder="Nombre del cliente o Empresa (Nombre)"
            className="w-full bg-surface border border-surface-edge rounded-xl px-3.5 py-2 text-sm sm:text-base text-white font-bold placeholder-gray-500 focus:outline-none focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* Field: Teléfono */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Phone className="w-4.5 h-4.5 text-emerald-400" /> Teléfono:
          </label>
          <button
            type="button"
            onClick={onPasteClipboard}
            className="text-xs text-brand hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-brand/10 px-2.5 py-1 rounded-xl border border-brand/20"
          >
            <Clipboard className="w-3.5 h-3.5" /> Pegar Portapapeles
          </button>
        </div>
        <input
          type="text"
          value={phone}
          onChange={(e) => onChangePhone(e.target.value)}
          placeholder="+34 600 000 000"
          className="w-full bg-surface-soft border border-surface-edge rounded-xl p-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-all font-mono font-bold"
        />
      </div>

      {/* Selector de Actividad e Idioma */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-amber-400" /> Curso / Actividad:
          </label>
          {payment.num_people > 1 && (
            <button
              type="button"
              onClick={onToggleMultipleActivities}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              {isMultipleActivities ? 'Misma actividad para todos' : '¿Actividades distintas?'}
            </button>
          )}
        </div>

        {!isMultipleActivities || payment.num_people === 1 ? (
          <div className="grid grid-cols-2 gap-3">
            <select
              value={activity}
              onChange={(e) => onChangeActivity(e.target.value)}
              className="w-full bg-surface-soft border border-surface-edge rounded-xl p-3 text-sm sm:text-base text-white focus:outline-none focus:border-brand transition-all cursor-pointer font-bold"
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
                className={`flex items-center justify-center py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
                className={`flex items-center justify-center py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
          <div className="space-y-2.5 p-3.5 bg-surface-soft/40 border border-amber-500/20 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Actividades por Pax ({payment.num_people}):</span>
              <div className="flex p-0.5 bg-surface border border-surface-edge rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => onChangeIsEnglish(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEnglish
                      ? 'bg-brand text-white shadow-sm font-black'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  Español
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Array.from({ length: payment.num_people }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-400 shrink-0 w-12">Pax {idx + 1}:</span>
                  <select
                    value={paxActivities[idx] || 'OW'}
                    onChange={(e) => onPaxActivityChange(idx, e.target.value)}
                    className="w-full bg-surface border border-surface-edge rounded-xl p-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand font-bold cursor-pointer"
                  >
                    <option value="OW">OW</option>
                    <option value="OW 2">OW 2</option>
                    <option value="AA">AA</option>
                    <option value="DSD">DSD</option>
                    <option value="SR">SR</option>
                    <option value="FD">FD</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vista previa del mensaje */}
      <div className="bg-surface/70 border border-surface-edge/70 rounded-2xl p-3.5 text-xs sm:text-sm text-gray-300 space-y-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wider text-brand block">Vista previa ({isEnglish ? 'Inglés' : 'Español'}):</span>
        <p className="line-clamp-3 italic text-gray-200 leading-relaxed">"{previewMessage}"</p>
      </div>

      {calendarError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm text-center font-medium">
          {calendarError}
        </div>
      )}

      {/* LAS 3 ACCIONES DIRECTAS DE BIZUM */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onAllActions}
          disabled={loadingCalendar}
          className="w-full py-4 px-5 rounded-2xl bg-brand text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {loadingCalendar ? (
            <>
              <Loader2 className="w-5.5 h-5.5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5.5 h-5.5" />
              <span>WhatsApp y Calendario</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onWhatsappOnly}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span>Solo Enviar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onCalendarOnly}
            disabled={loadingCalendar}
            className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingCalendar ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Creando en Calendar...</span>
              </>
            ) : (
              <>
                <CalendarIcon className="w-4.5 h-4.5" />
                <span>Solo Crear en Calendario</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
