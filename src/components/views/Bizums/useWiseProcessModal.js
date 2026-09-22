import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { cleanPhone } from './Bizums_Utils';
import { createCustomGoogleCalendarEvent } from './googleCalendarApi';

const ACTIVITY_TRANSLATIONS = {
  "OW 2": { en: "Open Water Course", es: "Open Water", code: "OW" },
  "OW": { en: "Open Water Course", es: "Open Water", code: "OW" },
  "AA": { en: "Advanced Course", es: "Curso Avanzado", code: "AA" },
  "DSD": { en: "Try Dive", es: "Bautizo de Buceo", code: "DSD" },
  "SR": { en: "Scuba Refresh", es: "Refresh", code: "SR" },
  "FD": { en: "Fun Dives", es: "Fun Dives", code: "FD" }
};

export default function useWiseProcessModal({ payment, isOpen, onClose, onProcessedSuccess }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [clientName, setClientName] = useState('');
  const [activity, setActivity] = useState('OW');
  const [phone, setPhone] = useState('');
  const [isEnglish, setIsEnglish] = useState(true);
  const [isMultipleActivities, setIsMultipleActivities] = useState(false);
  const [activityLines, setActivityLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);
  const [isRetained, setIsRetained] = useState(false);
  const [retainedPeople, setRetainedPeople] = useState(1);
  const [isSettled, setIsSettled] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [eventLink, setEventLink] = useState(null);
  const [calendarError, setCalendarError] = useState(null);
  const [completedList, setCompletedList] = useState([]);
  const [isDoneView, setIsDoneView] = useState(false);

  useEffect(() => {
    if (isOpen && payment) {
      if (payment.booking_date) {
        const [y, m, d] = payment.booking_date.split('-').map(Number);
        const bDate = new Date(y, m - 1, d);
        setSelectedDate(bDate);
        setCurrentMonth(bDate);
      } else {
        const now = new Date();
        setSelectedDate(now);
        setCurrentMonth(now);
      }

      setClientName(payment.sender_name || '');
      setIsEnglish(payment.is_english !== undefined && payment.is_english !== null ? !!payment.is_english : true);

      const numPax = payment.num_people || 1;
      const savedLines = Array.isArray(payment.activity_lines) && payment.activity_lines.length > 0 
        ? payment.activity_lines 
        : null;

      if (savedLines && (savedLines.length > 1 || (savedLines.length === 1 && numPax > 1 && savedLines[0].count < numPax))) {
        setIsMultipleActivities(true);
        setActivityLines(savedLines);
        setActivity(savedLines[0].code || 'OW');
      } else {
        setIsMultipleActivities(false);
        const initialActivity = (payment.activity && !payment.activity.includes(',')) 
          ? payment.activity.replace(/\s*x\d+.*$/i, '').trim() 
          : 'OW';
        setActivity(initialActivity || 'OW');
        const secondaryCode = initialActivity === 'OW' ? 'AA' : 'OW';
        if (numPax > 1) {
          setActivityLines([
            { count: numPax - 1, code: initialActivity || 'OW' },
            { count: 1, code: secondaryCode }
          ]);
        } else {
          setActivityLines([{ count: 1, code: initialActivity || 'OW' }]);
        }
      }

      setNotes(payment.notes || '');
      setIsProcessed(!!payment.is_processed);
      setIsRetained(!!payment.is_retained);
      setRetainedPeople(payment.retained_people || payment.num_people || 1);
      setIsSettled(!!payment.is_settled);
      setCompletedList([]);
      setEventLink(null);
      setCalendarError(null);
      setIsDoneView(false);

      if (payment.phone) {
        setPhone(payment.phone);
      } else {
        setPhone('');
        autoReadClipboard();
      }
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

  const handleAddLine = () => {
    const numPax = payment?.num_people || 1;
    const assigned = activityLines.reduce((sum, l) => sum + (parseInt(l.count) || 0), 0);
    const remaining = Math.max(1, numPax - assigned);
    const unusedCode = activity === 'AA' ? 'OW' : 'AA';
    setActivityLines(prev => [...prev, { count: remaining, code: unusedCode }]);
  };

  const handleRemoveLine = (index) => {
    if (activityLines.length <= 1) return;
    setActivityLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    const numPax = payment?.num_people || 1;
    setActivityLines(prev => {
      const updated = [...prev];
      if (field === 'count') {
        const otherAssigned = updated.reduce((sum, l, i) => i === index ? sum : sum + (parseInt(l.count) || 0), 0);
        const maxAllowed = Math.max(1, numPax - otherAssigned);
        const parsed = parseInt(value) || 1;
        const finalCount = Math.min(Math.max(1, parsed), maxAllowed);
        updated[index] = { ...updated[index], count: finalCount };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleToggleMultipleActivities = () => {
    const numPax = payment?.num_people || 1;
    setIsMultipleActivities(prev => {
      const next = !prev;
      if (next && (!activityLines || activityLines.length <= 1)) {
        const secondaryCode = activity === 'OW' ? 'AA' : 'OW';
        if (numPax > 1) {
          setActivityLines([
            { count: numPax - 1, code: activity },
            { count: 1, code: secondaryCode }
          ]);
        } else {
          setActivityLines([{ count: 1, code: activity }]);
        }
      }
      return next;
    });
  };

  const totalAssignedPax = isMultipleActivities
    ? activityLines.reduce((sum, l) => sum + (parseInt(l.count) || 0), 0)
    : (payment?.num_people || 1);

  const isPaxCountValid = !isMultipleActivities || totalAssignedPax === (payment?.num_people || 1);

  const hasOW2 = !isMultipleActivities 
    ? (activity === 'OW 2') 
    : activityLines.some(l => l.code === 'OW 2');

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
    activityLines.forEach(line => {
      const cnt = parseInt(line.count) || 0;
      if (cnt <= 0) return;
      const transName = getSingleActivityTranslation(line.code);
      counts[transName] = (counts[transName] || 0) + cnt;
    });

    const parts = Object.entries(counts).map(([actName, count]) => `${actName} x${count}`);
    if (parts.length === 0) return getSingleActivityTranslation(activity);
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
    activityLines.forEach(line => {
      const cnt = parseInt(line.count) || 0;
      if (cnt <= 0) return;
      const shortCode = ACTIVITY_TRANSLATIONS[line.code]?.code || line.code;
      counts[shortCode] = (counts[shortCode] || 0) + cnt;
    });

    return Object.entries(counts).map(([code, count]) => `${code}x${count}`).join(' ');
  };

  const getActivityAcronymText = () => {
    const numPax = payment?.num_people || 1;
    if (!isMultipleActivities || numPax === 1) {
      return numPax > 1 ? `${activity} x${numPax}` : activity;
    }

    const counts = {};
    activityLines.forEach(line => {
      const cnt = parseInt(line.count) || 0;
      if (cnt <= 0) return;
      counts[line.code] = (counts[line.code] || 0) + cnt;
    });

    return Object.entries(counts).map(([code, count]) => `${count}x ${code}`).join(', ');
  };

  const combinedActivitiesText = getCombinedActivitiesText();
  const acronymsText = getAcronymsText();
  const activityAcronymText = getActivityAcronymText();

  const extractGreetingName = (rawName) => {
    if (!rawName) return 'Cliente';
    // Si viene formato con paréntesis ej: "WeSpearhead LLC (Carlos)" o "Empresa (Carlos Sanz)"
    const parenMatch = rawName.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1].trim()) {
      return parenMatch[1].trim().split(' ')[0];
    }
    // Si viene con guión ej: "WeSpearhead LLC - Carlos"
    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ');
      if (parts[1] && parts[1].trim()) {
        return parts[1].trim().split(' ')[0];
      }
    }
    // Nombre normal
    return rawName.trim().split(' ')[0] || 'Cliente';
  };

  const finalCustomerName = (clientName || '').trim() || payment?.sender_name || 'Cliente';
  const firstName = extractGreetingName(finalCustomerName);

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
      const finalName = (clientName || '').trim() || payment.sender_name;
      const cleaned = cleanPhone(phone);
      const numPax = payment?.num_people || 1;
      const activityStr = isMultipleActivities 
        ? getActivityAcronymText() 
        : (numPax > 1 ? `${activity} x${numPax}` : activity);

      const updates = { 
        is_processed: true,
        sender_name: finalName,
        phone: cleaned || null,
        notes: notes.trim() || null,
        booking_date: formattedBookingDate,
        activity: activityStr,
        activity_lines: isMultipleActivities ? activityLines : null,
        is_english: isEnglish
      };

      const { error } = await supabase
        .from('wise_payments')
        .update(updates)
        .eq('id', payment.id);

      if (error) throw error;
      setIsProcessed(true);
      if (onProcessedSuccess) onProcessedSuccess();
      return true;
    } catch (err) {
      console.error('Error al actualizar estado procesado:', err);
      return false;
    }
  };

  const handleAllActions = async () => {
    if (!isPaxCountValid) {
      alert(`Debes asignar exactamente ${payment?.num_people || 1} Pax antes de continuar (actualmente hay ${totalAssignedPax}).`);
      return;
    }
    await markPaymentAsProcessed();

    const list = [];
    if (waLink) {
      window.open(waLink, '_blank');
      list.push({ text: 'WhatsApp abierto con mensaje de confirmación', type: 'success' });
    } else {
      list.push({ text: 'No se abrió WhatsApp: falta número de teléfono internacional válido (+ prefijo)', type: 'error' });
    }

    try {
      setLoadingCalendar(true);
      setCalendarError(null);

      const res = await createCustomGoogleCalendarEvent({
        customerName: finalCustomerName,
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
        list.push({ text: `Evento '${res.summary || finalCustomerName + ' ' + acronymsText}' creado en Google Calendar`, type: 'success' });
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al crear evento en el calendario');
      list.push({ text: `Error al crear evento en Google Calendar: ${err.message || 'Error al conectar con la API'}`, type: 'error' });
    } finally {
      setLoadingCalendar(false);
    }

    list.push({ text: 'Transferencia marcada como PROCESADA en Diving ERP', type: 'success' });
    setCompletedList(list);
    setIsDoneView(true);
  };

  const handleWhatsappOnly = async () => {
    if (!isPaxCountValid) {
      alert(`Debes asignar exactamente ${payment?.num_people || 1} Pax antes de continuar (actualmente hay ${totalAssignedPax}).`);
      return;
    }
    if (!waLink) {
      alert('Por favor introduce un número de teléfono válido con prefijo internacional para abrir WhatsApp.');
      return;
    }
    await markPaymentAsProcessed();
    window.open(waLink, '_blank');
    
    setCompletedList([
      { text: 'WhatsApp abierto con mensaje de confirmación', type: 'success' },
      { text: 'Transferencia marcada como PROCESADA en Diving ERP', type: 'success' }
    ]);
    setIsDoneView(true);
  };

  const handleCalendarOnly = async () => {
    if (!isPaxCountValid) {
      alert(`Debes asignar exactamente ${payment?.num_people || 1} Pax antes de continuar (actualmente hay ${totalAssignedPax}).`);
      return;
    }
    await markPaymentAsProcessed();
    const list = [];
    try {
      setLoadingCalendar(true);
      setCalendarError(null);

      const res = await createCustomGoogleCalendarEvent({
        customerName: finalCustomerName,
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
        list.push({ text: `Evento '${res.summary || finalCustomerName + ' ' + acronymsText}' creado en Google Calendar`, type: 'success' });
      }
    } catch (err) {
      console.error('Error creando evento en Google Calendar API:', err);
      setCalendarError(err.message || 'Error al conectar con la API de Google Calendar');
      list.push({ text: `Error al crear evento en Google Calendar: ${err.message || 'Error al conectar con la API'}`, type: 'error' });
    } finally {
      setLoadingCalendar(false);
    }

    list.push({ text: 'Transferencia marcada como PROCESADA en Diving ERP', type: 'success' });
    setCompletedList(list);
    setIsDoneView(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!isPaxCountValid) {
        alert(`Debes asignar exactamente ${payment?.num_people || 1} Pax antes de guardar (actualmente hay ${totalAssignedPax}).`);
        return;
      }
      setSavingEdit(true);
      const cleaned = cleanPhone(phone);
      const numPax = payment?.num_people || 1;
      const activityStr = isMultipleActivities 
        ? getActivityAcronymText() 
        : (numPax > 1 ? `${activity} x${numPax}` : activity);

      const updates = {
        sender_name: (clientName || '').trim() || payment.sender_name,
        phone: cleaned || null,
        is_processed: isProcessed,
        is_retained: isRetained,
        retained_people: isRetained ? Number(retainedPeople) : null,
        is_settled: isRetained ? isSettled : false,
        notes: notes.trim() || null,
        booking_date: formattedBookingDate,
        activity: activityStr,
        activity_lines: isMultipleActivities ? activityLines : null,
        is_english: isEnglish
      };
      const { error } = await supabase
        .from('wise_payments')
        .update(updates)
        .eq('id', payment.id);

      if (error) throw error;
      if (onProcessedSuccess) onProcessedSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error al guardar edición:', err);
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    clientName,
    setClientName,
    activity,
    setActivity,
    phone,
    setPhone,
    isEnglish,
    setIsEnglish,
    isMultipleActivities,
    setIsMultipleActivities,
    handleToggleMultipleActivities,
    activityLines,
    handleAddLine,
    handleRemoveLine,
    handleLineChange,
    totalAssignedPax,
    isPaxCountValid,
    handleManualPasteClipboard,
    generateWhatsappMessageText,
    combinedActivitiesText,
    activityAcronymText,
    loadingCalendar,
    eventLink,
    calendarError,
    completedList,
    isDoneView,
    handleAllActions,
    handleWhatsappOnly,
    handleCalendarOnly,
    notes,
    setNotes,
    isProcessed,
    setIsProcessed,
    isRetained,
    setIsRetained,
    retainedPeople,
    setRetainedPeople,
    isSettled,
    setIsSettled,
    savingEdit,
    handleSaveEdit
  };
}
