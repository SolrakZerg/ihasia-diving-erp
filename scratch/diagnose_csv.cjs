const fs = require('fs');
const CSV_PATH = 'c:/Users/solra/Documents/Antigravity/diving-erp/BD/Registro IHASIA (respuestas) - Historial 2026.csv';

const monthsMap = {
  'ene':'01','feb':'02','mar':'03','abr':'04','may':'05','jun':'06',
  'jul':'07','ago':'08','sep':'09','sept':'09','oct':'10','nov':'11','dic':'12'
};

function parseDate(s) {
  if (!s) return null;
  const clean = s.replace(/"/g,'').trim().toLowerCase();
  const m = clean.match(/(\d{1,2})\s+([a-z]{3,4})\s+(\d{2})/);
  if (!m) return null;
  return monthsMap[m[2]] ? 'ok' : null;
}

function parseCSV(content) {
  const result = [];
  let cur = [], field = '', inQ = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i], n = content[i+1];
    if (c === '"' && inQ && n === '"') { field += '"'; i++; }
    else if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { cur.push(field); field = ''; }
    else if ((c === '\r' || c === '\n') && !inQ) {
      if (field || cur.length > 0) { cur.push(field); result.push(cur); cur = []; field = ''; }
      if (c === '\r' && n === '\n') i++;
    } else field += c;
  }
  if (field || cur.length > 0) { cur.push(field); result.push(cur); }
  return result;
}

function cleanStr(s) {
  if (!s) return null;
  let v = s.replace(/"/g,'').trim();
  v = v.replace(/[\u0000-\u001F\u007F-\u009F]/g,'');
  return v || null;
}

const content = fs.readFileSync(CSV_PATH, 'utf8');
const rows    = parseCSV(content);
const headers = rows[0];
const data    = rows.slice(1);

console.log(`CSV total filas (con cabecera): ${rows.length}`);
console.log(`Registros de datos:             ${data.length}`);
console.log(`Columnas esperadas (cabecera):  ${headers.length}`);
console.log('');

const issues = [];
const firstNames = new Map(); // para detectar duplicados de nombre+email

for (let i = 0; i < data.length; i++) {
  const col = data[i];
  const csvRow = i + 2;

  if (col.length < 5) {
    issues.push({ csvRow, type:'EMPTY_ROW', cols: col.length });
    continue;
  }

  const firstName = cleanStr(col[2]);
  const email     = cleanStr(col[1]);
  const passport  = cleanStr(col[5]);

  // NOT NULL violation
  if (!firstName) {
    issues.push({ csvRow, type:'FIRST_NAME_NULL', raw: JSON.stringify(col.slice(0,6)) });
  }

  // Columnas insuficientes
  if (col.length < 17) {
    issues.push({ csvRow, type:'MISSING_COLS', cols: col.length, firstName });
  }

  // booking_date inválida (col[7]) — causaría error de tipo DATE
  const bdRaw = col[7] ? col[7].trim() : '';
  if (!bdRaw || !parseDate(bdRaw)) {
    issues.push({ csvRow, type:'INVALID_BOOKING_DATE', raw: bdRaw, firstName });
  }

  // created_at inválida (col[0])
  const caRaw = col[0] ? col[0].trim() : '';
  if (!caRaw || !parseDate(caRaw)) {
    issues.push({ csvRow, type:'INVALID_CREATED_AT', raw: caRaw, firstName });
  }

  // birth_date inválida (col[9])
  const bdateRaw = col[9] ? col[9].trim() : '';
  if (bdateRaw && !parseDate(bdateRaw)) {
    issues.push({ csvRow, type:'INVALID_BIRTH_DATE', raw: bdateRaw, firstName });
  }

  // Apóstrofes en campos (debug info)
  for (let j = 0; j < col.length; j++) {
    if (col[j] && col[j].includes("'") && col[j].includes("'")) {
      // single quote — solo informativo, el escape debe manejarlo
    }
  }
}

// Resumen
console.log(`Total issues encontrados: ${issues.length}`);
console.log('');

const byType = {};
for (const issue of issues) {
  byType[issue.type] = (byType[issue.type] || 0) + 1;
}
console.log('Por tipo:');
for (const [type, count] of Object.entries(byType)) {
  console.log(`  ${type}: ${count}`);
}

console.log('');
console.log('Detalle:');
for (const issue of issues) {
  console.log(JSON.stringify(issue));
}

// Generar lista de filas OK vs KO
const okRows  = data.filter((_, i) => !issues.find(x => x.csvRow === i+2)).length;
console.log('');
console.log(`Filas sin issues: ~${data.length - (new Set(issues.map(x=>x.csvRow))).size}`);
console.log(`Filas con issues: ${(new Set(issues.map(x=>x.csvRow))).size}`);
