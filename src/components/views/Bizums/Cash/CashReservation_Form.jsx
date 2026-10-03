import { useState, useEffect } from 'react';
import { Plus, Trash2, Clipboard, Loader2, MessageSquare, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import CashReservation_Calendar from './CashReservation_Calendar';
import { COURSES } from './cashReservationUtils';

export default function CashReservation_Form({
  selectedDate,
  onSelectDate,
  currentMonth,
  onChangeMonth,
  customerName,
  onChangeCustomerName,
  phone,
  onChangePhone,
  onPasteClipboard,
  activities,
  onAddActivity,
  onRemoveActivity,
  onUpdateActivity,
  reservaPax,
  onChangeReservaPax,
  paymentMethod = 'CASH',
  onChangePaymentMethod,
  isEnglish,
  onToggleEnglish,
  previewWaText,
  onSubmit,
  isSubmitting,
  errorMessage
}) {
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar en tiempo real para evitar que se escriban letras en el teléfono
  const handlePhoneInputChange = (e) => {
    let val = e.target.value;
    // Solo permitir números, espacios, guiones y un '+' al inicio
    let clean = val.replace(/[^0-9+\s-]/g, '');
    if (clean.indexOf('+') > 0) {
      clean = clean[0] + clean.slice(1).replace(/\+/g, '');
    }
    onChangePhone(clean);
  };

  const digitsCount = (phone || '').replace(/[^0-9]/g, '').length;
  const isPhoneEntered = (phone || '').trim().length > 0;
  const isPhoneIncomplete = isPhoneEntered && digitsCount < 7;
  const isPhoneValid = digitsCount >= 7;

  return (
    <form onSubmit={onSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 overflow-x-hidden">
      {/* Contenedor centralizado para que Calendario y Formulario tengan EXACTAMENTE el mismo ancho */}
      <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
        {/* 1. Calendario Visual */}
        <CashReservation_Calendar
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          currentMonth={currentMonth}
          onChangeMonth={onChangeMonth}
        />

        {/* 2. Fila 1: Nombre del Cliente + Botón Pegar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <label className="w-18 sm:w-22 shrink-0 text-sm sm:text-base font-black text-white text-left">
            Nombre:
          </label>
          <div className="flex-1 min-w-0 flex gap-1.5 sm:gap-2">
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => onChangeCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
              className="flex-1 min-w-0 bg-surface-soft border border-surface-edge rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-bold text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
              autoFocus
            />
            <button
              type="button"
              onClick={onPasteClipboard}
              className="w-9 h-9 sm:w-auto sm:h-auto p-2 sm:px-4 sm:py-2.5 bg-surface-soft hover:bg-emerald-500/20 text-emerald-300 border border-surface-edge hover:border-emerald-500/40 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Pegar y autocompletar desde el portapapeles"
            >
              <Clipboard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Pegar</span>
            </button>
          </div>
        </div>

        {/* 3. Fila 2: Teléfono + Reserva (solo número) + Método de Pago */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <label className="w-18 sm:w-22 shrink-0 text-sm sm:text-base font-black text-white text-left flex flex-col justify-center">
            <span>Teléfono:</span>
            {isPhoneIncomplete && (
              <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold leading-none mt-0.5" title="Mínimo 7 dígitos para WhatsApp">
                ⚠️ Corto
              </span>
            )}
          </label>
          <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneInputChange}
              placeholder="+34 600 000 000"
              className={`flex-1 min-w-0 bg-surface-soft border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-mono font-bold text-white placeholder-gray-500 focus:outline-none transition-all shadow-inner ${
                isPhoneIncomplete
                  ? 'border-amber-500/70 focus:border-amber-400 text-amber-200'
                  : isPhoneValid
                  ? 'border-emerald-500/70 focus:border-emerald-400'
                  : 'border-surface-edge focus:border-emerald-500'
              }`}
            />

            {/* En Desktop (>= sm): Reserva + Desplegable Método con ancho equilibrado */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm sm:text-base font-black text-white">
                  Reserva:
                </span>
                <select
                  value={reservaPax}
                  onChange={(e) => onChangeReservaPax(Number(e.target.value))}
                  className={`w-14 sm:w-15 bg-surface-soft border rounded-xl py-2 sm:py-2.5 text-sm sm:text-base font-black text-center focus:outline-none cursor-pointer transition-all shadow-inner ${
                    reservaPax === 0
                      ? 'border-red-500/50 text-white bg-red-500/20 focus:border-red-400'
                      : 'border-surface-edge text-white focus:border-white/50'
                  }`}
                  title={reservaPax === 0 ? 'Sin fianza (0 THB)' : `${reservaPax} pax (${reservaPax * 1000} THB)`}
                >
                  <option value={0} className="bg-surface font-bold text-white">0</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n} className="bg-surface font-bold text-white">
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desplegable Método ajustado (deja más espacio al teléfono) */}
              {reservaPax > 0 ? (
                <select
                  value={paymentMethod}
                  onChange={(e) => onChangePaymentMethod && onChangePaymentMethod(e.target.value)}
                  className="w-32 sm:w-35 bg-surface-soft border border-white/20 hover:border-white/40 focus:border-white text-white rounded-xl px-2.5 py-2 sm:py-2.5 text-xs sm:text-sm font-black focus:outline-none cursor-pointer transition-all shadow-inner"
                >
                  <option value="CASH" className="bg-surface font-bold text-white">💵 CASH</option>
                  <option value="WISE CR" className="bg-surface font-bold text-cyan-300">🔵 WISE CR</option>
                  <option value="WISE BT" className="bg-surface font-bold text-purple-300">🟣 WISE BT</option>
                </select>
              ) : (
                <span className="w-32 sm:w-35 text-center py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-red-500/20 border border-red-500/40 shadow-sm">
                  Sin fianza
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fila Reserva y Método en Móvil (< sm): 1 sola línea armónica debajo de Teléfono */}
        <div className="flex sm:hidden items-center gap-2">
          <label className="w-18 shrink-0 text-sm font-black text-white text-left">
            Reserva:
          </label>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <select
              value={reservaPax}
              onChange={(e) => onChangeReservaPax(Number(e.target.value))}
              className={`w-14 bg-surface-soft border rounded-xl py-2 text-sm font-black text-center focus:outline-none cursor-pointer shadow-inner ${
                reservaPax === 0
                  ? 'border-red-500/50 text-white bg-red-500/20'
                  : 'border-surface-edge text-white'
              }`}
            >
              <option value={0} className="bg-surface font-bold text-white">0</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n} className="bg-surface font-bold text-white">
                  {n}
                </option>
              ))}
            </select>

            {reservaPax > 0 ? (
              <select
                value={paymentMethod}
                onChange={(e) => onChangePaymentMethod && onChangePaymentMethod(e.target.value)}
                className="flex-1 min-w-0 bg-surface-soft border border-white/20 text-white rounded-xl px-2.5 py-2 text-xs font-black focus:outline-none cursor-pointer"
              >
                <option value="CASH" className="bg-surface font-bold text-white">💵 CASH</option>
                <option value="WISE CR" className="bg-surface font-bold text-cyan-300">🔵 WISE CR</option>
                <option value="WISE BT" className="bg-surface font-bold text-purple-300">🟣 WISE BT</option>
              </select>
            ) : (
              <span className="flex-1 text-center py-2 px-2 rounded-xl text-xs font-extrabold text-white bg-red-500/20 border border-red-500/40 shadow-sm">
                Sin fianza (0 THB)
              </span>
            )}
          </div>
        </div>

        {/* 4. Fila 3: Cursos / Actividades con Colores Oficiales del ERP */}
        {activities.map((item, index) => {
          const currentCourse = COURSES.find(c => c.code === item.activity) || COURSES[0];
          const badge = currentCourse.badge || {
            border: 'border-surface-edge focus:border-emerald-500',
            text: 'text-white',
            bgSoft: 'bg-surface-soft'
          };

          return (
            <div key={index} className="flex items-center gap-2 sm:gap-2.5">
              <label className="w-18 sm:w-22 shrink-0 text-sm sm:text-base font-black text-white text-left">
                {index === 0 ? 'Curso:' : 'Extra:'}
              </label>
              <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
                {/* Selector Curso con color oficial ERP */}
                <select
                  value={item.activity}
                  onChange={(e) => onUpdateActivity(index, 'activity', e.target.value)}
                  className={`flex-1 min-w-0 ${badge.bgSoft} border ${badge.border} ${badge.text} rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-sm sm:text-base font-black focus:outline-none cursor-pointer transition-all shadow-inner`}
                >
                  {COURSES.map(c => {
                    const label = isMobile
                      ? c.code
                      : `${c.code} - ${c.nameEs}`;
                    return (
                      <option key={c.code} value={c.code} className="bg-surface font-bold text-white">
                        {c.emoji} {label}
                      </option>
                    );
                  })}
                </select>

                {/* Selector Pax con borde armonizado */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <span className="text-xs sm:text-base font-bold text-gray-300">Nº:</span>
                  <select
                    value={item.num}
                    onChange={(e) => onUpdateActivity(index, 'num', Number(e.target.value))}
                    className={`w-12 sm:w-16 ${badge.bgSoft} border ${badge.border} ${badge.text} rounded-xl px-1 sm:px-2 py-2 sm:py-2.5 text-sm sm:text-base font-black text-center focus:outline-none cursor-pointer transition-all`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n} className="bg-surface font-bold text-white">
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón + o Eliminar */}
                {index === 0 ? (
                  <button
                    type="button"
                    onClick={onAddActivity}
                    disabled={activities.length >= 5}
                    className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-md shadow-emerald-600/30"
                    title="Añadir otra actividad"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemoveActivity(index)}
                    className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition-all cursor-pointer shrink-0"
                    title="Eliminar actividad"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 5. Fila 4: Checkbox Inglés + Toggle Vista Previa WhatsApp */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnglish}
              onChange={onToggleEnglish}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 bg-surface cursor-pointer"
            />
            <span className="text-sm sm:text-base font-black text-white">Inglés</span>
            <span className="text-[11px] sm:text-xs text-gray-400">(WhatsApp y Cal)</span>
          </label>

          {/* Toggle para ver mensaje WhatsApp */}
          {previewWaText && (
            <button
              type="button"
              onClick={() => setShowWaPreview(prev => !prev)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showWaPreview ? 'Ocultar WhatsApp' : 'Ver WhatsApp'}</span>
              {showWaPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Vista Previa WhatsApp: Ancho COMPLETO exacto al calendario */}
        {showWaPreview && previewWaText && (
          <div className="w-full bg-surface-soft/60 border border-surface-edge rounded-xl p-3.5 text-xs text-gray-200 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar animate-in fade-in duration-200 shadow-inner">
            {previewWaText}
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 6. Botón Principal: Procesar Evento (Ancho COMPLETO exacto al calendario) */}
        <button
          type="submit"
          disabled={isSubmitting || !customerName.trim()}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-[#258547] hover:bg-[#1e6f3b] disabled:opacity-40 text-white font-black text-base sm:text-xl rounded-2xl transition-all shadow-xl shadow-emerald-700/30 active:scale-[0.99] disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider mt-2 sm:mt-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              <span>Creando Evento en Google Calendar...</span>
            </>
          ) : (
            <span>PROCESAR EVENTO</span>
          )}
        </button>
      </div>
    </form>
  );
}
