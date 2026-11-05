const fs = require('node:fs');
const assert = require('node:assert/strict');

const records = [
  {
    file: '_cms_news/2026-10-29-kosos-autumn-oral-hong.md',
    title: '2026 한국안전학회 추계학술대회 구두발표 (홍동현)',
    body: '홍동현 학생이 2026 한국안전학회 추계학술대회에서 「진동 데이터를 이용한 로봇 매니퓰레이터의 기계적 고장에 대한 딥러닝 기반 진단 모델 개발」 연구를 구두로 발표했습니다. 남윤희 학생이 공동저자로 참여했습니다.',
  },
  {
    file: '_cms_news/2026-10-29-kosos-autumn-poster-kim.md',
    title: '2026 한국안전학회 추계학술대회 포스터발표 (김성현)',
    body: '김성현 학생이 2026 한국안전학회 추계학술대회에서 「YOLO 기반 리튬이온 배터리 외관 이상 검출 모델」 연구를 포스터로 발표했습니다. 홍동현 학생이 공동저자로 참여했습니다.',
  },
];

for (const record of records) {
  const source = fs.readFileSync(record.file, 'utf8');
  const body = source.split(/^---\s*$/m).slice(2).join('').trim();
  assert.ok(source.includes(`title: ${record.title}`));
  assert.match(source, /^date: 2026-10-29$/m);
  assert.match(source, /^category: 학술대회$/m);
  assert.match(source, /^images: \[\]$/m);
  assert.match(source, /^published: true$/m);
  assert.doesNotMatch(source, /구두 발표|포스터 발표|이채민|^summary:/m);
  assert.equal(body, record.body);
  assert.doesNotMatch(body, /\r?\n/);
}

assert.match(fs.readFileSync('_cms_news/2026-10-01-2026.md', 'utf8'), /^published: false$/m);
console.log(JSON.stringify({pass: true, checks: ['two separate approved conference stories', 'consistent presentation title spacing', 'exact research titles and student coauthors', 'single paragraph and no separate summary', 'empty photo lists ready for later uploads', 'original unpublished placeholder retained']}));
