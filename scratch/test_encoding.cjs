const fs = require('fs');
const csvPath = 'c:/Users/solra/Documents/Antigravity/diving-erp/BD/Registro IHASIA (respuestas) - Historial 2026.csv';

// Probar lectura en latin1
const content = fs.readFileSync(csvPath, 'latin1');
console.log('--- Probar Latin1 (primeros 500 chars) ---');
console.log(content.substring(0, 500));

// Buscar una palabra con ñ o tilde
if (content.includes('Gómez') || content.includes('Gomez')) {
    console.log('\nEncontrado Gomez!');
}
