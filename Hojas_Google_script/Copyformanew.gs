// Archivo: ConsolidarRegistros.gs (o como lo llames) copia losr registros nuevos del google_form de registro antiguo a New formulario 

// === CONFIGURACIÓN PARA COPIAR REGISTROS DE GOOGLE FORM ===
var NOMBRE_PESTANA_FUENTE_GOOGLE_FORM = "Respuestas de formulario"; 
var NOMBRE_PESTANA_DESTINO_CONSOLIDADA = "NewFormulario";        

function copiarRegistroDeGoogleForm(e) {
  if (!e || !e.range || !e.source || !e.values) {
    Logger.log("copiarRegistroDeGoogleForm: Evento no válido o sin valores. Saliendo.");
    return;
  }

  var hojaFuente = e.range.getSheet();
  if (hojaFuente.getName() !== NOMBRE_PESTANA_FUENTE_GOOGLE_FORM) {
    Logger.log("copiarRegistroDeGoogleForm: Evento no es de la pestaña fuente ('" + NOMBRE_PESTANA_FUENTE_GOOGLE_FORM + "'). Proviene de: '" + hojaFuente.getName() + "'. Saliendo.");
    return;
  }

  Logger.log("copiarRegistroDeGoogleForm: Nueva respuesta. e.values (longitud " + e.values.length + "): " + JSON.stringify(e.values));

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var hojaDestino = spreadsheet.getSheetByName(NOMBRE_PESTANA_DESTINO_CONSOLIDADA);

  if (!hojaDestino) {
    Logger.log("copiarRegistroDeGoogleForm: No se encontró la pestaña destino '" + NOMBRE_PESTANA_DESTINO_CONSOLIDADA + "'.");
    return;
  }

  var datosFormulario = e.values; 
  var filaParaDestino = new Array(17).fill(""); 

  filaParaDestino[0] = datosFormulario[0] || new Date();    // Col A: Timestamp
  filaParaDestino[1] = datosFormulario[1] || "";          // Col B: Email
  filaParaDestino[2] = datosFormulario[2] || "";          // Col C: Nombre
  filaParaDestino[3] = datosFormulario[3] || "";          // Col D: Apellidos
  filaParaDestino[4] = datosFormulario[4] || "";          // Col E: Género
  filaParaDestino[5] = datosFormulario[5] || "";          // Col F: Pasaporte
  filaParaDestino[6] = datosFormulario[6] || "";          // Col G: Actividad
  
  // Col H ("Fecha Actividad") y Col I ("WhatsApp") en "NewFormulario" se dejan vacías
  // porque no vienen del Google Form según la última aclaración.
  // filaParaDestino[7] y filaParaDestino[8] ya son "" por la inicialización.

  filaParaDestino[9]  = datosFormulario[7] || "";         // Col J: Fecha Nacimiento (de e.values[7])
  filaParaDestino[10] = datosFormulario[8] || "";         // Col K: Contacto Emergencia (de e.values[8])
  filaParaDestino[11] = datosFormulario[9] || "";         // Col L: Dirección (de e.values[9])
  filaParaDestino[12] = datosFormulario[10] || "";        // Col M: Como Nos Conociste (de e.values[10])
  filaParaDestino[13] = datosFormulario[11] || "";        // Col N: Nivel Buceo (de e.values[11])
  filaParaDestino[14] = datosFormulario[12] || "";        // Col O: Fecha Ultimo Buceo (de e.values[12])
  filaParaDestino[15] = datosFormulario[13] || "";        // Col P: Numero Buceos (de e.values[13])

  filaParaDestino[16] = "Google Form";                    // Col Q: Origen Formulario

  var numColumnasDestino = hojaDestino.getMaxColumns();
  if (filaParaDestino.length > numColumnasDestino) {
      filaParaDestino = filaParaDestino.slice(0, numColumnasDestino);
  }

  hojaDestino.appendRow(filaParaDestino);
  Logger.log("copiarRegistroDeGoogleForm: Datos mapeados y copiados a '" + hojaDestino.getName() + "': " + filaParaDestino.join(" | "));

  // === SINCRONIZACIÓN AUTOMÁTICA A SUPABASE ===
  try {
    var rawData = {
      "Nombre": datosFormulario[2] || "",
      "Apellidos": datosFormulario[3] || "",
      "Correo": datosFormulario[1] || "",
      "Genero": datosFormulario[4] || "",
      "Pasaporte": datosFormulario[5] || "",
      "WhatsApp": "", // No viene en el Google Form
      "Fecha Nacimiento": datosFormulario[7] || "",
      "Contacto Emergencia": datosFormulario[8] || "",
      "Direccion": datosFormulario[9] || "",
      "Como Nos Conociste": datosFormulario[10] || "",
      "Nivel Buceador": datosFormulario[11] || "",
      "Numero Buceos": datosFormulario[13] || "",
      "Numero de Inmersiones": datosFormulario[13] || "",
      "Fecha Ultimo Buceo": datosFormulario[12] || "",
      "Origen Formulario": "Google Form",
      "Actividad": datosFormulario[6] || "",
      "Fecha Actividad": "" // No viene en el Google Form
    };

    var supabaseUrl = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
    var supabaseKey = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

    if (supabaseUrl && supabaseKey) {
      // La función syncToSupabase está declarada de forma global en CF7toSheets.gs
      var result = syncToSupabase(rawData);
      Logger.log("copiarRegistroDeGoogleForm: Resultado Sync Supabase: " + result);
    } else {
      Logger.log("copiarRegistroDeGoogleForm: SUPABASE_URL o SUPABASE_KEY no configurados.");
    }
  } catch (err) {
    Logger.log("copiarRegistroDeGoogleForm: Error al sincronizar con Supabase: " + err.toString());
  }
}

// === FUNCIONES PARA MIGRACIÓN MANUAL DEL HISTORIAL ===

/**
 * Sincroniza todas las respuestas históricas del Google Form directamente a Supabase,
 * leyendo de la pestaña nativa "Respuestas de formulario" (donde solo hay datos del Google Form).
 */
function migrarClientesDesdeRespuestasFormulario() {
  var sheetName = NOMBRE_PESTANA_FUENTE_GOOGLE_FORM; // "Respuestas de formulario"
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Hoja '" + sheetName + "' no encontrada.");
    SpreadsheetApp.getActiveSpreadsheet().toast("Error: Hoja '" + sheetName + "' no encontrada.", "Migración Fallida", 5);
    return;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("No hay datos en la hoja '" + sheetName + "'.");
    return;
  }
  
  // Leemos todas las filas y columnas de la pestaña nativa de respuestas del Google Form
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  var successCount = 0;
  var skipCount = 0;
  var errorCount = 0;
  
  Logger.log("Iniciando migración manual de clientes desde '" + sheetName + "'...");
  SpreadsheetApp.getActiveSpreadsheet().toast("Migrando clientes desde '" + sheetName + "'...", "Procesando", 3);
  
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var email = row[1] || "";
    var nombre = row[2] || "";
    var apellidos = row[3] || "";
    var passport = row[5] || "";
    
    if (!nombre && !email) {
      continue; // Omitir filas vacías
    }
    
    // Comprobar si ya existe en Supabase para evitar duplicados
    var exists = checkIfCustomerExistsInDb(email, passport);
    if (exists) {
      Logger.log("Cliente ya existe en Supabase (Omitido): " + nombre + " (" + email + ")");
      skipCount++;
      continue;
    }
    
    // Mapeamos los datos según el orden de columnas nativo de "Respuestas de formulario"
    var rawData = {
      "Nombre": nombre,
      "Apellidos": apellidos,
      "Correo": email,
      "Genero": row[4] || "",
      "Pasaporte": passport,
      "WhatsApp": "", // No se registra en el Google Form original
      "Fecha Nacimiento": row[7] || "", // Col H
      "Contacto Emergencia": row[8] || "", // Col I
      "Direccion": row[9] || "", // Col J
      "Como Nos Conociste": row[10] || "", // Col K
      "Nivel Buceador": row[11] || "", // Col L
      "Numero de Inmersiones": row[13] || "", // Col N
      "Fecha Ultimo Buceo": row[12] || "", // Col M
      "Origen Formulario": "Google Form",
      "Actividad": row[6] || "", // Col G
      "Fecha Actividad": "" // No se registra en el Google Form original
    };
    
    var result = syncToSupabase(rawData);
    if (result && result.indexOf("OK") !== -1) {
      successCount++;
      Logger.log("Migrado con éxito: " + nombre + " - " + result);
    } else {
      errorCount++;
      Logger.log("Error al migrar " + nombre + ": " + result);
    }
  }
  
  Logger.log("Migración completada desde '" + sheetName + "'. Exitosos: " + successCount + ", Ya existentes: " + skipCount + ", Errores: " + errorCount);
  spreadsheet.toast("Exitosos: " + successCount + ", Omitidos (ya en BD): " + skipCount + ", Errores: " + errorCount, "Migración Completada", 7);
}

/**
 * Realiza una consulta rápida a Supabase para verificar si el cliente ya existe por Correo o Pasaporte
 */
function checkIfCustomerExistsInDb(email, passport) {
  var supabaseUrl = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
  var supabaseKey = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');
  
  if (!supabaseUrl || !supabaseKey) return false;
  if (!email && !passport) return false;
  
  var queries = [];
  if (email && email.toString().trim()) {
    queries.push("email.eq." + encodeURIComponent(email.toString().trim()));
  }
  if (passport && passport.toString().trim()) {
    queries.push("passport_number.eq." + encodeURIComponent(passport.toString().trim()));
  }
  
  if (queries.length === 0) return false;
  
  var url = supabaseUrl + "/rest/v1/customers?select=id&or=(" + queries.join(",") + ")";
  var options = {
    "method": "get",
    "headers": {
      "apikey": supabaseKey,
      "Authorization": "Bearer " + supabaseKey
    },
    "muteHttpExceptions": true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      return data && data.length > 0;
    }
  } catch (e) {
    Logger.log("checkIfCustomerExistsInDb Error: " + e.toString());
  }
  return false;
}