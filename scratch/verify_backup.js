import fs from 'fs';
import path from 'path';

const functionsFile = fs.readFileSync('database/db_functions.sql', 'utf8');
const triggersFile = fs.readFileSync('database/db_triggers.sql', 'utf8');
const tablesFile = fs.readFileSync('database/db_tables.sql', 'utf8');

// Match CREATE OR REPLACE FUNCTION occurrences
const functionMatches = functionsFile.match(/CREATE OR REPLACE FUNCTION [\s\S]*?\$function\$/g) || [];
// Match CREATE TRIGGER occurrences
const triggerMatches = triggersFile.match(/CREATE TRIGGER [^\n]+/g) || [];
// Match CREATE TABLE occurrences
const tableMatches = tablesFile.match(/CREATE TABLE [^\n\(]+/g) || [];

console.log(`=== AUDITORÍA DE ARCHIVOS DE RESPALDO ===`);
console.log(`Funciones encontradas en db_functions.sql: ${functionMatches.length}`);
console.log(`Triggers encontrados en db_triggers.sql: ${triggerMatches.length}`);
console.log(`Tablas encontradas en db_tables.sql: ${tableMatches.length}`);
