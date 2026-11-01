(() => {
  'use strict';
  const root = document.querySelector('.simulation-showcase');
  if (!root) return;
  const data = JSON.parse(document.querySelector('#simulation-media-data').textContent);
  const videos = [...root.querySelectorAll('video')];
  const toggle = document.querySelector('#simulation-motion');
  const dialog = document.querySelector('#simulation-dialog');
  const expanded = document.querySelector('#simulation-dialog-video');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let wanted = !reduced.matches && !navigator.connection?.saveData;
  let visible = true;
  let focusReturn = null;
  const source = video => {
    if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
  };
  const update = () => {
    const playing = wanted && visible && !document.hidden && !dialog.open;
    videos.forEach(video => {
      if (playing) { source(video); video.play().catch(() => {}); }
      else video.pause();
    });
    toggle.textContent = wanted ? '영상 일시정지' : '영상 재생';
    toggle.setAttribute('aria-pressed', String(wanted));
  };
  toggle.addEventListener('click', () => { wanted = !wanted; update(); });
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', event => { if (event.matches) wanted = false; update(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); },
      {rootMargin: '80px'}).observe(root);
  }
  root.querySelectorAll('[data-simulation]').forEach(button => {
    button.addEventListener('click', () => {
      const tileVideo = button.querySelector('video');
      const item = data[Number(button.dataset.simulation)];
      focusReturn = button;
      document.querySelector('#simulation-dialog-title').textContent = item.title;
      document.querySelector('#simulation-dialog-note').textContent = item.note;
      expanded.poster = tileVideo.poster;
      expanded.src = tileVideo.dataset.src;
      dialog.showModal();
      update();
      expanded.play().catch(() => {});
    });
  });
  document.querySelector('#simulation-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    expanded.pause(); expanded.removeAttribute('src'); expanded.load();
    update(); focusReturn?.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  update();
})();
