import { useState } from 'react';
import { X, MessageSquare, Calendar, CheckCircle2, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { generateWhatsappLink, formatSpanishDate } from './Bizums_Utils';
import { createGoogleCalendarEvent } from './googleCalendarApi';

export default function Bizums_ActionsModal({ data, isOpen, onClose }) {
  const [completedList, setCompletedList] = useState([]);
  const [isDoneView, setIsDoneView] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [eventLink, setEventLink] = useState(null);
  const [calendarError, setCalendarError] = useState(null);

  if (!isOpen || !data) return null;

  const waLink = generateWhatsappLink(
    data.whatsapp_phone || data.bizum_phone,
    data.customer_name,
    data.num_people,
    data.activity,
    data.booking_date
  );

  const formattedDate = formatSpanishDate(data.booking_date);
  const mainInfo = `${data.customer_name} - ${data.activity || 'Actividad'} x${data.num_people || 1}`;

  const handleWhatsappOnly = () => {
    if (waLink) {
      window.open(waLink, '_blank');
      handleClose();
    }
  };

  const handleCalendarOnly = async () => {
    try {
      setLoadingCalendar(true);
      setCalendarError(null);
      const res = await createGoogleCalendarEvent(data);
      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        setCompletedList([`Evento '${res.summary}' creado en Calendar`]);
        setIsDoneView(true);
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al conectar con la API de Google Calendar');
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleAllActions = async () => {
    const list = [];
    if (waLink) {
      window.open(waLink, '_blank');
      list.push('WhatsApp abierto para enviar mensaje de confirmación');
    }

    let success = false;
    try {
      setLoadingCalendar(true);
      setCalendarError(null);
      const res = await createGoogleCalendarEvent(data);
      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        list.push(`Evento '${res.summary}' creado en Calendar`);
        success = true;
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al crear el evento en el calendario (revisa la configuración API)');
    } finally {
      setLoadingCalendar(false);
    }

    if (success) {
      list.push('Reserva marcada como PAGADA en Diving ERP');
      setCompletedList(list);
      setIsDoneView(true);
    }
  };

  const handleClose = () => {
    setIsDoneView(false);
    setCompletedList([]);
    setEventLink(null);
    setCalendarError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">Reserva Pagada</h2>
              <p className="text-sm text-gray-400 font-medium mt-0.5">¿Qué acciones deseas realizar?</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Badge */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-surface-edge text-center">
            <span className="text-gray-400 block text-xs uppercase font-extrabold tracking-wider mb-1">Reserva Confirmada</span>
            <strong className="text-white text-base md:text-lg block font-black leading-snug">{mainInfo}</strong>
            <span className="text-gray-300 text-base md:text-lg block font-medium mt-1">({formattedDate})</span>
          </div>

          {calendarError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
              {calendarError}
            </div>
          )}

          {!isDoneView ? (
            <div className="space-y-4">
              {/* Botón Todo */}
              <button
                onClick={handleAllActions}
                disabled={loadingCalendar}
                className="w-full py-4 px-5 rounded-2xl bg-brand text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {loadingCalendar ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>WhatsApp y Calendario</span>
                  </>
                )}
              </button>

              {/* Botones Individuales */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                <button
                  onClick={handleWhatsappOnly}
                  disabled={!waLink || loadingCalendar}
                  className="w-full py-3 px-5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Solo Enviar WhatsApp</span>
                </button>

                <button
                  onClick={handleCalendarOnly}
                  disabled={loadingCalendar}
                  className="w-full py-3 px-5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {loadingCalendar ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creando en Google Calendar API...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      <span>Solo Crear Evento en Calendario (API)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Completado */
            <div className="space-y-5 text-left">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">Acciones Completadas:</h4>
              <ul className="space-y-3 text-sm text-gray-200">
                {completedList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>

              {eventLink && (
                <a
                  href={eventLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleClose}
                  className="w-full py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Ver el evento en Calendar</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
