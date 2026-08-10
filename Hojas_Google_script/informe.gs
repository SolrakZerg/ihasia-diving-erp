/************************************************
 * CONFIGURACIÓN GENERAL
 ************************************************/
const HOJA_DATOS = 'TODOS';
const COLS_POR_INSTRUCTOR = 15;
const FILA_INICIO_DIAS = 2;
const FILA_FIN_DIAS = 33; // 31 días
const EMAIL_DESTINO = 'ihasiakohtao@gmail.com';

/************************************************
 * NOMBRES DE ACTIVIDADES
 * (posición relativa dentro del bloque)
 ************************************************/
const ACTIVIDADES = {
  1: 'Fun Dive 1 buceo',
  2: 'Fun Dive 2 buceos',
  3: 'Bautizo 1 buceo',
  4: 'Bautizo 2 buceos',
  5: 'Refresh 1 buceo',
  6: 'Refresh 2 buceos',
  7: 'Scuba Diver',
  8: 'Open Water',
  9: 'Avanzado',
  10: 'Rescue',
  11: 'Cancelación',
  12: 'Asistencia',
  13: 'Extra'
};

const MESES_ESPANOL = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

/************************************************
 * GENERAR PDF DE UN INSTRUCTOR
 ************************************************/
function generarPdfInstructor_1() { generarInformeInstructor(1); }
function generarPdfInstructor_2() { generarInformeInstructor(2); }
function generarPdfInstructor_3() { generarInformeInstructor(3); }
function generarPdfInstructor_4() { generarInformeInstructor(4); }
function generarPdfInstructor_5() { generarInformeInstructor(5); }
function generarPdfInstructor_6() { generarInformeInstructor(6); }
function generarPdfInstructor_7() { generarInformeInstructor(7); }
function generarPdfInstructor_8() { generarInformeInstructor(8); }
function generarPdfInstructor_9() { generarInformeInstructor(9); }

/************************************************
 * ENVIAR TODOS LOS INFORMES
 ************************************************/
function enviarTodosLosInformes() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(HOJA_DATOS);

  if (!hoja) {
    ui.alert('Error', 'No se encuentra la hoja ' + HOJA_DATOS, ui.ButtonSet.OK);
    return;
  }

  // ⚡️ OPTIMIZACIÓN: Cargar todos los datos una sola vez
  // Leemos todo el rango de datos usado para minimizar llamadas a la API
  const rangoDatos = hoja.getDataRange();
  const datosCache = {
    valores: rangoDatos.getValues(),        // Para cálculos numéricos
    textos: rangoDatos.getDisplayValues(),  // Para fechas formateadas
    notas: rangoDatos.getNotes()            // Para notas de celdas
  };

  const adjuntos = [];
  const listaNombres = [];

  for (let i = 1; i <= 9; i++) {
    // Pasamos el cache de datos
    const resultado = generarInformeInstructor(i, true, true, datosCache);
    if (resultado && resultado.blob) {
      adjuntos.push(resultado.blob);
      listaNombres.push(resultado.nombre);
    }
  }

  if (adjuntos.length > 0) {
    const hoy = new Date();
    const mes = `${MESES_ESPANOL[hoy.getMonth()]} ${hoy.getFullYear()}`;

    GmailApp.sendEmail(
      EMAIL_DESTINO,
      `Informes Mensuales Agrupados – ${mes}`,
      `Se adjuntan los ${adjuntos.length} informes correspondientes a: ${listaNombres.join(', ')}.`,
      { attachments: adjuntos }
    );

    ui.alert('✅ Envío Agrupado Completado', `Se han enviado ${adjuntos.length} informes en un solo correo.`, ui.ButtonSet.OK);
  } else {
    ui.alert('⚠️ Sin Informes', 'No se ha generado ningún informe válido.', ui.ButtonSet.OK);
  }
}

/************************************************
 * FUNCIÓN PRINCIPAL
 ************************************************/
function generarInformeInstructor(numInstructor, silencioso = false, retornarObjeto = false, datosCache = null) {
  const ui = SpreadsheetApp.getUi();

  // Si no pasaron cache (ejecución individual), cargamos los datos aquí
  if (!datosCache) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(HOJA_DATOS);
    const rangoDatos = hoja.getDataRange();
    datosCache = {
      valores: rangoDatos.getValues(),
      textos: rangoDatos.getDisplayValues(),
      notas: rangoDatos.getNotes()
    };
  }

  // Helper para leer datos del cache de manera segura (maneja índices fuera de rango)
  const getVal = (fil, col) => (datosCache.valores[fil - 1] && datosCache.valores[fil - 1][col - 1]);
  const getTxt = (fil, col) => (datosCache.textos[fil - 1] && datosCache.textos[fil - 1][col - 1]);
  const getNot = (fil, col) => (datosCache.notas[fil - 1] && datosCache.notas[fil - 1][col - 1]);

  const colInicio = (numInstructor - 1) * COLS_POR_INSTRUCTOR + 1;
  const colTotalDia = colInicio + COLS_POR_INSTRUCTOR - 1;

  // Fila 1 = índice 0
  const nombreInstructor = getVal(1, colInicio);
  if (!nombreInstructor) return null;

  const hoy = new Date();
  const mes = `${MESES_ESPANOL[hoy.getMonth()]} ${hoy.getFullYear()}`;

  let html = `
    <html>
      <head>
        <style>
          /* Forzar impresión de colores de fondo en el renderizador de PDF */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          body { font-family: 'Arial', sans-serif; color: #333; padding: 5px 20px; margin: 0; }
          .header-table { width: 100%; margin-bottom: 10px; } /* Eliminados border-bottom y padding */
          .logo-text { font-size: 38px; font-weight: bold; margin: 0; letter-spacing: -1px; }
          .logo-ihasia { color: #008080; } /* Teal */
          .logo-kohtao { color: #0f172a; } /* Slate-900 */
          .report-title { font-size: 16px; color: #555; text-transform: uppercase; font-weight: bold; margin-top: 2px; letter-spacing: 1px; }
          .meta-text { font-size: 14px; color: #333; text-align: right; margin-bottom: 8px; }
          .meta-label { font-weight: bold; color: #555; text-transform: uppercase; font-size: 12px; margin-right: 5px; }
          .meta-value { font-weight: bold; font-size: 16px; color: #0f172a; }
          
          .data-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 5px; }
          .data-table td { border: 1px solid #bdc3c7; padding: 5px 12px; vertical-align: top; }
          .row-even { background-color: #f8fafc; }
          .row-odd { background-color: #ffffff; }
          
          .col-center { text-align: center; width: 40px; font-weight: bold; }
          .col-right { text-align: right; width: 120px; font-weight: bold; }
          
          .activity-list { margin: 0; padding-left: 20px; color: #333; }
          .activity-item { margin-bottom: 1px; }
          .extra-note { font-style: italic; color: #666; font-size: 12px; }
          
          .footer-section { margin-top: 10px; }
          .total-table { width: 100%; border-top: 2px solid #0f172a; padding-top: 10px; }
          .total-label { font-size: 18px; color: #008080; font-weight: bold; text-transform: uppercase; text-align: left; padding-left: 10px; }
          .total-amount { font-size: 20px; color: #0f172a; font-weight: bold; text-align: right; padding-right: 10px;}
          
          .reserved-space { display: none; margin: 0; height: 0; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="vertical-align: bottom;">
              <div class="logo-text"><span class="logo-ihasia">IHASIA</span> <span class="logo-kohtao">Koh Tao</span></div>
              <div class="report-title">RESUMEN DE PAGOS Y ACTIVIDADES</div>
            </td>
            <td style="vertical-align: bottom;">
              <div class="meta-text"><span class="meta-label">Instructor:</span> <span class="meta-value">${nombreInstructor}</span></div>
              <div class="meta-text"><span class="meta-label">Periodo:</span> <span class="meta-value" style="color: #008080;">${mes}</span></div>
            </td>
          </tr>
        </table>

        <!-- Bloque de color independiente fuera de la tabla principal -->
        <div style="background-color: #0f172a !important; color: #ffffff !important; margin-top: 5px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td class="col-center" style="color: #ffffff; padding: 5px 12px; border: 1px solid #0f172a;"><b>Día</b></td>
              <td style="color: #ffffff; padding: 5px 12px; border: 1px solid #0f172a;"><b>Actividades / Descripción</b></td>
              <td class="col-right" style="color: #ffffff; padding: 5px 12px; border: 1px solid #0f172a;"><b>Total (THB)</b></td>
            </tr>
          </table>
        </div>

        <table class="data-table" style="margin-top: 0; border-top: none;">
          <tbody>
  `;

  let totalMes = 0;
  let hayActividad = false;
  let rowCount = 0;

  for (let fila = FILA_INICIO_DIAS; fila <= FILA_FIN_DIAS; fila++) {
    const dia = getTxt(fila, colInicio);
    if (!dia) continue;

    const totalDia = getVal(fila, colTotalDia);
    if (!totalDia || totalDia === 0) continue;

    let actividadesHtml = '<ul class="activity-list">';

    for (const offset in ACTIVIDADES) {
      const col = colInicio + Number(offset);
      const valor = getVal(fila, col);

      if (valor && valor !== 0) {
        const isExtra = ACTIVIDADES[offset] === 'Extra';
        
        let qtyFormat = '';
        if (isExtra) {
          // Destacar en rojo las cantidades negativas de Extras
          qtyFormat = (Number(valor) < 0) 
            ? `(<span style="color: #d32f2f; font-weight: bold;">${valor}</span>)` 
            : `(${valor})`;
        } else {
          qtyFormat = `(x${valor})`;
        }
        
        let detalle = `<li class="activity-item">${ACTIVIDADES[offset]} ${qtyFormat}`;

        if (isExtra) {
          const nota = getNot(fila, col);
          if (nota && nota.trim() !== '') {
            detalle += ` <span class="extra-note">— ${nota}</span>`;
          }
        }

        detalle += `</li>`;
        actividadesHtml += detalle;
      }
    }
    actividadesHtml += '</ul>';

    const rowClass = (rowCount % 2 === 0) ? 'row-odd' : 'row-even';
    
    html += `
      <tr class="${rowClass}">
        <td class="col-center">${dia}</td>
        <td>${actividadesHtml}</td>
        <td class="col-right">${Number(totalDia).toLocaleString()}</td>
      </tr>
    `;

    totalMes += Number(totalDia);
    hayActividad = true;
    rowCount++;
  }

  if (!hayActividad) {
    html += `<tr><td colspan="3" style="text-align:center; padding: 50px; color: #666; font-style: italic;">No hay actividad registrada en este periodo.</td></tr>`;
  }

  html += `
          </tbody>
        </table>

        <div class="footer-section">
  `;

  let totalCobrado = 0;
  let cobrosHtml = '';

  for (let fila = 35; fila <= 38; fila++) {
    const motivo = getTxt(fila, colInicio + 12); // Celda BF (combinada BF+BG)
    const monto = getVal(fila, colTotalDia);     // Celda BH

    if (monto && monto > 0) {
      totalCobrado += Number(monto);
      const etiquetaMotivo = motivo && motivo.trim() !== '' ? motivo.trim() : 'Adelanto parcial';
      cobrosHtml += `
            <tr>
              <td class="total-label" style="font-size: 14px; text-transform: none; color: #555; text-align: right; padding-right: 20px; padding-top: 5px; font-weight: normal;">- ${etiquetaMotivo}</td>
              <td class="total-amount" style="font-size: 16px; color: #e74c3c; font-weight: normal; padding-top: 5px;">- ฿ ${Number(monto).toLocaleString()}</td>
            </tr>
      `;
    }
  }

  if (totalCobrado > 0) {
    const pendiente = totalMes - totalCobrado;
    html += `
          <table class="total-table">
            <tr>
              <td class="total-label" style="color: #333; font-size: 16px;">TOTAL GENERADO (MES)</td>
              <td class="total-amount" style="color: #333; font-size: 18px;">฿ ${totalMes.toLocaleString()}</td>
            </tr>
            ${cobrosHtml}
            <tr>
              <td class="total-label" style="padding-top: 12px; font-size: 18px; color: #0f172a; border-top: 1px solid #bdc3c7; margin-top: 10px;">PENDIENTE DE RECIBIR</td>
              <td class="total-amount" style="padding-top: 12px; font-size: 20px; color: #008080; border-top: 1px solid #bdc3c7; margin-top: 10px;">฿ ${pendiente.toLocaleString()}</td>
            </tr>
          </table>
    `;
  } else {
    html += `
          <table class="total-table">
            <tr>
              <td class="total-label" style="font-size: 20px;">TOTAL A RECIBIR</td>
              <td class="total-amount" style="font-size: 22px;">฿ ${totalMes.toLocaleString()}</td>
            </tr>
          </table>
    `;
  }

  html += `
          <div class="reserved-space">
            <!-- Espacio para firma o ampliaciones -->
          </div>
        </div>
      </body>
    </html>
  `;

  const blob = Utilities.newBlob(
    `<html><body style="font-family:Arial">${html}</body></html>`,
    'text/html'
  ).getAs('application/pdf')
    .setName(`Informe mensual – ${nombreInstructor}.pdf`);

  // 👉 Si nos piden devolver el objeto (para envío masivo), lo devolvemos y paramos aquí.
  if (retornarObjeto) {
    return { blob: blob, nombre: nombreInstructor };
  }

  GmailApp.sendEmail(
    EMAIL_DESTINO,
    `Informe mensual – ${nombreInstructor}`,
    'Adjunto el informe mensual.',
    { attachments: [blob] }
  );

  if (!silencioso) {
    ui.alert('✅ Informe enviado', `Informe de ${nombreInstructor} enviado correctamente.`, ui.ButtonSet.OK);
  }
}
