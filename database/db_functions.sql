-- ################################################################################
-- DATABASE FUNCTIONS (Respaldo Literal Documentado Supabase Q3 2026)
-- Project: IHASIA ERP
-- Schemas: public (API cliente y utilidades) y logic (Motores financieros internos)
-- Extraído literalmente vía PostgreSQL pg_get_functiondef()
-- ################################################################################

-- ================================================================================
-- SECTION 1: PUBLIC API FUNCTIONS (Accesibles desde cliente PostgREST)
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Función: public.search_customers_v3(query_text text)
-- Propósito: Búsqueda avanzada de clientes tokenizada e insensible a tildes (unaccent).
--            Descompone la consulta por palabras clave y busca coincidencias en nombre,
--            apellidos, correo electrónico y número de pasaporte.
-- Parámetros: query_text (text) - Texto introducido en la barra de búsqueda.
-- Retorna: TABLE con los 19 campos completos del perfil del cliente.
-- ERP Módulo: Buscador global de clientes, modales de asignación y facturación.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_customers_v3(query_text text)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, gender text, passport_number text, birth_date date, emergency_contact text, address text, lead_source text, certification_level text, total_dives text, last_dive_date text, form_origin text, booked_activity text, booking_date date, insurance_expiry date, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  tokens text[];
BEGIN
  tokens := regexp_split_to_array(trim(query_text), '\s+');
  
  RETURN QUERY
  SELECT 
    c.id, 
    c.first_name, 
    c.last_name, 
    c.email, 
    c.phone,
    c.gender,
    c.passport_number,
    c.birth_date,
    c.emergency_contact,
    c.address,
    c.lead_source,
    c.certification_level,
    c.total_dives,
    c.last_dive_date,
    c.form_origin,
    c.booked_activity,
    c.booking_date,
    c.insurance_expiry,
    c.created_at
  FROM customers c
  WHERE (
    SELECT bool_and(
      extensions.unaccent(COALESCE(c.first_name, '')) ILIKE extensions.unaccent('%' || t || '%') OR 
      extensions.unaccent(COALESCE(c.last_name, '')) ILIKE extensions.unaccent('%' || t || '%') OR 
      extensions.unaccent(COALESCE(c.email, '')) ILIKE extensions.unaccent('%' || t || '%') OR
      extensions.unaccent(COALESCE(c.passport_number, '')) ILIKE extensions.unaccent('%' || t || '%')
    ) FROM unnest(tokens) t
  )
  ORDER BY c.booking_date DESC NULLS LAST, c.created_at DESC
  LIMIT 15;
END;
$function$;

COMMENT ON FUNCTION public.search_customers_v3(text) IS 'Buscador avanzado de clientes tokenizado e insensible a tildes (unaccent).';


-- --------------------------------------------------------------------------------
-- Función: public.get_duplicate_customers()
-- Propósito: Identifica registros de clientes duplicados comparando nombre, apellido y email
--            con coincidencia exacta (normalizados sin espacios y minúsculas).
-- Parámetros: Ninguno.
-- Retorna: SETOF customers (Lista de registros de clientes duplicados).
-- ERP Módulo: Herramientas de limpieza de base de datos y depuración de clientes.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_duplicate_customers()
 RETURNS SETOF customers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT c.* FROM customers c
    WHERE EXISTS (
        SELECT 1 FROM customers c2 WHERE c2.id <> c.id
          AND LOWER(TRIM(c2.email)) = LOWER(TRIM(c.email))
          AND LOWER(TRIM(c2.first_name)) = LOWER(TRIM(c.first_name))
          AND LOWER(TRIM(c2.last_name)) = LOWER(TRIM(c.last_name))
    ) ORDER BY c.email, c.created_at;
END;
$function$;

COMMENT ON FUNCTION public.get_duplicate_customers() IS 'Identifica clientes duplicados comparando nombre, apellido y email.';


-- --------------------------------------------------------------------------------
-- Función: public.sync_monthly_activity_logs(p_year integer, p_month integer, p_data jsonb)
-- Propósito: Sincronización atómica de actividades mensuales. Resetea los conteos del mes,
--            inserta/actualiza los valores del JSONB mediante UPSERT y limpia ceros.
-- Parámetros: p_year (integer), p_month (integer), p_data (jsonb) - Array de objetos {activity_id, count}.
-- Retorna: void
-- ERP Módulo: Widget de estadísticas de actividades mensuales y métricas de producción.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_monthly_activity_logs(p_year integer, p_month integer, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Poner a 0 todas las cantidades de ese mes (para limpiar actividades que se hayan quedado sin reservas)
    UPDATE public.monthly_activity_logs
    SET count = 0, updated_at = NOW()
    WHERE year = p_year AND month = p_month;

    -- 2. Insertar o actualizar con los datos reales usando ON CONFLICT
    IF p_data IS NOT NULL AND jsonb_array_length(p_data) > 0 THEN
        INSERT INTO public.monthly_activity_logs (year, month, activity_id, count, updated_at)
        SELECT 
            p_year, 
            p_month, 
            (item->>'activity_id')::UUID, 
            (item->>'count')::INT, 
            NOW()
        FROM jsonb_array_elements(p_data) AS item
        WHERE (item->>'count')::INT > 0
        ON CONFLICT (year, month, activity_id) 
        DO UPDATE SET 
            count = EXCLUDED.count, 
            updated_at = NOW();
    END IF;

    -- 3. Borrar las filas que hayan quedado a 0 para mantener la tabla limpia
    DELETE FROM public.monthly_activity_logs 
    WHERE year = p_year AND month = p_month AND count = 0;
END;
$function$;

COMMENT ON FUNCTION public.sync_monthly_activity_logs(integer, integer, jsonb) IS 'Sincronización atómica de actividades mensuales para métricas ERP.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_clean_phone(p_phone text)
-- Propósito: Función de utilidad inmutable para purgar y conservar únicamente los dígitos
--            numéricos de un número telefónico.
-- Parámetros: p_phone (text)
-- Retorna: text (Cadena numérica pura)
-- ERP Módulo: Algoritmos de coincidencia de depósitos Wise / Bizum y normalización de contactos.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_clean_phone(p_phone text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
END;
$function$;

COMMENT ON FUNCTION public.fn_clean_phone(text) IS 'Extrae únicamente los dígitos numéricos de un número telefónico.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_normalize_name(p_name text)
-- Propósito: Normaliza nombres para comparación eliminando tildes, símbolos especiales
--            y convirtiendo todo el texto a minúsculas.
-- Parámetros: p_name (text)
-- Retorna: text (Nombre limpio para comparaciones difusas)
-- ERP Módulo: Coincidencia inteligente de transferencias de reservas Bizum/Wise.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_normalize_name(p_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN lower(extensions.unaccent(regexp_replace(COALESCE(p_name, ''), '[^a-zA-Z0-9\s]', '', 'g')));
END;
$function$;

COMMENT ON FUNCTION public.fn_normalize_name(text) IS 'Normaliza nombres eliminando tildes y símbolos para búsqueda difusa.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_match_bizum_deposit(p_customer_id uuid)
-- Propósito: Encuentra el depósito Bizum correspondiente a un cliente evaluando una ventana
--            de ±3 días de la fecha de reserva, coincidencia telefónica o similitud de nombre (> 0.5).
-- Parámetros: p_customer_id (uuid)
-- Retorna: TABLE(bizum_id uuid, deposit_eur numeric, customer_name text)
-- ERP Módulo: Facturación automática y conciliación de depósitos en euros.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_match_bizum_deposit(p_customer_id uuid)
 RETURNS TABLE(bizum_id uuid, deposit_eur numeric, customer_name text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cust_first text;
  v_cust_last text;
  v_cust_phone text;
  v_cust_date date;
  v_normalized_full text;
  v_clean_phone text;
BEGIN
  SELECT first_name, last_name, phone, booking_date
  INTO v_cust_first, v_cust_last, v_cust_phone, v_cust_date
  FROM public.customers
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_normalized_full := public.fn_normalize_name(v_cust_first || ' ' || COALESCE(v_cust_last, ''));
  v_clean_phone := public.fn_clean_phone(v_cust_phone);

  IF v_cust_date IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    b.id, 
    (COALESCE(b.returned_people, b.num_people) * 25.0)::numeric, -- Considerar pax devuelto parcial
    b.customer_name
  FROM public.bizums b
  WHERE b.is_paid = true 
    AND b.is_returned = false
    AND b.is_retained = false -- Excluir retenidos
    AND b.booking_date >= v_cust_date - 3 -- Ventana de 3 días antes
    AND b.booking_date <= v_cust_date + 3 -- Ventana de 3 días después
    AND (
      -- Coincidencia de teléfono
      (v_clean_phone <> '' AND (
        public.fn_clean_phone(b.bizum_phone) = v_clean_phone
        OR public.fn_clean_phone(b.whatsapp_phone) = v_clean_phone
      ))
      OR
      -- Coincidencia difusa de nombre completo (similitud > 0.5)
      (
        v_normalized_full <> '' AND (
          extensions.similarity(v_normalized_full, public.fn_normalize_name(b.customer_name)) > 0.5
        )
      )
    )
  ORDER BY 
    (v_clean_phone <> '' AND (public.fn_clean_phone(b.bizum_phone) = v_clean_phone OR public.fn_clean_phone(b.whatsapp_phone) = v_clean_phone)) DESC,
    abs(b.booking_date - v_cust_date) ASC, -- Priorizar la fecha más cercana (menor diferencia de días)
    extensions.similarity(v_normalized_full, public.fn_normalize_name(b.customer_name)) DESC,
    b.created_at DESC
  LIMIT 1;
END;
$function$;

COMMENT ON FUNCTION public.fn_match_bizum_deposit(uuid) IS 'Asocia un depósito Bizum a un cliente comparando fechas, teléfono o similitud de nombre.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_match_google_calendar_deposit(p_first_name text, p_last_name text, p_booking_date date)
-- Sobrecarga: 3 parámetros (Búsqueda por nombre y fecha)
-- Propósito: Conecta con la API de Google Calendar usando secretos de Vault para buscar la
--            reserva del cliente en el calendario "IHASIA Llegadas New" e importar su depósito.
-- Parámetros: p_first_name (text), p_last_name (text), p_booking_date (date)
-- Retorna: jsonb con {success, matched, deposit_thb, num_people, payment_method}
-- ERP Módulo: Importación automática de depósitos desde Google Calendar hacia facturación.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_match_google_calendar_deposit(p_first_name text, p_last_name text, p_booking_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_calendar_list_res http_response;
  v_calendar_list_json jsonb;
  v_item jsonb;
  v_calendar_id text := 'primary'; -- default fallback
  
  v_start_str text;
  v_end_str text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_event jsonb;
  v_summary text;
  v_description text;
  
  -- Regex extraction variables
  v_matches text[];
  v_pax int;
  v_amount numeric;
  v_method text;
  
  v_search_query text;
BEGIN
  -- 1. Obtener los 3 secretos desencrypted desde Supabase Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se encontraron las credenciales de Google OAuth en Vault');
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error al obtener Access Token de Google (status ' || v_token_res.status::text || '): ' || v_token_res.content);
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo obtener access_token de la respuesta de Google');
  END IF;

  -- 3. Buscar el Calendar ID para "IHASIA Llegadas New"
  BEGIN
    v_calendar_list_res := http((
      'GET',
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      ARRAY[http_header('Authorization', 'Bearer ' || v_access_token)],
      NULL,
      NULL
    )::http_request);

    IF v_calendar_list_res.status = 200 THEN
      v_calendar_list_json := v_calendar_list_res.content::jsonb;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_calendar_list_json->'items') LOOP
        IF v_item->>'summary' = 'IHASIA Llegadas New' THEN
          v_calendar_id := v_item->>'id';
          EXIT;
        END IF;
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Si falla al listar, usamos 'primary' por defecto
    v_calendar_id := 'primary';
  END;

  -- 4. Definir rango de búsqueda (la fecha del evento)
  v_start_str := to_char(p_booking_date, 'YYYY-MM-DD') || 'T00:00:00Z';
  v_end_str := to_char(p_booking_date, 'YYYY-MM-DD') || 'T23:59:59Z';
  
  -- Buscar usando el primer nombre del cliente como consulta
  v_search_query := trim(p_first_name);

  IF length(v_search_query) = 0 THEN
    RETURN jsonb_build_object('success', true, 'matched', false, 'reason', 'Primer nombre vacío');
  END IF;

  v_cal_res := http((
    'GET',
    'https://www.googleapis.com/calendar/v3/calendars/' || urlencode(v_calendar_id) || '/events?' ||
      'timeMin=' || urlencode(v_start_str) || '&timeMax=' || urlencode(v_end_str) || '&q=' || urlencode(v_search_query),
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token)
    ],
    NULL,
    NULL
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error consultando eventos en Google Calendar (status ' || v_cal_res.status::text || '): ' || v_cal_res.content);
  END IF;

  v_cal_json := v_cal_res.content::jsonb;

  -- 5. Analizar los eventos encontrados
  FOR v_event IN SELECT * FROM jsonb_array_elements(v_cal_json->'items') LOOP
    v_summary := v_event->>'summary';
    v_description := v_event->>'description';

    -- Comprobar si el summary coincide con el nombre (contiene el primer nombre)
    IF v_summary ILIKE '%' || v_search_query || '%' THEN
      -- Limpiar formato HTML y decodificar entidades comunes
      v_description := regexp_replace(COALESCE(v_description, ''), '<[^>]*>', '', 'g');
      v_description := replace(v_description, '&gt;', '>');
      v_description := replace(v_description, '&lt;', '<');
      v_description := replace(v_description, '&nbsp;', ' ');

      -- Buscar el patrón en la descripción:
      -- Ej: "Reserva: 2 personas -> 2000 thb a WISE BT"
      v_matches := regexp_matches(
        v_description, 
        'Reserva:\s*(\d+)\s*personas?\s*->\s*(\d+)\s*(?:thb)?\s*a\s*([A-Za-z0-9\s]+)', 
        'i'
      );
      
      IF v_matches IS NOT NULL AND array_length(v_matches, 1) >= 3 THEN
        v_pax := v_matches[1]::int;
        v_amount := v_matches[2]::numeric;
        v_method := trim(v_matches[3]);

        RETURN jsonb_build_object(
          'success', true,
          'matched', true,
          'event_summary', v_summary,
          'num_people', v_pax,
          'deposit_thb', v_amount,
          'payment_method', v_method
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'matched', false);
END;
$function$;

COMMENT ON FUNCTION public.fn_match_google_calendar_deposit(text, text, date) IS 'Busca depósitos de reservas en Google Calendar por nombre y fecha.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_match_google_calendar_deposit(p_first_name text, p_last_name text, p_phone text, p_booking_date date)
-- Sobrecarga: 4 parámetros (Prioridad por teléfono y prevención de falsos positivos)
-- Propósito: Consulta Google Calendar evaluando primero el número telefónico WhatsApp y como
--            fallback el nombre, evitando asignar depósitos pertenecientes a otros clientes.
-- Parámetros: p_first_name (text), p_last_name (text), p_phone (text), p_booking_date (date)
-- Retorna: jsonb con los datos formateados de la reserva encontrada.
-- ERP Módulo: Auto-importación inteligente de depósitos Wise a partidas de facturas.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_match_google_calendar_deposit(p_first_name text, p_last_name text, p_phone text, p_booking_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp', 'extensions'
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_calendar_list_res http_response;
  v_calendar_list_json jsonb;
  v_item jsonb;
  v_calendar_id text := 'primary';
  
  v_start_str text;
  v_end_str text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_event jsonb;
  v_summary text;
  v_description text;
  
  -- Regex extraction variables
  v_matches text[];
  v_pax int;
  v_amount numeric;
  v_method text;
  
  v_clean_phone text;
  v_search_query text;
  
  v_matched_by_phone boolean;
  v_event_phone text;
  v_other_cust_exists boolean;
BEGIN
  -- 1. Obtener los 3 secretos desencrypted desde Supabase Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se encontraron las credenciales de Google OAuth en Vault');
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error al obtener Access Token de Google (status ' || v_token_res.status::text || '): ' || v_token_res.content);
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo obtener access_token de la respuesta de Google');
  END IF;

  -- 3. Buscar el Calendar ID para "IHASIA llegadas New"
  BEGIN
    v_calendar_list_res := http((
      'GET',
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      ARRAY[http_header('Authorization', 'Bearer ' || v_access_token)],
      NULL,
      NULL
    )::http_request);

    IF v_calendar_list_res.status = 200 THEN
      v_calendar_list_json := v_calendar_list_res.content::jsonb;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_calendar_list_json->'items') LOOP
        IF lower(v_item->>'summary') = 'ihasia llegadas new' THEN
          v_calendar_id := v_item->>'id';
          EXIT;
        END IF;
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_calendar_id := 'primary';
  END;

  -- 4. Rango de búsqueda ±1 día para compensar desfases de zonas horarias en eventos de todo el día
  v_start_str := to_char(p_booking_date - 1, 'YYYY-MM-DD') || 'T00:00:00Z';
  v_end_str := to_char(p_booking_date + 1, 'YYYY-MM-DD') || 'T23:59:59Z';
  
  v_clean_phone := public.fn_clean_phone(p_phone);
  v_search_query := trim(p_first_name);

  -- Realizar la consulta a Google Calendar para el rango de 3 días
  v_cal_res := http((
    'GET',
    'https://www.googleapis.com/calendar/v3/calendars/' || urlencode(v_calendar_id) || '/events?' ||
      'timeMin=' || urlencode(v_start_str) || '&timeMax=' || urlencode(v_end_str),
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token)
    ],
    NULL,
    NULL
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Error consultando eventos en Google Calendar (status ' || v_cal_res.status::text || '): ' || v_cal_res.content);
  END IF;

  v_cal_json := v_cal_res.content::jsonb;

  -- 5. Analizar los eventos encontrados
  FOR v_event IN SELECT * FROM jsonb_array_elements(v_cal_json->'items') LOOP
    -- Filtrar que la fecha sea la correcta
    IF COALESCE(v_event->'start'->>'date', v_event->'start'->>'dateTime') LIKE to_char(p_booking_date, 'YYYY-MM-DD') || '%' THEN
      v_summary := v_event->>'summary';
      v_description := v_event->>'description';

      -- Limpiar formato HTML
      v_description := regexp_replace(COALESCE(v_description, ''), '<[^>]*>', '', 'g');
      v_description := replace(v_description, '&gt;', '>');
      v_description := replace(v_description, '&lt;', '<');
      v_description := replace(v_description, '&nbsp;', ' ');

      -- Comprobar coincidencia: por teléfono (prioritario) o por nombre (fallback)
      IF (v_clean_phone <> '' AND (v_description LIKE '%' || v_clean_phone || '%' OR v_summary LIKE '%' || v_clean_phone || '%')) THEN
        v_matched_by_phone := true;
      ELSIF (v_search_query <> '' AND v_summary ILIKE '%' || v_search_query || '%') THEN
        v_matched_by_phone := false;
      ELSE
        CONTINUE;
      END IF;

      -- OPTIMIZACIÓN DE PROPIEDAD: Si coincide por nombre pero NO por teléfono,
      -- comprobamos si el evento contiene el teléfono de otro cliente registrado hoy.
      -- Si es así, no lo asignamos a este cliente, dejamos que se asigne al cliente dueño del teléfono.
      IF NOT v_matched_by_phone THEN
        v_event_phone := substring(v_description from 'wa\.me/(\d+)');
        IF v_event_phone IS NOT NULL AND v_event_phone <> v_clean_phone THEN
          SELECT EXISTS (
            SELECT 1 FROM public.customers 
            WHERE booking_date = p_booking_date 
              AND public.fn_clean_phone(phone) = v_event_phone
          ) INTO v_other_cust_exists;
          
          IF v_other_cust_exists THEN
            -- Pertenece al otro cliente propietario del teléfono, saltar coincidencia
            CONTINUE;
          END IF;
        END IF;
      END IF;

      -- Buscar el patrón de la reserva
      v_matches := regexp_matches(
        v_description, 
        'Reserva:\s*(\d+)\s*personas?\s*->\s*(\d+)\s*(?:thb)?\s*a\s*([A-Za-z0-9\s]+)', 
        'i'
      );
      
      IF v_matches IS NOT NULL AND array_length(v_matches, 1) >= 3 THEN
        v_pax := v_matches[1]::int;
        v_amount := v_matches[2]::numeric;
        v_method := trim(v_matches[3]);

        RETURN jsonb_build_object(
          'success', true,
          'matched', true,
          'event_summary', v_summary,
          'num_people', v_pax,
          'deposit_thb', v_amount,
          'payment_method', v_method
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'matched', false);
END;
$function$;

COMMENT ON FUNCTION public.fn_match_google_calendar_deposit(text, text, text, date) IS 'Busca depósitos de reservas en Google Calendar priorizando teléfono sobre nombre.';


-- --------------------------------------------------------------------------------
-- Función: public.create_google_calendar_event(p_bizum_id uuid)
-- Propósito: Publica un evento de reserva en Google Calendar usando la API v3 a partir de un
--            registro de Bizum en la base de datos local. Genera además el enlace directo a WhatsApp.
-- Parámetros: p_bizum_id (uuid)
-- Retorna: jsonb {success, htmlLink, summary}
-- ERP Módulo: Módulo de Bizums (Botón de sincronización a Google Calendar).
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_google_calendar_event(p_bizum_id uuid, p_custom_title text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_bizum record;
  v_num_people int;
  v_short_code text;
  v_title text;
  v_phone text;
  v_formatted_date text;
  v_wa_date text;
  v_first_name text;
  v_wa_message text;
  v_total_eur numeric;
  v_wa_link text;
  v_desc_html text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_cal_req_body text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_html_link text;
  v_summary text;
  
  v_booking_date_str text;
BEGIN
  -- 1. Obtener los 3 secretos desencrypted desde Supabase Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las credenciales de Google OAuth en Vault';
  END IF;

  -- 2. Obtener datos de la reserva desde public.bizums
  SELECT * INTO v_bizum FROM public.bizums WHERE id = p_bizum_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva Bizum con ID % no encontrada', p_bizum_id;
  END IF;

  v_num_people := COALESCE(v_bizum.num_people, 1);
  IF v_num_people <= 0 THEN v_num_people := 1; END IF;

  -- Usar p_custom_title si fue proporcionado por el modal sin sobreescribir la BD
  IF p_custom_title IS NOT NULL AND length(trim(p_custom_title)) > 0 THEN
    v_title := COALESCE(v_bizum.customer_name, 'Cliente') || ' ' || p_custom_title;
  ELSIF COALESCE(v_bizum.activity, '') ~* '[a-z]+\s*x\s*\d+' 
     OR COALESCE(v_bizum.activity, '') ~* '\d+x[a-z]+' 
     OR COALESCE(v_bizum.activity, '') ~* 'en 2 d' THEN
    v_title := COALESCE(v_bizum.customer_name, 'Cliente') || ' ' || v_bizum.activity;
  ELSIF upper(COALESCE(v_bizum.activity, '')) LIKE '%BAUTIZO%' OR upper(COALESCE(v_bizum.activity, '')) LIKE '%DSD%' THEN
    v_short_code := 'DSD';
    v_title := COALESCE(v_bizum.customer_name, 'Cliente') || ' ' || v_short_code || ' x' || v_num_people::text;
  ELSIF upper(COALESCE(v_bizum.activity, '')) LIKE '%OPEN%' OR upper(COALESCE(v_bizum.activity, '')) LIKE '%OWE%' THEN
    v_short_code := 'OWE';
  ELSIF upper(COALESCE(v_bizum.activity, '')) LIKE '%AVANZADO%' OR upper(COALESCE(v_bizum.activity, '')) LIKE '%AA%' THEN
    v_short_code := 'AA';
  ELSIF upper(COALESCE(v_bizum.activity, '')) LIKE '%REFRESH%' OR upper(COALESCE(v_bizum.activity, '')) LIKE '%SR%' THEN
    v_short_code := 'SR';
  ELSIF upper(COALESCE(v_bizum.activity, '')) LIKE '%FUN%' OR upper(COALESCE(v_bizum.activity, '')) LIKE '%FD%' THEN
    v_short_code := 'FD';
  ELSE
    v_short_code := 'ACT';
  END IF;

  v_title := COALESCE(v_bizum.customer_name, 'Cliente') || ' ' || v_short_code || ' x' || v_num_people::text;
  v_phone := COALESCE(v_bizum.whatsapp_phone, v_bizum.bizum_phone, '');
  
  -- Formatear fecha a formato DD MES YY en español (ej: 24 JUL 26)
  v_formatted_date := to_char(COALESCE(v_bizum.booking_date, CURRENT_DATE), 'DD') || ' ' ||
                      CASE extract(month from COALESCE(v_bizum.booking_date, CURRENT_DATE))::int
                        WHEN 1 THEN 'ENE'
                        WHEN 2 THEN 'FEB'
                        WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR'
                        WHEN 5 THEN 'MAY'
                        WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL'
                        WHEN 8 THEN 'AGO'
                        WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT'
                        WHEN 11 THEN 'NOV'
                        WHEN 12 THEN 'DIC'
                        ELSE '---'
                      END || ' ' ||
                      to_char(COALESCE(v_bizum.booking_date, CURRENT_DATE), 'YY');

  -- Formatear fecha extendida para mensaje de WhatsApp (ej: viernes, 24 de julio de 2026)
  v_wa_date := CASE extract(isodow from COALESCE(v_bizum.booking_date, CURRENT_DATE))::int
                 WHEN 1 THEN 'lunes'
                 WHEN 2 THEN 'martes'
                 WHEN 3 THEN 'miércoles'
                 WHEN 4 THEN 'jueves'
                 WHEN 5 THEN 'viernes'
                 WHEN 6 THEN 'sábado'
                 WHEN 7 THEN 'domingo'
               END || ', ' ||
               extract(day from COALESCE(v_bizum.booking_date, CURRENT_DATE))::int::text || ' de ' ||
               CASE extract(month from COALESCE(v_bizum.booking_date, CURRENT_DATE))::int
                 WHEN 1 THEN 'enero'
                 WHEN 2 THEN 'febrero'
                 WHEN 3 THEN 'marzo'
                 WHEN 4 THEN 'abril'
                 WHEN 5 THEN 'mayo'
                 WHEN 6 THEN 'junio'
                 WHEN 7 THEN 'julio'
                 WHEN 8 THEN 'agosto'
                 WHEN 9 THEN 'septiembre'
                 WHEN 10 THEN 'octubre'
                 WHEN 11 THEN 'noviembre'
                 WHEN 12 THEN 'diciembre'
               END || ' de ' ||
               extract(year from COALESCE(v_bizum.booking_date, CURRENT_DATE))::int::text;

  v_first_name := COALESCE(NULLIF(split_part(trim(v_bizum.customer_name), ' ', 1), ''), 'Cliente');

  -- Construir el mensaje completo de WhatsApp
  v_wa_message := 'Hola ' || v_first_name || ', gracias por tu reserva de ' || v_num_people::text || ' persona(s) para ' || COALESCE(v_bizum.activity, 'tu actividad') || ' el ' || v_wa_date || '.' || chr(10) || chr(10) ||
                  'Ya puedes realizar los registros necesarios en https://ihasiadivingkohtao.com/registro' || chr(10) || chr(10) ||
                  'Ahí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.';

  v_total_eur := v_num_people * 25;
  v_booking_date_str := to_char(COALESCE(v_bizum.booking_date, CURRENT_DATE), 'YYYY-MM-DD');

  IF length(v_phone) > 0 THEN
    v_wa_link := 'https://wa.me/' || replace(v_phone, '+', '') || '?text=' || urlencode(v_wa_message);
    v_desc_html := 'https://wa.me/' || replace(v_phone, '+', '') || '<br><br><b><a href=\"' || v_wa_link || '\">📲 ENVIAR MENSAJE CONFIRMACIÓN</a></b><br><br><b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || v_total_eur::text || '€ a BIZUM</b></li></ul>';
  ELSE
    v_desc_html := '<b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || v_total_eur::text || '€ a BIZUM</b></li></ul>';
  END IF;

  -- 3. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RAISE EXCEPTION 'Error al obtener Access Token de Google (status %): %', v_token_res.status, v_token_res.content;
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RAISE EXCEPTION 'No se pudo obtener access_token de la respuesta de Google';
  END IF;

  -- 4. Crear Evento en Google Calendar API v3
  v_cal_req_body := jsonb_build_object(
    'summary', v_title,
    'description', v_desc_html,
    'start', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'end', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'colorId', '9',
    'reminders', jsonb_build_object('useDefault', false, 'overrides', '[]'::jsonb)
  )::text;

  v_cal_res := http((
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_cal_req_body
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RAISE EXCEPTION 'Error creando evento en Google Calendar (status %): %', v_cal_res.status, v_cal_res.content;
  END IF;

  v_cal_json := v_cal_res.content::jsonb;
  v_html_link := v_cal_json->>'htmlLink';
  v_summary := v_cal_json->>'summary';

  RETURN jsonb_build_object(
    'success', true,
    'htmlLink', v_html_link,
    'summary', v_summary
  );
END;
$function$;

COMMENT ON FUNCTION public.create_google_calendar_event(uuid) IS 'Crea un evento de reserva en Google Calendar a partir de una reserva Bizum.';


-- --------------------------------------------------------------------------------
-- Función: public.create_custom_google_calendar_event(p_customer_name text, p_activity text, p_num_people integer, p_booking_date date, p_phone text, p_payment_method text)
-- Sobrecarga: 6 parámetros (Creación genérica de reservas)
-- Propósito: Crea eventos personalizados en Google Calendar aceptando métodos de pago arbitrarios.
-- Parámetros: p_customer_name, p_activity, p_num_people, p_booking_date, p_phone, p_payment_method.
-- Retorna: jsonb {success, htmlLink, summary}
-- ERP Módulo: Formulario de adición manual de eventos al calendario.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_custom_google_calendar_event(p_customer_name text, p_activity text, p_num_people integer DEFAULT 1, p_booking_date date DEFAULT CURRENT_DATE, p_phone text DEFAULT ''::text, p_payment_method text DEFAULT 'WISE BT'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_num_people int;
  v_title text;
  v_formatted_date text;
  v_desc_html text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_cal_req_body text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_html_link text;
  v_summary text;
  v_booking_date_str text;
BEGIN
  -- 1. Obtener secretos Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las credenciales de Google OAuth en Vault';
  END IF;

  v_num_people := COALESCE(p_num_people, 1);
  IF v_num_people <= 0 THEN v_num_people := 1; END IF;

  v_title := COALESCE(p_customer_name, 'Cliente') || ' - ' || COALESCE(p_activity, 'Buceo');
  
  v_formatted_date := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'DD') || ' ' ||
                      CASE extract(month from COALESCE(p_booking_date, CURRENT_DATE))::int
                        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                        ELSE '---'
                      END || ' ' ||
                      to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YY');

  IF length(p_phone) > 0 THEN
    v_desc_html := 'https://wa.me/' || replace(p_phone, '+', '') || '<br><br><b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' persona(s) (' || p_payment_method || ')</b></li></ul>';
  ELSE
    v_desc_html := '<b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' persona(s) (' || p_payment_method || ')</b></li></ul>';
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RAISE EXCEPTION 'Error al obtener Access Token de Google (status %): %', v_token_res.status, v_token_res.content;
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RAISE EXCEPTION 'No se pudo obtener access_token de la respuesta de Google';
  END IF;

  v_booking_date_str := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YYYY-MM-DD');

  -- 3. Crear Evento en Google Calendar API v3
  v_cal_req_body := jsonb_build_object(
    'summary', v_title,
    'description', v_desc_html,
    'start', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'end', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'colorId', '9',
    'reminders', jsonb_build_object('useDefault', false, 'overrides', '[]'::jsonb)
  )::text;

  v_cal_res := http((
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_cal_req_body
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RAISE EXCEPTION 'Error creando evento en Google Calendar (status %): %', v_cal_res.status, v_cal_res.content;
  END IF;

  v_cal_json := v_cal_res.content::jsonb;
  v_html_link := v_cal_json->>'htmlLink';
  v_summary := v_cal_json->>'summary';

  RETURN jsonb_build_object(
    'success', true,
    'htmlLink', v_html_link,
    'summary', v_summary
  );
END;
$function$;

COMMENT ON FUNCTION public.create_custom_google_calendar_event(text, text, integer, date, text, text) IS 'Crea eventos personalizados en Google Calendar con método de pago arbitrario.';


-- --------------------------------------------------------------------------------
-- Función: public.create_custom_google_calendar_event(p_customer_name, p_activity_codes, p_activity_full, p_num_people, p_booking_date, p_phone, p_amount_raw, p_currency, p_is_english, p_wa_message)
-- Sobrecarga: 10 parámetros (Creación avanzada con cálculo de días y mensaje multi-idioma)
-- Propósito: Construye eventos en Google Calendar agregando etiquetas dinámicas de días
--            ("- in X days"), selección de idioma (ES/EN) y enlace dinámico a WhatsApp.
-- Retorna: jsonb {success, htmlLink, summary}
-- ERP Módulo: Módulo AddToCalendar / Generación avanzada de reservas.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_custom_google_calendar_event(p_customer_name text, p_activity_codes text, p_activity_full text, p_num_people integer DEFAULT 1, p_booking_date date DEFAULT CURRENT_DATE, p_phone text DEFAULT ''::text, p_amount_raw text DEFAULT ''::text, p_currency text DEFAULT 'THB'::text, p_is_english boolean DEFAULT true, p_wa_message text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_num_people int;
  v_title text;
  v_formatted_date text;
  v_desc_html text;
  v_wa_link text;
  v_btn_text text;
  v_currency_upper text;
  v_days_diff int;
  v_in_days_text text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_cal_req_body text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_html_link text;
  v_summary text;
  v_booking_date_str text;
  v_phone_clean text;
BEGIN
  -- 1. Obtener secretos Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las credenciales de Google OAuth en Vault';
  END IF;

  v_num_people := COALESCE(p_num_people, 1);
  IF v_num_people <= 0 THEN v_num_people := 1; END IF;

  -- Calcular días de diferencia para la etiqueta "- in X days"
  v_days_diff := (COALESCE(p_booking_date, CURRENT_DATE) - CURRENT_DATE)::int;
  IF v_days_diff = 0 THEN
    v_in_days_text := ' - hoy';
  ELSIF v_days_diff = 1 THEN
    v_in_days_text := ' - mañana';
  ELSIF v_days_diff > 1 THEN
    v_in_days_text := ' - in ' || v_days_diff::text || ' days';
  ELSE
    v_in_days_text := '';
  END IF;

  -- Título idéntico a Bizum / Addtocalendar 5.1 (ej: Vishrut Verma OWx2 - in 2 days - Inglés)
  v_title := COALESCE(p_customer_name, 'Cliente') || ' ' || COALESCE(p_activity_codes, 'ACT') || v_in_days_text;
  
  IF p_is_english THEN
    v_title := v_title || ' - Inglés';
    v_btn_text := '📲 SEND CONFIRMATION MESSAGE';
  ELSE
    v_title := v_title || ' - Español';
    v_btn_text := '📲 ENVIAR MENSAJE CONFIRMACIÓN';
  END IF;

  -- Formato de fecha para las viñetas (Siempre en español y formato DD MES YY como en Bizum)
  v_formatted_date := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'DD') || ' ' ||
                      CASE extract(month from COALESCE(p_booking_date, CURRENT_DATE))::int
                        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                        ELSE '---'
                      END || ' ' ||
                      to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YY');

  v_currency_upper := lower(COALESCE(p_currency, 'thb'));
  v_phone_clean := replace(replace(COALESCE(p_phone, ''), '+', ''), ' ', '');

  -- Construir HTML del evento (Con enlace directo a WhatsApp https://wa.me/...)
  IF length(v_phone_clean) > 0 THEN
    v_wa_link := 'https://wa.me/' || v_phone_clean || '?text=' || urlencode(COALESCE(p_wa_message, ''));
    v_desc_html := 'https://wa.me/' || v_phone_clean || '<br><br><b><a href=\"' || v_wa_link || '\">' || v_btn_text || '</a></b><br><br><b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || COALESCE(p_amount_raw, '') || ' ' || v_currency_upper || ' a WISE BT</b></li></ul>';
  ELSE
    v_desc_html := '<b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || COALESCE(p_amount_raw, '') || ' ' || v_currency_upper || ' a WISE BT</b></li></ul>';
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RAISE EXCEPTION 'Error al obtener Access Token de Google (status %): %', v_token_res.status, v_token_res.content;
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RAISE EXCEPTION 'No se pudo obtener access_token de la respuesta de Google';
  END IF;

  v_booking_date_str := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YYYY-MM-DD');

  -- 3. Crear Evento en Google Calendar API v3
  v_cal_req_body := jsonb_build_object(
    'summary', v_title,
    'description', v_desc_html,
    'start', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'end', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'colorId', '9',
    'reminders', jsonb_build_object('useDefault', false, 'overrides', '[]'::jsonb)
  )::text;

  v_cal_res := http((
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_cal_req_body
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RAISE EXCEPTION 'Error creando evento en Google Calendar (status %): %', v_cal_res.status, v_cal_res.content;
  END IF;

  v_cal_json := v_cal_res.content::jsonb;
  v_html_link := v_cal_json->>'htmlLink';
  v_summary := v_cal_json->>'summary';

  RETURN jsonb_build_object(
    'success', true,
    'htmlLink', v_html_link,
    'summary', v_summary
  );
END;
$function$;

COMMENT ON FUNCTION public.create_custom_google_calendar_event(text, text, text, integer, date, text, text, text, boolean, text) IS 'Crea eventos avanzados en Google Calendar con etiquetas de días y plantilla WhatsApp.';


-- --------------------------------------------------------------------------------
-- Función: public.create_custom_google_calendar_event(p_customer_name, p_activity_codes, p_activity_full, p_num_people, p_booking_date, p_phone, p_amount_raw, p_currency, p_is_english, p_wa_message, p_sufijo_dias)
-- Sobrecarga: 11 parámetros (Con sufijo personalizado de días y depósito en THB estándar)
-- Propósito: Variante de AddToCalendar 5.1 que computa el depósito en formato THB estándar
--            (Pax * 1000 THB) para garantizar que el lector de facturación lo reconozca.
-- Retorna: jsonb {success, htmlLink, summary}
-- ERP Módulo: AddToCalendar v5.1 / Generador de reservas para facturación en Koh Tao.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_custom_google_calendar_event(p_customer_name text, p_activity_codes text, p_activity_full text, p_num_people integer DEFAULT 1, p_booking_date date DEFAULT CURRENT_DATE, p_phone text DEFAULT ''::text, p_amount_raw text DEFAULT ''::text, p_currency text DEFAULT 'THB'::text, p_is_english boolean DEFAULT true, p_wa_message text DEFAULT ''::text, p_sufijo_dias text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_client_id text;
  v_client_secret text;
  v_refresh_token text;
  
  v_num_people int;
  v_title text;
  v_formatted_date text;
  v_desc_html text;
  v_wa_link text;
  v_btn_text text;
  v_thb_amount text;
  
  v_token_req_body text;
  v_token_res http_response;
  v_token_json jsonb;
  v_access_token text;
  
  v_cal_req_body text;
  v_cal_res http_response;
  v_cal_json jsonb;
  v_html_link text;
  v_summary text;
  v_booking_date_str text;
  v_phone_clean text;
BEGIN
  -- 1. Obtener secretos Vault
  SELECT decrypted_secret INTO v_client_id FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_ID' LIMIT 1;
  SELECT decrypted_secret INTO v_client_secret FROM vault.decrypted_secrets WHERE name = 'GOOGLE_CLIENT_SECRET' LIMIT 1;
  SELECT decrypted_secret INTO v_refresh_token FROM vault.decrypted_secrets WHERE name = 'GOOGLE_REFRESH_TOKEN' LIMIT 1;

  IF v_client_id IS NULL OR v_client_secret IS NULL OR v_refresh_token IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las credenciales de Google OAuth en Vault';
  END IF;

  v_num_people := COALESCE(p_num_people, 1);
  IF v_num_people <= 0 THEN v_num_people := 1; END IF;

  -- Para facturación en Koh Tao: la reserva en el calendario siempre se computa como (Pax * 1000 thb)
  v_thb_amount := (v_num_people * 1000)::text || ' thb';

  -- Título idéntico a Addtocalendar 5.1
  v_title := COALESCE(p_customer_name, 'Cliente') || ' ' || COALESCE(p_activity_codes, 'ACT') || COALESCE(p_sufijo_dias, '');
  
  IF p_is_english THEN
    v_title := v_title || ' - Inglés';
    v_btn_text := '📲 SEND CONFIRMATION MESSAGE';
  ELSE
    v_title := v_title || ' - Español';
    v_btn_text := '📲 ENVIAR MENSAJE CONFIRMACIÓN';
  END IF;

  -- Formato de fecha para las viñetas (Siempre en español y formato DD MES YY)
  v_formatted_date := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'DD') || ' ' ||
                      CASE extract(month from COALESCE(p_booking_date, CURRENT_DATE))::int
                        WHEN 1 THEN 'ENE' WHEN 2 THEN 'FEB' WHEN 3 THEN 'MAR'
                        WHEN 4 THEN 'ABR' WHEN 5 THEN 'MAY' WHEN 6 THEN 'JUN'
                        WHEN 7 THEN 'JUL' WHEN 8 THEN 'AGO' WHEN 9 THEN 'SEP'
                        WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DIC'
                        ELSE '---'
                      END || ' ' ||
                      to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YY');

  v_phone_clean := replace(replace(COALESCE(p_phone, ''), '+', ''), ' ', '');

  -- Construir HTML del evento (Con formato estándar de reserva en THB para el lector de facturas)
  IF length(v_phone_clean) > 0 THEN
    v_wa_link := 'https://wa.me/' || v_phone_clean || '?text=' || urlencode(COALESCE(p_wa_message, ''));
    v_desc_html := 'https://wa.me/' || v_phone_clean || '<br><br><b><a href=\"' || v_wa_link || '\">' || v_btn_text || '</a></b><br><br><b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || v_thb_amount || ' a WISE BT</b></li></ul>';
  ELSE
    v_desc_html := '<b>' || v_title || '</b><ul><li>Fecha de inicio: <b>' || v_formatted_date || '</b></li><li>Reserva: <b>' || v_num_people::text || ' personas -> ' || v_thb_amount || ' a WISE BT</b></li></ul>';
  END IF;

  -- 2. Renovar Access Token usando Google OAuth2 API
  v_token_req_body := 'client_id=' || urlencode(v_client_id) ||
                      '&client_secret=' || urlencode(v_client_secret) ||
                      '&refresh_token=' || urlencode(v_refresh_token) ||
                      '&grant_type=refresh_token';

  v_token_res := http((
    'POST',
    'https://oauth2.googleapis.com/token',
    ARRAY[http_header('Content-Type', 'application/x-www-form-urlencoded')],
    'application/x-www-form-urlencoded',
    v_token_req_body
  )::http_request);

  IF v_token_res.status >= 300 THEN
    RAISE EXCEPTION 'Error al obtener Access Token de Google (status %): %', v_token_res.status, v_token_res.content;
  END IF;

  v_token_json := v_token_res.content::jsonb;
  v_access_token := v_token_json->>'access_token';

  IF v_access_token IS NULL THEN
    RAISE EXCEPTION 'No se pudo obtener access_token de la respuesta de Google';
  END IF;

  v_booking_date_str := to_char(COALESCE(p_booking_date, CURRENT_DATE), 'YYYY-MM-DD');

  -- 3. Crear Evento en Google Calendar API v3
  v_cal_req_body := jsonb_build_object(
    'summary', v_title,
    'description', v_desc_html,
    'start', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'end', jsonb_build_object('date', v_booking_date_str, 'timeZone', 'Asia/Bangkok'),
    'colorId', '9',
    'reminders', jsonb_build_object('useDefault', false, 'overrides', '[]'::jsonb)
  )::text;

  v_cal_res := http((
    'POST',
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_access_token),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_cal_req_body
  )::http_request);

  IF v_cal_res.status >= 300 THEN
    RAISE EXCEPTION 'Error creando evento en Google Calendar (status %): %', v_cal_res.status, v_cal_res.content;
  END IF;

  v_cal_json := v_cal_res.content::jsonb;
  v_html_link := v_cal_json->>'htmlLink';
  v_summary := v_cal_json->>'summary';

  RETURN jsonb_build_object(
    'success', true,
    'htmlLink', v_html_link,
    'summary', v_summary
  );
END;
$function$;

COMMENT ON FUNCTION public.create_custom_google_calendar_event(text, text, text, integer, date, text, text, text, boolean, text, text) IS 'Crea eventos en Google Calendar con formato THB estándar para facturación Koh Tao.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_trg_bizums_before_save()
-- Propósito: Función trigger BEFORE para la tabla bizums. Calcula automáticamente la columna
--            `has_retention` si la reserva está marcada como retenida o devuelta parcialmente.
-- Retorna: trigger (NEW)
-- ERP Módulo: Módulo de Gestión de Bizums y Retenciones.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_bizums_before_save()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.has_retention := (NEW.is_retained = true) OR (NEW.is_returned = true AND NEW.returned_people IS NOT NULL AND NEW.returned_people < NEW.num_people);
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.fn_trg_bizums_before_save() IS 'Calcula la columna has_retention en la tabla bizums antes de guardar.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_trg_sync_invoice_item_bizum()
-- Propósito: Función trigger BEFORE para la tabla invoice_items. Al crear o modificar el
--            customer_id de un ítem de factura, busca si existe un depósito Bizum aplicable.
-- Retorna: trigger (NEW)
-- ERP Módulo: Asignación automática de depósitos Bizum a partidas de factura.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_sync_invoice_item_bizum()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_match_bizum_id uuid;
  v_bizum_date date;
  v_deposit_eur numeric;
  v_bizum_name text;
  v_already_claimed boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS NOT DISTINCT FROM NEW.customer_id 
       AND OLD.date IS NOT DISTINCT FROM NEW.date THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.customer_id IS NULL THEN
    NEW.bizum_deposit_eur := NULL;
    RETURN NEW;
  END IF;

  SELECT bizum_id, deposit_eur, customer_name
  INTO v_match_bizum_id, v_deposit_eur, v_bizum_name
  FROM public.fn_match_bizum_deposit(NEW.customer_id);

  IF v_match_bizum_id IS NOT NULL THEN
    SELECT booking_date INTO v_bizum_date FROM public.bizums WHERE id = v_match_bizum_id;

    -- Evitar duplicidad: comprobar si este Bizum ya fue reclamado por cualquier cliente coincidente
    SELECT EXISTS (
      SELECT 1 
      FROM public.invoice_items ii
      JOIN public.customers c ON ii.customer_id = c.id
      WHERE ii.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND ii.bizum_deposit_eur > 0
        AND COALESCE(ii.date, c.booking_date) >= v_bizum_date - INTERVAL '3 days'
        AND COALESCE(ii.date, c.booking_date) <= v_bizum_date + INTERVAL '7 days'
        AND (
          -- Mismo cliente
          ii.customer_id = NEW.customer_id
          -- O misma factura
          OR ii.invoice_id = NEW.invoice_id
          -- O el otro cliente coincide con los teléfonos de este Bizum
          OR (
            public.fn_clean_phone(c.phone) <> '' 
            AND (
              public.fn_clean_phone(c.phone) = (SELECT public.fn_clean_phone(bizum_phone) FROM public.bizums WHERE id = v_match_bizum_id)
              OR public.fn_clean_phone(c.phone) = (SELECT public.fn_clean_phone(whatsapp_phone) FROM public.bizums WHERE id = v_match_bizum_id)
            )
          )
          -- O el otro cliente coincide con el nombre completo de este Bizum (similitud > 0.5)
          OR (
            public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' 
            AND (
              extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), public.fn_normalize_name(v_bizum_name)) > 0.5
            )
          )
        )
    ) INTO v_already_claimed;

    IF NOT v_already_claimed THEN
      NEW.bizum_deposit_eur := v_deposit_eur;
    ELSE
      NEW.bizum_deposit_eur := NULL;
    END IF;
  ELSE
    NEW.bizum_deposit_eur := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.fn_trg_sync_invoice_item_bizum() IS 'Busca y asigna depósitos Bizum a los ítems de factura al cambiar de cliente.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_trg_sync_bizum_to_invoice_item()
-- Propósito: Función trigger AFTER para la tabla bizums. Sincroniza en tiempo real los cambios
--            de estado en Bizum (pagado, devuelto o retenido) hacia las partidas de factura vinculadas.
-- Retorna: trigger (NEW)
-- ERP Módulo: Sincronización reactiva del estado de Bizums a la facturación activa.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_sync_bizum_to_invoice_item()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_match_item_id uuid;
  v_clean_bizum_phone text;
  v_clean_wa_phone text;
  v_normalized_bizum_name text;
  v_match_date date;
BEGIN
  v_clean_bizum_phone := public.fn_clean_phone(NEW.bizum_phone);
  v_clean_wa_phone := public.fn_clean_phone(NEW.whatsapp_phone);
  v_normalized_bizum_name := public.fn_normalize_name(NEW.customer_name);
  v_match_date := NEW.booking_date;

  -- 1. Si pasa a pagado, no devuelto y no retenido -> Buscar factura y asignar/actualizar depósito
  IF NEW.is_paid = true AND NEW.is_returned = false AND NEW.is_retained = false THEN
    SELECT ii.id INTO v_match_item_id
    FROM public.invoice_items ii
    JOIN public.customers c ON ii.customer_id = c.id
    WHERE (
        ii.bizum_deposit_eur IS NULL 
        OR (TG_OP = 'UPDATE' AND ii.bizum_deposit_eur = (COALESCE(OLD.returned_people, OLD.num_people) * 25.0)::numeric)
      )
      AND COALESCE(ii.date, c.booking_date) >= v_match_date - INTERVAL '3 days'
      AND COALESCE(ii.date, c.booking_date) <= v_match_date + INTERVAL '7 days'
      AND (
        (v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone)
        OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)
        OR
        (
          public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' AND (
            extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) > 0.5
          )
        )
      )
    ORDER BY 
      ((v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone) OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)) DESC,
      extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) DESC,
      ii.created_at DESC
    LIMIT 1;

    IF v_match_item_id IS NOT NULL THEN
      UPDATE public.invoice_items
      SET bizum_deposit_eur = (COALESCE(NEW.returned_people, NEW.num_people) * 25.0)::numeric
      WHERE id = v_match_item_id;
    END IF;

  -- 2. Si pasa a devuelto, retenido o impagado -> Quitar depósito de las facturas
  ELSIF NEW.is_returned = true OR NEW.is_retained = true OR NEW.is_paid = false THEN
    -- Buscamos y limpiamos las facturas vinculadas que tengan el depósito anterior asignado
    UPDATE public.invoice_items ii
    SET bizum_deposit_eur = NULL
    FROM public.customers c
    WHERE ii.customer_id = c.id
      AND (
        ii.bizum_deposit_eur = (COALESCE(OLD.returned_people, OLD.num_people) * 25.0)::numeric
        OR ii.bizum_deposit_eur = (COALESCE(NEW.returned_people, NEW.num_people) * 25.0)::numeric
      )
      AND COALESCE(ii.date, c.booking_date) >= v_match_date - INTERVAL '3 days'
      AND COALESCE(ii.date, c.booking_date) <= v_match_date + INTERVAL '7 days'
      AND (
        (v_clean_bizum_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_bizum_phone)
        OR (v_clean_wa_phone <> '' AND public.fn_clean_phone(c.phone) = v_clean_wa_phone)
        OR
        (
          public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')) <> '' AND (
            extensions.similarity(public.fn_normalize_name(c.first_name || ' ' || COALESCE(c.last_name, '')), v_normalized_bizum_name) > 0.5
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.fn_trg_sync_bizum_to_invoice_item() IS 'Sincroniza cambios en Bizums (pagos, devoluciones, retenciones) a las partidas de factura.';


-- --------------------------------------------------------------------------------
-- Función: public.fn_trg_billing_auto_import_calendar_deposit()
-- Propósito: Función trigger AFTER para invoice_items. Si una partida recibe un cliente y no tiene
--            depósito Bizum en euros, consulta a Google Calendar e inserta la línea de reserva automática.
-- Retorna: trigger (NEW)
-- ERP Módulo: Auto-importación automática de depósitos Wise desde Google Calendar.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_billing_auto_import_calendar_deposit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cust record;
  v_cal_res jsonb;
  v_reserva_exists boolean;
  v_bizum_exists boolean;
  v_event_already_imported boolean;
  v_reserva_activity_id uuid := '06ee3b83-af61-462e-9e98-b8dc90107ef9';
BEGIN
  -- 1. Evitar recursividad
  IF NEW.activity_id = v_reserva_activity_id THEN
    RETURN NEW;
  END IF;

  -- 2. Ejecutar solo si tiene cliente asignado y es una nueva asignación
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS NOT DISTINCT FROM NEW.customer_id THEN
      RETURN NEW;
    END IF;
  END IF;

  -- 3. OPTIMIZACIÓN CRÍTICA: Si ya tiene un depósito de Bizum asignado o existe uno coincidente
  -- en la base de datos local (ventana ±3 días), omitir por completo la llamada a Google Calendar.
  IF NEW.bizum_deposit_eur IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.fn_match_bizum_deposit(NEW.customer_id)
  ) INTO v_bizum_exists;

  IF v_bizum_exists THEN
    RETURN NEW;
  END IF;

  -- 4. Comprobar si ya existe una línea de Reserva para ESTA factura
  SELECT EXISTS (
    SELECT 1 
    FROM public.invoice_items 
    WHERE invoice_id = NEW.invoice_id 
      AND activity_id = v_reserva_activity_id
  ) INTO v_reserva_exists;

  IF v_reserva_exists THEN
    RETURN NEW;
  END IF;

  -- 5. Obtener datos del cliente
  SELECT first_name, last_name, phone, booking_date
  INTO v_cust
  FROM public.customers
  WHERE id = NEW.customer_id;

  IF NOT FOUND OR v_cust.booking_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- 6. Consultar Google Calendar
  BEGIN
    v_cal_res := public.fn_match_google_calendar_deposit(v_cust.first_name, v_cust.last_name, v_cust.phone, v_cust.booking_date);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al consultar Google Calendar en trigger: %', SQLERRM;
    RETURN NEW;
  END;

  -- 7. Si hay coincidencia de Wise, insertar la línea de Reserva
  IF v_cal_res->>'matched' = 'true' THEN
    -- 7.5. PREVENIR DUPLICIDAD GLOBAL: Comprobar si este evento de Google Calendar ya fue importado
    -- en cualquier otra factura del sistema usando el texto de la nota (independiente de la fecha de la fila)
    SELECT EXISTS (
      SELECT 1 
      FROM public.invoice_items 
      WHERE notes = 'Auto-importado de Google Calendar: ' || (v_cal_res->>'event_summary')
    ) INTO v_event_already_imported;

    IF v_event_already_imported THEN
      RETURN NEW;
    END IF;

    -- Insertamos el registro de reserva con DATE = NULL para que lo establezcas manualmente
    INSERT INTO public.invoice_items (
      invoice_id,
      customer_id,
      activity_id,
      date,
      quantity,
      unit_price_thb,
      total_thb,
      status,
      payment_method,
      notes
    ) VALUES (
      NEW.invoice_id,
      NEW.customer_id,
      v_reserva_activity_id,
      NULL, -- date is NULL, forcing manual selection in UI
      (v_cal_res->>'num_people')::integer,
      CASE 
        WHEN (v_cal_res->>'num_people')::integer > 0 THEN ((v_cal_res->>'deposit_thb')::numeric / (v_cal_res->>'num_people')::integer)::numeric
        ELSE 1000
      END,
      (v_cal_res->>'deposit_thb')::numeric,
      'Paid',
      COALESCE(v_cal_res->>'payment_method', 'WISE BT'),
      'Auto-importado de Google Calendar: ' || (v_cal_res->>'event_summary')
    );
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.fn_trg_billing_auto_import_calendar_deposit() IS 'Importa automáticamente reservas desde Google Calendar como ítems de factura.';


-- ================================================================================
-- SECTION 2: INTERNAL LOGIC FUNCTIONS (Esquema: logic - Lógica de Negocio ERP)
-- ================================================================================

-- --------------------------------------------------------------------------------
-- Función: logic.calc_total_xpagar()
-- Propósito: Trigger BEFORE en monthly_reports. Recalcula el total a pagar del mes sumando
--            proveedores, sueldos pendientes, gastos financieros, fijos y bote.
-- Retorna: trigger (NEW)
-- ERP Módulo: Motor de Informes Financieros Mensuales.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.calc_total_xpagar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_suppliers_pending NUMERIC;
    v_sueldos_pending   NUMERIC;
    v_gastos_pending    NUMERIC;
    v_fijo_office       NUMERIC;
    v_fijo_infinity     NUMERIC;
    v_fijo_pae          NUMERIC;
    v_fijo_polimigra    NUMERIC;
    v_bote_pending      NUMERIC;
BEGIN
    -- SUPER ESCUDO PROTECTOR (Ene-Mar 2026)
    IF NEW.year < 2026 OR (NEW.year = 2026 AND NEW.month <= 3) THEN 
        RETURN NEW; 
    END IF;

    -- Proveedores pendientes
    SELECT COALESCE(SUM(pending_amount), 0) INTO v_suppliers_pending
    FROM supplier_settlements WHERE year = NEW.year AND month = NEW.month;

    -- Sueldos pendientes
    SELECT COALESCE(SUM(total_payout), 0) INTO v_sueldos_pending
    FROM staff_settlements WHERE year = NEW.year AND month = NEW.month;

    -- Gastos financieros pendientes
    SELECT COALESCE(grand_total_pending, 0) INTO v_gastos_pending
    FROM monthly_expenses WHERE year = NEW.year AND month = NEW.month;

    -- Valores base de fijos
    SELECT COALESCE(amount, 0) INTO v_fijo_office    FROM fixed_expenses WHERE name ILIKE '%office%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_infinity  FROM fixed_expenses WHERE name ILIKE '%infinity%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_pae       FROM fixed_expenses WHERE name ILIKE '%pae%' OR name ILIKE '%p ae%' LIMIT 1;
    SELECT COALESCE(amount, 0) INTO v_fijo_polimigra FROM fixed_expenses WHERE name ILIKE '%poli%' LIMIT 1;

    -- Bote pendiente
    SELECT COALESCE(apartar_amount, 0) INTO v_bote_pending
    FROM bote_monthly WHERE year = NEW.year AND month = NEW.month;

    NEW.total_xpagar :=
        v_suppliers_pending
        + v_sueldos_pending
        + v_gastos_pending
        + COALESCE(NEW.office_xpagar,    v_fijo_office)
        + COALESCE(NEW.infinity_xpagar,  v_fijo_infinity)
        + COALESCE(NEW.pae_xpagar,       v_fijo_pae)
        + COALESCE(NEW.polimigra_xpagar, v_fijo_polimigra)
        + COALESCE(NEW.bote_xpagar,      v_bote_pending);

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION logic.calc_total_xpagar() IS 'Recalcula el total a pagar del mes en monthly_reports sumando todos los fijos y pendientes.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_calculate_bote_final_balance()
-- Propósito: Trigger BEFORE en bote_monthly. Calcula el saldo final del bote mensual:
--            final_balance = initial_balance + apartar_amount - pending_amount - expenses_total.
-- Retorna: trigger (NEW)
-- ERP Módulo: Módulo de Gestión de Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_calculate_bote_final_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.final_balance := COALESCE(NEW.initial_balance, 0) + (COALESCE(NEW.apartar_amount, 0) - COALESCE(NEW.pending_amount, 0)) - COALESCE(NEW.expenses_total, 0);
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION logic.func_calculate_bote_final_balance() IS 'Calcula el saldo final del bote en función de ingresos, gastos y remanentes.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_cascade_bote_initial_balance()
-- Propósito: Trigger AFTER en bote_monthly. Propaga en cascada el saldo final de un mes
--            como saldo inicial del mes siguiente.
-- Retorna: NULL
-- ERP Módulo: Módulo de Bote Mensual (Arrastre intermensual de saldos).
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_cascade_bote_initial_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_next_year INTEGER;
    v_next_month INTEGER;
BEGIN
    -- Solo actuar si el final_balance ha cambiado
    IF OLD.final_balance IS DISTINCT FROM NEW.final_balance THEN
        -- Calcular el mes y año siguiente
        IF NEW.month = 12 THEN
            v_next_month := 1;
            v_next_year := NEW.year + 1;
        ELSE
            v_next_month := NEW.month + 1;
            v_next_year := NEW.year;
        END IF;

        -- Actualizar el saldo inicial del mes siguiente si existe
        UPDATE public.bote_monthly
        SET initial_balance = NEW.final_balance, updated_at = NOW()
        WHERE year = v_next_year AND month = v_next_month;
    END IF;

    RETURN NULL; -- Es un trigger AFTER
END;
$function$;

COMMENT ON FUNCTION logic.func_cascade_bote_initial_balance() IS 'Transfiere en cascada el saldo final del bote hacia el saldo inicial del mes siguiente.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_fill_ssi_breakdown_unit_cost()
-- Propósito: Trigger BEFORE en ssi_monthly_breakdown. Asigna automáticamente el costo unitario
--            desde la tabla `activities` si no se especificó un valor manual.
-- Retorna: trigger (NEW)
-- ERP Módulo: Módulo de Contabilidad de Cursos SSI.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_fill_ssi_breakdown_unit_cost()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'logic'
AS $function$
BEGIN
    IF NEW.unit_cost IS NULL OR NEW.unit_cost = 0 THEN
        SELECT COALESCE(ssi_cost_thb, 0)
        INTO NEW.unit_cost
        FROM public.activities
        WHERE id = NEW.activity_id;
    END IF;
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION logic.func_fill_ssi_breakdown_unit_cost() IS 'Rellena el costo unitario de SSI automáticamente desde el catálogo de actividades.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_recount_ssi_month(p_year integer, p_month integer)
-- Propósito: Recalcula la liquidación mensual de SSI sumando las filas de `ssi_monthly_breakdown`
--            y ajustando diferencias/adelantos del mes anterior y siguiente en `supplier_settlements`.
-- Parámetros: p_year (integer), p_month (integer)
-- Retorna: void
-- ERP Módulo: Liquidación de Proveedores (SSI).
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_recount_ssi_month(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_calculated_total numeric;
  v_adj_prev numeric;
  v_adj_next numeric;
  v_next_year integer;
  v_next_month integer;
  v_total numeric;
BEGIN
  -- 1. Sumar los totales de las filas del desglose
  SELECT COALESCE(SUM(total_fila), 0)
  INTO v_calculated_total
  FROM public.ssi_monthly_breakdown
  WHERE year = p_year AND month = p_month;
  
  -- 2. Leer el ajuste (mes_anterior) de la fila del MES ACTUAL de forma segura (COALESCE de subconsulta)
  v_adj_prev := COALESCE((
      SELECT mes_anterior 
      FROM public.supplier_settlements
      WHERE supplier_name = 'SSI' AND year = p_year AND month = p_month
  ), 0);
  
  -- 3. Calcular mes y año siguiente
  IF p_month = 12 THEN
      v_next_year := p_year + 1;
      v_next_month := 1;
  ELSE
      v_next_year := p_year;
      v_next_month := p_month + 1;
  END IF;

  -- 4. Leer el adelanto (mes_anterior del mes siguiente) de forma segura (COALESCE de subconsulta)
  v_adj_next := COALESCE((
      SELECT mes_anterior 
      FROM public.supplier_settlements
      WHERE supplier_name = 'SSI' AND year = v_next_year AND month = v_next_month
  ), 0);

  -- 5. Total = Calculado - (v_adj_prev * 1067) + (v_adj_next * 1067)
  v_total := v_calculated_total - (v_adj_prev * 1067) + (v_adj_next * 1067);
  
  -- 6. Insertar o actualizar la fila de supplier_settlements de forma segura (UPSERT)
  INSERT INTO public.supplier_settlements (supplier_name, year, month, total_amount, paid_amount, mes_anterior)
  VALUES ('SSI', p_year, p_month, v_total, 0, v_adj_prev)
  ON CONFLICT (supplier_name, month, year)
  DO UPDATE SET total_amount = EXCLUDED.total_amount;
END;
$function$;

COMMENT ON FUNCTION logic.func_recount_ssi_month(integer, integer) IS 'Recalcula atómicamente la factura mensual total del proveedor SSI.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_sync_bote_expenses_to_monthly()
-- Propósito: Trigger AFTER en bote_expenses. Suma los gastos diarios del bote y actualiza
--            `bote_monthly.expenses_total` para el mes correspondiente.
-- Retorna: NULL
-- ERP Módulo: Gastos del Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_sync_bote_expenses_to_monthly()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
    v_total NUMERIC;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_year := EXTRACT(YEAR FROM OLD.date)::INTEGER;
        v_month := EXTRACT(MONTH FROM OLD.date)::INTEGER;
    ELSE
        v_year := EXTRACT(YEAR FROM NEW.date)::INTEGER;
        v_month := EXTRACT(MONTH FROM NEW.date)::INTEGER;
    END IF;

    -- Construir fechas de inicio y fin de mes de forma segura
    v_start_date := TO_DATE(v_year || '-' || v_month || '-01', 'YYYY-MM-DD');
    v_end_date := v_start_date + INTERVAL '1 month';

    IF TG_OP = 'DELETE' THEN
        -- Calcular el total excluyendo el que se está borrando, y forzar a ENTERO
        SELECT COALESCE(SUM(amount), 0)::INTEGER INTO v_total
        FROM public.bote_expenses
        WHERE date >= v_start_date AND date < v_end_date
          AND id <> OLD.id;
    ELSE
        -- Calcular el total normalmente, y forzar a ENTERO
        SELECT COALESCE(SUM(amount), 0)::INTEGER INTO v_total
        FROM public.bote_expenses
        WHERE date >= v_start_date AND date < v_end_date;
    END IF;

    -- Actualizar la tabla bote_monthly
    UPDATE public.bote_monthly
    SET expenses_total = v_total, updated_at = NOW()
    WHERE year = v_year AND month = v_month;

    RETURN NULL; -- Es un trigger AFTER
END;
$function$;

COMMENT ON FUNCTION logic.func_sync_bote_expenses_to_monthly() IS 'Sincroniza la suma de gastos del bote hacia el acumulado mensual de bote.';


-- --------------------------------------------------------------------------------
-- Función: logic.func_trigger_invoice_to_ssi()
-- Propósito: Trigger AFTER en invoice_items. Cuando se vende o modifica una actividad SSI,
--            recalcula los conteos de `ssi_monthly_breakdown` para el mes de la factura.
-- Retorna: trigger
-- ERP Módulo: Sincronización automática de facturas vendidas con el consumo de materiales SSI.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.func_trigger_invoice_to_ssi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_date DATE;
    v_year INTEGER;
    v_month INTEGER;
BEGIN
    -- 1. Obtener la fecha de la factura afectada
    IF (TG_OP = 'DELETE') THEN
        v_date := OLD.date;
        IF (v_date IS NULL) THEN
            SELECT created_at::DATE INTO v_date FROM public.invoices WHERE id = OLD.invoice_id;
        END IF;
    ELSE
        v_date := NEW.date;
        IF (v_date IS NULL) THEN
            SELECT created_at::DATE INTO v_date FROM public.invoices WHERE id = NEW.invoice_id;
        END IF;
    END IF;

    IF (v_date IS NULL) THEN 
        IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    v_year := EXTRACT(YEAR FROM v_date)::INTEGER;
    v_month := EXTRACT(MONTH FROM v_date)::INTEGER;

    -- 2. Resetear system_quantity a 0 para todas las actividades de ese mes
    -- Esto asegura que si una actividad ya no tiene facturas, su conteo baje a 0
    -- pero MANTIENE los ajustes manuales.
    UPDATE public.ssi_monthly_breakdown 
    SET system_quantity = 0 
    WHERE year = v_year AND month = v_month;

    -- 3. Calcular e Insertar/Actualizar los totales reales de las facturas
    INSERT INTO public.ssi_monthly_breakdown (year, month, activity_id, system_quantity, unit_cost)
    SELECT 
        v_year, 
        v_month, 
        ii.activity_id,
        SUM(ii.quantity),
        COALESCE(a.ssi_cost_thb, 0)
    FROM public.invoice_items ii
    JOIN public.activities a ON ii.activity_id = a.id
    WHERE a.is_ssi_active = true
      AND EXTRACT(YEAR FROM ii.date) = v_year 
      AND EXTRACT(MONTH FROM ii.date) = v_month
    GROUP BY ii.activity_id, a.ssi_cost_thb
    ON CONFLICT (year, month, activity_id) 
    DO UPDATE SET 
        system_quantity = EXCLUDED.system_quantity,
        unit_cost = EXCLUDED.unit_cost;

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.func_trigger_invoice_to_ssi() IS 'Sincroniza la venta de ítems SSI de facturas con el desglose mensual SSI.';


-- --------------------------------------------------------------------------------
-- Función: logic.recalculate_bote_apartar(p_year integer, p_month integer)
-- Propósito: Recalcula la cantidad de fondos a apartar para el bote mensual según camisetas
--            incluidas en los cursos realizados y seguros contratados en el mes.
-- Parámetros: p_year (integer), p_month (integer)
-- Retorna: void
-- ERP Módulo: Cálculo de fondos a apartar en el Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.recalculate_bote_apartar(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_tshirts INT;
    v_insurances INT;
    v_total NUMERIC;
    v_prev_balance NUMERIC := 0;
    v_exists BOOLEAN;
BEGIN
    -- ESCUDO CONTRA VALORES NULOS
    IF p_year IS NULL OR p_month IS NULL THEN
        RETURN;
    END IF;

    -- SUPER ESCUDO PROTECTOR (Ene-Mar 2026)
    IF p_year < 2026 OR (p_year = 2026 AND p_month <= 3) THEN 
        RETURN; 
    END IF;

    -- 1. Contar camisetas usando la FECHA DEL CURSO (date), no la fecha de registro
    SELECT COALESCE(SUM(i.quantity), 0) INTO v_tshirts
    FROM public.invoice_items i
    JOIN public.activities a ON i.activity_id = a.id
    WHERE a.tshirt_included = true
    AND EXTRACT(YEAR FROM i.date) = p_year
    AND EXTRACT(MONTH FROM i.date) = p_month;

    -- 2. Contar seguros de los lotes
    SELECT COALESCE(SUM(total_pax), 0) INTO v_insurances
    FROM public.insurance_batches
    WHERE EXTRACT(YEAR FROM created_at) = p_year
    AND EXTRACT(MONTH FROM created_at) = p_month;

    -- 3. Calcular total (180 por camiseta desde Junio 2026, 160 antes; 75 por seguro)
    IF p_year > 2026 OR (p_year = 2026 AND p_month >= 6) THEN
        v_total := (v_tshirts * 180) + (v_insurances * 75);
    ELSE
        v_total := (v_tshirts * 160) + (v_insurances * 75);
    END IF;

    -- 4. Actualizar tabla bote_monthly
    SELECT EXISTS (
        SELECT 1 FROM public.bote_monthly 
        WHERE year = p_year AND month = p_month
    ) INTO v_exists;

    IF NOT v_exists THEN
        -- Intentar recuperar saldo final del mes anterior
        SELECT COALESCE(final_balance, 0) INTO v_prev_balance
        FROM public.bote_monthly
        WHERE (year = p_year AND month = p_month - 1)
           OR (year = p_year - 1 AND month = 12 AND p_month = 1);
           
        INSERT INTO public.bote_monthly (year, month, apartar_amount, initial_balance, updated_at)
        VALUES (p_year, p_month, v_total, v_prev_balance, now());
    ELSE
        UPDATE public.bote_monthly
        SET apartar_amount = v_total, updated_at = now()
        WHERE year = p_year AND month = p_month;
    END IF;
END;
$function$;

COMMENT ON FUNCTION logic.recalculate_bote_apartar(integer, integer) IS 'Calcula los fondos a apartar para el bote según camisetas e ingresos por seguros.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_invoice_report()
-- Propósito: Trigger AFTER en invoice_items. Sincroniza en `monthly_reports` las métricas de
--            facturado, pendiente de cobro y cobrado del mes afectado.
-- Retorna: trigger
-- ERP Módulo: Informe Mensual de Ingresos y Facturación.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_invoice_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_date DATE; target_year INTEGER; target_month INTEGER; t_total NUMERIC; t_pending NUMERIC; t_cobrado NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN target_date := OLD.date; ELSE target_date := NEW.date; END IF;
    IF target_date IS NULL THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
    target_year := EXTRACT(YEAR FROM target_date); target_month := EXTRACT(MONTH FROM target_date);
    IF target_year < 2026 OR (target_year = 2026 AND target_month <= 3) THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
    SELECT COALESCE(SUM(total_thb), 0), COALESCE(SUM(CASE WHEN status != 'Paid' THEN total_thb ELSE 0 END), 0), COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_thb ELSE 0 END), 0)
    INTO t_total, t_pending, t_cobrado FROM invoice_items WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;
    INSERT INTO monthly_reports (year, month, facturado, pendiente, cobrado, updated_at) VALUES (target_year, target_month, t_total, t_pending, t_cobrado, NOW())
    ON CONFLICT (year, month) DO UPDATE SET facturado = EXCLUDED.facturado, pendiente = EXCLUDED.pendiente, cobrado = EXCLUDED.cobrado, updated_at = NOW();
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.sync_invoice_report() IS 'Sincroniza facturado, pendiente y cobrado en los informes mensuales.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_monthly_finances()
-- Propósito: Trigger AFTER en daily_expenses e invoice_items. Recalcula comisiones de staff,
--            costos de proveedor de snorkel y gastos diarios acumulados en `monthly_expenses`.
-- Retorna: trigger
-- ERP Módulo: Cuadro Financiero Mensual (Comisiones y Gastos Generales).
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_monthly_finances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_date DATE; target_year INTEGER; target_month INTEGER;
    t_expenses NUMERIC; c_paid NUMERIC; c_pending NUMERIC; s_paid NUMERIC; s_pending NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN target_date := OLD.date; ELSE target_date := NEW.date; END IF;
    IF target_date IS NULL THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;

    target_year := EXTRACT(YEAR FROM target_date);
    target_month := EXTRACT(MONTH FROM target_date);

    -- SUPER ESCUDO PROTECTOR: No tocar nada anterior a Abril 2026
    IF target_year < 2026 OR (target_year = 2026 AND target_month <= 3) THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- Recalcular Gastos
    SELECT COALESCE(SUM(amount), 0) INTO t_expenses FROM daily_expenses 
    WHERE EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    -- Recalcular Comisiones
    SELECT 
        COALESCE(SUM(CASE WHEN i.is_comm_paid THEN COALESCE(i.comm_amount_thb, a.price_thb * 0.1) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT i.is_comm_paid THEN COALESCE(i.comm_amount_thb, a.price_thb * 0.1) ELSE 0 END), 0)
    INTO c_paid, c_pending 
    FROM invoice_items i
    LEFT JOIN activities a ON i.activity_id = a.id
    WHERE i.is_comm = true AND EXTRACT(YEAR FROM i.date) = target_year AND EXTRACT(MONTH FROM i.date) = target_month;

    -- Recalcular Snorkel
    SELECT 
        COALESCE(SUM(CASE WHEN i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN NOT i.is_prov_paid THEN i.quantity * COALESCE(a.ssi_cost_thb, 0) ELSE 0 END), 0)
    INTO s_paid, s_pending FROM invoice_items i LEFT JOIN activities a ON i.activity_id = a.id
    WHERE (a.category = 'Snorkeling' OR a.name ILIKE '%snorkel%')
      AND EXTRACT(YEAR FROM i.date) = target_year AND EXTRACT(MONTH FROM i.date) = target_month;

    -- Upsert en monthly_expenses
    INSERT INTO monthly_expenses (
        year, month, total_expenses, comm_paid, comm_pending, 
        snorkel_paid, snorkel_pending, grand_total_expenses, grand_total_pending, updated_at
    )
    VALUES (
        target_year, target_month, t_expenses, c_paid, c_pending, 
        s_paid, s_pending, (t_expenses + c_paid + c_pending + s_paid + s_pending), (c_pending + s_pending), NOW()
    )
    ON CONFLICT (year, month) DO UPDATE SET 
        total_expenses = EXCLUDED.total_expenses, 
        comm_paid = EXCLUDED.comm_paid, 
        comm_pending = EXCLUDED.comm_pending, 
        snorkel_paid = EXCLUDED.snorkel_paid, 
        snorkel_pending = EXCLUDED.snorkel_pending, 
        grand_total_expenses = EXCLUDED.grand_total_expenses, 
        grand_total_pending = EXCLUDED.grand_total_pending, 
        updated_at = NOW();

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.sync_monthly_finances() IS 'Sincroniza comisiones, gastos diarios y costo de snorkel en monthly_expenses.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_staff_settlement()
-- Propósito: Recalcula la liquidación mensual de salarios e incentivos de un instructor en
--            `staff_settlements` sumando comisiones, adelantos, guardias/asistencias y ajustes.
-- Retorna: trigger
-- ERP Módulo: Módulo de Sueldos y Nóminas del Staff.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_staff_settlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_staff_id uuid; v_year int; v_month int; v_commissions numeric; v_advances numeric; v_bonus numeric; v_adjustments numeric; v_assists_count int; v_staff_ids uuid[] := '{}'; v_years int[] := '{}'; v_months int[] := '{}'; i int;
BEGIN
    IF TG_TABLE_NAME = 'invoice_items' THEN
        IF TG_OP IN ('INSERT', 'UPDATE') THEN v_staff_ids := array_append(v_staff_ids, NEW.instructor_id); v_years := array_append(v_years, EXTRACT(YEAR FROM NEW.date)::int); v_months := array_append(v_months, EXTRACT(MONTH FROM NEW.date)::int); END IF;
        IF TG_OP IN ('DELETE', 'UPDATE') THEN v_staff_ids := array_append(v_staff_ids, OLD.instructor_id); v_years := array_append(v_years, EXTRACT(YEAR FROM OLD.date)::int); v_months := array_append(v_months, EXTRACT(MONTH FROM OLD.date)::int); END IF;
    ELSE
        IF TG_OP IN ('INSERT', 'UPDATE') THEN v_staff_ids := array_append(v_staff_ids, NEW.staff_id); v_years := array_append(v_years, NEW.year); v_months := array_append(v_months, NEW.month); END IF;
        IF TG_OP IN ('DELETE', 'UPDATE') THEN v_staff_ids := array_append(v_staff_ids, OLD.staff_id); v_years := array_append(v_years, OLD.year); v_months := array_append(v_months, OLD.month); END IF;
    END IF;
    FOR i IN 1 .. array_length(v_staff_ids, 1) LOOP
        v_staff_id := v_staff_ids[i]; v_year := v_years[i]; v_month := v_months[i];
        IF v_staff_id IS NULL OR v_year IS NULL OR v_month IS NULL THEN CONTINUE; END IF;
        IF v_year < 2026 OR (v_year = 2026 AND v_month <= 3) THEN CONTINUE; END IF;
        SELECT COALESCE(SUM(ip.amount_thb * ii.quantity), 0) INTO v_commissions FROM public.invoice_items ii JOIN public.instructor_payouts ip ON ii.activity_id = ip.activity_id WHERE ii.instructor_id = v_staff_id AND EXTRACT(YEAR FROM ii.date) = v_year AND EXTRACT(MONTH FROM ii.date) = v_month;
        SELECT COALESCE(SUM(amount), 0) INTO v_advances FROM public.staff_advances WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        SELECT COALESCE(SUM(assists * 2000), 0), COALESCE(SUM(assists), 0) INTO v_bonus, v_assists_count FROM public.staff_daily_activity WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        SELECT COALESCE(SUM(amount), 0) INTO v_adjustments FROM public.staff_adjustments WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        IF v_commissions = 0 AND v_advances = 0 AND v_bonus = 0 AND v_adjustments = 0 AND v_assists_count = 0 THEN DELETE FROM public.staff_settlements WHERE staff_id = v_staff_id AND year = v_year AND month = v_month;
        ELSE INSERT INTO public.staff_settlements (staff_id, year, month, total_commissions, total_advances, total_bonus, assists_count, updated_at)
            VALUES (v_staff_id, v_year, v_month, v_commissions, v_advances, v_bonus + v_adjustments, v_assists_count, now())
            ON CONFLICT (staff_id, year, month) DO UPDATE SET total_commissions = EXCLUDED.total_commissions, total_advances = EXCLUDED.total_advances, total_bonus = EXCLUDED.total_bonus, assists_count = EXCLUDED.assists_count, updated_at = EXCLUDED.updated_at;
        END IF;
    END LOOP;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

COMMENT ON FUNCTION logic.sync_staff_settlement() IS 'Recalcula la liquidación mensual de comisiones, adelantos y bonos del staff.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_total_courses_from_logs()
-- Propósito: Trigger AFTER en monthly_activity_logs. Suma los cursos que tienen `widget_column = 1`
--            y actualiza `monthly_reports.total_courses`.
-- Retorna: trigger
-- ERP Módulo: Conteo total de cursos impartidos en informes mensuales.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_courses_from_logs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_year INT; v_month INT; v_total_courses INT;
BEGIN
    IF TG_OP = 'DELETE' THEN v_year := OLD.year; v_month := OLD.month; 
    ELSE v_year := NEW.year; v_month := NEW.month; END IF;
    IF v_year < 2026 OR (v_year = 2026 AND v_month <= 3) THEN IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
    SELECT COALESCE(SUM(CASE WHEN a.widget_column = 1 THEN l.count ELSE 0 END), 0)::INT INTO v_total_courses 
    FROM monthly_activity_logs l JOIN activities a ON l.activity_id = a.id WHERE l.year = v_year AND l.month = v_month;
    UPDATE monthly_reports SET total_courses = v_total_courses WHERE year = v_year AND month = v_month;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION logic.sync_total_courses_from_logs() IS 'Actualiza total_courses en monthly_reports desde los logs de actividades.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_total_courses_trigger()
-- Propósito: Trigger BEFORE en monthly_reports. Protege la métrica `total_courses` evitando
--            que se restablezca a cero si ya contenía un valor válido registrado.
-- Retorna: trigger (NEW)
-- ERP Módulo: Protección de datos en informes mensuales.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_courses_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.year < 2026 OR (NEW.year = 2026 AND NEW.month <= 3) THEN RETURN NEW; END IF;
    IF NEW.year >= 2026 AND NEW.total_courses IS NOT NULL AND NEW.total_courses > 0 THEN
        UPDATE monthly_reports SET total_courses = NEW.total_courses WHERE year = NEW.year AND month = NEW.month AND (total_courses IS NULL OR total_courses = 0);
    END IF;
    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION logic.sync_total_courses_trigger() IS 'Evita sobreescribir total_courses con 0 en monthly_reports si ya existían datos.';


-- --------------------------------------------------------------------------------
-- Función: logic.sync_total_gastos_to_report(p_year integer, p_month integer)
-- Propósito: Recalcula de forma atómica `monthly_reports.total_gastos`, `sueldos_total` y
--            `sueldos_pendiente` combinando proveedores, sueldos, bote, gastos fijos y financieros.
-- Parámetros: p_year (integer), p_month (integer)
-- Retorna: void
-- ERP Módulo: Motor consolidado de Gastos Totales del ERP.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.sync_total_gastos_to_report(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_suppliers numeric;
    v_sueldos_total numeric;
    v_sueldos_pendiente numeric;
    v_bote numeric;
    v_fijos numeric;
    v_gastos_fin numeric;
    v_total_gastos numeric;
BEGIN
    -- SUPER ESCUDO PROTECTOR
    IF p_year < 2026 OR (p_year = 2026 AND p_month <= 3) THEN 
        RETURN; 
    END IF;

    -- 1. Proveedores: Todo lo pagado en Settlements
    SELECT COALESCE(SUM(total_amount), 0) INTO v_suppliers 
    FROM supplier_settlements WHERE year = p_year AND month = p_month;

    -- 2. Sueldos: TOTAL y PENDIENTE
    SELECT 
        COALESCE(SUM(total_commissions + total_bonus), 0),
        COALESCE(SUM(total_payout), 0)
    INTO v_sueldos_total, v_sueldos_pendiente
    FROM staff_settlements WHERE year = p_year AND month = p_month;

    -- 3. Bote: Cantidad apartada ese mes
    SELECT COALESCE(SUM(apartar_amount), 0) INTO v_bote 
    FROM bote_monthly WHERE year = p_year AND month = p_month;

    -- 4. Gastos Fijos: Suma de la tabla de configuración
    SELECT COALESCE(SUM(amount), 0) INTO v_fijos FROM fixed_expenses;

    -- 5. Gastos Financieros
    SELECT COALESCE(grand_total_expenses, 0) INTO v_gastos_fin 
    FROM monthly_expenses WHERE year = p_year AND month = p_month;

    -- Cálculo del Total Final Agregado
    v_total_gastos := v_suppliers + v_sueldos_total + v_bote + v_fijos + v_gastos_fin;

    -- Actualización atómica
    INSERT INTO monthly_reports (year, month, total_gastos, sueldos_total, sueldos_pendiente, updated_at)
    VALUES (p_year, p_month, v_total_gastos, v_sueldos_total, v_sueldos_pendiente, NOW())
    ON CONFLICT (year, month) 
    DO UPDATE SET total_gastos = v_total_gastos, sueldos_total = v_sueldos_total, sueldos_pendiente = v_sueldos_pendiente, updated_at = NOW();
END;
$function$;

COMMENT ON FUNCTION logic.sync_total_gastos_to_report(integer, integer) IS 'Consolida y sincroniza la totalidad de gastos operativos y salarios en monthly_reports.';


-- --------------------------------------------------------------------------------
-- Función: logic.trg_call_sync_fixed_expenses()
-- Propósito: Trigger AFTER en fixed_expenses. Invoca `sync_total_gastos_to_report()` para el
--            mes actual cuando se modifica la estructura de gastos fijos de la empresa.
-- Retorna: trigger
-- ERP Módulo: Re-calculador de gastos fijos.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trg_call_sync_fixed_expenses()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_year INTEGER; v_month INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::INTEGER; v_month := EXTRACT(MONTH FROM NOW())::INTEGER;
    PERFORM logic.sync_total_gastos_to_report(v_year, v_month);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.trg_call_sync_fixed_expenses() IS 'Re-dispara el cálculo de gastos totales cuando cambian los gastos fijos.';


-- --------------------------------------------------------------------------------
-- Función: logic.trg_sync_total_gastos_to_report()
-- Propósito: Trigger AFTER multitabla. Invoca `sync_total_gastos_to_report()` cuando hay cambios
--            en `bote_monthly`, `monthly_expenses`, `staff_settlements` o `supplier_settlements`.
-- Retorna: trigger
-- ERP Módulo: Invocador reactivo de informes financieros agregados.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trg_sync_total_gastos_to_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_year  INTEGER;
    v_month INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN v_year := OLD.year; v_month := OLD.month;
    ELSE v_year := NEW.year; v_month := NEW.month; END IF;
    PERFORM logic.sync_total_gastos_to_report(v_year, v_month);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.trg_sync_total_gastos_to_report() IS 'Disparador reactivo para actualizar total_gastos en monthly_reports.';


-- --------------------------------------------------------------------------------
-- Función: logic.trigger_recalculate_bote()
-- Propósito: Trigger AFTER genérico para recalcular los fondos a apartar para el bote mensual
--            utilizando la fecha de creación del registro afectado.
-- Retorna: NULL
-- ERP Módulo: Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trigger_recalculate_bote()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM logic.recalculate_bote_apartar(
        EXTRACT(YEAR FROM COALESCE(NEW.created_at, OLD.created_at))::INT,
        EXTRACT(MONTH FROM COALESCE(NEW.created_at, OLD.created_at))::INT
    );
    RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION logic.trigger_recalculate_bote() IS 'Dispara la función recalculate_bote_apartar usando created_at.';


-- --------------------------------------------------------------------------------
-- Función: logic.trigger_recalculate_bote_insurances()
-- Propósito: Trigger AFTER en insurance_batches. Dispara el recálculo del bote mensual (75 THB
--            por seguro) al crear, editar o borrar lotes de seguros.
-- Retorna: NULL
-- ERP Módulo: Módulo de Seguros / Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trigger_recalculate_bote_insurances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM logic.recalculate_bote_apartar(
        EXTRACT(YEAR FROM COALESCE(NEW.created_at, OLD.created_at))::INT,
        EXTRACT(MONTH FROM COALESCE(NEW.created_at, OLD.created_at))::INT
    );
    RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION logic.trigger_recalculate_bote_insurances() IS 'Recalcula el bote mensual al modificar lotes de seguros.';


-- --------------------------------------------------------------------------------
-- Función: logic.trigger_recalculate_bote_invoices()
-- Propósito: Trigger AFTER en invoice_items. Detecta modificaciones o cambios de fecha en
--            ítems de factura con camisetas incluidas para recalcular el bote de los meses involucrados.
-- Retorna: trigger
-- ERP Módulo: Camisetas / Bote Mensual.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trigger_recalculate_bote_invoices()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Si la fecha es nula, salimos de inmediato sin gastar recursos de la base de datos
    IF COALESCE(NEW.date, OLD.date) IS NULL THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    -- Si se añade o modifica una fila con fecha no nula, recalculamos el mes de esa fecha
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.date IS NOT NULL THEN
        PERFORM logic.recalculate_bote_apartar(
            EXTRACT(YEAR FROM NEW.date)::INT,
            EXTRACT(MONTH FROM NEW.date)::INT
        );
    END IF;

    -- Si se edita y cambia la fecha de un mes a otro, recalculamos el mes anterior (OLD) para restar
    IF (TG_OP = 'UPDATE' AND OLD.date IS DISTINCT FROM NEW.date AND OLD.date IS NOT NULL) THEN
        PERFORM logic.recalculate_bote_apartar(
            EXTRACT(YEAR FROM OLD.date)::INT,
            EXTRACT(MONTH FROM OLD.date)::INT
        );
    END IF;

    -- Si se borra la fila, recalculamos su mes para restar
    IF (TG_OP = 'DELETE') THEN
        PERFORM logic.recalculate_bote_apartar(
            EXTRACT(YEAR FROM OLD.date)::INT,
            EXTRACT(MONTH FROM OLD.date)::INT
        );
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

COMMENT ON FUNCTION logic.trigger_recalculate_bote_invoices() IS 'Recalcula el bote al modificar partidas de factura con camisetas.';


-- --------------------------------------------------------------------------------
-- Función: logic.trigger_update_ssi_total_amount()
-- Propósito: Trigger AFTER en ssi_monthly_breakdown. Invoca `func_recount_ssi_month()` para
--            actualizar el total a pagar de SSI cuando cambia el desglose mensual de cursos.
-- Retorna: trigger
-- ERP Módulo: Módulo SSI / Proveedores.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.trigger_update_ssi_total_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'logic'
AS $function$
DECLARE
    v_year integer;
    v_month integer;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_year := OLD.year;
        v_month := OLD.month;
    ELSE
        v_year := NEW.year;
        v_month := NEW.month;
    END IF;

    IF (v_year IS NULL OR v_month IS NULL) THEN
        IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    PERFORM logic.func_recount_ssi_month(v_year, v_month);

    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

COMMENT ON FUNCTION logic.trigger_update_ssi_total_amount() IS 'Actualiza la liquidación mensual de SSI tras cambios en el desglose.';


-- --------------------------------------------------------------------------------
-- Función: logic.update_updated_at_column()
-- Propósito: Trigger BEFORE universal para actualizar automáticamente el campo `updated_at = now()`.
-- Retorna: trigger (NEW)
-- ERP Módulo: Auditoría y marcas temporales de modificación.
-- --------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logic.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

COMMENT ON FUNCTION logic.update_updated_at_column() IS 'Establece automáticamente la columna updated_at a la hora actual.';
