import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone } from './Bizums_Utils';
import { createCustomGoogleCalendarEvent } from './googleCalendarApi';

const ACTIVITY_TRANSLATIONS = {
  "OW 2": { en: "Open Water Course", es: "Open Water", code: "OW" },
  "OW": { en: "Open Water Course", es: "Open Water", code: "OW" },
  "AA": { en: "Advanced Adventurer Course", es: "Curso Avanzado", code: "AA" },
  "DSD": { en: "Discover Scuba Diving", es: "Bautizo de Buceo", code: "DSD" },
  "SR": { en: "Scuba Refresh", es: "Refresh", code: "SR" },
  "FD": { en: "Fun Dives", es: "Fun Dives", code: "FD" }
};

export default function useWiseProcessModal({ payment, isOpen, onClose, onProcessedSuccess }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [activity, setActivity] = useState('OW 2');
  const [phone, setPhone] = useState('');
  const [isEnglish, setIsEnglish] = useState(true);
  const [isMultipleActivities, setIsMultipleActivities] = useState(false);
  const [paxActivities, setPaxActivities] = useState([]);

  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [eventLink, setEventLink] = useState(null);
  const [calendarError, setCalendarError] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [isDoneView, setIsDoneView] = useState(false);

  useEffect(() => {
    if (isOpen && payment) {
      const now = new Date();
      setSelectedDate(now);
      setCurrentMonth(now);
      setActivity('OW 2');
      setIsEnglish(true);
      setIsMultipleActivities(false);
      setPaxActivities(Array.from({ length: payment.num_people || 1 }, () => 'OW 2'));
      setCompletedList([]);
      setEventLink(null);
      setCalendarError(null);
      setIsDoneView(false);

      autoReadClipboard();
    }
  }, [isOpen, payment]);

  const extractCleanPhone = (rawText) => {
    if (!rawText) return '';
    const match = rawText.match(/(?:\+\d{1,3}|\b\d{8,12})[\d\s-]{6,15}/);
    if (match) {
      const cleaned = match[0].replace(/[^\d+]/g, '');
      return cleanPhone(cleaned);
    }
    const onlyDigits = rawText.replace(/[^\d+]/g, '');
    return cleanPhone(onlyDigits);
  };

  const autoReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        const cleaned = extractCleanPhone(clipText);
        if (cleaned) setPhone(cleaned);
      }
    } catch (err) {
      console.log('Lectura de portapapeles no disponible sin interacción:', err);
    }
  };

  const handleManualPasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        const cleaned = extractCleanPhone(clipText);
        if (cleaned) {
          setPhone(cleaned);
        } else {
          alert('No se detectó un número de teléfono válido en el portapapeles.');
        }
      }
    } catch (err) {
      alert('Por favor autoriza el acceso al portapapeles o escribe el teléfono manualmente.');
    }
  };

  const formatLocalYMD = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedBookingDate = formatLocalYMD(selectedDate);

  const handlePaxActivityChange = (index, newAct) => {
    const updated = [...paxActivities];
    updated[index] = newAct;
    setPaxActivities(updated);
  };

  const hasOW2 = !isMultipleActivities 
    ? (activity === 'OW 2') 
    : paxActivities.includes('OW 2');

  const sufijoDiasTitulo = hasOW2 ? (isEnglish ? " - in 2 days" : " - en 2 días") : "";
  const sufijoDiasWa = hasOW2 ? (isEnglish ? " in 2 days" : " en 2 días") : "";

  const getSingleActivityTranslation = (code) => {
    const obj = ACTIVITY_TRANSLATIONS[code];
    if (!obj) return code;
    return isEnglish ? obj.en : obj.es;
  };

  const getCombinedActivitiesText = () => {
    const numPax = payment?.num_people || 1;
    if (!isMultipleActivities || numPax === 1) {
      const singleTrans = getSingleActivityTranslation(activity);
      return numPax > 1 ? `${singleTrans} x${numPax}` : singleTrans;
    }

    const counts = {};
    paxActivities.forEach(code => {
      const transName = getSingleActivityTranslation(code);
      counts[transName] = (counts[transName] || 0) + 1;
    });

    const parts = Object.entries(counts).map(([actName, count]) => `${actName} x${count}`);
    if (parts.length === 1) return parts[0];

    const lastPart = parts.pop();
    const joinWord = isEnglish ? ' and ' : ' y ';
    return parts.join(', ') + joinWord + lastPart;
  };

  const getAcronymsText = () => {
    const numPax = payment?.num_people || 1;
    if (!isMultipleActivities || numPax === 1) {
      const shortCode = ACTIVITY_TRANSLATIONS[activity]?.code || 'OW';
      return `${shortCode}x${numPax}`;
    }

    const counts = {};
    paxActivities.forEach(actCode => {
      const shortCode = ACTIVITY_TRANSLATIONS[actCode]?.code || 'OW';
      counts[shortCode] = (counts[shortCode] || 0) + 1;
    });

    return Object.entries(counts).map(([code, count]) => `${code}x${count}`).join(' ');
  };

  const combinedActivitiesText = getCombinedActivitiesText();
  const acronymsText = getAcronymsText();
  const firstName = payment?.sender_name ? payment.sender_name.trim().split(' ')[0] : 'Cliente';

  const formatSpanishDateText = (dateObj) => {
    const daysEs = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const monthsEs = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${daysEs[dateObj.getDay()]}, ${dateObj.getDate()} de ${monthsEs[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  };

  const formatEnglishDateText = (dateObj) => {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${daysEn[dateObj.getDay()]}, ${monthsEn[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  };

  const formattedDateString = isEnglish ? formatEnglishDateText(selectedDate) : formatSpanishDateText(selectedDate);

  const generateWhatsappMessageText = () => {
    const numPax = payment?.num_people || 1;
    if (isEnglish) {
      return `Hi ${firstName}, thank you for your booking for ${numPax} person(s) for ${combinedActivitiesText}${sufijoDiasWa} on ${formattedDateString}.\n\n` +
             `You can now complete the necessary registration at https://ihasiadivingkohtao.com/en/register/\n\n` +
             `There you will find the instructions on how to do it. Let us know if you have any questions. Best regards and see you soon.`;
    } else {
      return `Hola ${firstName}, gracias por tu reserva de ${numPax} persona(s) para ${combinedActivitiesText}${sufijoDiasWa} el ${formattedDateString}.\n\n` +
             `Ya puedes realizar los registros necesarios en https://ihasiadivingkohtao.com/registro\n\n` +
             `Ahí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.`;
    }
  };

  const generateWhatsappUrl = () => {
    const cleaned = cleanPhone(phone);
    if (!cleaned || !cleaned.startsWith('+')) return null;
    const msg = generateWhatsappMessageText();
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
  };

  const waLink = generateWhatsappUrl();

  const markPaymentAsProcessed = async () => {
    try {
      const { error } = await supabase
        .from('wise_payments')
        .update({ is_processed: true })
        .eq('id', payment.id);

      if (error) throw error;
      if (onProcessedSuccess) onProcessedSuccess();
    } catch (err) {
      console.error('Error al actualizar estado procesado:', err);
    }
  };

  const handleAllActions = async () => {
    await markPaymentAsProcessed();

    const list = [];
    if (waLink) {
      window.open(waLink, '_blank');
      list.push('WhatsApp abierto con mensaje de confirmación');
    } else {
      list.push('Nota: No se abrió WhatsApp por falta de teléfono internacional válido');
    }

    try {
      setLoadingCalendar(true);
      setCalendarError(null);

      const res = await createCustomGoogleCalendarEvent({
        customerName: payment.sender_name,
        activityCodes: acronymsText,
        activityFull: combinedActivitiesText,
        numPeople: payment.num_people,
        bookingDate: formattedBookingDate,
        phone: cleanPhone(phone),
        amountRaw: payment.amount_raw,
        currency: payment.currency,
        isEnglish: isEnglish,
        waMessage: generateWhatsappMessageText(),
        sufijoDias: sufijoDiasTitulo
      });

      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        list.push(`Evento '${res.summary || payment.sender_name + ' ' + acronymsText}' creado en Google Calendar`);
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al crear evento en el calendario');
    } finally {
      setLoadingCalendar(false);
    }

    list.push('Transferencia marcada como PROCESADA en Diving ERP');
    setCompletedList(list);
    setIsDoneView(true);
  };

  const handleWhatsappOnly = async () => {
    if (!waLink) {
      alert('Por favor introduce un número de teléfono válido con prefijo internacional para abrir WhatsApp.');
      return;
    }
    await markPaymentAsProcessed();
    window.open(waLink, '_blank');
    
    setCompletedList([
      'WhatsApp abierto con mensaje de confirmación',
      'Transferencia marcada como PROCESADA en Diving ERP'
    ]);
    setIsDoneView(true);
  };

  const handleCalendarOnly = async () => {
    await markPaymentAsProcessed();
    try {
      setLoadingCalendar(true);
      setCalendarError(null);

      const res = await createCustomGoogleCalendarEvent({
        customerName: payment.sender_name,
        activityCodes: acronymsText,
        activityFull: combinedActivitiesText,
        numPeople: payment.num_people,
        bookingDate: formattedBookingDate,
        phone: cleanPhone(phone),
        amountRaw: payment.amount_raw,
        currency: payment.currency,
        isEnglish: isEnglish,
        waMessage: generateWhatsappMessageText(),
        sufijoDias: sufijoDiasTitulo
      });

      if (res && res.htmlLink) {
        setEventLink(res.htmlLink);
        setCompletedList([
          `Evento '${res.summary || payment.sender_name + ' ' + acronymsText}' creado en Google Calendar`,
          'Transferencia marcada como PROCESADA en Diving ERP'
        ]);
        setIsDoneView(true);
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al conectar con la API de Google Calendar');
    } finally {
      setLoadingCalendar(false);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    activity,
    setActivity,
    phone,
    setPhone,
    isEnglish,
    setIsEnglish,
    isMultipleActivities,
    setIsMultipleActivities,
    paxActivities,
    handlePaxActivityChange,
    handleManualPasteClipboard,
    generateWhatsappMessageText,
    loadingCalendar,
    eventLink,
    calendarError,
    completedList,
    isDoneView,
    handleAllActions,
    handleWhatsappOnly,
    handleCalendarOnly
  };
}
