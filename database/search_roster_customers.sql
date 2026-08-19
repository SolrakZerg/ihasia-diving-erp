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
BEGIN
    target_id := p_customer_id;

    -- Si no tenemos el UUID, buscar inteligentemente por el nombre del Roster (ej: "Kiron G." o "Kiron Geiger")
    IF target_id IS NULL AND p_customer_name IS NOT NULL AND trim(p_customer_name) <> '' THEN
        SELECT c.id INTO target_id
        FROM customers c
        WHERE (
            extensions.unaccent(lower(c.first_name || ' ' || c.last_name)) ILIKE extensions.unaccent(lower(trim(p_customer_name) || '%'))
            OR
            (
                extensions.unaccent(lower(trim(c.first_name))) = extensions.unaccent(lower(split_part(trim(p_customer_name), ' ', 1)))
                AND (
                    split_part(trim(p_customer_name), ' ', 2) = ''
                    OR extensions.unaccent(lower(substring(c.last_name, 1, 1))) = extensions.unaccent(lower(substring(split_part(trim(p_customer_name), ' ', 2), 1, 1)))
                )
            )
        )
        ORDER BY c.booking_date DESC NULLS LAST, c.created_at DESC
        LIMIT 1;
    END IF;

    IF target_id IS NOT NULL THEN
        UPDATE customers 
        SET 
            bcd_size = CASE WHEN p_bcd IS NOT NULL THEN NULLIF(p_bcd, '') ELSE bcd_size END,
            suit_size = CASE WHEN p_suit IS NOT NULL THEN NULLIF(p_suit, '') ELSE suit_size END,
            fins_size = CASE WHEN p_fins IS NOT NULL THEN NULLIF(p_fins, '') ELSE fins_size END
        WHERE id = target_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

GRANT EXECUTE ON FUNCTION public.update_customer_gear(UUID, TEXT, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.update_customer_gear(UUID, VARCHAR, VARCHAR, VARCHAR) 
IS 'Actualiza exclusivamente las tallas de equipo (BCD, traje, aletas) de un cliente desde Roster 2.0.';

-- 3. Función RPC de búsqueda segura para el Roster con priorización por fecha
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
BEGIN
    -- Limpiar espacios y dividir consulta en tokens
    tokens := regexp_split_to_array(trim(query_text), '\s+');
    
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
        CASE WHEN target_date IS NOT NULL AND c.booking_date = target_date THEN 1 ELSE 0 END DESC,
        c.booking_date DESC NULLS LAST,
        c.created_at DESC
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_roster_customers(text, date) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.search_roster_customers(text, date) 
IS 'Búsqueda contextualizada de clientes para Roster 2.0 con priorización por fecha y datos higienizados.';
