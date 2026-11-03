const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const training = fs.readFileSync('_cms_news/2026-07-29-pouch-cell-assembly-training.md', 'utf8');
const test = fs.readFileSync('_cms_news/2026-09-08-battery-thermal-runaway-test.md', 'utf8');
const dinner = fs.readFileSync('_cms_news/2026-06-24-lab-dinner.md', 'utf8');
const summit = fs.readFileSync('_cms_news/2026-05-14-tsne-tech-summit-2026.md', 'utf8');

assert.match(training, /^title: 파우치셀 조립 공정 교육$/m);
assert.match(training, /^date: 2026-07-29$/m);
assert.match(training, /파우치셀 조립 공정 교육에 참여했습니다/);
assert.doesNotMatch(training, /2026-07-24(?!-training-program)|학생 전문교육 프로그램 참여|새로운 해석 기법/);
const photos = training.match(/^images:\r?\n((?:  - [^\r\n]+\r?\n)+)/m)[1]
  .trim().split(/\r?\n/).map(line => line.trim().slice(2));
const expectedPhotos = [2, 1, 3, 4, 5].map(index => `/images/uploads/pouch-cell-assembly-2026-07-29-0${index}.jpg`);
assert.deepEqual(photos, expectedPhotos);
assert.match(dinner, /^title: 연구실 회식$/m);
assert.match(dinner, /^date: 2026-06-24$/m);
assert.match(dinner, /함께 식사하고 스크린 야구를 하며 즐거운 시간을 보냈습니다/);
assert.doesNotMatch(dinner, /교류/);
assert.doesNotMatch(test, /히팅 필름|열전대|5°C|홍동현, 남윤희|연구실 학생들이/);
for (const record of [dinner, training, test, summit]) {
  assert.doesNotMatch(record, /^summary:/m);
  assert.doesNotMatch(record, /연구실 구성원들이|연구실 학생들이|홍동현|남윤희|이서영|김성현/);
  const body = record.split(/^---\s*$/m).slice(2).join('').trim();
  assert.doesNotMatch(body, /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/);
}
assert.match(summit, /^title: TSNE Tech Summit 2026$/m);
assert.match(summit, /^date: 2026-05-14$/m);
assert.match(summit, /^category: 세미나$/m);
assert.match(summit, /공학 시뮬레이션과 인공지능 기술의 산업 활용 사례/);
const dinnerPhotos = dinner.match(/^images:\r?\n((?:  - [^\r\n]+\r?\n)+)/m)[1]
  .trim().split(/\r?\n/).map(line => line.trim().slice(2));
assert.deepEqual(dinnerPhotos, [1, 2, 3].map(index => `/images/uploads/lab-dinner-2026-06-24-0${index}.jpg`));
for (const photo of [...photos, ...dinnerPhotos]) {
  const asset = path.join(process.cwd(), photo.slice(1));
  const bytes = fs.readFileSync(asset);
  assert.ok(bytes.length > 1000);
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
}
assert.match(training, /redirect_from:\r?\n  - \/news\/2026-07-24-training-program\//);
assert.match(test, /^title: 방재시험연구원 배터리 열폭주 시험$/m);
assert.match(test, /^date: 2026-09-08$/m);
assert.match(test, /방재시험연구원에서 리튬이온 배터리 셀의 열폭주 시험을 진행했습니다/);
assert.match(test, /열폭주의 개시와 진행 양상, 가스 분출 위치를 관찰했습니다/);
assert.doesNotMatch(test, /위더스세웅/);
assert.match(test, /redirect_from:\r?\n  - \/news\/2026-10-01\//);
assert.match(test, /\/images\/uploads\/file\.png\r?\n  - \/images\/uploads\/file-1\.png/);
assert.match(training, /^published: true$/m);
assert.match(test, /^published: true$/m);
assert.match(dinner, /^published: true$/m);
const home = fs.readFileSync('index.html', 'utf8');
assert.match(home, /site\.cms_news \| where: 'published', true \| sort: 'date' \| reverse/);
assert.match(home, /include modern-news-card\.html item=item/);
const card = fs.readFileSync('_includes/modern-news-card.html', 'utf8');
assert.match(card, /datetime="\{\{ include\.item\.date \| date: '%Y-%m-%d' \}\}"/);
console.log(JSON.stringify({pass: true, trainingPhotos: photos.length, dinnerPhotos: dinnerPhotos.length, checks: ['July 29 training title and date', 'training first two photos swapped', 'June 24 lab dinner with three photos in supplied order', 'original photo files present', 'September 8 thermal runaway title and content', 'existing thermal runaway photos retained', 'old URLs redirected', 'home latest news uses the same records', 'normalized date attributes']}));
