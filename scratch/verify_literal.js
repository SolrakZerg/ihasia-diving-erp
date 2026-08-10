import fs from 'fs';

const fileContent = fs.readFileSync('database/db_functions.sql', 'utf8').replace(/\r\n/g, '\n');

// Extraer bloques de funciones
const rawBlocks = fileContent.split(/(?=CREATE OR REPLACE FUNCTION)/g).filter(b => b.trim().startsWith('CREATE OR REPLACE FUNCTION'));

console.log(`Total de funciones parseadas en db_functions.sql: ${rawBlocks.length}`);

let totalLines = 0;
let totalChars = 0;

rawBlocks.forEach((block, idx) => {
  const matchHeader = block.match(/CREATE OR REPLACE FUNCTION ([^\n\(]+)/);
  const funcName = matchHeader ? matchHeader[1] : `Función #${idx + 1}`;
  const lines = block.trim().split('\n').length;
  const chars = block.trim().length;
  totalLines += lines;
  totalChars += chars;
  console.log(`  - ${funcName}: ${lines} líneas, ${chars} caracteres`);
});

console.log(`\nSuma Total: ${totalLines} líneas de código PL/pgSQL puro, ${totalChars} caracteres en 37 funciones.`);
