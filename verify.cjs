const fs = require('fs');
const path = require('path');

try {
  const filePath = path.resolve(__dirname, 'server/src/db/templates/bulk_exams.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  
  if (!data.exams || !Array.isArray(data.exams)) {
    throw new Error('Missing top-level "exams" array');
  }
  
  let examCount = 0;
  let subjectCount = 0;
  let topicCount = 0;
  const errors = [];
  
  data.exams.forEach((ex, i) => {
    examCount++;
    if (!ex.exam || !ex.exam.name) errors.push(`Exam at index ${i} missing exam.name`);
    if (!ex.subjects || !Array.isArray(ex.subjects)) errors.push(`Exam '${ex.exam?.name}' missing subjects array`);
    else {
      ex.subjects.forEach((sub, j) => {
        subjectCount++;
        if (!sub.name) errors.push(`Exam '${ex.exam?.name}' Subject ${j} missing name`);
        if (!sub.topics || !Array.isArray(sub.topics)) errors.push(`Exam '${ex.exam?.name}' Subject '${sub.name}' missing topics array`);
        else {
          sub.topics.forEach((top, k) => {
            topicCount++;
            if (!top.name) errors.push(`Exam '${ex.exam?.name}' Subject '${sub.name}' Topic ${k} missing name`);
          });
        }
      });
    }
  });

  if (errors.length > 0) {
    console.log('VALIDATION ERRORS:');
    errors.slice(0, 10).forEach(e => console.log(' - ' + e));
    if (errors.length > 10) console.log(`...and ${errors.length - 10} more errors`);
    process.exit(1);
  } else {
    console.log('JSON Structure is VALID!');
    console.log(`Found: ${examCount} exams, ${subjectCount} subjects, ${topicCount} topics.`);
  }
} catch (err) {
  console.error('PARSE ERROR:', err.message);
  process.exit(1);
}
