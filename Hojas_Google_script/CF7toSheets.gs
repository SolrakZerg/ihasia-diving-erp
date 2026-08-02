/**
 * DIVING ERP - DUAL SYNC SCRIPT (v1.2.0 - FIX DUPLICATES & RANGES)
 * PERMITE MAILS DUPLICADOS Y RANGOS DE BUCEO (51-100)
 */

var SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY'); 

var SHEET_NAME = "NewFormulario"; 

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    locked = lock.tryLock(10000); 
    if (!locked) return errorResponse("Lock timeout");

    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) return errorResponse("Hoja '" + SHEET_NAME + "' no encontrada");

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1; 
    var newRowData = [];
    var rawData = {};

    console.log("Procesando doPost v1.2.0...");

    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i];
      var val = e.parameter[headerName] || "";
      rawData[headerName] = val;

      if (headerName === 'Timestamp' && !val) {
        newRowData.push(new Date());
      } else if (headerName === 'WhatsApp') { 
        newRowData.push(val ? "wa.me/" + val.replace(/[^\d+]/g, '') : "");
      } else {
        newRowData.push(val);
      }
    }
    
    sheet.getRange(nextRow, 1, 1, newRowData.length).setValues([newRowData]);
    console.log("Fila escrita en Excel correctamente.");

    if (SUPABASE_URL && SUPABASE_KEY) {
      var result = syncToSupabase(rawData);
      console.log("Resultado Sync Supabase: " + result);
    }

    return ContentService.createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    console.error("ERROR FATAL: " + error.toString());
    return errorResponse(error.toString());
  } finally {
    if (locked) lock.releaseLock();
  }
}

function syncToSupabase(rawData) {
  var url = SUPABASE_URL + "/rest/v1/customers";
  
  // v1.2.1: Soporta 'Numero Buceos' y 'Numero de Inmersiones' y preserva rangos de texto en 'last_dive_date'
  var numBuceos = (rawData["Numero Buceos"] || rawData["Numero de Inmersiones"] || "").replace(/---/g, '').trim();
  if (numBuceos.toLowerCase().includes('ninguno') || numBuceos.toLowerCase().includes('none')) { numBuceos = "0"; }
  
  var ultimoBuceoRaw = (rawData["Fecha Ultimo Buceo"] || "").replace(/---/g, '').trim();
  var ultimoBuceoFinal = formatDate(ultimoBuceoRaw) || ultimoBuceoRaw;
  
  var payload = {
    "first_name": rawData["Nombre"] || "",
    "last_name": rawData["Apellidos"] || "",
    "email": rawData["Correo"] || "",
    "gender": rawData["Genero"] || "",
    "passport_number": rawData["Pasaporte"] || "",
    "phone": rawData["WhatsApp"] || "",
    "birth_date": formatDate(rawData["Fecha Nacimiento"]),
    "emergency_contact": rawData["Contacto Emergencia"] || "",
    "address": rawData["Direccion"] || "",
    "lead_source": rawData["Como Nos Conociste"] || "",
    "certification_level": (rawData["Nivel Buceador"] || "").replace(/---/g, '').trim(),
    "total_dives": numBuceos,
    "last_dive_date": ultimoBuceoFinal,
    "form_origin": rawData["Origen Formulario"] || "Form Web",
    "booked_activity": rawData["Actividad"] || "",
    "booking_date": formatDate(rawData["Fecha Actividad"])
  };

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

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    return (code >= 200 && code < 300) ? "OK (" + code + ")" : "Error " + code + ": " + response.getContentText();
  } catch (e) {
    return "Fetch Exception: " + e.toString();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch(e) { return null; }
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({"result":"error", "message": msg}))
                       .setMimeType(ContentService.MimeType.JSON);
}
