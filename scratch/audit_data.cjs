const fs = require('fs');

async function audit() {
  const csvPath = 'c:/Users/solra/Documents/Antigravity/diving-erp/BD/Registro IHASIA (respuestas) - Historial 2026.csv';
  if (!fs.existsSync(csvPath)) {
    console.error('CSV no encontrado en ' + csvPath);
    return;
  }
  
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const csvEmails = new Set();
  
  for(let i = 1; i < lines.length; i++) {
    const emailMatch = lines[i].match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if(emailMatch) {
      csvEmails.add(emailMatch[0].toLowerCase().trim());
    }
  }

  console.log(`CSV_TOTAL_UNIQUE_EMAILS:${csvEmails.size}`);
  // Imprimir una lista de emails para comparar vía SQL
  // console.log(JSON.stringify(Array.from(csvEmails)));
}

audit();
