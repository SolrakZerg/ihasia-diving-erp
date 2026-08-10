import { useState, useEffect } from 'react';
import { X, MessageSquare, Calendar, CheckCircle2, Sparkles, Loader2, ExternalLink, Users, BookOpen } from 'lucide-react';
import { 
  generateWhatsappLink, 
  generateWhatsappMessage, 
  formatSpanishDate, 
  getShortCodeFromActivityName, 
  getActivitySpanishName,
  BIZUM_ACTIVITY_OPTIONS 
} from './Bizums_Utils';
import { createGoogleCalendarEvent, createCustomGoogleCalendarEvent } from './googleCalendarApi';

export default function Bizums_ActionsModal({ data, isOpen, onClose }) {
  const [completedList, setCompletedList] = useState([]);
  const [isDoneView, setIsDoneView] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [eventLink, setEventLink] = useState(null);
  const [calendarError, setCalendarError] = useState(null);

  // Estados para desglose de actividades múltiples por Pax
  const [isMultipleActivities, setIsMultipleActivities] = useState(false);
  const [paxActivities, setPaxActivities] = useState([]);

  useEffect(() => {
    if (isOpen && data) {
      const defaultCode = getShortCodeFromActivityName(data.activity);
      const numPax = data.num_people || 1;
      setIsMultipleActivities(false);
      setPaxActivities(Array.from({ length: numPax }, () => defaultCode));
      setCompletedList([]);
      setEventLink(null);
      setCalendarError(null);
      setIsDoneView(false);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const numPax = data.num_people || 1;

  // 1. Manejador para cambiar la actividad individual de cada Pax
  const handlePaxActivityChange = (index, newCode) => {
    const updated = [...paxActivities];
    updated[index] = newCode;
    setPaxActivities(updated);
  };

  // 2. Formato de Acrónimos para el Título de Google Calendar (ej: "DSD x4" o "OWx1 SRx1 DSDx2")
  const getAcronymsText = () => {
    if (!isMultipleActivities || numPax === 1) {
      const defaultCode = getShortCodeFromActivityName(data.activity);
      return `${defaultCode} x${numPax}`;
    }

    const counts = {};
    paxActivities.forEach(code => {
      counts[code] = (counts[code] || 0) + 1;
    });

    return Object.entries(counts).map(([code, count]) => `${code}x${count}`).join(' ');
  };

  // 3. Formato para el mensaje amigable de WhatsApp
  const getCombinedActivitiesText = () => {
    if (!isMultipleActivities || numPax === 1) {
      const actName = data.activity || 'tu actividad de buceo';
      return numPax > 1 ? `${actName} x${numPax}` : actName;
    }

    const counts = {};
    paxActivities.forEach(code => {
      const name = getActivitySpanishName(code);
      counts[name] = (counts[name] || 0) + 1;
    });

    const parts = Object.entries(counts).map(([actName, count]) => 
      count > 1 ? `${count} ${actName}` : `1 ${actName}`
    );
    if (parts.length === 1) return parts[0];

    const lastPart = parts.pop();
    return parts.join(', ') + ' y ' + lastPart;
  };

  const acronymsText = getAcronymsText();
  const combinedActivitiesText = getCombinedActivitiesText();

  // Enlace directo de WhatsApp con mensaje desglosado
  const waLink = generateWhatsappLink(
    data.whatsapp_phone || data.bizum_phone,
    data.customer_name,
    data.num_people,
    combinedActivitiesText,
    data.booking_date
  );

  const formattedDate = formatSpanishDate(data.booking_date);
  const mainInfo = `${data.customer_name} - ${acronymsText}`;

  // Ejecución de la API de Google Calendar manteniendo la nomenclatura solicitada
  const executeCalendarCreation = async () => {
    if (!isMultipleActivities) {
      // Si es actividad simple, llamamos al procedimiento estándar de Bizum
      return await createGoogleCalendarEvent(data);
    } else {
      // Si hay desglose de actividades por persona, usamos la sobrecarga con acrónimos exactos
      return await createCustomGoogleCalendarEvent({
        customerName: data.customer_name,
        activity: acronymsText,
        numPeople: data.num_people,
        bookingDate: data.booking_date,
        phone: data.whatsapp_phone || data.bizum_phone || '',
        paymentMethod: 'BIZUM 25€/PAX'
      });
    }
  };

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
      const res = await executeCalendarCreation();
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
      const res = await executeCalendarCreation();
      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        list.push(`Evento '${res.summary}' creado en Calendar`);
        success = true;
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al crear el evento en el calendario');
    } finally {
      setLoadingCalendar(false);
    }

    if (success) {
      list.push('Reserva marcada como RECIBIDA en Diving ERP');
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
      <div className="relative w-full max-w-lg bg-surface border border-surface-edge rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-surface-edge bg-surface-soft/50 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">Reserva Recibida</h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">¿Qué acciones deseas realizar?</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-surface-soft hover:bg-surface-edge text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Info Badge */}
          <div className="p-4 rounded-2xl bg-surface-soft border border-surface-edge text-center space-y-1">
            <span className="text-gray-400 block text-xs uppercase font-extrabold tracking-wider">Reserva Confirmada</span>
            <strong className="text-white text-base sm:text-lg block font-black leading-snug">{mainInfo}</strong>
            <span className="text-gray-300 text-sm sm:text-base block font-medium">({formattedDate})</span>
          </div>

          {/* Selector de Actividades Múltiples por Pax */}
          {numPax > 1 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Desglose de Cursos / Actividades:
                </span>
                <button
                  type="button"
                  onClick={() => setIsMultipleActivities(!isMultipleActivities)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20 transition-all"
                >
                  <Users className="w-4 h-4" />
                  {isMultipleActivities ? 'Misma actividad para todos' : '¿Actividades distintas?'}
                </button>
              </div>

              {isMultipleActivities && (
                <div className="space-y-2.5 p-4 bg-surface-soft/60 border border-amber-500/30 rounded-2xl animate-in fade-in duration-200">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider block mb-2">
                    Selecciona la actividad individual por Pax ({numPax}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: numPax }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-300 shrink-0 w-12">Pax {idx + 1}:</span>
                        <select
                          value={paxActivities[idx] || 'OW'}
                          onChange={(e) => handlePaxActivityChange(idx, e.target.value)}
                          className="w-full bg-surface border border-surface-edge rounded-xl p-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand font-bold cursor-pointer"
                        >
                          {BIZUM_ACTIVITY_OPTIONS.map(opt => (
                            <option key={opt.code} value={opt.acronym}>
                              {opt.nameEs} ({opt.acronym})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista Previa del Mensaje de WhatsApp */}
          <div className="bg-surface-soft/40 border border-surface-edge/60 rounded-2xl p-3.5 text-xs sm:text-sm text-gray-300 space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand block">Mensaje de WhatsApp:</span>
            <p className="italic text-gray-200 leading-relaxed">
              "{generateWhatsappMessage(data.customer_name, numPax, combinedActivitiesText, data.booking_date)}"
            </p>
          </div>

          {calendarError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
              {calendarError}
            </div>
          )}

          {!isDoneView ? (
            <div className="space-y-3.5 pt-1">
              {/* Botón Principal (Todo) */}
              <button
                onClick={handleAllActions}
                disabled={loadingCalendar}
                className="w-full py-4 px-5 rounded-2xl bg-brand text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleWhatsappOnly}
                  disabled={!waLink || loadingCalendar}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>Solo Enviar WhatsApp</span>
                </button>

                <button
                  onClick={handleCalendarOnly}
                  disabled={loadingCalendar}
                  className="w-full py-3.5 px-4 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loadingCalendar ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Creando en Calendar...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4.5 h-4.5" />
                      <span>Solo Crear en Calendario</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Completado */
            <div className="space-y-5 text-left pt-2">
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
