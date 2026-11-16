(() => {
  'use strict';
  const dialog = document.querySelector('#research-dialog');
  if (!dialog) return;
  const tiles = [...document.querySelectorAll('.research-play')];
  const videos = tiles.map(tile => tile.querySelector('video'));
  const expanded = dialog.querySelector('video');
  const title = dialog.querySelector('#research-dialog-title');
  const note = dialog.querySelector('#research-dialog-note');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = 'IntersectionObserver' in window;
  const visible = new Set();
  let opener;

  const update = () => {
    const allow = !reduced.matches && !navigator.connection?.saveData && !document.hidden && !dialog.open;
    for (const video of videos) {
      if (allow && (!canObserve || visible.has(video))) {
        if (!video.getAttribute('src')) video.src = video.dataset.src;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  };

  if (canObserve) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    }, { rootMargin: '80px' });
    videos.forEach(video => observer.observe(video));
  }
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);

  for (const button of tiles) {
    button.addEventListener('click', () => {
      const video = button.querySelector('video');
      opener = button;
      title.textContent = button.dataset.title;
      note.textContent = button.dataset.note || '';
      note.hidden = !note.textContent;
      if (video.hasAttribute('poster')) expanded.poster = video.getAttribute('poster');
      else expanded.removeAttribute('poster');
      expanded.src = video.dataset.src;
      dialog.showModal();
      update();
      expanded.play().catch(() => {});
    });
  }
  dialog.querySelector('#research-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    expanded.pause();
    expanded.removeAttribute('src');
    expanded.load();
    update();
    opener?.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  update();
})();
