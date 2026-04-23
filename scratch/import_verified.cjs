const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Leer .env ────────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env');
const envVars = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/\r$/, '');
});

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SERVICE_KEY  = envVars['SUPABASE_SERVICE_KEY'];
const CSV_PATH     = path.resolve(__dirname, '../BD/Registro IHASIA (respuestas) - Historial 2018.csv');

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === 'PEGA_AQUI_TU_SERVICE_ROLE_KEY') {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en el .env');
  process.exit(1);
}

console.log('Supabase URL:', SUPABASE_URL);
console.log('Service key:  ...', SERVICE_KEY.slice(-10));

// ── Parser CSV ────────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const monthsMap = {
  'ene':'01','enero':'01','feb':'02','febrero':'02','mar':'03','marzo':'03',
  'abr':'04','abril':'04','may':'05','mayo':'05','jun':'06','junio':'06',
  'jul':'07','julio':'07','ago':'08','agosto':'08','sep':'09','sept':'09',
  'septiembre':'09','octubre':'10','oct':'10','nov':'11','noviembre':'11',
  'dic':'12','diciembre':'12'
};

// Nombres de meses usados como separadores en los CSV históricos
const MONTH_SEPARATORS = new Set([
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
  'january','february','march','april','june','july',
  'august','september','october','november','december'
]);

/**
 * Devuelve true si la fila es un separador de mes o está vacía.
 * Criterio: primera celda es un nombre de mes O todas las celdas útiles están vacías.
 */
function isSkipRow(cols) {
  const first = (cols[0] || '').trim().toLowerCase();
  if (MONTH_SEPARATORS.has(first)) return true;
  // Fila vacía: menos de 3 campos con contenido real
  const nonEmpty = cols.filter(c => c.trim() !== '').length;
  return nonEmpty < 3;
}

/**
 * Parsea una fecha en formato español "1/01/2024 19:06:40" o "02/03/2024" o "d/m/YYYY"
 * Devuelve ISO string o null.
 */
function parseSlashDate(s) {
  if (!s) return null;
  const clean = s.replace(/"/g,'').trim();
  // Formato: d/m/YYYY o d/m/YYYY H:MM:SS (guión o barra)
  const m = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  let [,d,mo,y,h,mi,s2] = m;
  if (y.length === 2) y = (parseInt(y) > 30 ? '19' : '20') + y;
  const date = `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  const time = h ? `${h.padStart(2,'0')}:${(mi||'00').padStart(2,'0')}:${(s2||'00').padStart(2,'0')}` : '12:00:00';
  return `${date}T${time}`;
}

/**
 * Parsea fecha en formato español "15 ene 25" (formato 2025/2026)
 */
function parseSpanishDate(s) {
  if (!s) return null;
  const clean = s.replace(/"/g,'').trim().toLowerCase();
  const m = clean.match(/(\d{1,2})\s+([a-záéíóúü]{2,})\s+(\d{2,4})/);
  if (!m) return null;
  const month = monthsMap[m[2]];
  if (!month) return null;
  const day  = m[1].padStart(2,'0');
  const raw  = parseInt(m[3]);
  const year = m[3].length === 4 ? m[3] : (raw > 30 ? '19' : '20') + m[3];
  let time = '12:00:00';
  const tm = clean.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (tm) time = `${tm[1].padStart(2,'0')}:${tm[2]}:${tm[3]}`;
  return `${year}-${month}-${day}T${time}`;
}

/**
 * Intenta parsear cualquier formato de fecha.
 */
function parseAnyDate(s) {
  if (!s) return null;
  const clean = s.replace(/"/g,'').trim();
  if (!clean) return null;
  // Formato con barra (2024 y anteriores)
  if (clean.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) return parseSlashDate(clean);
  // Formato español con mes abreviado (2025/2026)
  if (clean.match(/\d{1,2}\s+[a-záéíóú]/i)) return parseSpanishDate(clean);
  return null;
}

function cleanStr(s) {
  if (s === null || s === undefined) return null;
  let v = s.replace(/"/g,'').trim();
  v = v.replace(/[\u0000-\u001F\u007F-\u009F]/g,'');
  const nullWords = [
    '--- none ---','--- ninguno ---','--- never ---','--- nunca---','--- nunca ---',
    '--- no estoy certificado ---','--- ninguno ---','--- nunca---',
    'none','never','nunca','---','','false','#error!'
  ];
  if (nullWords.includes(v.toLowerCase())) return null;
  return v || null;
}

function normalizeLevel(level) {
  if (!level) return null;
  const clean = level.trim();
  if (clean.toLowerCase() === 'advance') return 'Advanced';
  return clean;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function apiRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url  = new URL(SUPABASE_URL + apiPath);
    const opts = {
      hostname: url.hostname, port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try   { resolve({ status: res.statusCode, headers: res.headers, body: raw ? JSON.parse(raw) : null }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getCount() {
  const res = await apiRequest('GET', '/rest/v1/customers?select=count', null);
  if (res.status === 200 && Array.isArray(res.body) && res.body[0]?.count !== undefined) {
    return parseInt(res.body[0].count);
  }
  const cr = res.headers && res.headers['content-range'];
  const m  = cr && cr.match(/\/(\d+)/);
  return m ? parseInt(m[1]) : -1;
}

// ── Detectar formato y construir registros ────────────────────────────────────
const content = fs.readFileSync(CSV_PATH, 'utf8');
const allRows = parseCSV(content);

if (allRows.length < 2) {
  console.error('ERROR: CSV vacío o sin filas de datos.');
  process.exit(1);
}

const headerRow = allRows[0];
const numCols   = headerRow.length;

// Detectar formato por número de columnas o por nombres de cabecera
// Formato NUEVO (2025/2026): 16-17 columnas, cabecera "Timestamp","Correo"...
// Formato ANTIGUO (2024 y anteriores): 14 columnas, cabecera "Marca temporal","Dirección de correo"...
const isNewFormat = numCols >= 16;

console.log(`\n📄 Formato detectado: ${isNewFormat ? 'NUEVO (2025/2026, ' + numCols + ' cols)' : 'HISTÓRICO (2024 y anteriores, ' + numCols + ' cols)'}`);
console.log(`   Cabecera: [${headerRow.slice(0,5).join(' | ')} ...]`);

/**
 * Mapea una fila del formato ANTIGUO (2018-2024).
 * Maneja tanto la versión de 14 columnas (con Género/Pasaporte) como la de 12 (sin ellos).
 */
function mapOldFormat(col, csvRowNum, numCols) {
  const ts = parseAnyDate(col[0]);
  const birthDate = parseAnyDate(col[numCols === 12 ? 5 : 7]);
  
  let rec = {};
  
  if (numCols === 12) {
    // Nuevo formato 2018 (12 columnas)
    rec = {
      first_name:          cleanStr(col[2]) || 'UNKNOWN',
      last_name:           cleanStr(col[3]),
      email:               cleanStr(col[1]),
      phone:               null,
      gender:              null,
      passport_number:     null,
      booked_activity:     cleanStr(col[4]),
      booking_date:        null, // No hay fecha de actividad real en 2018
      certification_level: normalizeLevel(cleanStr(col[9])),
      emergency_contact:   cleanStr(col[6]),
      address:             cleanStr(col[7]),
      lead_source:         cleanStr(col[8]),
      total_dives:         cleanStr(col[10]),
      last_dive_date:      cleanStr(col[11]),
      form_origin:         null,
      insurance_expiry:    null
    };
  } else {
    // Formato histórico estándar (14 columnas)
    rec = {
      first_name:          cleanStr(col[2]) || 'UNKNOWN',
      last_name:           cleanStr(col[3]),
      email:               cleanStr(col[1]),
      phone:               null,
      gender:              cleanStr(col[4]),
      passport_number:     cleanStr(col[5]),
      booked_activity:     cleanStr(col[6]),
      booking_date:        null, // No hay fecha de actividad real en formatos antiguos
      certification_level: normalizeLevel(cleanStr(col[11])),
      emergency_contact:   cleanStr(col[8]),
      address:             cleanStr(col[9]),
      lead_source:         cleanStr(col[10]),
      total_dives:         cleanStr(col[12]),
      last_dive_date:      cleanStr(col[13]),
      form_origin:         null,
      insurance_expiry:    null
    };
  }
  
  if (birthDate) rec.birth_date = birthDate.split('T')[0];
  if (ts)        rec.created_at = ts;
  return { _csvRow: csvRowNum, ...rec };
}

/**
 * Mapea una fila del formato NUEVO (2025/2026) a un registro BD.
 * Columnas: Timestamp(0)|Correo(1)|Nombre(2)|Apellidos(3)|Genero(4)|Pasaporte(5)|
 *           Actividad(6)|Fecha Actividad(7)|WhatsApp(8)|Fecha Nacimiento(9)|
 *           Contacto Emergencia(10)|Direccion(11)|Como Nos Conociste(12)|
 *           Nivel Buceador(13)|Numero Buceos(14)|Fecha Ultimo Buceo(15)|Origen Formulario(16)
 */
function mapNewFormat(col, csvRowNum) {
  const ts = parseSpanishDate(col[0]);
  const bookingDate = parseAnyDate(col[7]);
  const birthDate   = parseAnyDate(col[9]);
  const rec = {
    first_name:          cleanStr(col[2]) || 'UNKNOWN',
    last_name:           cleanStr(col[3]),
    email:               cleanStr(col[1]),
    phone:               cleanStr(col[8]),
    gender:              cleanStr(col[4]),
    passport_number:     cleanStr(col[5]),
    booked_activity:     cleanStr(col[6]),
    booking_date:        bookingDate ? bookingDate.split('T')[0] : null,
    certification_level: normalizeLevel(cleanStr(col[13])),
    emergency_contact:   cleanStr(col[10]),
    address:             cleanStr(col[11]),
    lead_source:         cleanStr(col[12]),
    total_dives:         cleanStr(col[14]),
    last_dive_date:      cleanStr(col[15]),
    form_origin:         cleanStr(col[16]),
  };
  if (birthDate) rec.birth_date = birthDate.split('T')[0];
  if (ts)        rec.created_at = ts;
  return { _csvRow: csvRowNum, ...rec };
}

// Construir registros saltando cabecera, separadores de mes y filas vacías
const records = [];
for (let i = 1; i < allRows.length; i++) {
  const col = allRows[i];
  if (isSkipRow(col)) continue;
  try {
    const rec = isNewFormat ? mapNewFormat(col, i + 1) : mapOldFormat(col, i + 1, numCols);
    if (rec.first_name) records.push(rec);
  } catch (e) {
    console.warn(`  ⚠️  Fila ${i+1} ignorada por error: ${e.message}`);
  }
}

console.log(`\nCSV: ${records.length} registros válidos (de ${allRows.length - 1} filas de datos)\n`);

// ── Insert con verificación ───────────────────────────────────────────────────
const BATCH_SIZE = 15;

async function main() {
  const startCount = await getCount();
  console.log(`📊 Registros en BD al inicio: ${startCount}`);
  console.log(`📋 Registros a insertar del CSV: ${records.length}`);
  console.log(`\nInsertando en lotes de ${BATCH_SIZE}...\n`);

  let totalOk = 0;
  const failures = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch    = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const payload  = batch.map(r => { const p = {...r}; delete p._csvRow; return p; });

    const res = await apiRequest('POST', '/rest/v1/customers', payload);

    let batchOk = 0, batchFail = 0;

    if (res.status === 201 || res.status === 200) {
      batchOk = batch.length;
      totalOk += batchOk;
    } else {
      console.log(`  ⚠️  Lote ${batchNum} rechazado (HTTP ${res.status}), intentando fila por fila...`);
      for (const rec of batch) {
        const p = {...rec}; delete p._csvRow;
        const r2 = await apiRequest('POST', '/rest/v1/customers', p);
        if (r2.status === 201 || r2.status === 200) {
          batchOk++;
          totalOk++;
        } else {
          batchFail++;
          const reason = typeof r2.body === 'object'
            ? (r2.body?.message || r2.body?.error || JSON.stringify(r2.body))
            : r2.body;
          console.error(`    ❌ Fila CSV ${rec._csvRow}: [${r2.status}] ${reason}`);
          console.error(`       first_name="${rec.first_name}" email="${rec.email}"`);
          failures.push({ csvRow: rec._csvRow, status: r2.status, reason,
                          first_name: rec.first_name, email: rec.email });
        }
      }
    }

    // Verificar count real cada 3 lotes
    if (batchNum % 3 === 0 || i + BATCH_SIZE >= records.length) {
      const currentCount = await getCount();
      console.log(`  Lote ${batchNum.toString().padStart(3)} | OK acum: ${totalOk.toString().padStart(4)} | BD real: ${currentCount}`);
    } else {
      console.log(`  Lote ${batchNum.toString().padStart(3)} | OK acum: ${totalOk.toString().padStart(4)}`);
    }
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  const endCount = await getCount();
  console.log('\n══════════════════════════════════════════════════');
  console.log(`BD al inicio:       ${startCount}`);
  console.log(`BD al final:        ${endCount}`);
  console.log(`Insertados ahora:   ${endCount - startCount}`);
  console.log(`Fallos detectados:  ${failures.length}`);
  console.log('══════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n📋 FILAS CON FALLO:');
    failures.forEach(f =>
      console.log(`  Fila ${f.csvRow}: [${f.status}] ${f.reason} | ${f.first_name} / ${f.email}`)
    );
    fs.writeFileSync(path.join(__dirname, 'failures.json'), JSON.stringify(failures, null, 2));
    console.log('\n💾 Guardado en scratch/failures.json');
  }

  if (failures.length === 0) {
    console.log('\n✅ ¡MIGRACIÓN COMPLETA! 0 fallos.');
  } else {
    console.log(`\n⚠️  Migración finalizada con ${failures.length} fallo(s).`);
  }
}

main().catch(console.error);
