const fs = require('node:fs');
const assert = require('node:assert/strict');

const card = fs.readFileSync('_includes/modern-news-card.html', 'utf8');
const article = fs.readFileSync('_layouts/modern-news.html', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const news = fs.readFileSync('news/index.html', 'utf8');
const css = fs.readFileSync('.design-preview/style-modern.css', 'utf8');

assert.match(card, /assign news_body_text = include\.item\.content \| markdownify \| strip_html \| normalize_whitespace \| strip/);
assert.match(card, /if news_body_text != ''/);
assert.match(card, /class="news-preview">\{\{ news_body_text \| escape_once \}\}/);
assert.doesNotMatch(card, /\.summary|\.excerpt|\btruncate(?:words)?\b/);
assert.match(article, /class="article-body">\{\{ content \}\}/);
assert.match(home, /include modern-news-card\.html item=item/);
assert.match(news, /include modern-news-card\.html item=item/);
assert.match(css, /\.news-card \.news-preview\s*\{[^}]*display: -webkit-box;[^}]*-webkit-box-orient: vertical;[^}]*-webkit-line-clamp: 3;[^}]*overflow: hidden;/);
const previewRule = css.match(/\.news-card \.news-preview\s*\{([^}]*)\}/)[1];
const contentRule = css.match(/\.news-content\s*\{([^}]*)\}/)[1];
assert.doesNotMatch(previewRule, /\bmax-width\s*:/, 'News previews must grow with the photo width');
assert.doesNotMatch(contentRule, /\bmax-width\s*:/, 'News text must not retain the old card width');

for (const file of fs.readdirSync('_cms_news').filter(file => file.endsWith('.md'))) {
  const source = fs.readFileSync(`_cms_news/${file}`, 'utf8');
  assert.doesNotMatch(source, /^summary:/m, `Separate summary remains in ${file}`);
}

console.log(JSON.stringify({pass: true, checks: ['article body is the only text source', 'home and news use the same shared renderer', 'no manual summary or automatic rewriting', 'full body text retained while preview height is visually limited', 'safe display of formatted text', 'empty bodies do not create filler text', 'no legacy summary fields remain']}));
