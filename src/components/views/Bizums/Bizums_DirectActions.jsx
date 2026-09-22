import { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink 
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { generateWhatsappLink } from './Bizums_Utils';
import { createGoogleCalendarEvent } from './googleCalendarApi';

export default function Bizums_DirectActions({ bizum, formData, onSaved, onPaidChange }) {
  const [loadingAction, setLoadingAction] = useState(null); // 'all' | 'wa' | 'cal' | null
  const [actionResults, setActionResults] = useState(null);
  const [eventLink, setEventLink] = useState(null);

  if (!bizum || !bizum.id) return null;

  const markAsPaidInDb = async () => {
    try {
      await supabase
        .from('bizums')
        .update({ is_paid: true })
        .eq('id', bizum.id);
      if (onPaidChange) onPaidChange(true);
      if (onSaved) onSaved();
    } catch (e) {
      console.error('Error al marcar pagado:', e);
    }
  };

  const getWaLink = () => {
    return generateWhatsappLink(
      formData.whatsapp_phone || formData.bizum_phone,
      formData.customer_name,
      formData.num_people,
      formData.activity,
      formData.booking_date
    );
  };

  const handleWhatsappOnly = async () => {
    const link = getWaLink();
    if (!link) {
      alert('Por favor introduce un teléfono de WhatsApp válido con prefijo internacional.');
      return;
    }
    setLoadingAction('wa');
    await markAsPaidInDb();
    window.open(link, '_blank');
    setLoadingAction(null);
    setActionResults([
      { text: 'WhatsApp abierto con mensaje de confirmación', type: 'success' },
      { text: 'Reserva marcada como RECIBIDA en Diving ERP', type: 'success' }
    ]);
  };

  const handleCalendarOnly = async () => {
    setLoadingAction('cal');
    setActionResults(null);
    setEventLink(null);
    await markAsPaidInDb();

    const list = [];
    try {
      const res = await createGoogleCalendarEvent({
        id: bizum.id,
        customer_name: formData.customer_name,
        booking_date: formData.booking_date,
        num_people: formData.num_people,
        activity: formData.activity,
        bizum_phone: formData.bizum_phone,
        whatsapp_phone: formData.whatsapp_phone,
        notes: formData.notes
      });
      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        list.push({ text: `Evento '${res.summary}' creado en Google Calendar`, type: 'success' });
      }
    } catch (err) {
      console.error('Error creando evento en Calendar:', err);
      list.push({ text: `Error al crear evento en Calendar: ${err.message || 'Error al conectar con la API'}`, type: 'error' });
    } finally {
      setLoadingAction(null);
    }

    list.push({ text: 'Reserva marcada como RECIBIDA en Diving ERP', type: 'success' });
    setActionResults(list);
  };

  const handleAllActions = async () => {
    setLoadingAction('all');
    setActionResults(null);
    setEventLink(null);
    await markAsPaidInDb();

    const list = [];
    const link = getWaLink();
    if (link) {
      window.open(link, '_blank');
      list.push({ text: 'WhatsApp abierto con mensaje de confirmación', type: 'success' });
    } else {
      list.push({ text: 'No se abrió WhatsApp: falta teléfono válido con prefijo internacional', type: 'error' });
    }

    try {
      const res = await createGoogleCalendarEvent({
        id: bizum.id,
        customer_name: formData.customer_name,
        booking_date: formData.booking_date,
        num_people: formData.num_people,
        activity: formData.activity,
        bizum_phone: formData.bizum_phone,
        whatsapp_phone: formData.whatsapp_phone,
        notes: formData.notes
      });
      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        list.push({ text: `Evento '${res.summary}' creado en Google Calendar`, type: 'success' });
      }
    } catch (err) {
      console.error('Error creando evento en Calendar:', err);
      list.push({ text: `Error al crear evento en Calendar: ${err.message || 'Error al conectar con la API'}`, type: 'error' });
    } finally {
      setLoadingAction(null);
    }

    list.push({ text: 'Reserva marcada como RECIBIDA en Diving ERP', type: 'success' });
    setActionResults(list);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-brand/10 via-surface to-cyan-500/10 border border-brand/30 space-y-3 shadow-md">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Acciones de Reserva (WhatsApp / Calendario):
        </label>
        <span className="text-[11px] font-bold text-gray-400">
          {formData.num_people || 1} Pax
        </span>
      </div>

      {/* Botón Principal y Secundarios */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleAllActions}
          disabled={loadingAction !== null}
          className="w-full py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-light text-white font-black text-xs uppercase tracking-wider shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          {loadingAction === 'all' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ejecutando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>WhatsApp y Calendario</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleWhatsappOnly}
            disabled={loadingAction !== null}
            className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Solo WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCalendarOnly}
            disabled={loadingAction !== null}
            className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loadingAction === 'cal' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Solo Calendario</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback / Resultado de Acciones */}
      {actionResults && (
        <div className="p-2.5 rounded-xl bg-surface/90 border border-surface-edge space-y-1.5 animate-in fade-in duration-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            Resultado:
          </span>
          <ul className="space-y-1 text-xs font-medium">
            {actionResults.map((res, i) => (
              <li key={i} className="flex items-start gap-1.5">
                {res.type === 'error' ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <span className={res.type === 'error' ? 'text-rose-300 font-bold' : 'text-gray-200'}>
                  {res.text}
                </span>
              </li>
            ))}
          </ul>

          {eventLink && (
            <a
              href={eventLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline pt-0.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver evento en Google Calendar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
