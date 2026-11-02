const fs = require('node:fs');
const assert = require('node:assert/strict');
const cms = fs.readFileSync('.pages.yml', 'utf8').replace(/\r\n/g, '\n');
const news = cms.split('      - name: news')[1].split('      - name: members')[0];
const field = name => news.split(`          - name: ${name}\n`)[1]?.split(/\n          - name: /)[0];

assert.match(news, /type: collection\s+path: _cms_news/);
assert.match(news, /sort: date\s+order: desc/);
for (const name of ['title', 'date', 'summary', 'body', 'images', 'published']) {
  assert.ok(field(name), `Missing news field: ${name}`);
  assert.match(field(name), /description:/);
}
assert.match(field('date'), /최신 소식 3개/);
assert.match(field('summary'), /연구실 구성원들이/);
assert.match(field('body'), /1~2문장/);
assert.match(field('body'), /media: false/);
assert.match(field('images'), /개수 제한 없이/);
assert.match(field('images'), /첫 사진이 News와 Home의 대표 사진/);
assert.match(field('images'), /원본 비율을 유지하고 긴 변/);
assert.match(field('images'), /multiple: true/);
assert.doesNotMatch(field('images'), /\bmax:/);
assert.match(field('published'), /정식 홈페이지 배포/);
assert.match(cms, /content:\s+merge: true/);

console.log(JSON.stringify({pass: true, checks: ['same news collection used by CMS and site', 'date-based sorting retained', 'field-level writing guidance', 'body photos routed to dedicated gallery', 'unlimited ordered photos with first-photo cover', 'automatic longest-edge sizing explained', 'live publishing and result check explained', 'existing metadata preserved']}));
