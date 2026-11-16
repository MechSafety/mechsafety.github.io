const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const read = file => fs.readFileSync(file, 'utf8');
const home = read('index.html');
const research = read('research/index.html');
const shared = read('_includes/modern-research-list.html');
const clipFiles = [
  '02-computational-modeling-and-simulation',
  '03-data-informed-engineering-methods',
  '04-procedural-3d-modeling-with-blender',
];
const entries = clipFiles.map(slug => read('_cms_research/' + slug + '.md'));
const code = read('assets/js/research-media.js');
const videos = entries.flatMap(entry => [...entry.matchAll(/^ +(?:- )?video: (\/[^\r\n]+)$/gm)].map(match => match[1]));
const posters = [...entries[0].matchAll(/^ +poster: (\/[^\r\n]+)$/gm)].map(match => match[1]);
assert.equal(videos.length, 6);
assert.equal(posters.length, 4);
assert.equal((entries[0].match(/^ +note:/gm) || []).length, 4);
assert.doesNotMatch(entries.join(''), /^video:/m);
for (const asset of [...videos, ...posters]) {
  const bytes = fs.readFileSync(asset.slice(1));
  assert.ok(bytes.length > 1000);
  if (asset.endsWith('.mp4')) assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
}
assert.match(home, /include modern-research-list\.html heading_tag="h3"/);
assert.match(research, /include modern-research-list\.html heading_tag="h2"/);
assert.match(shared, /site\.cms_research \| where: 'published', true \| sort: 'order'/);
assert.match(shared, /for clip in clips/);
assert.match(shared, /elsif first_image/);
assert.match(shared, /research-placeholder-/);
assert.match(home, /Latest News/);
assert.ok(!fs.existsSync('_data/cms/simulation_media.json'));
const editor = read('.pages.yml').split('      - name: research')[1].split('      - name: publications')[0];
assert.match(editor, /name: videos[\s\S]*type: object[\s\S]*max: 4[\s\S]*type: file[\s\S]*extensions: \[mp4\]/);

class Element {
  constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  getAttribute(name) { return this.attrs[name] || null; }
  hasAttribute(name) { return Object.hasOwn(this.attrs, name); }
  removeAttribute(name) { delete this.attrs[name]; }
  focus() { this.focused = true; }
}
class Video extends Element {
  constructor(src, poster) { super(); this.dataset.src = src; if (poster) this.attrs.poster = poster; this.paused = true; }
  set src(value) { this.attrs.src = value; }
  set poster(value) { this.attrs.poster = value; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
}

function check(saveData) {
  const inline = videos.map((src, i) => new Video(src, posters[i]));
  const title = new Element(), note = new Element(), close = new Element(), expanded = new Video();
  const tiles = inline.map((video, i) => {
    const tile = new Element();
    tile.dataset = { title: 'Tile ' + i, note: i < 4 ? 'Description ' + i : '' };
    tile.querySelector = () => video;
    return tile;
  });
  const dialog = new Element(), document = new Element(), reduced = new Element();
  dialog.querySelector = selector => ({ video: expanded, '#research-dialog-title': title, '#research-dialog-note': note, '#research-dialog-close': close })[selector];
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.listeners.close(); };
  document.querySelector = () => dialog;
  document.querySelectorAll = () => tiles;
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
  }
  const window = { matchMedia: () => reduced, IntersectionObserver: Observer };
  const navigator = { connection: { saveData } };
  vm.runInNewContext(code, { document, window, navigator, IntersectionObserver: Observer });
  assert.ok(inline.every(video => !video.getAttribute('src')));
  observer.callback(inline.map((target, i) => ({ target, isIntersecting: i < 4 })));
  assert.ok(inline.every((video, i) => video.paused === (saveData || i >= 4)));
  assert.ok(!inline[4].getAttribute('src'));
  for (let i = 0; i < tiles.length; i++) {
    tiles[i].listeners.click();
    assert.ok(dialog.open);
    assert.equal(title.textContent, tiles[i].dataset.title);
    assert.equal(note.textContent, tiles[i].dataset.note);
    assert.equal(note.hidden, i >= 4);
    assert.equal(expanded.getAttribute('src'), videos[i]);
    assert.equal(expanded.getAttribute('poster'), posters[i] || null);
    assert.equal(expanded.paused, false);
    assert.ok(inline.every(video => video.paused));
    close.listeners.click();
    assert.equal(dialog.open, false);
    assert.equal(expanded.getAttribute('src'), null);
    assert.ok(tiles[i].focused);
  }
  document.hidden = true;
  document.listeners.visibilitychange();
  assert.ok(inline.every(video => video.paused));
  document.hidden = false;
  reduced.matches = true;
  reduced.listeners.change();
  assert.ok(inline.every(video => video.paused));
  reduced.matches = false;
  observer.callback(inline.map(target => ({ target, isIntersecting: false })));
  assert.ok(inline.every(video => video.paused));
}
check(false);
check(true);
console.log(JSON.stringify({pass: true, sharedResearchList: true, videos: 6, grouped: 4, visibilityAndPlayback: true}));
