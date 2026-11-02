const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.NEWS_PLAYWRIGHT_PATH || 'playwright');

const css = ['.design-preview/style.css', '.design-preview/style-modern.css']
  .map(file => fs.readFileSync(file, 'utf8').replace(/@import\s+url\([^;]*\);/g, '')).join('\n');
const photos = {
  landscape: 'images/uploads/pouch-cell-assembly-2026-07-29-02.jpg',
  portrait: 'images/uploads/pouch-cell-assembly-2026-07-29-01.jpg',
  wide: 'images/uploads/tsne-tech-summit-2026.jpg'
};
const cases = [
  ['one-landscape', ['landscape']],
  ['one-portrait', ['portrait']],
  ['one-wide', ['wide']],
  ['two-photos', ['landscape', 'portrait']],
  ['mixed-three', ['landscape', 'portrait', 'wide']],
  ['five-photos', ['landscape', 'portrait', 'wide', 'landscape', 'portrait']]
];

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: process.env.NEWS_BROWSER_PATH || undefined});
  const results = [];
  try {
    for (const viewport of [{width: 1440, height: 1000}, {width: 390, height: 844}]) {
      const page = await browser.newPage({viewport, deviceScaleFactor: 1});
      await page.route('https://news-photos.test/**', route => {
        const key = new URL(route.request().url()).pathname.slice(1);
        return route.fulfill({contentType: 'image/jpeg', body: fs.readFileSync(photos[key])});
      });
      const firstSizes = new Map();
      for (const [name, keys] of cases) {
        await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div class="content-shell"><div class="story-gallery">${keys.map(key => `<img class="story-image" src="https://news-photos.test/${key}" data-key="${key}" alt="${key}">`).join('')}</div></div></body></html>`);
        await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
        const measured = await page.evaluate(() => {
          const gallery = document.querySelector('.story-gallery').getBoundingClientRect();
          return {galleryWidth: gallery.width, overflow: document.documentElement.scrollWidth > innerWidth, images: [...document.images].map(img => {
            const rect = img.getBoundingClientRect();
            return {key: img.dataset.key, width: rect.width, height: rect.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, centerOffset: rect.x + rect.width / 2 - gallery.x - gallery.width / 2, background: getComputedStyle(img).backgroundColor};
          })};
        });
        assert.equal(measured.images.length, keys.length);
        assert.equal(measured.overflow, false);
        for (const img of measured.images) {
          assert.ok(Math.abs(Math.max(img.width, img.height) - measured.galleryWidth) <= 1, JSON.stringify(img));
          assert.ok(Math.abs(img.width / img.height - img.naturalWidth / img.naturalHeight) < 0.005);
          assert.ok(Math.abs(img.centerOffset) <= 1);
          assert.equal(img.background, 'rgba(0, 0, 0, 0)');
          if (firstSizes.has(img.key)) {
            const previous = firstSizes.get(img.key);
            assert.ok(Math.abs(previous.width - img.width) <= 1 && Math.abs(previous.height - img.height) <= 1);
          } else firstSizes.set(img.key, img);
        }
        results.push({viewport: viewport.width, name, sizes: measured.images.map(({key, width, height}) => ({key, width, height}))});
        if (name === 'mixed-three' && process.env.NEWS_TEST_OUTPUT) {
          await page.screenshot({path: path.join(process.env.NEWS_TEST_OUTPUT, `news-long-edge-${viewport.width}.png`), fullPage: true});
        }
      }
      await page.close();
    }
    console.log(JSON.stringify({pass: true, browserCases: results.length, results}));
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
