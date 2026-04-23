
const fs = require('fs');
const path = require('path');

const csvPath = 'BD/2025 sinfecahactividad.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

const emailsToNullify = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple split by comma (assuming no commas in the fields we care about, which is usually true for email)
    // Actually, the first field is quoted and has a comma: " 4 dic 25, 19:21:00"
    // So we need a better split.
    
    const parts = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$)/g) || [];
    // Index 1 is Correo
    // Index 7 is Fecha Actividad
    
    const email = parts[1]?.trim();
    const activityDate = parts[7]?.trim();
    
    if (email && (!activityDate || activityDate === '""')) {
        emailsToNullify.push(email);
    }
}

console.log(JSON.stringify(emailsToNullify));
