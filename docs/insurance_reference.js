/**
 * REFERENCIA DEL SCRIPT ORIGINAL DE GOOGLE SHEETS
 * Utilizado para enviar por email el PDF de seguros diarios.
 */

// =================== CONFIGURACIÓN PRINCIPAL ===================
// Recortado del script de Google Sheets:
// Destinatarios: Saifon.t@bangkokinsurance.com, pattarada.s@bangkokinsurance.com
// Asunto: Nombre de la hoja (Fecha)
// Cuerpo: Hello, Please find the attached PDF document with the insured persons for today...

const RANGO_CON_EMAILS = 'A31:F33';
const NOMBRE_REMITENTE = 'Ihasia diving Koh Tao';

function enviarPdfPersonalizado() {
  // 1. Obtiene emails de A31:F33
  // 2. Genera PDF de la hoja actual
  // 3. Envía via GmailApp.sendEmail
}
