const fs = require('fs');
const path = require('path');

const csvPath = 'c:/Users/solra/Documents/Antigravity/diving-erp/BD/Registro IHASIA (respuestas) - Historial 2026.csv';
const batchDir = 'c:/Users/solra/Documents/Antigravity/diving-erp/scratch/batches';

if (!fs.existsSync(batchDir)) {
  fs.mkdirSync(batchDir, { recursive: true });
}

const monthsMap = {
  'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'sep': '09', 'sept': '09', 'oct': '10', 'nov': '11', 'dic': '12'
};

function parseSpanishDate(dateStr) {
  if (!dateStr || dateStr.trim() === '' || dateStr.includes('---')) return null;
  
  // Limpiar y normalizar
  let clean = dateStr.replace(/"/g, '').trim().toLowerCase();
  
  // Caso 1: "28 dic 25, 11:59:44" o "2 ene 26, 10:34:19"
  // Caso 2: "02 ene 26"
  
  const regex = /(\d{1,2})\s+([a-z]{3,4})\s+(\d{2})/;
  const match = clean.match(regex);
  
  if (match) {
    let day = match[1].padStart(2, '0');
    let month = monthsMap[match[2]];
    let rawYear = parseInt(match[3]);
    let year = (rawYear > 30 ? '19' : '20') + (match[3]);
    
    // Si tiene hora (caso 1)
    let time = '12:00:00';
    const timeMatch = clean.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:${timeMatch[3]}`;
    }
    
    return `${year}-${month}-${day}T${time}`;
  }
  
  return null;
}

function escape(str, isDate = false) {
  if (str === null || str === undefined) return 'NULL';
  let val = String(str).replace(/"/g, '').trim();
  
  // Limpieza profunda de caracteres no imprimibles y control
  val = val.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  
  // Lista expandida de placeholders que significan "vacío"
  const nullPlaceholders = [
    '--- none ---', '--- ninguno ---', '--- never ---', '--- nunca---', 
    '--- nunca ---', 'none', 'never', 'nunca', '---', ''
  ];
  
  if (nullPlaceholders.includes(val.toLowerCase())) return 'NULL';
  
  // Si es una fecha y no cumple un formato básico, mejor NULL que error
  if (isDate && !val.match(/\d/)) return 'NULL';

  return `'${val.replace(/'/g, "''")}'`;
}

function normalizeLevel(level) {
  if (!level) return '--- No estoy Certificado ---';
  let clean = level.trim();
  if (clean.toLowerCase() === 'advance') return 'Advanced';
  return clean;
}

function parseCSV(content) {
  const result = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      currentField += '"';
      i++; // Saltar la siguiente comilla
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        result.push(currentLine);
        currentLine = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++; // Manejar \r\n
    } else {
      currentField += char;
    }
  }
  
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    result.push(currentLine);
  }
  
  return result;
}

const content = fs.readFileSync(csvPath, 'utf8');
const allRows = parseCSV(content);
const headers = allRows[0];
const dataRows = allRows.slice(1);

const customers = [];
for (let colData of dataRows) {
  if (colData.length < 5) continue; // Saltar líneas vacías

  const createdAt = parseSpanishDate(colData[0]);
  const bookingDate = parseSpanishDate(colData[7]) || '2026-01-01'; // Fallback
  const birthDate = parseSpanishDate(colData[9]);
  
  customers.push({
    first_name: colData[2],
    last_name: colData[3],
    email: colData[1],
    phone: colData[8],
    gender: colData[4],
    passport_number: colData[5],
    booked_activity: colData[6],
    booking_date: bookingDate.split('T')[0],
    certification_level: normalizeLevel(colData[13]),
    birth_date: birthDate ? birthDate.split('T')[0] : null,
    emergency_contact: colData[10],
    address: colData[11],
    lead_source: colData[12],
    total_dives: colData[14],
    last_dive_date: colData[15],
    form_origin: colData[16],
    created_at: createdAt || 'NOW()'
  });
}

// Generar SQL Batches
const BATCH_SIZE = 50;
const allSqlLines = customers.map(c => `(
    ${escape(c.first_name)},
    ${escape(c.last_name)},
    ${escape(c.email)},
    ${escape(c.phone)},
    ${escape(c.gender)},
    ${escape(c.passport_number)},
    ${escape(c.booked_activity)},
    ${escape(c.booking_date, true)},
    ${escape(c.certification_level)},
    ${escape(c.birth_date, true)},
    ${escape(c.emergency_contact)},
    ${escape(c.address)},
    ${escape(c.lead_source)},
    ${escape(c.total_dives)},
    ${escape(c.last_dive_date)},
    ${escape(c.form_origin)},
    ${c.created_at === 'NOW()' ? 'NOW()' : `'${c.created_at}'`}
  )`);

for (let i = 0; i < allSqlLines.length; i += BATCH_SIZE) {
  const batch = allSqlLines.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const sql = `INSERT INTO public.customers (
    first_name, last_name, email, phone, gender, passport_number, booked_activity, booking_date, certification_level, birth_date, emergency_contact, address, lead_source, total_dives, last_dive_date, form_origin, created_at
  ) VALUES \n` + batch.join(',\n') + ';';
  
  fs.writeFileSync(path.join(batchDir, `batch_${batchNum}.sql`), sql);
  console.log(`Lote ${batchNum} generado con ${batch.length} registros.`);
}

console.log(`Generados ${Math.ceil(customers.length / BATCH_SIZE)} lotes SQL para ${customers.length} registros.`);
