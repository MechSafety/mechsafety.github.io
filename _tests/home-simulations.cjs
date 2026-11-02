const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('_data/cms/simulation_media.json')).items;
const panel = read('_includes/modern-simulation-panel.html');
const code = read('assets/js/home-simulations.js');
assert.equal(data.length, 4);
assert.doesNotMatch(panel, /simulation-toolbar|simulation-motion|Numerical simulations/);
assert.doesNotMatch(code, /simulation-motion/);
assert.match(panel, /<video id="simulation-dialog-video" controls/);
for (const item of data) {
  assert.ok(item.note.length > 0 && item.note.length < 60);
  assert.doesNotMatch(item.note, /예제|표시했|뜻하지|실제 크기|Ansys|Fluent|LS-DYNA|EnSight|FDS|Smokeview/i);
  assert.ok(!Object.hasOwn(item, 'software'));
  for (const field of ['video', 'poster']) {
    const asset = path.join(root, item[field]);
    assert.ok(fs.statSync(asset).size > 1000);
    if (field === 'video') {
      assert.equal(fs.readFileSync(asset).toString('ascii', 4, 8), 'ftyp');
    }
  }
}

class Element {
  constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attrs[name] = value; }
  getAttribute(name) { return this.attrs[name]; }
  removeAttribute(name) { delete this.attrs[name]; }
  focus() { this.focused = true; }
}
class Video extends Element {
  constructor(item) {
    super();
    this.dataset.src = item.video;
    this.poster = item.poster;
    this.paused = true;
  }
  get src() { return this.attrs.src || ''; }
  set src(value) { this.attrs.src = value; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
}
function check(reduced, saveData) {
  const videos = data.map(item => new Video(item));
  const buttons = videos.map((video, i) => {
    const button = new Element();
    button.dataset.simulation = String(i);
    button.querySelector = () => video;
    return button;
  });
  const showcase = new Element();
  showcase.querySelectorAll = selector => selector === 'video' ? videos : buttons;
  const dialog = new Element(), expanded = new Video(data[0]);
  const title = new Element(), note = new Element(), close = new Element();
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.listeners.close(); };
  dialog.getBoundingClientRect = () => ({left: 0, right: 100, top: 0, bottom: 100});
  const media = new Element();
  media.textContent = JSON.stringify(data);
  const nodes = {
    '.simulation-showcase': showcase, '#simulation-media-data': media,
    '#simulation-dialog': dialog, '#simulation-dialog-video': expanded,
    '#simulation-dialog-title': title, '#simulation-dialog-note': note,
    '#simulation-dialog-close': close
  };
  const document = new Element();
  document.hidden = false;
  document.querySelector = selector => nodes[selector] ?? null;
  const preference = new Element();
  preference.matches = reduced;
  let observer;
  class Observer {
    constructor(callback) { observer = this; this.callback = callback; }
    observe() { this.callback([{isIntersecting: true}]); }
  }
  const window = {matchMedia: () => preference, IntersectionObserver: Observer};
  const navigator = {connection: {saveData}};
  vm.runInNewContext(code, {document, window, navigator, IntersectionObserver: Observer});
  const automatic = !reduced && !saveData;
  assert.ok(videos.every(video => video.paused === !automatic));
  if (!automatic) assert.ok(videos.every(video => !video.src));
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].listeners.click();
    assert.equal(dialog.open, true);
    assert.equal(expanded.src, data[i].video);
    assert.equal(title.textContent, data[i].title);
    assert.equal(note.textContent, data[i].note);
    assert.equal(expanded.paused, false);
    assert.ok(videos.every(video => video.paused));
    close.listeners.click();
    assert.equal(dialog.open, false);
    assert.equal(expanded.src, '');
    assert.ok(buttons[i].focused);
    assert.ok(videos.every(video => video.paused === !automatic));
  }
  document.hidden = true;
  document.listeners.visibilitychange();
  assert.ok(videos.every(video => video.paused));
  document.hidden = false;
  document.listeners.visibilitychange();
  observer.callback([{isIntersecting: false}]);
  assert.ok(videos.every(video => video.paused));
  observer.callback([{isIntersecting: true}]);
  preference.matches = true;
  preference.listeners.change({matches: true});
  assert.ok(videos.every(video => video.paused));
  preference.matches = false;
  preference.listeners.change({matches: false});
  assert.ok(videos.every(video => video.paused === saveData));
  buttons[0].listeners.click();
  dialog.listeners.click({target: dialog, clientX: 200, clientY: 200});
  assert.equal(dialog.open, false);
}
check(false, false);
check(true, false);
check(false, true);
assert.match(read('index.html'), /Latest News/);
console.log(JSON.stringify({pass: true, videos: 4, checks: ['toolbar removed', 'concise descriptions', 'assets', 'inline playback', 'expanded playback', 'focus return', 'background pause', 'reduced motion', 'data saving', 'news retained']}));
