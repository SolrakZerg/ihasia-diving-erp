const fs = require('fs');
const https = require('https');

// ── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://mowoxxyusicasgxouhxv.supabase.co';
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY; // pasa como env var
const CSV_PATH      = 'c:/Users/solra/Documents/Antigravity/diving-erp/BD/Registro IHASIA (respuestas) - Historial 2026.csv';
// ────────────────────────────────────────────────────────────────────────────

if (!SUPABASE_KEY) {
  console.error('ERROR: Define la variable de entorno SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

const monthsMap = {
  'ene':'01','feb':'02','mar':'03','abr':'04','may':'05','jun':'06',
  'jul':'07','ago':'08','sep':'09','sept':'09','oct':'10','nov':'11','dic':'12'
};

function parseSpanishDate(dateStr) {
  if (!dateStr || dateStr.trim() === '' || dateStr.includes('---')) return null;
  let clean = dateStr.replace(/"/g, '').trim().toLowerCase();
  const regex = /(\d{1,2})\s+([a-z]{3,4})\s+(\d{2})/;
  const match = clean.match(regex);
  if (!match) return null;
  let day    = match[1].padStart(2, '0');
  let month  = monthsMap[match[2]];
  if (!month) return null;
  let rawYear = parseInt(match[3]);
  let year   = (rawYear > 30 ? '19' : '20') + match[3];
  let time   = '12:00:00';
  const tMatch = clean.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (tMatch) time = `${tMatch[1].padStart(2,'0')}:${tMatch[2]}:${tMatch[3]}`;
  return `${year}-${month}-${day}T${time}`;
}

function cleanStr(str) {
  if (str === null || str === undefined) return null;
  let v = String(str).replace(/"/g, '').trim();
  // Eliminar caracteres de control
  v = v.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  const nullWords = ['--- none ---','--- ninguno ---','--- never ---',
                     '--- nunca---','--- nunca ---','none','never','nunca','---',''];
  if (nullWords.includes(v.toLowerCase())) return null;
  return v || null;
}

function normalizeLevel(level) {
  if (!level) return '--- No estoy Certificado ---';
  let clean = level.trim();
  if (clean.toLowerCase() === 'advance') return 'Advanced';
  return clean;
}

function parseCSV(content) {
  const result = [];
  let currentLine = [], currentField = '', inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i], nextChar = content[i+1];
    if (char === '"' && inQuotes && nextChar === '"') { currentField += '"'; i++; }
    else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { currentLine.push(currentField); currentField = ''; }
    else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        result.push(currentLine);
        currentLine = []; currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else { currentField += char; }
  }
  if (currentField || currentLine.length > 0) { currentLine.push(currentField); result.push(currentLine); }
  return result;
}

// ── HTTP REQUEST ─────────────────────────────────────────────────────────────

function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url  = new URL(SUPABASE_URL + path);
    const opts = {
      hostname: url.hostname, port: 443, path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getCount() {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + '/rest/v1/customers?select=id&count=exact&limit=1');
    const opts = {
      hostname: url.hostname, port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    };
    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        const countHeader = res.headers['content-range'];
        // content-range: 0-0/370
        const m = countHeader && countHeader.match(/\/(\d+)/);
        resolve(m ? parseInt(m[1]) : -1);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Count actual
  const startCount = await getCount();
  console.log(`\n🔢 Registros actuales en BD: ${startCount}\n`);

  // 2. Parse CSV
  const content  = fs.readFileSync(CSV_PATH, 'utf8');
  const allRows  = parseCSV(content);
  const dataRows = allRows.slice(1); // skip header
  console.log(`📄 Filas en CSV (sin cabecera): ${dataRows.length}`);

  // 3. Build records
  const records = [];
  for (let i = 0; i < dataRows.length; i++) {
    const col = dataRows[i];
    if (col.length < 5) { console.log(`  ⚠️  Fila ${i+2} ignorada (muy pocas columnas: ${col.length})`); continue; }
    
    const createdAt   = parseSpanishDate(col[0]);
    const bookingDate = parseSpanishDate(col[7]);
    const birthDate   = parseSpanishDate(col[9]);

    records.push({
      _csvRow: i + 2, // número de fila en CSV (cabecera = fila 1)
      first_name:         cleanStr(col[2]),
      last_name:          cleanStr(col[3]),
      email:              cleanStr(col[1]),
      phone:              cleanStr(col[8]),
      gender:             cleanStr(col[4]),
      passport_number:    cleanStr(col[5]),
      booked_activity:    cleanStr(col[6]),
      booking_date:       bookingDate ? bookingDate.split('T')[0] : '2026-01-01',
      certification_level: normalizeLevel(cleanStr(col[13])),
      birth_date:         birthDate  ? birthDate.split('T')[0]  : null,
      emergency_contact:  cleanStr(col[10]),
      address:            cleanStr(col[11]),
      lead_source:        cleanStr(col[12]),
      total_dives:        cleanStr(col[14]),
      last_dive_date:     cleanStr(col[15]),
      form_origin:        cleanStr(col[16]),
      created_at:         createdAt || null // null = BD usa NOW()
    });
  }

  console.log(`✅ Registros parseados del CSV: ${records.length}`);

  // 4. Insertar fila a fila con reporte de errores
  let ok = 0, fail = 0;
  const failures = [];

  for (const rec of records) {
    const csvRow = rec._csvRow;
    const payload = { ...rec };
    delete payload._csvRow;
    // Supabase REST no acepta null para TS; omitir si null
    if (!payload.created_at) delete payload.created_at;
    if (!payload.birth_date) delete payload.birth_date;

    const res = await postJSON('/rest/v1/customers', payload);

    if (res.status === 201) {
      ok++;
    } else {
      fail++;
      const reason = typeof res.body === 'object'
        ? (res.body.message || res.body.error || JSON.stringify(res.body))
        : res.body;
      console.error(`  ❌ Fila CSV ${csvRow} | HTTP ${res.status} | ${reason}`);
      console.error(`     first_name="${payload.first_name}" email="${payload.email}" passport="${payload.passport_number}"`);
      failures.push({ csvRow, status: res.status, reason, first_name: payload.first_name, email: payload.email });
    }
  }

  // 5. Resumen final
  const endCount = await getCount();
  console.log('\n══════════════════════════════════════════');
  console.log(`Registros antes:    ${startCount}`);
  console.log(`Registros después:  ${endCount}`);
  console.log(`Insertados ahora:   ${endCount - startCount}`);
  console.log(`Éxitos esperados:   ${ok}`);
  console.log(`Fallos:             ${fail}`);
  console.log('══════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n📋 RESUMEN DE FALLOS:');
    for (const f of failures) {
      console.log(`  Fila ${f.csvRow}: [${f.status}] ${f.reason} (${f.first_name} / ${f.email})`);
    }
    // Guardar log de fallos
    fs.writeFileSync('scratch/failures.json', JSON.stringify(failures, null, 2));
    console.log('\n💾 Log guardado en scratch/failures.json');
  }
}

main().catch(console.error);
