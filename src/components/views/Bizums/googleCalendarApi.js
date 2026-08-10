import { supabase } from '../../../lib/supabaseClient';

/**
 * Llama a la función de base de datos cifrada RPC 'create_google_calendar_event' en Supabase para Bizums.
 */
export async function createGoogleCalendarEvent(bizumRow, customTitle = null) {
  if (!bizumRow || !bizumRow.id) {
    throw new Error('Identificador de reserva inválido para crear el evento');
  }

  const { data, error } = await supabase.rpc('create_google_calendar_event', {
    p_bizum_id: bizumRow.id,
    p_custom_title: customTitle || null
  });

  if (error) {
    throw new Error(error.message || 'Error al ejecutar la creación del evento en Supabase');
  }

  return {
    success: true,
    htmlLink: data?.htmlLink,
    summary: data?.summary,
  };
}

/**
 * Llama a la función RPC 'create_custom_google_calendar_event' en Supabase para Wise u otros pagos.
 * Soporta la lógica exacta de Addtocalendar 5.1 (sufijo 'in 2 days' / 'en 2 días' únicamente cuando la actividad elegida es OW 2).
 */
export async function createCustomGoogleCalendarEvent({ 
  customerName, 
  activityCodes, 
  activityFull, 
  numPeople, 
  bookingDate, 
  phone, 
  amountRaw, 
  currency, 
  isEnglish, 
  waMessage,
  sufijoDias
}) {
  const { data, error } = await supabase.rpc('create_custom_google_calendar_event', {
    p_customer_name: customerName,
    p_activity_codes: activityCodes,
    p_activity_full: activityFull,
    p_num_people: numPeople || 1,
    p_booking_date: bookingDate,
    p_phone: phone || '',
    p_amount_raw: String(amountRaw || ''),
    p_currency: currency || 'thb',
    p_is_english: !!isEnglish,
    p_wa_message: waMessage || '',
    p_sufijo_dias: sufijoDias || ''
  });

  if (error) {
    throw new Error(error.message || 'Error al ejecutar la creación del evento en Supabase');
  }

  return {
    success: true,
    htmlLink: data?.htmlLink,
    summary: data?.summary,
  };
}
