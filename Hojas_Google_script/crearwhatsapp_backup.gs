// === CONFIGURACIÓN DE COLUMNAS ===
// ... (tus constantes de columnas y hoja) ...
var COL_FECHA_RESERVA = 2;    // Columna B
var COL_NOMBRE = 3;           // Columna C
var COL_NUM_PERSONAS = 4;     // Columna D
var COL_ACTIVIDAD = 5;        // Columna E
var COL_TELEFONO_BIZUM = 6; // No se usa en esta lógica específica
var COL_TELEFONO = 7;         // Columna G
var COL_ENLACE_WHATSAPP_SIMPLE = 8; // No se usa directamente aquí
var COL_PAGADO = 9;           // Columna I
var COL_DEVUELTO = 10;        // Columna J
var COL_MENSAJE_WHATSAPP = 11;// Columna K
var TARGET_SHEET_NAME = "Reservas";
var FIRST_DATA_ROW = 2;

// === FUNCIÓN onFormSubmit (CORREGIDA Y COMPLETA) ===
function onFormSubmit(e) {
  if (!e || !e.range || !e.source) {
    Logger.log("onFormSubmit: Evento no válido. Saliendo.");
    return;
  }
  var formResponseSheet = e.range.getSheet();
  var formInsertedRow = e.range.getRow(); 

  Logger.log("onFormSubmit: Script ejecutado. Hoja Forms: '" + formResponseSheet.getName() + "'. Rango original: " + e.range.getA1Notation());
  Logger.log("onFormSubmit: Fila donde Forms insertó (y donde se procesará): " + formInsertedRow);

  if (formResponseSheet.getName() !== TARGET_SHEET_NAME) {
    Logger.log("onFormSubmit: Hoja incorrecta ('" + formResponseSheet.getName() + "' vs '" + TARGET_SHEET_NAME + "'). Saliendo.");
    return;
  }

  var sheet = formResponseSheet;
  var processingRow = formInsertedRow;

  Logger.log("onFormSubmit: Aplicando formato y lógica a la fila: " + processingRow);
  var rowToProcessRange = sheet.getRange(processingRow, 1, 1, sheet.getLastColumn());
  // 1. Tamaño de fuente (ya lo tenías)
  rowToProcessRange.setFontSize(15);
  Logger.log("onFormSubmit: Tamaño de letra 15 aplicado.");

  // 2. Altura de Fila (NUEVO)
  var alturaDeseada = 30; // Ajusta este valor según necesites para el padding (ej. 25, 28, 30)
  sheet.setRowHeight(processingRow, alturaDeseada);
  Logger.log("onFormSubmit: Altura de fila " + processingRow + " establecida a " + alturaDeseada);

  // 3. Alineación Vertical (NUEVO)
  rowToProcessRange.setVerticalAlignment("middle");
  Logger.log("onFormSubmit: Alineación vertical 'middle' aplicada a la fila " + processingRow);
  
  // 4. Color de Texto (NUEVO)
  var colorDeTextoDeseado = "#434343";
  rowToProcessRange.setFontColor(colorDeTextoDeseado);
  Logger.log("onFormSubmit: Color de texto '" + colorDeTextoDeseado + "' aplicado a la fila " + processingRow);
  // --- FIN DE FORMATO BÁSICO DE FILA ---

  var fechaReservaCell = sheet.getRange(processingRow, COL_FECHA_RESERVA);
  var fechaOriginal = fechaReservaCell.getValue();
  // --- LOG DE DIAGNÓSTICO ---
  Logger.log("onFormSubmit - DIAGNÓSTICO FECHA BIZUM:");
  Logger.log("  Fila: " + processingRow);
  Logger.log("  Valor crudo de la celda (fechaOriginal): " + fechaOriginal);
  Logger.log("  Tipo de dato (typeof fechaOriginal): " + typeof fechaOriginal);
  if (fechaOriginal !== null && fechaOriginal !== undefined) {
    Logger.log("  ¿Es instancia de Date? (fechaOriginal instanceof Date): " + (fechaOriginal instanceof Date));
    if (fechaOriginal instanceof Date) {
      Logger.log("  ¿Es una fecha válida? (!isNaN(fechaOriginal)): " + !isNaN(fechaOriginal));
    }
  }
  Logger.log("  Formato actual de la celda (getNumberFormat()): " + fechaReservaCell.getNumberFormat());
  // --- FIN LOG DE DIAGNÓSTICO ---


  if (fechaOriginal instanceof Date && !isNaN(fechaOriginal)) {
    fechaReservaCell.setNumberFormat('dd mmm yyyy');
    Logger.log("onFormSubmit: Formato de fecha 'dd mmm yyyy' aplicado a B" + processingRow);
  } else {
    Logger.log("onFormSubmit: No se aplicó formato de fecha a B" + processingRow + ". Valor: " + fechaOriginal);
  }

  // --- CENTRAR NÚMERO DE PERSONAS (COLUMNA D) ---
  sheet.getRange(processingRow, COL_NUM_PERSONAS).setHorizontalAlignment("center");
  Logger.log("onFormSubmit: Centrado horizontal aplicado a D" + processingRow);



  // --- TELÉFONO BIZUM Y TELÉFONO ---
  var bizumCell = sheet.getRange(processingRow, COL_TELEFONO_BIZUM); 
  var telefonoCell = sheet.getRange(processingRow, COL_TELEFONO);
  var bizumPhoneNumber = bizumCell.getValue();
  var phoneNumber = telefonoCell.getValue();
  Logger.log("onFormSubmit: Valor Teléfono Bizum (F" + processingRow + "): '" + bizumPhoneNumber + "'");
  Logger.log("onFormSubmit: Valor Teléfono (G" + processingRow + "): '" + phoneNumber + "'");


  if ((!bizumPhoneNumber || bizumPhoneNumber.toString().trim() === "") && phoneNumber && phoneNumber.toString().trim() !== "") {
    var telefonoParaBizum = phoneNumber.toString().trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (!telefonoParaBizum.startsWith('+') && telefonoParaBizum.length >= 9) { 
       telefonoParaBizum = "+34" + telefonoParaBizum;
    }
    bizumCell.setValue(telefonoParaBizum);
    Logger.log("onFormSubmit: Teléfono Bizum (F" + processingRow + ") copiado y formateado: " + telefonoParaBizum);
  } else {
     if (bizumPhoneNumber && bizumPhoneNumber.toString().trim() !== "") Logger.log("onFormSubmit: No se copió Teléfono a Bizum. Col F ya tenía valor.");
     else if (!phoneNumber || phoneNumber.toString().trim() === "") Logger.log("onFormSubmit: No se copió Teléfono a Bizum. Col G (Teléfono) está vacía.");
  }

  // --- ENLACE WHATSAPP SIMPLE (COLUMNA H) ---
  var telefonoParaLinkSimple = telefonoCell.getValue(); 
  var celdaEnlaceWhatsapp = sheet.getRange(processingRow, COL_ENLACE_WHATSAPP_SIMPLE); // Obtener la celda

  if (telefonoParaLinkSimple && telefonoParaLinkSimple.toString().trim() !== "") {
    var telefonoLimpioSimple = telefonoParaLinkSimple.toString().trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (!telefonoLimpioSimple.startsWith('+') && telefonoLimpioSimple.length >= 9) {
      telefonoLimpioSimple = "+34" + telefonoLimpioSimple;
    }
    if (telefonoLimpioSimple.startsWith('+')) { 
      var urlWhatsapp = "https://wa.me/" + telefonoLimpioSimple;
      // Crear el hipervínculo usando la fórmula HYPERLINK para asegurar el estilo azul
      // O simplemente poner el valor y luego el estilo.
      // Usar setValue y luego setFontColor es más directo aquí.
      celdaEnlaceWhatsapp.setValue(urlWhatsapp);
      celdaEnlaceWhatsapp.setFontColor("#1155cc"); // Color azul estándar para enlaces en Google Sheets
      // Opcional: subrayado si quieres
      // celdaEnlaceWhatsapp.setFontLine("underline"); 
      Logger.log("onFormSubmit: Enlace WhatsApp simple (H" + processingRow + ") creado y estilizado.");
    } else {
      celdaEnlaceWhatsapp.setValue(""); // Limpiar si el teléfono es inválido
      // celdaEnlaceWhatsapp.setFontColor(null); // Restablecer al color por defecto de la fila si es necesario
      Logger.log("onFormSubmit: No se creó enlace WhatsApp simple en H" + processingRow + ". Teléfono inválido: " + telefonoLimpioSimple);
    }
  } else {
    celdaEnlaceWhatsapp.setValue(""); // Limpiar si no hay teléfono
    // celdaEnlaceWhatsapp.setFontColor(null); // Restablecer al color por defecto de la fila
    Logger.log("onFormSubmit: No se creó enlace WhatsApp simple en H" + processingRow + ". Teléfono en G" + processingRow + " vacío.");
  }

  Logger.log("onFormSubmit: Finalizada ejecución para datos en fila " + processingRow);
}

// === FUNCIÓN PRINCIPAL DISPARADA POR ACTIVADOR "AL EDITARSE" ===
function gestionarEdicionReservas(e) {
  if (!e || !e.source || !e.range) {
    Logger.log("gestionarEdicionReservas: Evento no válido. Saliendo.");
    return;
  }
  var editedSheet = e.range.getSheet();
  if (editedSheet.getName() !== TARGET_SHEET_NAME) {
    Logger.log("gestionarEdicionReservas: Edición en hoja incorrecta ('" + editedSheet.getName() + "'). Saliendo.");
    return;
  }

  var range = e.range;
  var row = range.getRow();
  var column = range.getColumn();
  var value = e.value;

  if (row < FIRST_DATA_ROW) {
    Logger.log("gestionarEdicionReservas: Edición en fila de encabezado. Saliendo.");
    return;
  }

  if (column === COL_PAGADO) {
    Logger.log("gestionarEdicionReservas: Columna PAGADO editada en fila " + row + ". Nuevo valor: " + value);
    var pagado = (value === true || (typeof value === 'string' && value.toUpperCase() === 'TRUE'));
    
    var celdaMensajeWhatsapp = editedSheet.getRange(row, COL_MENSAJE_WHATSAPP); // Celda K

    if (pagado) {
      var datosBrutosParaUtil = {
        nombreCliente: editedSheet.getRange(row, COL_NOMBRE).getValue(),
        actividadOriginal: editedSheet.getRange(row, COL_ACTIVIDAD).getValue(),
        numPersonasRaw: editedSheet.getRange(row, COL_NUM_PERSONAS).getValue(),
        fechaReservaValue: editedSheet.getRange(row, COL_FECHA_RESERVA).getValue(),
        telefonoClienteRaw: editedSheet.getRange(row, COL_TELEFONO).getValue()
      };

      var datosProcesados = prepararDatosParaCalendarioYDialogo(datosBrutosParaUtil);
      
      if (datosProcesados.whatsappLink && datosProcesados.whatsappLink !== "ERROR_NO_PHONE" && datosProcesados.whatsappLink !== "INVALID_PHONE_FORMAT") {
        celdaMensajeWhatsapp.setValue(datosProcesados.whatsappLink);
        celdaMensajeWhatsapp.setFontColor("#1155cc"); 
        // Opcional: celdaMensajeWhatsapp.setFontLine("underline");
        Logger.log("gestionarEdicionReservas: Enlace WhatsApp (COL K) CREADO y estilizado para fila " + row);
      } else {
        celdaMensajeWhatsapp.setValue(''); // Simplemente limpiar el valor
        Logger.log("gestionarEdicionReservas: No se pudo generar enlace WhatsApp (COL K) para fila " + row + ". Celda limpiada.");
      }
      
      mostrarDialogoAcciones(datosProcesados); 

    } else { 
      // Si se desmarca la casilla PAGADO
      Logger.log("gestionarEdicionReservas: Casilla PAGADO DESMARCADA en fila " + row + ". Limpiando K y reordenando.");
      celdaMensajeWhatsapp.setValue(''); // Simplemente limpiar el valor
      reordenarHojaReservas(); 
    }

  } else if (column === COL_DEVUELTO) {
    Logger.log("gestionarEdicionReservas: Columna DEVUELTO editada en fila " + row + ". Nuevo valor: " + value);
    reordenarHojaReservas(); 
    if (value === true || (typeof value === 'string' && value.toUpperCase() === 'TRUE')) {
      SpreadsheetApp.getActiveSpreadsheet().toast("Fila marcada como DEVUELTO y hoja reordenada.", "Estado Actualizado", 3);
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast("Fila desmarcada como DEVUELTO y hoja reordenada.", "Estado Actualizado", 3);
    }
  }
}

// === FUNCIÓN PARA MOSTRAR DIÁLOGO HTML (sin cambios) ===
// Se asume que esta función ya existe y está preparada para recibir un objeto complejo.
function mostrarDialogoAcciones(datosParaDialogo) {
  var htmlTemplate = HtmlService.createTemplateFromFile('DialogoAcciones');
  htmlTemplate.datosReserva = datosParaDialogo; // El nombre 'datosReserva' es el que usa el HTML
  var htmlOutput = htmlTemplate.evaluate().setWidth(400).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Reserva Pagada - Acciones');
}

// === FUNCIÓN PARA REORDENAR LA HOJA COMPLETA (USA Range.sort()) ===
function reordenarHojaReservas() {
  // ... (código de reordenarHojaReservas como lo teníamos, sin cambios) ...
  Logger.log("reordenarHojaReservas: Iniciando reordenación completa.");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  var lastRow = sheet.getLastRow();

  if (lastRow < FIRST_DATA_ROW) {
    Logger.log("reordenarHojaReservas: No hay datos suficientes para ordenar (lastRow: " + lastRow + ", firstDataRow: " + FIRST_DATA_ROW + ").");
    return "No hay datos para ordenar.";
  }
  try {
    var dataRangeToSort = sheet.getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, sheet.getLastColumn());
    Logger.log("reordenarHojaReservas: Ordenando rango " + dataRangeToSort.getA1Notation());
    dataRangeToSort.sort([
      { column: COL_DEVUELTO, ascending: false },
      { column: COL_PAGADO, ascending: false },
      { column: COL_FECHA_RESERVA, ascending: false }
    ]);
    Logger.log("reordenarHojaReservas: Hoja reordenada.");
    SpreadsheetApp.getActiveSpreadsheet().toast("Reservas reordenadas.", "Ordenación Completa", 3);
    return "Hoja reordenada.";
  } catch (error) {
    Logger.log("reordenarHojaReservas: Error - " + error.toString() + " Stack: " + error.stack);
    SpreadsheetApp.getActiveSpreadsheet().toast("Error al reordenar: " + error.message, "Error de Ordenación", 5);
    return "Error al reordenar: " + error.message;
  }
}