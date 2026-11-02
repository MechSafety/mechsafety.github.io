const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const training = fs.readFileSync('_cms_news/2026-07-29-pouch-cell-assembly-training.md', 'utf8');
const test = fs.readFileSync('_cms_news/2026-09-08-battery-thermal-runaway-test.md', 'utf8');

assert.match(training, /^title: 파우치셀 조립 공정 교육$/m);
assert.match(training, /^date: 2026-07-29$/m);
assert.match(training, /2026년 7월 29일 파우치셀 조립 공정 교육/);
assert.doesNotMatch(training, /2026-07-24(?!-training-program)|학생 전문교육 프로그램 참여|새로운 해석 기법/);
const photos = training.match(/^images:\r?\n((?:  - [^\r\n]+\r?\n)+)/m)[1]
  .trim().split(/\r?\n/).map(line => line.trim().slice(2));
const expectedPhotos = [1, 2, 3, 4, 5].map(index => `/images/uploads/pouch-cell-assembly-2026-07-29-0${index}.jpg`);
assert.deepEqual(photos, expectedPhotos);
for (const photo of photos) {
  const asset = path.join(process.cwd(), photo.slice(1));
  const bytes = fs.readFileSync(asset);
  assert.ok(bytes.length > 1000);
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
}
assert.match(training, /redirect_from:\r?\n  - \/news\/2026-07-24-training-program\//);
assert.match(test, /^title: 방재시험연구원 배터리 열폭주 시험$/m);
assert.match(test, /^date: 2026-09-08$/m);
assert.match(test, /2026년 9월 8일 방재시험연구원에서/);
assert.match(test, /redirect_from:\r?\n  - \/news\/2026-10-01\//);
assert.match(test, /\/images\/uploads\/file\.png\r?\n  - \/images\/uploads\/file-1\.png/);
assert.match(training, /^published: true$/m);
assert.match(test, /^published: true$/m);
const home = fs.readFileSync('index.html', 'utf8');
assert.match(home, /site\.cms_news \| where: 'published', true \| sort: 'date' \| reverse/);
assert.match(home, /include modern-news-card\.html item=item/);
console.log(JSON.stringify({pass: true, photos: photos.length, checks: ['July 29 training title and date', 'five photos in supplied order', 'original photo files present', 'September 8 thermal runaway title and content', 'existing thermal runaway photos retained', 'old URLs redirected', 'home latest news uses the same records']}));
