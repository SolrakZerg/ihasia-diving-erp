<?php

// THIS WILL ALLOW ADDING CUSTOM CSS TO THE style.css FILE and JS code to /js/zn_script_child.js

add_action( 'wp_enqueue_scripts', 'kl_child_scripts',11 );
function kl_child_scripts() {

	wp_deregister_style( 'kallyas-styles' );
    wp_enqueue_style( 'kallyas-styles', get_template_directory_uri().'/style.css', '' , ZN_FW_VERSION );
    wp_enqueue_style( 'kallyas-child', get_stylesheet_uri(), array('kallyas-styles') , ZN_FW_VERSION );

	/**
	 **** Uncomment this line if you want to add custom javascript file
	 */
	// wp_enqueue_script( 'zn_script_child', get_stylesheet_directory_uri() .'/js/zn_script_child.js' , '' , ZN_FW_VERSION , true );

}

/* ======================================================== */

/**
 * Load child theme's textdomain.
 */
add_action( 'after_setup_theme', 'kallyasChildLoadTextDomain' );
function kallyasChildLoadTextDomain(){
   load_child_theme_textdomain( 'zn_framework', get_stylesheet_directory().'/languages' );
}

/* ======================================================== */

/**
 * Example code loading JS in Header. Uncomment to use.
 */

/* ====== REMOVE COMMENT

add_action('wp_head', 'KallyasChild_loadHeadScript' );
function KallyasChild_loadHeadScript(){

	echo '
	<script type="text/javascript">

	// Your JS code here

	</script>';

}
 ====== REMOVE COMMENT */

/* ======================================================== */

/**
 * Example code loading JS in footer. Uncomment to use.
 */

/* ====== REMOVE COMMENT

add_action('wp_footer', 'KallyasChild_loadFooterScript' );
function KallyasChild_loadFooterScript(){

	echo '
	<script type="text/javascript">

	// Your JS code here

	</script>';

}
 ====== REMOVE COMMENT */

/* ======================================================== */




/* ======================================================== */
/* 			Anchos personalizados para bloque del blog */
/* ======================================================== */
function custom_admin_css() {
echo '<style type="text/css">
/* Contenido por defecto (textos y otros) */
.wp-block {     max-width: 1100px; }

/* Ancho establecido como "Amplio" del Bloque (imágenes y otros) */
.wp-block[data-align="wide"] {     max-width: 1170px;}

/* Ancho establecido como "Completo" del Bloque (imágenes y otros) */
.wp-block[data-align="full"] {    max-width: none;}
</style>';
}
add_action('admin_head', 'custom_admin_css');

add_theme_support( 'wp-block-styles' );
add_theme_support( 'align-wide' );



/* ======================================================== */
/* PROCESAR NUMEROS DE WhatsApp para recibirlos en el  mail */
/* ======================================================== */
function custom_cf7_process_whatsapp( $posted_data ) {
    // Asegúrate de que el campo 'whatsapp' existe y no está vacío
    if ( isset( $posted_data['whatsapp'] ) && ! empty( trim( $posted_data['whatsapp'] ) ) ) {
        
        // 1. Limpia espacios en blanco y guiones (más robusto)
        $whatsapp_number = preg_replace( '/[\s-]+/', '', $posted_data['whatsapp'] );
        
        // 2. Comprueba si YA empieza con '+' (prefijo internacional)
        //    O si empieza con '00' (otra forma de prefijo internacional)
        //    O si tiene una longitud típica de número español con prefijo (12 dígitos: +34 y 9 más)
        //    (Puedes ajustar esta lógica si recibes muchos números de otros países)
        if ( substr( $whatsapp_number, 0, 1 ) !== '+' && substr( $whatsapp_number, 0, 2 ) !== '00' && strlen( $whatsapp_number ) === 9 ) {
            // Si NO empieza con '+' o '00' Y tiene 9 dígitos (número español típico sin prefijo)
            // Añade el prefijo +34
            $whatsapp_number = '+34' . $whatsapp_number;
        } elseif ( substr( $whatsapp_number, 0, 2 ) === '00' ) {
            // Si empieza con '00', reemplázalo por '+'
            $whatsapp_number = '+' . substr( $whatsapp_number, 2 );
        }
        
        // 3. Quita cualquier '+' EXTRA que pudiera quedar al principio si lo pusieron mal
        //    (Ej: si pusieron ++34...) Esto es opcional pero seguro.
        // $whatsapp_number = ltrim( $whatsapp_number, '+' );
        // $whatsapp_number = '+' . $whatsapp_number; 
        // --> Mejor no hacer esto, podría quitar un + válido. La lógica anterior ya debería manejarlo.

        // 4. Actualiza el valor en los datos enviados
        $posted_data['whatsapp'] = $whatsapp_number;
    }

    return $posted_data;
}

add_filter( 'wpcf7_posted_data', 'custom_cf7_process_whatsapp' ); 



/* ========================================================	 */
/* Para accesibilidad poder hacer zoom con dedos en mobil	 */
/* ========================================================  */
function ihasia_custom_viewport_meta_tag_buffer_start() {
    ob_start();
}
function ihasia_custom_viewport_meta_tag_buffer_end() {
    $buffer = ob_get_clean();
    // Esta expresión regular busca CUALQUIER etiqueta meta viewport y la reemplaza por la nuestra.
    // La 'i' al final la hace insensible a mayúsculas/minúsculas.
    $buffer = preg_replace( '/<meta name=["\']viewport["\'][^>]*>/i', '<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">', $buffer );
    echo $buffer;
}
// Engancha estas funciones a hooks que se ejecutan muy temprano y muy tarde.
add_action( 'template_redirect', 'ihasia_custom_viewport_meta_tag_buffer_start', 0 );
add_action( 'shutdown', 'ihasia_custom_viewport_meta_tag_buffer_end', 0 );



/* ========================================================	 */
/* Para shortcode del ano actual en el Footer	 */
/* ========================================================  */
function anio_actual_shortcode() {
    return date('Y');
}
add_shortcode('anio_actual', 'anio_actual_shortcode');


/* ========================================================	 */
/* Para enviar_datos_a_google_sheet desde form de resgitro	 */
/* ========================================================  */

add_action( 'wpcf7_mail_sent', 'ihasia_enviar_datos_a_google_sheet_final' );

function ihasia_enviar_datos_a_google_sheet_final( $contact_form ) {
    
    $form_id_numerico = $contact_form->id(); 
     error_log( '[IHASIA_GS_LOG] Hook disparado. FORM ID NUMÉRICO DETECTADO: ' . $form_id_numerico ); 

    $formularios_objetivo_ids = array( 14284, 14291 ); 

    if ( !in_array( $form_id_numerico, $formularios_objetivo_ids ) ) {
         error_log( '[IHASIA_GS_LOG] Formulario ID ' . $form_id_numerico . ' NO es objetivo. Saliendo.' );
        return; 
    }

     error_log( '[IHASIA_GS_LOG] Formulario ID ' . $form_id_numerico . ' ES objetivo. Procesando...' );

    $submission = WPCF7_Submission::get_instance();

    if ( $submission ) {
        $datos_enviados = $submission->get_posted_data();
        $datos_para_enviar_a_google = array();

        // === INICIO: Mapeo de Datos ===
        $datos_para_enviar_a_google['Timestamp'] = current_time('mysql'); 
        $datos_para_enviar_a_google['Correo'] = isset($datos_enviados['your-email']) ? $datos_enviados['your-email'] : '';
        $datos_para_enviar_a_google['Fecha Actividad'] = isset($datos_enviados['activity-date']) ? $datos_enviados['activity-date'] : '';
        $datos_para_enviar_a_google['Fecha Nacimiento'] = isset($datos_enviados['date-of-birth']) ? $datos_enviados['date-of-birth'] : '';
        $datos_para_enviar_a_google['Nombre'] = isset($datos_enviados['first-name']) ? $datos_enviados['first-name'] : '';
        $datos_para_enviar_a_google['Apellidos'] = isset($datos_enviados['last-name']) ? $datos_enviados['last-name'] : '';
        $datos_para_enviar_a_google['Genero'] = isset($datos_enviados['reg-gender']) ? implode(', ', (array)$datos_enviados['reg-gender']) : ''; 
        $datos_para_enviar_a_google['Pasaporte'] = isset($datos_enviados['passport-no']) ? $datos_enviados['passport-no'] : '';
        $datos_para_enviar_a_google['Actividad'] = isset($datos_enviados['reg-actividad']) ? implode(', ', (array)$datos_enviados['reg-actividad']) : '';
        $datos_para_enviar_a_google['Contacto Emergencia'] = isset($datos_enviados['emergency-contact']) ? $datos_enviados['emergency-contact'] : '';
        $datos_para_enviar_a_google['WhatsApp'] = isset($datos_enviados['whatsapp']) ? $datos_enviados['whatsapp'] : '';
        $datos_para_enviar_a_google['Direccion'] = isset($datos_enviados['address']) ? $datos_enviados['address'] : '';
        
        $datos_para_enviar_a_google['Como Nos Conociste'] = '';
        if (isset($datos_enviados['how-did-you-find-us'])) {
            $valor = $datos_enviados['how-did-you-find-us'];
            $datos_para_enviar_a_google['Como Nos Conociste'] = is_array($valor) ? reset($valor) : $valor;
        }

        $datos_para_enviar_a_google['Nivel Buceador'] = '';
        if (isset($datos_enviados['diver-level'])) {
            $valor = $datos_enviados['diver-level'];
            $datos_para_enviar_a_google['Nivel Buceador'] = is_array($valor) ? reset($valor) : $valor;
        }
		
        $datos_para_enviar_a_google['Numero Buceos'] = '';
        if (isset($datos_enviados['dive-numbers'])) {
            $valor = $datos_enviados['dive-numbers'];
            $datos_para_enviar_a_google['Numero Buceos'] = is_array($valor) ? reset($valor) : $valor;
        }

        $datos_para_enviar_a_google['Fecha Ultimo Buceo'] = '';
        if (isset($datos_enviados['last-dive-date'])) {
            $valor = $datos_enviados['last-dive-date'];
            $datos_para_enviar_a_google['Fecha Ultimo Buceo'] = is_array($valor) ? reset($valor) : $valor;
        }
        
        $datos_para_enviar_a_google['Origen Formulario'] = isset($datos_enviados['source-page']) ? $datos_enviados['source-page'] : 'Desde Web (Origen no especificado)';
        // === FIN: Mapeo de Datos ===

        $url_webhook_google = 'https://script.google.com/macros/s/AKfycbw9zzVswcoWykd2rXsJMrGX8uNt86PMm8EvVcq-gHq254e_aLZyWZxZ0p8rr1wDWGk/exec';

         error_log( '[IHASIA_GS_LOG] Datos que se van a enviar a Google Sheet (Form ID ' . $form_id_numerico . '): ' . print_r( $datos_para_enviar_a_google, true ) );

        $argumentos_peticion = array(
            'method'      => 'POST',
            'timeout'     => 25,
            'blocking'    => true, 
            'body'        => $datos_para_enviar_a_google,
        );
        
         error_log( '[IHASIA_GS_LOG] Argumentos COMPLETOS para wp_remote_post (Form ID ' . $form_id_numerico . '): ' . print_r( $argumentos_peticion, true ) );

        $respuesta_google = wp_remote_post( $url_webhook_google, $argumentos_peticion );

        // --- Logging para depuración (Descomenta si necesitas ver la respuesta completa de Google) ---
        
        if ( is_wp_error( $respuesta_google ) ) {
            $titulo_formulario_log = method_exists($contact_form, 'title') ? $contact_form->title() : 'ID '.$form_id_numerico;
            error_log( '[IHASIA_GS_LOG] Error en wp_remote_post (Form: ' . $titulo_formulario_log . '): ' . $respuesta_google->get_error_message() );
        } else {
            $cuerpo_respuesta = wp_remote_retrieve_body( $respuesta_google );
            $codigo_respuesta = wp_remote_retrieve_response_code( $respuesta_google );
            $titulo_formulario_log = method_exists($contact_form, 'title') ? $contact_form->title() : 'ID '.$form_id_numerico;
            error_log( '[IHASIA_GS_LOG] Éxito wp_remote_post (Form: ' . $titulo_formulario_log . '): Status ' . $codigo_respuesta . ' - Body: ' . $cuerpo_respuesta );
            
            if ( $codigo_respuesta == 200 && !empty($cuerpo_respuesta) ) {
                $respuesta_json_google = json_decode( $cuerpo_respuesta, true );
                if ( $respuesta_json_google === null && json_last_error() !== JSON_ERROR_NONE ) {
                    error_log( '[IHASIA_GS_LOG] Error al decodificar JSON de Google Apps Script. Body recibido: ' . $cuerpo_respuesta );
                } elseif ( isset($respuesta_json_google['result']) && $respuesta_json_google['result'] === 'error' ) {
                    error_log( '[IHASIA_GS_LOG] Google Apps Script devolvió un error (Form: ' . $titulo_formulario_log . '): ' . (isset($respuesta_json_google['error']) ? print_r($respuesta_json_google['error'], true) : 'Error desconocido de Apps Script') );
                }
            } elseif ($codigo_respuesta != 200) {
                 error_log( '[IHASIA_GS_LOG] Google Apps Script devolvió un código de estado no exitoso: ' . $codigo_respuesta . ' - Body: ' . $cuerpo_respuesta );
            }
        }
        
    } else {
         error_log( '[IHASIA_GS_LOG] No se pudo obtener WPCF7_Submission para form ID: ' . $form_id_numerico );
    }
}

function wp2356_change_logo_tag() {
    return 'div';
}
add_filter( 'zn_logo_tag', 'wp2356_change_logo_tag', 50 );