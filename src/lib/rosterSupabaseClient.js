import { createClient } from '@supabase/supabase-js';

const ROSTER_SUPABASE_URL = "https://rjsfwbfgmxzcxugeaamp.supabase.co";
const ROSTER_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqc2Z3YmZnbXh6Y3h1Z2VhYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTgzNTksImV4cCI6MjA4MzkzNDM1OX0.GK0XgsA8_s_PUV_m6WiBN-LgRwBKh5LukhIUrdQF3YY";

const noOpLock = async (name, acquireTimeout, fn) => {
  return await fn();
};

export const rosterSupabase = createClient(ROSTER_SUPABASE_URL, ROSTER_SUPABASE_ANON_KEY, {
  auth: {
    lock: noOpLock,
    persistSession: true,
  }
});

export async function getRosterSession() {
  const { data: { session } } = await rosterSupabase.auth.getSession();
  return session;
}

export async function loginToRoster(email, password) {
  const { data, error } = await rosterSupabase.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });
  if (error) throw error;
  return data;
}

/**
 * Inserta uno o varios registros en la tabla roster_assignments usando autenticación del Roster
 * @param {Array<Object>} rows Array de filas para el Roster
 * @param {Object} [authCredentials] { email, password } si no hay sesión iniciada aún
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function sendAssignmentsToRoster(rows, authCredentials = null) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { data: null, error: new Error('No hay filas para enviar al Roster') };
  }

  // 1. Verificar si existe una sesión activa de Supabase del Roster
  let { data: { session } } = await rosterSupabase.auth.getSession();

  // 2. Si no hay sesión pero nos proporcionaron credenciales, hacer login
  if (!session && authCredentials?.email && authCredentials?.password) {
    const { data: loginData, error: loginError } = await rosterSupabase.auth.signInWithPassword({
      email: authCredentials.email.trim(),
      password: authCredentials.password
    });
    if (loginError) {
      return { data: null, error: new Error('Autenticación Roster fallida: ' + loginError.message) };
    }
    session = loginData.session;
  }

  // 3. Si aún no hay sesión, indicar a la UI que requiere credenciales de usuario
  if (!session) {
    const authReqError = new Error('REQUIRES_ROSTER_AUTH');
    authReqError.code = 'REQUIRES_ROSTER_AUTH';
    return { data: null, error: authReqError };
  }

  // 4. Con la sesión autenticada, la petición llevará el Bearer JWT token del usuario y pasará el RLS
  const { data, error } = await rosterSupabase
    .from('roster_assignments')
    .insert(rows);

  return { data, error };
}
