import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  parseClipboardText,
  buildWhatsAppMessage,
  buildActivitySummary,
  formatISODate,
  formatFechaEs,
  formatFechaEn
} from './cashReservationUtils';

export default function useCashReservationModal(onReservationCreated = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [activities, setActivities] = useState([{ activity: 'OW', num: 1 }]);
  const [reservaPax, setReservaPax] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isEnglish, setIsEnglish] = useState(false);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const resetForm = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    setCustomerName('');
    setPhone('');
    setActivities([{ activity: 'OW', num: 1 }]);
    setReservaPax(1);
    setPaymentMethod('CASH');
    setIsEnglish(false);
    setNotes('');
    setErrorMessage('');
    setSuccessResult(null);
  }, []);

  // Pegar y parsear del portapapeles
  const handlePasteClipboard = useCallback(async () => {
    try {
      if (!navigator?.clipboard?.readText) return;
      const text = await navigator.clipboard.readText();
      if (!text || typeof text !== 'string') return;

      const { name, phone: parsedPhone, detectedCourse } = parseClipboardText(text);

      if (name) setCustomerName(name);
      if (parsedPhone) setPhone(parsedPhone);
      if (detectedCourse) {
        setActivities([{ activity: detectedCourse, num: 1 }]);
      }
    } catch (err) {
      console.warn('Acceso al portapapeles en apertura:', err);
    }
  }, []);

  const openModal = useCallback(() => {
    resetForm();
    setIsOpen(true);
    // Auto-pegar automáticamente al abrir
    handlePasteClipboard();
    setTimeout(() => {
      handlePasteClipboard();
    }, 100);
  }, [resetForm, handlePasteClipboard]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    resetForm();
  }, [resetForm]);

  // Gestión de multi-actividades
  const handleAddActivity = () => {
    if (activities.length >= 5) return;
    setActivities(prev => [...prev, { activity: 'AA', num: 1 }]);
  };

  const handleRemoveActivity = (indexToRemove) => {
    setActivities(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateActivity = (index, field, value) => {
    setActivities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Mensaje en vivo de WhatsApp
  const waInfo = useMemo(() => {
    return buildWhatsAppMessage({
      customerName,
      activities,
      bookingDate: selectedDate,
      isEnglish,
      phone
    });
  }, [customerName, activities, selectedDate, isEnglish, phone]);

  // Envío del formulario
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('El nombre del cliente es obligatorio');
      return;
    }

    if (phone.trim()) {
      const digits = phone.replace(/[^0-9]/g, '');
      if (digits.length < 7) {
        setErrorMessage('El número de teléfono parece incompleto (mínimo 7 dígitos para WhatsApp)');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { codesStr, sufijoDias, totalPax } = waInfo;
      const bookingDateStr = formatISODate(selectedDate);

      // Llamada atómica a Supabase Vault RPC
      const { data, error } = await supabase.rpc('create_cash_calendar_event', {
        p_customer_name: customerName.trim(),
        p_activity_codes: codesStr,
        p_num_people: totalPax,
        p_booking_date: bookingDateStr,
        p_phone: phone.trim(),
        p_reserva_pax: Number(reservaPax) || 0,
        p_amount_thb: (Number(reservaPax) || 0) * 1000,
        p_is_english: !!isEnglish,
        p_wa_message: waInfo.text,
        p_sufijo_dias: sufijoDias || '',
        p_notes: notes.trim(),
        p_payment_method: paymentMethod || 'CASH'
      });

      if (error) {
        console.error('Error al crear reserva Cash en Supabase:', error);
        throw new Error(error.message || 'Error al conectar con Supabase/Google Calendar');
      }

      const result = {
        id: data?.id,
        customerName: customerName.trim(),
        activitySummary: codesStr,
        bookingDateStr: isEnglish ? formatFechaEn(selectedDate) : formatFechaEs(selectedDate),
        reservaPax,
        paymentMethod: paymentMethod || 'CASH',
        htmlLink: data?.htmlLink,
        waLink: waInfo.waLink
      };

      setSuccessResult(result);

      if (onReservationCreated) {
        onReservationCreated(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    openModal,
    closeModal,
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    customerName,
    setCustomerName,
    phone,
    setPhone,
    activities,
    handleAddActivity,
    handleRemoveActivity,
    handleUpdateActivity,
    reservaPax,
    setReservaPax,
    paymentMethod,
    setPaymentMethod,
    isEnglish,
    setIsEnglish: () => setIsEnglish(prev => !prev),
    notes,
    setNotes,
    handlePasteClipboard,
    previewWaText: waInfo.text,
    handleSubmit,
    isSubmitting,
    errorMessage,
    successResult,
    resetForm
  };
}
