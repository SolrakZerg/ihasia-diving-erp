import fs from 'fs';

const functionsFile = fs.readFileSync('database/db_functions.sql', 'utf8').replace(/\r\n/g, '\n');
const triggersFile = fs.readFileSync('database/db_triggers.sql', 'utf8').replace(/\r\n/g, '\n');

console.log("=== COMPROBACIÓN DE COMPLETITUD Y EXACTITUD ===");
console.log(`Tamaño db_functions.sql: ${functionsFile.length} caracteres, ${functionsFile.split('\n').length} líneas.`);
console.log(`Tamaño db_triggers.sql: ${triggersFile.length} caracteres, ${triggersFile.split('\n').length} líneas.`);

const suspiciousPatterns = ['...', 'TODO', 'FIXME', 'resumen', 'omitted', 'etc.'];

suspiciousPatterns.forEach(pat => {
  const fLines = functionsFile.split('\n').filter(line => line.includes(pat));
  const tLines = triggersFile.split('\n').filter(line => line.includes(pat));
  
  if (fLines.length > 0) {
    console.log(`db_functions.sql contiene "${pat}":`, fLines);
  }
  if (tLines.length > 0) {
    console.log(`db_triggers.sql contiene "${pat}":`, tLines);
  }
});
