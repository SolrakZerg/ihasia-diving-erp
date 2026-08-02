// ################################################################################
// GOOGLE APPS SCRIPT: WiseGmailToSupabase
// Descripción: Busca correos de depósitos recibidos en Wise, extrae la información
//              y la envía automáticamente a la base de datos de Supabase.
// Instrucciones de instalación:
// 1. Abre https://script.google.com en la cuenta de Gmail donde recibes notificaciones de Wise.
// 2. Crea un nuevo proyecto y pega este código reemplazando todo.
// 3. Ve a la Configuración del Proyecto (icono de engranaje a la izquierda).
// 4. Baja a "Propiedades del script" y añade:
//    - SUPABASE_URL: (Tu VITE_SUPABASE_URL del archivo .env)
//    - SUPABASE_KEY: (Tu VITE_SUPABASE_ANON_KEY del archivo .env)
// 5. Guarda el proyecto y pulsa en "Ejecutar" para autorizar permisos.
// 6. Crea un activador (Trigger) de tipo "Basado en tiempo" para ejecutarse cada 10 o 15 minutos.
// ################################################################################

const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL'); 
const SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

function syncWisePayments() {
  Logger.log("Iniciando sincronización de pagos de Wise...");
  
  // 1. Buscar correos de Wise en Gmail (último día)
  const query = 'from:noreply@wise.com subject:"Dinero recibido de" newer_than:1d';
  const threads = GmailApp.search(query);
  Logger.log(`Se encontraron ${threads.length} hilos de correo recientes.`);
  
  processThreads(threads);
}

/**
 * Procesa los hilos encontrados y los sube a Supabase
 */
function processThreads(threads) {
  const paymentsToUpsert = [];
  
  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      const body = message.getPlainBody();
      const subject = message.getSubject();
      
      const parsedData = parseWiseEmail(body, subject);
      if (parsedData) {
        // Usar la fecha del correo
        const emailDate = message.getDate();
        
        // Calcular la estimación del número de personas (Pax)
        let numPeople = 1;
        if (parsedData.currency === "THB") {
          numPeople = Math.round(parsedData.amount / 1000);
        } else {
          // Si llega en EUR u otra divisa, estimamos en base a la regla de ~25 por persona
          numPeople = Math.round(parsedData.amount / 25.0);
        }
        
        // Evitar que el número de personas sea menor a 1
        if (numPeople < 1) numPeople = 1;
        
        paymentsToUpsert.push({
          id: parsedData.transferId,
          created_at: emailDate.toISOString(),
          sender_name: parsedData.sender,
          amount_raw: parsedData.amount,
          currency: parsedData.currency,
          amount_eur: parsedData.amount, // Se envía el importe tal cual
          num_people: numPeople,
          reference: parsedData.reference,
          is_processed: false
        });
      } else {
        Logger.log(`No se pudo parsear el correo con Asunto: "${subject}". Enviando cuerpo completo a base de datos para depuración.`);
        
        // INSERTAR REGISTRO DE DEPURACIÓN EN LA BASE DE DATOS
        paymentsToUpsert.push({
          id: "DEBUG_" + message.getId(),
          created_at: message.getDate().toISOString(),
          sender_name: "DEBUG PARSE FAIL: " + subject,
          amount_raw: 0,
          currency: "EUR",
          amount_eur: 0,
          num_people: 1,
          reference: "FAIL_DEBUG",
          notes: body,
          is_processed: true
        });
      }
    }
  }
  
  Logger.log(`Procesados ${paymentsToUpsert.length} pagos para enviar a Supabase.`);
  
  // Enviar a Supabase
  if (paymentsToUpsert.length > 0) {
    const supabaseEndpoint = `${SUPABASE_URL}/rest/v1/wise_payments`;
    
    for (let k = 0; k < paymentsToUpsert.length; k++) {
      const payload = paymentsToUpsert[k];
      try {
        const options = {
          method: "post",
          contentType: "application/json",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Prefer": "resolution=merge-duplicates"
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };
        
        const response = UrlFetchApp.fetch(supabaseEndpoint, options);
        const code = response.getResponseCode();
        if (code >= 200 && code < 300) {
          Logger.log(`Pago ID ${payload.id} (${payload.sender_name}) sincronizado con éxito.`);
        } else {
          Logger.log(`Error al subir Pago ID ${payload.id}. Código: ${code}. Respuesta: ${response.getContentText()}`);
        }
      } catch (e) {
        Logger.log(`Excepción al enviar pago a Supabase: ${e}`);
      }
    }
  }
  
  Logger.log("Sincronización finalizada.");
}

/**
 * Parsea el texto del correo de Wise de forma robusta.
 */
function parseWiseEmail(body, subject) {
  // 1. Intentar buscar por el párrafo inicial: "Has recibido X de Y."
  const firstLineMatch = body.match(/Has recibido\s+([0-9.,]+)\s+([A-Z]{3})\s+de\s+([^\r\n.]+)/i);
  
  let sender = "";
  let amountStr = "";
  let currency = "";

  if (firstLineMatch) {
    amountStr = firstLineMatch[1].trim();
    currency = firstLineMatch[2].trim();
    sender = firstLineMatch[3].trim();
  } else {
    // Buscar por partes en la estructura del correo (con lookaheads para parar en el siguiente campo)
    const deMatch = body.match(/De:?\s*(.*?)(?=\s*Cantidad recibida:|\r|\n|$)/i);
    const qtyMatch = body.match(/Cantidad recibida:?\s*([0-9.,]+)\s*([A-Z]{3})/i);
    if (deMatch) sender = deMatch[1].trim();
    if (qtyMatch) {
      amountStr = qtyMatch[1].trim();
      currency = qtyMatch[2].trim();
    }
  }

  // Si no se encuentra el remitente en el cuerpo, extraerlo como fallback del Asunto
  if (!sender && subject) {
    const subjectMatch = subject.match(/Dinero recibido de\s+([^\r\n\-]+)/i);
    if (subjectMatch) sender = subjectMatch[1].trim();
  }

  // 2. Extraer Referencia e ID de transferencia tolerando saltos de línea en el texto "Número de transferencia"
  const refMatch = body.match(/Referencia:?\s*(.*?)(?=\s*N[uú]mero\s+de\s+transferencia:|\r|\n|$)/i);
  const numMatch = body.match(/N[uú]mero\s+de\s+transferencia:?\s*#?([0-9]+)/i);

  const reference = refMatch ? refMatch[1].trim() : "";
  const transferId = numMatch ? numMatch[1].trim() : "";

  // Validaciones mínimas necesarias para procesar la transacción
  if (!sender || !amountStr || !transferId) {
    return null; 
  }

  // Convertir el importe al formato numérico JS (tolerando formato español de comas/puntos)
  let amount = 0;
  if (amountStr.indexOf(",") !== -1) {
    amount = parseFloat(amountStr.replace(/\./g, "").replace(",", "."));
  } else {
    amount = parseFloat(amountStr.replace(/\./g, ""));
  }

  return {
    sender: sender,
    amount: amount,
    currency: currency.toUpperCase(),
    reference: reference,
    transferId: transferId
  };
}
