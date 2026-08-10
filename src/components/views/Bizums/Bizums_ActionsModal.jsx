import { useState, useEffect } from 'react';
import { X, MessageSquare, Calendar, CheckCircle2, Sparkles, Loader2, ExternalLink, Users, BookOpen, Plus, Trash2 } from 'lucide-react';
import { 
  generateWhatsappLink, 
  generateWhatsappMessage, 
  formatSpanishDate, 
  getShortCodeFromActivityName, 
  getActivitySpanishName,
  BIZUM_ACTIVITY_OPTIONS 
} from './Bizums_Utils';
import { createGoogleCalendarEvent, createCustomGoogleCalendarEvent } from './googleCalendarApi';

const ACTIVITY_OPTIONS = BIZUM_ACTIVITY_OPTIONS || [
  { code: 'OW 2', acronym: 'OW', nameEs: 'Open Water', nameEn: 'Open Water Course' },
  { code: 'OW', acronym: 'OW', nameEs: 'Open Water', nameEn: 'Open Water Course' },
  { code: 'AA', acronym: 'AA', nameEs: 'Curso Avanzado', nameEn: 'Advanced Adventurer Course' },
  { code: 'DSD', acronym: 'DSD', nameEs: 'Bautizo de Buceo', nameEn: 'Discover Scuba Diving' },
  { code: 'SR', acronym: 'SR', nameEs: 'Refresh', nameEn: 'Scuba Refresh' },
  { code: 'FD', acronym: 'FD', nameEs: 'Fun Dives', nameEn: 'Fun Dives' },
  { code: 'Rescue', acronym: 'Rescue', nameEs: 'Rescue Diver', nameEn: 'Rescue Diver' }
];

export default function Bizums_ActionsModal({ data, isOpen, onClose }) {
  const [completedList, setCompletedList] = useState([]);
  const [isDoneView, setIsDoneView] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [eventLink, setEventLink] = useState(null);
  const [calendarError, setCalendarError] = useState(null);

  // Estados para desglose de actividades múltiples por cantidad (ej: 3x OW + 1x SR)
  const [isMultipleActivities, setIsMultipleActivities] = useState(false);
  const [activityLines, setActivityLines] = useState([]);

  useEffect(() => {
    if (isOpen && data) {
      const defaultCode = getShortCodeFromActivityName(data.activity);
      const numPax = data.num_people || 1;
      setIsMultipleActivities(false);
      
      // Por defecto al desglosar: Línea 1 con numPax - 1, Línea 2 con 1 pax
      if (numPax > 1) {
        const secondaryCode = defaultCode === 'OW' ? 'SR' : 'OW';
        setActivityLines([
          { count: numPax - 1, code: defaultCode },
          { count: 1, code: secondaryCode }
        ]);
      } else {
        setActivityLines([{ count: 1, code: defaultCode }]);
      }

      setCompletedList([]);
      setEventLink(null);
      setCalendarError(null);
      setIsDoneView(false);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const numPax = data.num_people || 1;

  // Manejadores para añadir/eliminar/editar líneas de actividad
  const handleAddLine = () => {
    const defaultCode = getShortCodeFromActivityName(data.activity);
    const unusedCode = defaultCode === 'DSD' ? 'OW' : 'DSD';
    setActivityLines(prev => [...prev, { count: 1, code: unusedCode }]);
  };

  const handleRemoveLine = (index) => {
    if (activityLines.length <= 1) return;
    setActivityLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    setActivityLines(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'count' ? Math.max(1, parseInt(value) || 1) : value
      };
      return updated;
    });
  };

  const totalAssignedPax = activityLines.reduce((sum, line) => sum + (parseInt(line.count) || 0), 0);

  // Formato de Acrónimos para el Título de Google Calendar (ej: "DSD x4" o "OWx3 SRx1")
  const getAcronymsText = () => {
    if (!isMultipleActivities || numPax === 1) {
      const defaultCode = getShortCodeFromActivityName(data.activity);
      return `${defaultCode} x${numPax}`;
    }

    return activityLines
      .filter(line => (line.count || 0) > 0)
      .map(line => {
        const acronym = getShortCodeFromActivityName(line.code);
        return `${acronym}x${line.count}`;
      })
      .join(' ');
  };

  // Formato para el mensaje amigable de WhatsApp (ej: "3 Open Water y 1 Refresh")
  const getCombinedActivitiesText = () => {
    if (!isMultipleActivities || numPax === 1) {
      const actName = data.activity || 'tu actividad de buceo';
      return numPax > 1 ? `${actName} x${numPax}` : actName;
    }

    const validLines = activityLines.filter(line => (line.count || 0) > 0);
    const parts = validLines.map(line => {
      const name = getActivitySpanishName(line.code);
      const cnt = line.count || 1;
      return cnt > 1 ? `${cnt} ${name}` : `1 ${name}`;
    });

    if (parts.length === 0) return data.activity || 'tu actividad de buceo';
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

  // Ejecución de la API de Google Calendar
  const executeCalendarCreation = async () => {
    if (!isMultipleActivities) {
      return await createGoogleCalendarEvent(data);
    } else {
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

          {/* Selector de Actividades Múltiples por Cantidad (Líneas una debajo de otra) */}
          {numPax > 1 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Desglose de Cursos / Actividades:
                </span>
                <button
                  type="button"
                  onClick={() => setIsMultipleActivities(!isMultipleActivities)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 transition-all"
                >
                  <Users className="w-4 h-4" />
                  {isMultipleActivities ? 'Misma actividad para todos' : '¿Actividades distintas?'}
                </button>
              </div>

              {isMultipleActivities && (
                <div className="space-y-3 p-4 bg-surface-soft/60 border border-amber-500/30 rounded-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-1 border-b border-surface-edge/40">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Asigna la cantidad por actividad:
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      totalAssignedPax === numPax 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {totalAssignedPax} de {numPax} Pax
                    </span>
                  </div>

                  {/* Lista de Líneas (Vertical, una debajo de otra) */}
                  <div className="space-y-2.5">
                    {activityLines.map((line, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-surface/80 p-2.5 rounded-xl border border-surface-edge">
                        {/* Input Cantidad */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-400">Pax:</span>
                          <input
                            type="number"
                            min="1"
                            max={numPax}
                            value={line.count}
                            onChange={(e) => handleLineChange(idx, 'count', e.target.value)}
                            className="w-16 bg-surface-soft border border-surface-edge rounded-lg px-2.5 py-1.5 text-center text-sm font-black text-white focus:outline-none focus:border-brand font-mono"
                          />
                        </div>

                        {/* Select Actividad */}
                        <select
                          value={line.code}
                          onChange={(e) => handleLineChange(idx, 'code', e.target.value)}
                          className="flex-1 bg-surface-soft border border-surface-edge rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-brand font-bold cursor-pointer"
                        >
                          {ACTIVITY_OPTIONS.map(opt => (
                            <option key={opt.code} value={opt.acronym}>
                              {opt.nameEs} ({opt.acronym})
                            </option>
                          ))}
                        </select>

                        {/* Botón Eliminar Línea */}
                        {activityLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botón Añadir Otra Actividad */}
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full py-2 px-3 bg-surface hover:bg-surface-soft border border-surface-edge text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Plus className="w-4 h-4 text-brand" />
                    <span>Añadir otra actividad</span>
                  </button>
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
