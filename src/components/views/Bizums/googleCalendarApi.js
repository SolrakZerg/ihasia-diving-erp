import { supabase } from '../../../lib/supabaseClient';

/**
 * Llama a la función de base de datos cifrada RPC 'create_google_calendar_event' en Supabase.
 * La función lee los secretos cifrados guardados en el Vault de Supabase y conecta directamente con la API de Google Calendar.
 */
export async function createGoogleCalendarEvent(bizumRow) {
  if (!bizumRow || !bizumRow.id) {
    throw new Error('Identificador de reserva inválido para crear el evento');
  }

  const { data, error } = await supabase.rpc('create_google_calendar_event', {
    p_bizum_id: bizumRow.id,
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
