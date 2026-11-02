const fs = require('node:fs');
const assert = require('node:assert/strict');
const template = fs.readFileSync('courses/index.html', 'utf8');
assert.match(template, /for offering in course\.offerings/);
assert.doesNotMatch(template, /course\.audience|수강대상/);
const semesters = ['1학기', '하계학기', '2학기', '동계학기'];
const titles = new Set();
let courses = 0, offerings = 0;
for (const file of fs.readdirSync('_cms_courses').filter(file => file.endsWith('.md'))) {
  const text = fs.readFileSync('_cms_courses/' + file, 'utf8');
  const title = text.match(/^title: (.+)$/m)?.[1].trim();
  const english = text.match(/^title_en: (.+)$/m)?.[1].trim();
  assert.ok(title && english, 'Bilingual course name required: ' + file);
  assert.ok(!titles.has(title), 'Duplicate course: ' + title);
  titles.add(title);
  const entries = [...text.matchAll(/- year: (\d{4})\r?\n\s+semester: ([^\r\n]+)/g)];
  const seen = new Set();
  let previous = -Infinity;
  for (const entry of entries) {
    const year = Number(entry[1]), semester = entry[2].trim();
    assert.ok(semesters.includes(semester), 'Invalid semester: ' + file);
    const key = year + '/' + semester;
    assert.ok(!seen.has(key), 'Duplicate offering: ' + title + ' ' + key);
    seen.add(key);
    const chronological = year * 4 + semesters.indexOf(semester);
    assert.ok(chronological >= previous, 'Offerings must be chronological: ' + file);
    previous = chronological;
    offerings++;
  }
  courses++;
}
console.log(JSON.stringify({pass: true, courses, offerings, checks: ['bilingual course names', 'valid semesters', 'no duplicate offerings', 'chronological history', 'existing offering display retained']}));
