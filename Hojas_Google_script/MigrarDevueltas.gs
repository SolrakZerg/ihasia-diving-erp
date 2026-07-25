// === CONFIGURACIÓN DE MIGRACIÓN DE RESERVAS DEVUELTAS / RETENIDAS ===
var SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

var COL_MARCA_TEMPORAL = 1;   // Columna A
var COL_FECHA_RESERVA = 2;    // Columna B
var COL_NOMBRE = 3;           // Columna C
var COL_NUM_PERSONAS = 4;     // Columna D
var COL_ACTIVIDAD = 5;        // Columna E
var COL_TELEFONO_BIZUM = 6;   // Columna F
var COL_TELEFONO = 7;         // Columna G
var COL_PAGADO = 9;           // Columna I
var COL_DEVUELTO = 10;        // Columna J
var FIRST_DATA_ROW = 2;

/**
 * Función principal para migrar la pestaña de Reservas Devueltas.
 * Busca cualquier pestaña que contenga "Reservas Devueltas" en su nombre (ignorando emojis).
 */
function migrarReservasDevueltas() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var sheet = null;
  
  // Buscar la hoja de forma robusta por coincidencia de "Reservas Devueltas 2026" (ignora emojis)
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.indexOf("Reservas Devueltas 2026") !== -1) {
      sheet = sheets[i];
      break;
    }
  }

  if (!sheet) {
    Logger.log("Error: No se encontró ninguna pestaña con el nombre 'Reservas Devueltas'.");
    SpreadsheetApp.getActiveSpreadsheet().toast("Error: No se encontró la pestaña de devueltas.", "Sync Fallido", 5);
    return;
  }

  var lastRow = sheet.getLastRow();
  Logger.log("Iniciando migración desde '" + sheet.getName() + "' (filas " + FIRST_DATA_ROW + " a " + lastRow + ")...");
  SpreadsheetApp.getActiveSpreadsheet().toast("Iniciando migración de devueltas...", "Procesando", 3);

  var successCount = 0;
  var skipCount = 0;

  for (var r = FIRST_DATA_ROW; r <= lastRow; r++) {
    var res = syncRowToSupabase(sheet, r);
    if (res && res.indexOf("OK") !== -1) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  Logger.log("Migración completada. Exitosos: " + successCount + ", Omitidos/Erróneos: " + skipCount);
  SpreadsheetApp.getActiveSpreadsheet().toast("Migradas con éxito " + successCount + " reservas a la base de datos.", "¡Migración Completada!", 6);
}

function syncRowToSupabase(sheet, row) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    Logger.log("Credenciales de Supabase no configuradas.");
    return "Error Credenciales";
  }

  try {
    var ssTz = sheet.getParent().getSpreadsheetTimeZone() || "Asia/Bangkok";
    var rawMarcaTemporal = sheet.getRange(row, COL_MARCA_TEMPORAL).getValue();
    var rawFechaReserva = sheet.getRange(row, COL_FECHA_RESERVA).getValue();
    var customerName = sheet.getRange(row, COL_NOMBRE).getValue() || "";
    var numPeopleRaw = sheet.getRange(row, COL_NUM_PERSONAS).getValue();
    var activity = sheet.getRange(row, COL_ACTIVIDAD).getValue() || "";
    var bizumPhone = cleanMigracionPhone(sheet.getRange(row, COL_TELEFONO_BIZUM).getValue() || "");
    var whatsappPhone = cleanMigracionPhone(sheet.getRange(row, COL_TELEFONO).getValue() || "");
    var pagadoVal = sheet.getRange(row, COL_PAGADO).getValue();
    var devueltoVal = sheet.getRange(row, COL_DEVUELTO).getValue();

    var numPeople = parseInt(numPeopleRaw, 10);
    if (isNaN(numPeople) || numPeople <= 0) numPeople = 1;

    // 1. Formatear Fecha de Reserva
    var bookingDate = null;
    if (rawFechaReserva instanceof Date && !isNaN(rawFechaReserva)) {
      bookingDate = Utilities.formatDate(rawFechaReserva, ssTz, "yyyy-MM-dd");
    } else if (rawFechaReserva) {
      try {
        var d = new Date(rawFechaReserva);
        if (!isNaN(d.getTime())) bookingDate = Utilities.formatDate(d, ssTz, "yyyy-MM-dd");
      } catch (e) {}
    }

    // 2. Formatear Marca Temporal (created_at)
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
      Logger.log("Fila " + row + " omitida por falta de Nombre o Fecha de Reserva.");
      return "Faltan datos";
    }

    var isPaid = (pagadoVal === true || (typeof pagadoVal === 'string' && pagadoVal.toUpperCase() === 'TRUE'));
    var isReturned = (devueltoVal === true || (typeof devueltoVal === 'string' && devueltoVal.toUpperCase() === 'TRUE'));

    // Lógica para detectar reservas retenidas (No presentados)
    // Si está en esta pestaña, se asume que está pagado. Si DEVUELTO es false (casilla vacía o desmarcada),
    // significa que es una retención/penalización.
    var isRetained = isPaid && !isReturned;

    var payload = {
      "customer_name": customerName.toString().trim(),
      "booking_date": bookingDate,
      "num_people": numPeople,
      "activity": activity.toString().trim(),
      "bizum_phone": bizumPhone.toString().trim(),
      "whatsapp_phone": whatsappPhone.toString().trim(),
      "is_paid": isPaid,
      "is_returned": isReturned,
      "is_retained": isRetained
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
    Logger.log("syncRowToSupabase fila " + row + ": Resultado HTTP " + code);
    return code >= 200 && code < 300 ? "OK (" + code + ")" : "Error " + code;

  } catch (err) {
    Logger.log("syncRowToSupabase Fila " + row + " Exception: " + err.toString());
    return "Exception: " + err.toString();
  }
}

function cleanMigracionPhone(phone) {
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
