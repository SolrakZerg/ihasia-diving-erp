const fs = require('fs');
const path = require('path');

// Este script solo sirve para mostrar el contenido de los 11 lotes para que yo pueda copiarlos
// sin que el visor de Antigravity los recorte.

const batchesDir = 'c:/Users/solra/Documents/Antigravity/diving-erp/scratch/batches';

async function run() {
  for (let i = 1; i <= 11; i++) {
    const filePath = path.join(batchesDir, `batch_${i}.sql`);
    if (fs.existsSync(filePath)) {
      console.log(`--- INICIO LOTE ${i} ---`);
      console.log(fs.readFileSync(filePath, 'utf8'));
      console.log(`--- FIN LOTE ${i} ---`);
    }
  }
}

run();
