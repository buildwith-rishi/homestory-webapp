const fs = require('fs');
const content = fs.readFileSync('src/pages/dashboard/UserManagement.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => { if (line.includes('adminAPI.createUser')) console.log(lines.slice(i, i+15).join('\n')); });
