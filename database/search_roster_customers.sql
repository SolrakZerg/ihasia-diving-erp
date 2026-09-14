-- ################################################################################
-- RPC: search_roster_customers & update_customer_gear
-- Project: IHASIA ERP ↔ ROSTER 2.0 INTEGRATION
-- Propósito: Búsqueda rápida, segura y contextualizada de clientes para el autocompletado
--            del Roster 2.0. Protege datos sensibles (sin email, teléfono ni pasaporte).
--            Prioriza en primer lugar las coincidencias cuya fecha de reserva coincida con target_date.
-- ################################################################################

-- 1. Asegurar columnas de tallas en la tabla customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS bcd_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS suit_size VARCHAR(10),
ADD COLUMN IF NOT EXISTS fins_size VARCHAR(15);

-- 2. Función RPC para actualizar tallas desde el Roster de forma segura
CREATE OR REPLACE FUNCTION public.update_customer_gear(
    p_customer_id UUID DEFAULT NULL,
    p_customer_name TEXT DEFAULT NULL,
    p_bcd VARCHAR DEFAULT NULL,
    p_suit VARCHAR DEFAULT NULL,
    p_fins VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    target_id UUID;
    clean_bcd VARCHAR;
    clean_suit VARCHAR;
    clean_fins VARCHAR;
BEGIN
    target_id := p_customer_id;

    -- Si no tenemos el UUID, SOLO buscar por nombre completo exacto (nombre y apellido completos)
    -- NUNCA adivinar por iniciales abreviadas para evitar asignar tallas a personas equivocadas
    IF target_id IS NULL AND p_customer_name IS NOT NULL AND trim(p_customer_name) <> '' THEN
        IF position(' ' in trim(p_customer_name)) > 0 AND trim(p_customer_name) NOT LIKE '%.%' THEN
            SELECT c.id INTO target_id
            FROM customers c
            WHERE extensions.unaccent(lower(trim(c.first_name || ' ' || c.last_name))) = extensions.unaccent(lower(trim(p_customer_name)))
            ORDER BY c.booking_date DESC NULLS LAST, c.created_at DESC
            LIMIT 1;
        END IF;
    END IF;

    -- Normalizar tallas: si viene '--', cadena vacía o NULL, se guarda NULL en base de datos
    clean_bcd := CASE WHEN p_bcd IS NOT NULL AND trim(p_bcd) <> '' AND trim(p_bcd) <> '--' THEN trim(p_bcd) ELSE NULL END;
    clean_suit := CASE WHEN p_suit IS NOT NULL AND trim(p_suit) <> '' AND trim(p_suit) <> '--' THEN trim(p_suit) ELSE NULL END;
    clean_fins := CASE WHEN p_fins IS NOT NULL AND trim(p_fins) <> '' AND trim(p_fins) <> '--' THEN trim(p_fins) ELSE NULL END;

    IF target_id IS NOT NULL THEN
        UPDATE customers 
        SET 
            bcd_size = clean_bcd,
            suit_size = clean_suit,
            fins_size = clean_fins
        WHERE id = target_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

GRANT EXECUTE ON FUNCTION public.update_customer_gear(UUID, TEXT, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.update_customer_gear(UUID, TEXT, VARCHAR, VARCHAR, VARCHAR) 
IS 'Actualiza exclusivamente las tallas de equipo (BCD, traje, aletas) de un cliente desde Roster 2.0 de forma segura.';

-- 3. Función RPC de búsqueda segura para el Roster con priorización por fecha y relevancia textual
CREATE OR REPLACE FUNCTION public.search_roster_customers(
    query_text text,
    target_date date DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    roster_name text,
    level text,
    booked_activity text,
    booking_date date,
    bcd_size text,
    suit_size text,
    fins_size text,
    is_today boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    tokens text[];
    clean_query text;
    first_token text;
    second_token text;
BEGIN
    clean_query := trim(query_text);
    tokens := regexp_split_to_array(clean_query, '\s+');
    first_token := COALESCE(tokens[1], '');
    second_token := CASE WHEN array_length(tokens, 1) >= 2 THEN tokens[2] ELSE '' END;
    
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        (
            trim(c.first_name) || ' ' || 
            COALESCE((
                SELECT string_agg(upper(substring(part, 1, 1)) || '.', '')
                FROM unnest(regexp_split_to_array(trim(c.last_name), '\s+')) AS part
                WHERE part <> ''
            ), '')
        ) AS roster_name,
        c.certification_level AS level,
        c.booked_activity,
        c.booking_date,
        c.bcd_size::text,
        c.suit_size::text,
        c.fins_size::text,
        COALESCE(target_date IS NOT NULL AND c.booking_date = target_date, false) AS is_today
    FROM customers c
    WHERE (
        SELECT bool_and(
            extensions.unaccent(COALESCE(c.first_name, '')) ILIKE extensions.unaccent('%' || t || '%') OR 
            extensions.unaccent(COALESCE(c.last_name, '')) ILIKE extensions.unaccent('%' || t || '%')
        ) FROM unnest(tokens) t
    )
    ORDER BY 
        -- 1. Prioridad absoluta: los que bucean HOY (target_date)
        CASE WHEN target_date IS NOT NULL AND c.booking_date = target_date THEN 1 ELSE 0 END DESC,

        -- 2. Relevancia natural del texto escrito:
        -- Coincidencia exacta de nombre de pila
        CASE WHEN extensions.unaccent(lower(c.first_name)) = extensions.unaccent(lower(first_token)) THEN 1 ELSE 0 END DESC,
        -- El nombre de pila empieza por el primer término
        CASE WHEN extensions.unaccent(lower(c.first_name)) ILIKE extensions.unaccent(lower(first_token) || '%') THEN 1 ELSE 0 END DESC,
        -- Si hay segundo término, el apellido empieza por ese término (ej: "Ana s" -> Sánchez antes que Losa)
        CASE WHEN second_token <> '' AND extensions.unaccent(lower(c.last_name)) ILIKE extensions.unaccent(lower(second_token) || '%') THEN 1 ELSE 0 END DESC,
        -- El nombre completo empieza por la frase completa
        CASE WHEN extensions.unaccent(lower(trim(c.first_name || ' ' || c.last_name))) ILIKE extensions.unaccent(lower(clean_query) || '%') THEN 1 ELSE 0 END DESC,

        -- 3. Cercanía a la fecha de reserva consultada (días de diferencia)
        CASE 
            WHEN target_date IS NOT NULL AND c.booking_date IS NOT NULL 
            THEN ABS(c.booking_date - target_date)
            ELSE 99999 
        END ASC,

        -- 4. Desempate secundario por fecha y creación
        c.booking_date DESC NULLS LAST,
        c.created_at DESC
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_roster_customers(text, date) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.search_roster_customers(text, date) 
IS 'Búsqueda contextualizada de clientes para Roster con priorización por fecha, relevancia textual y proximidad temporal.';
