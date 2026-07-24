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
}