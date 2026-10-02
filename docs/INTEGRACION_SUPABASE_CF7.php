<?php
/**
 * ==============================================================================
 * INTEGRACIÓN CONTACT FORM 7 -> SUPABASE (DIVING ERP)
 * Archivo: ihasia-cf7-to-supabase.php
 * 
 * Gestiona automáticamente las reservas de:
 * 1. Wise ("Booking with Wise", "Reserva por Wise") -> tabla public.wise_payments
 * 2. Bizum ("Reserva por Bizum")                   -> tabla public.bizums
 * 
 * Instrucciones:
 * Pega este código en el plugin "WPCode" / "Code Snippets" reemplazando el anterior.
 * ==============================================================================
 */

add_action('wpcf7_mail_sent', 'ihasia_sync_cf7_to_supabase');

function ihasia_sync_cf7_to_supabase($contact_form) {
    // 1. Obtener la instancia de datos enviados
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) {
        return;
    }

    $posted_data = $submission->get_posted_data();
    $form_title  = method_exists($contact_form, 'title') ? trim($contact_form->title()) : '';

    // 2. Credenciales de Supabase
    $supabase_url = 'https://mowoxxyusicasgxouhxv.supabase.co';
    $supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODk2OTIsImV4cCI6MjA5MTc2NTY5Mn0.4hgAY3LGwVBR3M_KknIgnoFJ7WSSbJDxkSVYlKUyeTE';

    $headers = [
        'apikey'        => $supabase_key,
        'Authorization' => 'Bearer ' . $supabase_key,
        'Content-Type'  => 'application/json',
        'Prefer'        => 'return=minimal'
    ];

    // 3. Comprobar campos mínimos
    if (!isset($posted_data['fecha_reserva']) || !isset($posted_data['nombre_cliente'])) {
        return;
    }

    $fecha_raw      = !empty($posted_data['fecha_reserva']) ? sanitize_text_field($posted_data['fecha_reserva']) : null;
    $nombre_cliente = !empty($posted_data['nombre_cliente']) ? sanitize_text_field($posted_data['nombre_cliente']) : '';
    $whatsapp       = !empty($posted_data['whatsapp']) ? sanitize_text_field($posted_data['whatsapp']) : '';

    // Normalizar formato de fecha a YYYY-MM-DD para evitar confusión entre DD/MM/YYYY y MM/DD/YYYY
    $fecha_reserva = $fecha_raw;
    if (!empty($fecha_raw)) {
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $fecha_raw, $matches)) {
            // Formato DD/MM/YYYY -> YYYY-MM-DD
            $fecha_reserva = sprintf('%04d-%02d-%02d', $matches[3], $matches[2], $matches[1]);
        } elseif (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $fecha_raw, $matches)) {
            // Ya viene en formato YYYY-MM-DD
            $fecha_reserva = sprintf('%04d-%02d-%02d', $matches[1], $matches[2], $matches[3]);
        }
    }

    // 4. Desglose de actividades con nombres oficiales del ERP
    $activities_map = [
        'num_ow'     => ['code' => 'OW',     'name' => 'Open Water'],
        'num_aa'     => ['code' => 'AA',     'name' => 'Avanzado'],
        'num_dsd'    => ['code' => 'DSD',    'name' => 'Bautizo'],
        'num_sr'     => ['code' => 'SR',     'name' => 'Refresh'],
        'num_fd'     => ['code' => 'FD',     'name' => 'Fun Dives'],
        'num_rescue' => ['code' => 'Rescue', 'name' => 'Rescue']
    ];

    $activity_lines = [];
    $summary_parts  = [];
    $total_pax      = 0;

    foreach ($activities_map as $field_key => $act_info) {
        $count = isset($posted_data[$field_key]) ? intval($posted_data[$field_key]) : 0;
        if ($count > 0) {
            $activity_lines[] = [
                'code'  => $act_info['code'],
                'name'  => $act_info['name'],
                'count' => $count,
                'pax'   => $count
            ];
            $summary_parts[] = $act_info['name'];
            $total_pax += $count;
        }
    }

    // Pax mínimo 1
    if ($total_pax < 1) {
        $total_pax = !empty($posted_data['total_pax']) ? intval($posted_data['total_pax']) : 1;
        if ($total_pax < 1) $total_pax = 1;
    }

    $activity_summary = !empty($summary_parts) ? implode(', ', $summary_parts) : 'Open Water';

    // =========================================================================
    // CASO A: RESERVA POR BIZUM ("Reserva por Bizum") -> public.bizums
    // =========================================================================
    if (stripos($form_title, 'Bizum') !== false) {
        $telefono_bizum = !empty($posted_data['telefono_bizum']) ? sanitize_text_field($posted_data['telefono_bizum']) : '';
        $titular_bizum  = !empty($posted_data['titular_bizum']) ? sanitize_text_field($posted_data['titular_bizum']) : '';

        // Si no indicó teléfono específico de Bizum, usamos su WhatsApp
        $bizum_phone = !empty($telefono_bizum) ? $telefono_bizum : $whatsapp;

        $num_people_real = !empty($posted_data['num_personas']) ? intval($posted_data['num_personas']) : $total_pax;
        if ($num_people_real < 1) $num_people_real = 1;

        $bizum_payload = [
            'booking_date'   => $fecha_reserva,
            'customer_name'  => $nombre_cliente,
            'titular_bizum'  => !empty($titular_bizum) ? $titular_bizum : null,
            'num_people'     => $num_people_real,
            'activity'       => $activity_summary,
            'activity_lines' => $activity_lines,
            'bizum_phone'    => $bizum_phone,
            'whatsapp_phone' => $whatsapp,
            'is_paid'        => false,
            'is_returned'    => false,
            'is_retained'    => false,
            'is_settled'     => false,
            'notes'          => null
        ];

        wp_remote_post("{$supabase_url}/rest/v1/bizums", [
            'headers' => $headers,
            'body'    => wp_json_encode($bizum_payload),
            'timeout' => 5
        ]);

        return;
    }

    // =========================================================================
    // CASO B: RESERVA POR WISE -> public.wise_payments
    // Soporta: "Booking with Wise" (EN), "Reserva por Wise" (ES), "Wise Booking"
    // =========================================================================
    $allowed_wise_titles = ['Booking with Wise', 'Reserva por Wise', 'Wise Booking'];
    if (in_array($form_title, $allowed_wise_titles, true) || stripos($form_title, 'Wise') !== false) {
        $titular_wise = !empty($posted_data['titular_wise']) ? sanitize_text_field($posted_data['titular_wise']) : '';
        $is_english   = (isset($posted_data['is_english']) && $posted_data['is_english'] === 'true') ? true : false;
        $sender_name  = !empty($titular_wise) ? $titular_wise : $nombre_cliente;

        $web_id = 'WEB_' . date('Ymd_His') . '_' . wp_rand(100, 999);

        $wise_payload = [
            'id'             => $web_id,
            'sender_name'    => $sender_name,
            'customer_name'  => $nombre_cliente,
            'titular_wise'   => $titular_wise,
            'booking_date'   => $fecha_reserva,
            'phone'          => $whatsapp,
            'activity'       => $activity_summary,
            'activity_lines' => $activity_lines,
            'num_people'     => $total_pax,
            'is_english'     => $is_english,
            'is_paid'        => false,
            'is_processed'   => false,
            'amount_raw'     => 0,
            'currency'       => 'THB',
            'amount_eur'     => 0
        ];

        wp_remote_post("{$supabase_url}/rest/v1/wise_payments", [
            'headers' => $headers,
            'body'    => wp_json_encode($wise_payload),
            'timeout' => 5
        ]);
    }
}
