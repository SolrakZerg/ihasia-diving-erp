// Archivo: CalendarioUtil.gs

// === CONFIGURACIÓN DEL EVENTO DE CALENDARIO ===
var CALENDAR_ID_UTIL = "ihasiakohtao@gmail.com"; // ¡REEMPLAZA ESTO!
var PRECIO_POR_PERSONA_UTIL = 25;

// === FUNCIÓN AUXILIAR PARA OBTENER CÓDIGO DE ACTIVIDAD ===
function obtenerCodigoActividad(nombreActividad) {
  if (!nombreActividad || typeof nombreActividad !== 'string') return "ACT";
  var actividadUpper = nombreActividad.toUpperCase().trim();
  if (actividadUpper.includes("BAUTIZO")) return "DSD";
  if (actividadUpper.includes("OPENWATER") || actividadUpper.includes("OPEN WATER")) return "OWE";
  if (actividadUpper.includes("AVANZADO")) return "AA";
  if (actividadUpper.includes("REFRESH")) return "SR";
  if (actividadUpper.includes("FUNDIVES") || actividadUpper.includes("FUN DIVES") || actividadUpper.includes("FUN DIVE")) return "FD";
  return actividadUpper.substring(0, 3).replace(/\s+/g, '') || "ACT";
}

// === NUEVA FUNCIÓN PARA PREPARAR TODOS LOS DATOS NECESARIOS ===
function prepararDatosParaCalendarioYDialogo(datosBrutos) {
  // ... (inicio de la función sin cambios: nombreCliente, actividadOriginal, numPersonasInt, codigoActividad, tituloEvento, precioTotalCalculado) ...
  var nombreCliente = datosBrutos.nombreCliente || "Cliente";
  var actividadOriginal = datosBrutos.actividadOriginal || "Actividad no especificada";
  
  var numPersonasInt = parseInt(datosBrutos.numPersonasRaw, 10);
  if (isNaN(numPersonasInt) || numPersonasInt <= 0) {
    numPersonasInt = 1;
    Logger.log("CalendarioUtil.prepararDatos: Número de personas (" + datosBrutos.numPersonasRaw + ") inválido. Usando 1.");
  }

  var codigoActividad = obtenerCodigoActividad(actividadOriginal);
  var tituloEvento = nombreCliente + " " + codigoActividad + " x" + numPersonasInt;
  var precioTotalCalculado = numPersonasInt * PRECIO_POR_PERSONA_UTIL;


  var fechaReservaTimestamp = null;
  var fechaFormateadaParaWhatsapp = "fecha desconocida";
  var fechaFormateadaParaCalendario = "fecha desconocida"; // Para mostrar en el diálogo y mensaje de éxito
  var fechaParaLinkCalendario = ""; // Para el enlace yyyyMMdd

  if (datosBrutos.fechaReservaValue instanceof Date && !isNaN(datosBrutos.fechaReservaValue)) {
    fechaReservaTimestamp = datosBrutos.fechaReservaValue.getTime();
    var fechaObj = new Date(datosBrutos.fechaReservaValue);
    
    var diaNombre = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var mesNombreWhatsapp = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    fechaFormateadaParaWhatsapp = diaNombre[fechaObj.getDay()] + ", " + fechaObj.getDate() + " de " + mesNombreWhatsapp[fechaObj.getMonth()] + " de " + fechaObj.getFullYear();

    var mesNombreCalendario = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    fechaFormateadaParaCalendario = fechaObj.getDate() + " " + mesNombreCalendario[fechaObj.getMonth()] + " " + fechaObj.getFullYear();

    // Formato para el enlace del calendario (yyyyMMdd)
    var yyyy = fechaObj.getFullYear();
    var mm = (fechaObj.getMonth() + 1).toString().padStart(2, '0'); // Meses son 0-indexados
    var dd = fechaObj.getDate().toString().padStart(2, '0');
    fechaParaLinkCalendario = yyyy + mm + dd;
  }

  // ... (construcción de mensajeWhatsappCompleto, whatsappLinkParaDialogo sin cambios) ...
  var primerNombre = (nombreCliente && nombreCliente.toString().trim() !== "") ? nombreCliente.toString().split(" ")[0] : "Cliente";
  var mensajeOriginalWhatsapp = "Hola " + primerNombre + ", gracias por tu reserva de " + numPersonasInt + " persona(s) para " + actividadOriginal + " el " + fechaFormateadaParaWhatsapp + ".";
  var enlaceRegistro = "https://ihasiadivingkohtao.com/registro";
  var instruccionesAdicionales = "Ya puedes realizar los registros necesarios en " + enlaceRegistro + "\n\n" + "Ahí encontrarás las instrucciones para hacerlo, cualquier duda nos comentas. Saludos y hasta pronto.";
  var mensajeWhatsappCompleto = mensajeOriginalWhatsapp + "\n\n" + instruccionesAdicionales; 

  var telefonoClienteLimpio = "";
  var whatsappLinkParaDialogo = "ERROR_NO_PHONE";

  if (datosBrutos.telefonoClienteRaw && datosBrutos.telefonoClienteRaw.toString().trim() !== "") {
    var tempTel = datosBrutos.telefonoClienteRaw.toString().trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (!tempTel.startsWith('+')) {
      if (tempTel.length >= 9) tempTel = "+34" + tempTel;
      else tempTel = "INVALID_PHONE_FORMAT";
    }
    if (tempTel.startsWith('+')) {
      telefonoClienteLimpio = tempTel;
      whatsappLinkParaDialogo = "https://wa.me/" + telefonoClienteLimpio + "?text=" + encodeURIComponent(mensajeWhatsappCompleto);
    }
  }
  
  var enlaceWhatsappParaDescripcionCal = telefonoClienteLimpio ? "https://wa.me/" + telefonoClienteLimpio.replace("+", "") : "Teléfono no disponible";
  var descripcionEvento = enlaceWhatsappParaDescripcionCal + "\n\n" +
                          "<b>" + tituloEvento + "</b>\n\n" +
                          "<ul>" +
                          "<li>Fecha de inicio: <b>" + fechaFormateadaParaCalendario + "</b></li>" +
                          "<li>Reserva: <b>" + numPersonasInt + " personas -> " + precioTotalCalculado + "€ a BIZUM</b></li>" +
                          "</ul>";

  return {
    whatsappLink: whatsappLinkParaDialogo,
    nombreCliente: nombreCliente,
    actividadOriginal: actividadOriginal,
    codigoActividad: codigoActividad,
    numPersonas: numPersonasInt,
    fechaReservaTimestamp: fechaReservaTimestamp,
    telefonoClienteLimpio: telefonoClienteLimpio,
    mensajeWhatsappCompleto: mensajeWhatsappCompleto,
    tituloEvento: tituloEvento,
    descripcionEvento: descripcionEvento,
    fechaFormateadaParaCalendario: fechaFormateadaParaCalendario, // <--- Asegurarse que se devuelve
    fechaParaLinkCalendario: fechaParaLinkCalendario             // <--- Nueva para el enlace
  };
}


// === FUNCIÓN PARA CREAR EVENTO EN CALENDARIO (USANDO SERVICIO AVANZADO) ===
function crearEventoCalendario(datosEventoCliente) {
  try {
    if (!datosEventoCliente || !datosEventoCliente.fechaReservaTimestamp || !datosEventoCliente.tituloEvento) {
      Logger.log("CalendarioUtil.crearEventoCalendario: Faltan datos, fecha o título.");
      return { success: false, message: "Error: Faltan datos para crear el evento." };
    }

    // El servicio avanzado usa el ID del calendario directamente
    var calendarId = CALENDAR_ID_UTIL; 

    var fechaReserva = new Date(datosEventoCliente.fechaReservaTimestamp);
    
    // El servicio avanzado espera la fecha en formato YYYY-MM-DD para eventos de día completo
    var year = fechaReserva.getFullYear();
    var month = (fechaReserva.getMonth() + 1).toString().padStart(2, '0'); // Meses 0-indexados
    var day = fechaReserva.getDate().toString().padStart(2, '0');
    var fechaParaAPI = year + "-" + month + "-" + day;

    var eventoResource = {
      summary: datosEventoCliente.tituloEvento,
      description: datosEventoCliente.descripcionEvento,
      start: {
        date: fechaParaAPI // Para eventos de día completo
      },
      end: {
        date: fechaParaAPI // Para eventos de día completo (o el día siguiente si es exclusivo)
                           // Para que sea inclusivo del día, start y end date suelen ser el mismo
                           // o end.date es el día siguiente al que queremos que termine.
                           // Por simplicidad para un evento de un solo día completo, usamos la misma fecha.
      },
      colorId: "9" // color del evento
      // Podrías añadir recordatorios aquí si lo necesitas, similar a tu Python
      // "reminders": {
      //   "useDefault": false,
      //   "overrides": [] // o [{ "method": "popup", "minutes": 10 }]
      // }
    };

    // Usar el servicio avanzado de Calendario (el objeto se llama 'Calendar')
    var eventoCreadoRespuestaAPI = Calendar.Events.insert(eventoResource, calendarId);
    
    if (eventoCreadoRespuestaAPI && eventoCreadoRespuestaAPI.htmlLink) {
      var htmlLink = eventoCreadoRespuestaAPI.htmlLink;
      Logger.log("CalendarioUtil.crearEventoCalendario (API Avanzada): Evento creado: '" + datosEventoCliente.tituloEvento + 
                 "'. Enlace: " + htmlLink);
      
      return { 
        success: true, 
        message: "¡Evento '" + datosEventoCliente.tituloEvento + "' creado en tu calendario!", 
        htmlLink: htmlLink, // Devolvemos el enlace HTML directo de la API
        tituloEvento: datosEventoCliente.tituloEvento 
      };
    } else {
      Logger.log("CalendarioUtil.crearEventoCalendario (API Avanzada): No se pudo obtener htmlLink de la respuesta de la API.");
      Logger.log("Respuesta de la API: " + JSON.stringify(eventoCreadoRespuestaAPI));
      return { success: false, message: "Error: No se pudo obtener el enlace del evento creado." };
    }

  } catch (error) {
    Logger.log("CalendarioUtil.crearEventoCalendario (API Avanzada): Error - " + error.toString() + " Stack: " + error.stack);
    var errorMessage = "Error al crear evento (API Avanzada): " + error.message;
    // ... (manejo de errores de permisos como antes, aunque el scope es el mismo) ...
    if (error.message.includes("API call to calendar.events.insert failed with error: Forbidden") || error.message.includes("Not Found")) {
         errorMessage = "Error: No se pudo acceder al calendario o no se encontró. Verifica el ID ('" + CALENDAR_ID_UTIL + "') y permisos.";
    }
    return { success: false, message: errorMessage };
  }
}

function testCalendarPermissions() {
  try {
    var calendar = CalendarApp.getDefaultCalendar();
    Logger.log("Acceso al calendario por defecto exitoso. Nombre: " + calendar.getName());
    // Si quieres probar la creación, pero puede dar error si no hay eventos en un día específico
    // var events = calendar.getEventsForDay(new Date());
    // Logger.log("Número de eventos para hoy: " + events.length);
  } catch (e) {
    Logger.log("Error en testCalendarPermissions: " + e.toString());
  }
}