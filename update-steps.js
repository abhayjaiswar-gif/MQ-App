const fs = require('fs');
let content = fs.readFileSync('school-assessment.html', 'utf-8');

// 1. Remove steps 2, 3, 4
const step2To4Regex = /    <!-- STEP 2: Name -->[\s\S]*?<!-- STEP 5 -->/;
content = content.replace(step2To4Regex, '    <!-- STEP 5 -->');

// 2. Fix the counter
content = content.replace(/Step 01 \/ 21/g, 'Step 01 / 18');

const offsets = [
  { old: '05', new: '02' },
  { old: '06', new: '03' },
  { old: '07', new: '04' },
  { old: '08', new: '05' },
  { old: '09', new: '06' },
  { old: '10', new: '07' },
  { old: '11', new: '08' },
  { old: '12', new: '09' },
  { old: '13', new: '10' },
  { old: '14', new: '11' },
  { old: '15', new: '12' },
  { old: '16', new: '13' },
  { old: '17', new: '14' },
  { old: '18', new: '15' },
  { old: '19', new: '16' },
  { old: '20', new: '17' },
  { old: '21', new: '18' },
];

offsets.forEach(o => {
  content = content.replace(new RegExp(`Step ${o.old} \\/ 21`, 'g'), `Step ${o.new} / 18`);
});

fs.writeFileSync('school-assessment.html', content);
console.log('done');
