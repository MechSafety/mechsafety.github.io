const fs = require('node:fs');
const assert = require('node:assert/strict');
const cms = fs.readFileSync('.pages.yml', 'utf8').replace(/\r\n/g, '\n');
const news = cms.split('      - name: news')[1].split('      - name: members')[0];
const field = name => news.split(`          - name: ${name}\n`)[1]?.split(/\n          - name: /)[0];

assert.match(news, /type: collection\s+path: _cms_news/);
assert.match(news, /sort: date\s+order: desc/);
for (const name of ['title', 'date', 'body', 'images', 'published']) {
  assert.ok(field(name), `Missing news field: ${name}`);
  assert.match(field(name), /description:/);
}
const descriptions = Object.fromEntries(['title', 'date', 'body', 'images', 'published'].map(name => [name, field(name).match(/description: ([^\n]+)/)[1]]));
assert.deepEqual(descriptions, {
  title: '행사명 또는 활동명을 입력합니다.',
  date: '실제 활동 날짜를 입력합니다.',
  body: '같은 내용은 한 문단으로 이어 씁니다. News와 Home에는 본문 앞부분이 표시됩니다.',
  images: '표시할 순서대로 추가합니다. 첫 사진이 대표 사진이며, 개수 제한은 없습니다.',
  published: '켜고 Save를 누르면 홈페이지에 공개됩니다.'
});
assert.doesNotMatch(news, /연구실 구성원들이|통일합니다|1~2문장|한 문장/);
assert.doesNotMatch(news, /\bsummary\b|목록 설명/);
assert.match(news, /search: \[title, category, body\]/);
assert.match(field('body'), /media: false/);
assert.match(field('images'), /개수 제한은 없습니다/);
assert.match(field('images'), /첫 사진이 대표 사진/);
assert.match(field('images'), /multiple: true/);
assert.doesNotMatch(field('images'), /\bmax:/);
assert.match(field('published'), /홈페이지에 공개/);
assert.match(cms, /content:\s+merge: true/);

console.log(JSON.stringify({pass: true, checks: ['same news collection used by CMS and site', 'one body field without separate summary', 'date-based sorting retained', 'brief field-purpose guidance only', 'no forced subjects or sentence counts', 'body photos routed to dedicated gallery', 'unlimited ordered photos with first-photo cover', 'live publishing explained', 'existing metadata preserved']}));
