const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.LAYOUT_PLAYWRIGHT_PATH || 'playwright');

const root = path.resolve(__dirname, '..');
const layoutCss = fs.readFileSync(path.join(root, '.design-preview/style-modern.css'), 'utf8');
const layoutMax = Number(layoutCss.match(/--layout-max:\s*(\d+)px/)[1]);
const layoutGutter = Number(layoutCss.match(/--layout-gutter:\s*(\d+)px/)[1]);
const base = process.env.LAYOUT_BASE_URL || 'https://mechsafety.github.io';
const live = process.env.LAYOUT_USE_LIVE === '1';
const version = process.env.LAYOUT_VERSION || String(Date.now());
const output = process.env.LAYOUT_TEST_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'mscs-layout-'));
const pages = ['/', '/members/', '/research/', '/projects/', '/publications/', '/news/', '/courses/', '/contact/', '/news/2026-10-29-kosos-autumn-oral-hong/'];
const widths = process.env.LAYOUT_WIDTHS ? process.env.LAYOUT_WIDTHS.split(',').map(Number) : [1920, 1440, 1280, 1201, 1200, 1100, 1024, 900, 768, 720, 390, 320];
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1.5, `${label}: ${actual} vs ${expected}`);

async function run() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.LAYOUT_BROWSER_PATH ? { executablePath: process.env.LAYOUT_BROWSER_PATH } : {}),
  });
  const results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const documents = new Map();
    for (const pagePath of pages) {
      const response = await context.request.get(`${base}${pagePath}?v=${version}`);
      assert.equal(response.status(), 200, pagePath);
      let html = await response.text();
      if (!live) {
        html = html.replaceAll('추계학술대회 구두발표 (홍동현)', '추계학술대회 구두 발표 (홍동현)')
          .replaceAll('추계학술대회 포스터발표 (김성현)', '추계학술대회 포스터 발표 (김성현)');
      }
      documents.set(pagePath, html);
    }
    const projectBaseline = new Map();
    const baselinePage = await context.newPage();
    for (const width of [1920, 1280, 390]) {
      if (!widths.includes(width)) continue;
      await baselinePage.setViewportSize({ width, height: 1080 });
      await baselinePage.goto(`${base}/projects/?v=${version}`, { waitUntil: 'load' });
      await baselinePage.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].every(link => link.sheet) && getComputedStyle(document.querySelector('.project-item')).paddingTop === '16px');
      await baselinePage.evaluate(() => document.fonts.ready);
      projectBaseline.set(width, await baselinePage.locator('.project-copy').evaluateAll(elements => elements.map(el => {
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      })));
    }
    await baselinePage.close();
    const cssFiles = new Map([
      ['/.design-preview/style-modern.css', '.design-preview/style-modern.css'],
      ['/.design-preview/style.css', '.design-preview/style.css'],
      ['/assets/css/home-simulations.css', 'assets/css/home-simulations.css'],
    ]);
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (/\.mp4$/.test(url.pathname) || /daumcdn|kakao|daum\.net/.test(url.hostname)) return route.abort();
      if (url.origin === new URL(base).origin) {
        if (!live && cssFiles.has(url.pathname)) {
          return route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(root, cssFiles.get(url.pathname)), 'utf8') });
        }
        if (request.isNavigationRequest() && documents.has(url.pathname)) {
          return route.fulfill({ contentType: 'text/html', body: documents.get(url.pathname) });
        }
      }
      return route.continue();
    });
    const page = await context.newPage();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1080 });
      for (const pagePath of pages) {
        await page.goto(`${base}${pagePath}?v=${version}`, { waitUntil: 'load' });
        await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].every(link => link.sheet));
        await page.waitForFunction(expected => getComputedStyle(document.documentElement).getPropertyValue('--layout-max').trim() === `${expected}px`, layoutMax);
        await page.evaluate(() => document.fonts.ready);
        const measured = await page.evaluate(() => {
          const rect = el => {
            const b = el.getBoundingClientRect();
            return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom };
          };
          const lineRects = el => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return [...range.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width }));
          };
          return {
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            shells: [...document.querySelectorAll('.shell, .nav-shell')].map(el => rect(el).width),
            reading: document.querySelector('.content-shell') ? rect(document.querySelector('.content-shell')).width : null,
            intro: document.querySelector('.home-introduction') ? rect(document.querySelector('.home-introduction')).width : null,
            showcase: document.querySelector('.simulation-showcase') ? rect(document.querySelector('.simulation-showcase')).width : null,
            videos: [...document.querySelectorAll('.simulation-open video')].map(rect),
            members: [...document.querySelectorAll('.member-row')].map(card => ({
              card: rect(card),
              list: rect(card.closest('.member-list')),
              portrait: rect(card.querySelector('.portrait-placeholder')),
              columns: getComputedStyle(card.closest('.member-list')).gridTemplateColumns.split(' ').length,
              text: [...card.querySelectorAll('h3, dd, dd a')].map(rect),
              gaps: [...card.querySelectorAll('.member-data > div')].map(row => rect(row.querySelector('dd')).x - rect(row.querySelector('dt')).right),
            })),
            research: [...document.querySelectorAll('.research-visual')].map(el => rect(el).width),
            summaries: [...document.querySelectorAll('.research-copy p')].map(el => rect(el).width),
            publications: [...document.querySelectorAll('.publication-copy')].map(el => rect(el).width),
            projectTitles: [...document.querySelectorAll('.project-copy h2')].map(el => rect(el).width),
            projects: [...document.querySelectorAll('.project-item')].map(el => ({
              item: rect(el),
              copy: rect(el.querySelector('.project-copy')),
              rule: parseFloat(getComputedStyle(el, '::after').width),
              ruleHeight: parseFloat(getComputedStyle(el, '::after').height),
            })),
            projectTopRule: document.querySelector('.project-list') ? parseFloat(getComputedStyle(document.querySelector('.project-list'), '::before').width) : null,
            media: [...document.querySelectorAll('.course-media')].map(el => rect(el).width),
            courseGrid: document.querySelector('.course-grid') ? rect(document.querySelector('.course-grid')).width : null,
            courseLabels: [...document.querySelectorAll('.course-meta dt')].map(el => {
              const range = document.createRange();
              range.selectNodeContents(el);
              return { whitespace: getComputedStyle(el).whiteSpace, lines: new Set([...range.getClientRects()].map(r => r.y)).size };
            }),
            contacts: [...document.querySelectorAll('.contact-details dd')].map(el => ({ text: rect(el), card: rect(el.closest('.contact-card')) })),
            newsTitles: [...document.querySelectorAll('.news-card h3')].map(el => el.textContent.trim()),
            newsWidths: [...document.querySelectorAll('.news-card')].map(el => ({
              photo: rect(el.querySelector('.news-image')).width,
              content: rect(el.querySelector('.news-content')).width,
              body: el.querySelector('.news-preview') ? rect(el.querySelector('.news-preview')).width : null,
              clamp: el.querySelector('.news-preview') ? getComputedStyle(el.querySelector('.news-preview')).webkitLineClamp : null,
            })),
            sectionDescriptions: [...document.querySelectorAll('.section-heading > p')].map(el => {
              const words = [...el.firstChild.textContent.matchAll(/\S+/g)];
              return {
                box: rect(el),
                parent: rect(el.parentElement),
                lines: new Set(lineRects(el).map(r => r.y)).size,
                splitWords: words.filter(word => {
                  const range = document.createRange();
                  range.setStart(el.firstChild, word.index);
                  range.setEnd(el.firstChild, word.index + word[0].length);
                  return new Set([...range.getClientRects()].map(r => r.y)).size > 1;
                }).map(word => word[0]),
              };
            }),
            kimTitle: [...document.querySelectorAll('.news-card h3')].filter(el => el.textContent.includes('(김성현)')).map(el => {
              const range = document.createRange();
              range.selectNodeContents(el);
              const lines = new Set([...range.getClientRects()].map(r => r.y)).size;
              const index = el.firstChild.textContent.indexOf('(김성현)');
              range.setStart(el.firstChild, index);
              range.setEnd(el.firstChild, index + '(김성현)'.length);
              return { lines, nameLines: new Set([...range.getClientRects()].map(r => r.y)).size };
            }),
          };
        });
        const expectedWidth = Math.min(layoutMax, width - 2 * (width <= 720 ? 16 : layoutGutter));
        assert.ok(measured.scrollWidth <= width + 1, `Horizontal overflow: ${pagePath} at ${width}`);
        for (const shell of measured.shells) near(shell, expectedWidth, `${pagePath} shell at ${width}`);
        if (measured.reading !== null) near(measured.reading, Math.min(960, expectedWidth), 'reading width');
        if (measured.showcase !== null) assert.ok(measured.showcase <= 841, 'video panel width cap');
        if (width > 1000 && measured.intro !== null) assert.ok(measured.intro <= 561, 'intro line width cap');
        for (const video of measured.videos) near(video.width / video.height, 18 / 13, 'video aspect ratio');
        for (const member of measured.members) {
          assert.equal(member.columns, width <= 1200 ? 1 : 2, `member columns at ${width}`);
          const memberListWidth = width <= 1200 ? Math.min(720, expectedWidth) : Math.min(1464, expectedWidth * .94);
          near(member.list.width, memberListWidth, 'compact member list');
          near(member.card.width, width <= 1200 ? memberListWidth : (memberListWidth - 24) / 2, 'compact member card');
          near(member.portrait.width, width <= 720 ? 140 : 150, 'unchanged portrait width');
          if (width > 720) near(member.card.height, 180, 'unchanged desktop card height');
          for (const gap of member.gaps) near(gap, 18, 'member label-to-value gap');
          for (const text of member.text) {
            assert.ok(text.right <= member.card.right + 1 && text.bottom <= member.card.bottom + 1, `Clipped member text at ${width}`);
          }
        }
        if (width > 720) for (const image of measured.research) assert.ok(image <= 421, 'research image width cap');
        for (const summary of measured.summaries) assert.ok(summary <= 761, 'research reading width cap');
        for (const text of [...measured.publications, ...measured.projectTitles]) assert.ok(text <= 1241, 'list reading width cap');
        for (const project of measured.projects) {
          const ruleWidth = width <= 720 ? project.item.width : Math.min(1440, project.item.width * .94);
          near(project.rule, ruleWidth, 'shorter project separator');
          near(measured.projectTopRule, ruleWidth, 'matching top project separator');
          near(project.ruleHeight, 1, 'unchanged thin separator');
          near(project.copy.x - project.item.x, width <= 720 ? 0 : 6, 'unchanged project text inset');
        }
        if (pagePath === '/projects/' && projectBaseline.has(width)) {
          const previous = projectBaseline.get(width);
          assert.equal(measured.projects.length, previous.length);
          measured.projects.forEach((project, index) => {
            for (const key of ['x', 'y', 'width', 'height']) near(project.copy[key], previous[index][key], `preserved project ${index + 1} ${key}`);
          });
        }
        if (width > 900) for (const image of measured.media) assert.ok(image <= 481, 'course image width cap');
        if (measured.courseGrid !== null) assert.ok(measured.courseGrid <= 1361, 'compact course row width cap');
        for (const label of measured.courseLabels) {
          assert.equal(label.whitespace, 'nowrap', 'course label stays together');
          assert.equal(label.lines, 1, 'course label uses one line');
        }
        for (const title of measured.kimTitle) {
          assert.equal(title.nameLines, 1, `presenter name stays together at ${width}`);
          if (width >= 1280) assert.equal(title.lines, 1, `conference headline uses one desktop line at ${width}`);
        }
        for (const contact of measured.contacts) assert.ok(contact.text.right <= contact.card.right - 16, `Contact text exceeds card padding at ${width}`);
        for (const news of measured.newsWidths) {
          near(news.content, news.photo, 'news photo-to-content width');
          if (news.body !== null) {
            near(news.body, news.photo, 'news photo-to-description width');
            assert.equal(news.clamp, '3', 'existing three-line preview retained');
          }
        }
        for (const description of measured.sectionDescriptions) {
          assert.ok(description.box.right <= description.parent.right + 1, 'section description fits heading');
          assert.deepEqual(description.splitWords, [], 'section description does not split Korean words');
          if (width >= 768) assert.equal(description.lines, 1, 'Latest News description fits a desktop line');
        }
        if (pagePath === '/' || pagePath === '/news/') {
          assert.ok(measured.newsTitles.includes('2026 한국안전학회 추계학술대회 구두 발표 (홍동현)'));
          assert.ok(measured.newsTitles.includes('2026 한국안전학회 추계학술대회 포스터 발표 (김성현)'));
        }
        if (width === 1440 || width === 390 || (width === 1920 && ['/', '/members/', '/projects/', '/news/'].includes(pagePath))) {
          await page.locator('img').evaluateAll(images => Promise.all(images.filter(img => img.getBoundingClientRect().top < 2160).map(img => img.decode().catch(() => {}))));
          await page.screenshot({ path: path.join(output, `${pagePath.replaceAll('/', '') || 'home'}-${width}.png`), fullPage: pagePath !== '/publications/' });
        }
        results.push({ page: pagePath, width, shell: expectedWidth, members: measured.members.length });
      }
    }
    await context.close();
    console.log(JSON.stringify({ pass: true, mode: live ? 'live' : 'local CSS on generated pages', cases: results.length, widths, screenshots: output, checks: ['news descriptions match photo widths', 'natural Latest News description wrapping', 'shorter separators with unchanged project text positions', 'narrower uniform member cards', 'bounded text and media', 'unchanged photos and desktop heights', '18px member label gap', 'no cropped emails', 'tablet reflow and mobile layout', 'consistent presentation spacing'] }));
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
