// === CONFIGURACIÓN DE COLUMNAS ===
var SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

var COL_MARCA_TEMPORAL = 1;   // Columna A
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

  var cleanBizum = cleanGasPhone(bizumPhoneNumber);
  var cleanTel = cleanGasPhone(phoneNumber);

  if ((!cleanBizum || cleanBizum === "") && cleanTel && cleanTel !== "") {
    cleanBizum = cleanTel;
  }

  if (cleanBizum) bizumCell.setValue(cleanBizum);
  if (cleanTel) telefonoCell.setValue(cleanTel);

  // --- ENLACE WHATSAPP SIMPLE (COLUMNA H) ---
  var celdaEnlaceWhatsapp = sheet.getRange(processingRow, COL_ENLACE_WHATSAPP_SIMPLE);

  if (cleanTel && cleanTel.startsWith('+')) { 
    var urlWhatsapp = "https://wa.me/" + cleanTel;
    celdaEnlaceWhatsapp.setValue(urlWhatsapp);
    celdaEnlaceWhatsapp.setFontColor("#1155cc");
  } else {
    celdaEnlaceWhatsapp.setValue("");
  }

  // --- SINCRONIZACIÓN AUTOMÁTICA A SUPABASE (DIVING ERP) ---
  if (SUPABASE_URL && SUPABASE_KEY) {
    syncBizumToSupabase(sheet, processingRow);
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

// === FUNCIONES DE SINCRONIZACIÓN CON DIVING ERP (SUPABASE) ===

function syncBizumToSupabase(sheet, row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    Logger.log("syncBizumToSupabase: SUPABASE_URL o SUPABASE_KEY no configurados.");
    return "Credenciales no configuradas";
  }

  try {
    var ssTz = sheet.getParent().getSpreadsheetTimeZone() || "Asia/Bangkok";
    var rawMarcaTemporal = sheet.getRange(row, COL_MARCA_TEMPORAL).getValue();
    var rawFechaReserva = sheet.getRange(row, COL_FECHA_RESERVA).getValue();
    var customerName = sheet.getRange(row, COL_NOMBRE).getValue() || "";
    var numPeopleRaw = sheet.getRange(row, COL_NUM_PERSONAS).getValue();
    var activity = sheet.getRange(row, COL_ACTIVIDAD).getValue() || "";
    var bizumPhone = cleanGasPhone(sheet.getRange(row, COL_TELEFONO_BIZUM).getValue() || "");
    var whatsappPhone = cleanGasPhone(sheet.getRange(row, COL_TELEFONO).getValue() || "");
    var pagadoVal = sheet.getRange(row, COL_PAGADO).getValue();
    var devueltoVal = sheet.getRange(row, COL_DEVUELTO).getValue();

    var numPeople = parseInt(numPeopleRaw, 10);
    if (isNaN(numPeople) || numPeople <= 0) numPeople = 1;

    // 1. Formatear Fecha de Reserva respetando la Zona Horaria de la Hoja (evita desfase de 1 día)
    var bookingDate = null;
    if (rawFechaReserva instanceof Date && !isNaN(rawFechaReserva)) {
      bookingDate = Utilities.formatDate(rawFechaReserva, ssTz, "yyyy-MM-dd");
    } else if (rawFechaReserva) {
      try {
        var d = new Date(rawFechaReserva);
        if (!isNaN(d.getTime())) bookingDate = Utilities.formatDate(d, ssTz, "yyyy-MM-dd");
      } catch (e) {}
    }

    // 2. Formatear Marca Temporal (created_at) si existe en la Columna A
    var createdAtIso = null;
    if (rawMarcaTemporal instanceof Date && !isNaN(rawMarcaTemporal)) {
      createdAtIso = rawMarcaTemporal.toISOString();
    } else if (rawMarcaTemporal) {
      try {
        var dTimestamp = new Date(rawMarcaTemporal);
        if (!isNaN(dTimestamp.getTime())) createdAtIso = dTimestamp.toISOString();
      } catch (e) {}
    }

    if (!customerName || !bookingDate) {
      Logger.log("syncBizumToSupabase: Omitiendo fila " + row + " por falta de nombre o fecha.");
      return "Faltan datos obligatorios";
    }

    var isPaid = (pagadoVal === true || (typeof pagadoVal === 'string' && pagadoVal.toUpperCase() === 'TRUE'));
    var isReturned = (devueltoVal === true || (typeof devueltoVal === 'string' && devueltoVal.toUpperCase() === 'TRUE'));

    // Si viene de la pestaña de Reservas Devueltas 2026, forzar a true
    if (sheet.getName() === "Reservas Devueltas 2026") {
      isPaid = true;
      isReturned = true;
    }

    var payload = {
      "customer_name": customerName.toString().trim(),
      "booking_date": bookingDate,
      "num_people": numPeople,
      "activity": activity.toString().trim(),
      "bizum_phone": bizumPhone.toString().trim(),
      "whatsapp_phone": whatsappPhone.toString().trim(),
      "is_paid": isPaid,
      "is_returned": isReturned
    };

    if (createdAtIso) {
      payload["created_at"] = createdAtIso;
    }

    var url = SUPABASE_URL + "/rest/v1/bizums";
    var options = {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer": "return=minimal"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };

    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    Logger.log("syncBizumToSupabase fila " + row + " (" + sheet.getName() + "): Resultado HTTP " + code);
    return code >= 200 && code < 300 ? "OK (" + code + ")" : "Error " + code;

  } catch (err) {
    Logger.log("syncBizumToSupabase Fila " + row + " (" + sheet.getName() + ") Exception: " + err.toString());
    return "Exception: " + err.toString();
  }
}

/**
 * Función de Migración Masiva:
 * Puedes ejecutar esta función manualmente en Apps Script para enviar TODAS las reservas
 * existentes en tu pestaña de Google Sheets a la base de datos de Diving ERP.
 */
function syncAllExistingReservasToSupabase() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  if (!sheet) {
    Logger.log("Hoja '" + TARGET_SHEET_NAME + "' no encontrada.");
    return;
  }
  var lastRow = sheet.getLastRow();
  Logger.log("Iniciando migración masiva desde la fila " + FIRST_DATA_ROW + " hasta la fila " + lastRow + "...");

  var successCount = 0;
  for (var r = FIRST_DATA_ROW; r <= lastRow; r++) {
    var res = syncBizumToSupabase(sheet, r);
    if (res && res.indexOf("OK") !== -1) {
      successCount++;
    }
  }

  Logger.log("Migración masiva completada: " + successCount + " registros migrados a Supabase.");
  SpreadsheetApp.getActiveSpreadsheet().toast("Migradas " + successCount + " reservas a Diving ERP.", "Migración Completa", 5);
}

/**
 * Función de Migración Masiva para la pestaña "Reservas Devueltas 2026":
 * Puedes ejecutar esta función manualmente en Apps Script para enviar TODAS las reservas
 * devueltas de esa pestaña a la base de datos de Diving ERP.
 */
function syncAllReturnedReservasToSupabase() {
  var sheetName = "Reservas Devueltas 2026";
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Hoja '" + sheetName + "' no encontrada.");
    SpreadsheetApp.getActiveSpreadsheet().toast("Error: Hoja '" + sheetName + "' no encontrada.", "Sync Fallido", 5);
    return;
  }
  var lastRow = sheet.getLastRow();
  Logger.log("Iniciando migración de devueltas desde la fila " + FIRST_DATA_ROW + " hasta la fila " + lastRow + "...");

  var successCount = 0;
  for (var r = FIRST_DATA_ROW; r <= lastRow; r++) {
    var res = syncBizumToSupabase(sheet, r);
    if (res && res.indexOf("OK") !== -1) {
      successCount++;
    }
  }

  Logger.log("Migración de devueltas completada: " + successCount + " registros migrados a Supabase.");
  SpreadsheetApp.getActiveSpreadsheet().toast("Migradas " + successCount + " reservas devueltas a Diving ERP.", "Migración Completa", 5);
}

function cleanGasPhone(phone) {
  if (!phone) return "";
  var cleaned = phone.toString().trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');

  if (cleaned.indexOf("+00") === 0) {
    cleaned = "+" + cleaned.substring(3);
  } else if (cleaned.indexOf("00") === 0) {
    cleaned = "+" + cleaned.substring(2);
  }

  if (cleaned.indexOf("+") !== 0 && cleaned.length >= 9) {
    cleaned = "+34" + cleaned;
  }

  cleaned = cleaned.replace(/^\+34(?:00)?34/, '+34');
  cleaned = cleaned.replace(/^\+3400/, '+34');
  return cleaned;
}

function cleanAllPhonesInSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TARGET_SHEET_NAME);
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  for (var r = FIRST_DATA_ROW; r <= lastRow; r++) {
    var bCell = sheet.getRange(r, COL_TELEFONO_BIZUM);
    var tCell = sheet.getRange(r, COL_TELEFONO);
    var hCell = sheet.getRange(r, COL_ENLACE_WHATSAPP_SIMPLE);
    var bVal = cleanGasPhone(bCell.getValue());
    var tVal = cleanGasPhone(tCell.getValue());
    if (bVal) bCell.setValue(bVal);
    if (tVal) {
      tCell.setValue(tVal);
      hCell.setValue("https://wa.me/" + tVal);
    }
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Todos los teléfonos de la hoja han sido saneados.", "Limpieza Completada", 5);
}