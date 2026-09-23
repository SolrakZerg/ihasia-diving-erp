<?php
/**
 * ==============================================================================
 * INTEGRACIÓN CONTACT FORM 7 -> SUPABASE (DIVING ERP)
 * Archivo: ihasia-cf7-to-supabase.php
 * 
 * Instrucciones:
 * Pega este código al final del archivo functions.php de tu tema hijo,
 * o créalo como un nuevo snippet en el plugin "Code Snippets" / "WPCode".
 * ==============================================================================
 */

add_action('wpcf7_mail_sent', 'ihasia_sync_wise_booking_to_supabase');

function ihasia_sync_wise_booking_to_supabase($contact_form) {
    // 1. Obtener la instancia de datos enviados
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) {
        return;
    }

    $posted_data = $submission->get_posted_data();

    // 2. Comprobar que sea estrictamente uno de los formularios de reservas Wise por título
    $form_title = method_exists($contact_form, 'title') ? $contact_form->title() : '';
    $allowed_titles = ['Reserva por Wise', 'Wise Booking'];
    
    if (!in_array($form_title, $allowed_titles, true)) {
        return; // No es ninguno de los dos formularios de Wise, salir inmediatamente
    }

    // Doble verificación: comprobar campos clave
    if (!isset($posted_data['fecha_reserva']) || !isset($posted_data['nombre_cliente'])) {
        return;
    }

    // 3. Credenciales de Supabase
    $supabase_url = 'https://mowoxxyusicasgxouhxv.supabase.co';
    $supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd294eHl1c2ljYXNneG91aHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODk2OTIsImV4cCI6MjA5MTc2NTY5Mn0.4hgAY3LGwVBR3M_KknIgnoFJ7WSSbJDxkSVYlKUyeTE';

    // 4. Extraer campos
    $fecha_reserva = !empty($posted_data['fecha_reserva']) ? sanitize_text_field($posted_data['fecha_reserva']) : null;
    $nombre_cliente = !empty($posted_data['nombre_cliente']) ? sanitize_text_field($posted_data['nombre_cliente']) : '';
    $whatsapp = !empty($posted_data['whatsapp']) ? sanitize_text_field($posted_data['whatsapp']) : '';
    $titular_wise = !empty($posted_data['titular_wise']) ? sanitize_text_field($posted_data['titular_wise']) : '';
    $is_english = (isset($posted_data['is_english']) && $posted_data['is_english'] === 'true') ? true : false;

    // Nombre que aparecerá en Wise (si especificó titular usamos titular, sino su nombre)
    $sender_name = !empty($titular_wise) ? $titular_wise : $nombre_cliente;

    // 5. Desglose de actividades con NOMBRES OFICIALES DEL ERP (idénticos a Bizum)
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

    // Si no marcó ninguna actividad con contador pero envió el form, pax mínimo 1
    if ($total_pax < 1) {
        $total_pax = !empty($posted_data['total_pax']) ? intval($posted_data['total_pax']) : 1;
        if ($total_pax < 1) $total_pax = 1;
    }

    // Formato exacto de Bizum (ej: "Open Water", "Bautizo, Open Water")
    $activity_summary = !empty($summary_parts) ? implode(', ', $summary_parts) : 'Open Water';

    // 6. ENVIAR A SUPABASE (El trigger bidireccional en Supabase reconcilia automáticamente)
    $headers = [
        'apikey'        => $supabase_key,
        'Authorization' => 'Bearer ' . $supabase_key,
        'Content-Type'  => 'application/json',
        'Prefer'        => 'return=minimal'
    ];

    $post_url = "{$supabase_url}/rest/v1/wise_payments";
    $web_id   = 'WEB_' . date('Ymd_His') . '_' . wp_rand(100, 999);

    $post_payload = [
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

    wp_remote_post($post_url, [
        'headers' => $headers,
        'body'    => wp_json_encode($post_payload),
        'timeout' => 5
    ]);
}
