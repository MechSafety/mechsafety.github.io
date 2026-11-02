const fs = require('node:fs');
const assert = require('node:assert/strict');
const header = fs.readFileSync('_includes/modern-header.html', 'utf8');
const layout = fs.readFileSync('_layouts/modern.html', 'utf8');
assert.match(header, /assign navigation_version = site\.time \| date: '%s'/);
const links = [...header.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
assert.equal(links.length, 13);
for (const link of links) {
  assert.match(link, /\?v=\{\{ navigation_version \}\}/);
  assert.doesNotMatch(link, /#[^?]*\?v=/);
}
for (const fragment of ['current-members', 'alumni', 'scie-publications', 'domestic-publications']) {
  assert.ok(links.some(link => link.endsWith('}}#' + fragment)));
}
assert.match(layout, /rel="canonical" href="\{\{ page\.url \| absolute_url \}\}"/);
console.log(JSON.stringify({pass: true, navigationLinks: links.length, checks: ['shared build version', 'fragment order', 'stable canonical URL']}));
