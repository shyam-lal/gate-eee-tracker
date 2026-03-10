import fs from 'fs';
let text = fs.readFileSync('src/components/planner/PlannerDashboard.jsx', 'utf8');
text = text.replace(/\\`/g, '`');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/planner/PlannerDashboard.jsx', text);
console.log("Fixed backticks and dollar signs");
