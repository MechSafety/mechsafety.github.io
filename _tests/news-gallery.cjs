const fs = require('node:fs');
const assert = require('node:assert/strict');

const css = fs.readFileSync('.design-preview/style-modern.css', 'utf8');
const layout = fs.readFileSync('_layouts/modern-news.html', 'utf8');
const card = fs.readFileSync('_includes/modern-news-card.html', 'utf8');
const config = fs.readFileSync('.pages.yml', 'utf8');
const newsConfig = config.split('      - name: news')[1].split('      - name: members')[0];
const imagesConfig = newsConfig.split('          - name: images')[1].split('          - { name: published')[0];

assert.match(imagesConfig, /type: image/);
assert.match(imagesConfig, /multiple: true/);
assert.doesNotMatch(imagesConfig, /\bmax:/);
assert.match(layout, /for image in page\.images\s*%}/);
assert.doesNotMatch(layout, /limit:|slice:|forloop\.(?:index|index0)\s*[<>]=?/);
assert.match(layout, /page\.title \| escape/);
assert.match(layout, /loading="lazy" decoding="async"/);
assert.match(card, /include\.item\.images\[0\]/);
assert.match(card, /include\.item\.url \| relative_url \}\}\?v=\{\{ site\.time/);
assert.match(layout, /'\/news\/' \| relative_url \}\}\?v=\{\{ site\.time/);

const gallery = css.match(/\.story-gallery\s*\{([^}]+)\}/)[1];
const image = css.match(/\.story-image\s*\{([^}]+)\}/)[1];
assert.match(gallery, /width: min\(640px, 100%\)/);
assert.match(gallery, /margin: 30px auto 0/);
assert.match(gallery, /grid-template-columns: minmax\(0, 1fr\)/);
assert.match(gallery, /gap: 20px/);
assert.match(gallery, /padding: 0/);
assert.match(gallery, /border: 0/);
assert.match(gallery, /background: transparent/);
assert.match(image, /width: 100%/);
assert.match(image, /height: auto/);
assert.match(image, /aspect-ratio: auto/);
assert.match(image, /object-fit: contain/);
assert.match(image, /margin: 0/);
assert.match(image, /padding: 0/);
assert.match(image, /border: 0/);
assert.match(image, /background: transparent/);
assert.doesNotMatch(css, /story-image:only-child|story-gallery[^\{]*:has\(/);
const mobile = css.slice(css.lastIndexOf('@media (max-width: 720px)'));
assert.match(mobile, /\.story-gallery\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);

console.log(JSON.stringify({pass: true, checks: ['unlimited CMS photos', 'all photos rendered', 'same 640px maximum width regardless of count', 'one photo per row on desktop and mobile', 'natural image aspect ratio', 'no gray bars or frames', 'no image cropping', 'lazy loading', 'first photo stays the list cover']}));
