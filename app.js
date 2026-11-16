const grid = document.querySelector('#photo-grid');
const dialog = document.querySelector('.lightbox');
const viewerImage = document.querySelector('#viewer-image');
const stage = document.querySelector('#viewer-stage');
const viewerPhotos = photos.map((_, index) => index);
let current = 0;
let trigger = null;
let photoRequest = 0;
const originalCache = new Map();

function loadOriginal(index, priority = 'low') {
  const cached = originalCache.get(index);
  if (cached) {
    if (priority === 'high') cached.image.fetchPriority = 'high';
    return cached;
  }
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = priority;
  const entry = { image, ready: false, promise: null };
  originalCache.set(index, entry);
  image.src = photos[index].src;
  entry.promise = image.decode().then(() => {
    entry.ready = true;
    return true;
  }).catch(() => {
    // Keep the preview on failure and allow a later visit to retry.
    if (originalCache.get(index) === entry) originalCache.delete(index);
    return false;
  });
  return entry;
}

function renderGallery() {
  grid.replaceChildren(...photos.map((photo, index) => {
    const button = document.createElement('button');
    button.className = 'photo-card';
    button.setAttribute('aria-label', `Открыть фотографию ${index + 1}`);
    button.innerHTML = `<img src="${photo.preview}" alt="Фотография ${index + 1}" loading="lazy" decoding="async" width="600" height="800">`;
    button.addEventListener('click', () => openPhoto(index, button));
    return button;
  }));
}
function showPhoto() {
  const index = viewerPhotos[current];
  const photo = photos[index];
  const request = ++photoRequest;
  const original = loadOriginal(index, 'high');
  viewerImage.src = original.ready ? photo.src : photo.preview;
  viewerImage.alt = `Фотография ${index + 1}`;
  document.querySelector('#viewer-count').textContent = `${current + 1} / ${viewerPhotos.length}`;
  original.promise.then(ready => {
    if (ready && request === photoRequest && dialog.open) viewerImage.src = photo.src;
  });

  const neighbors = [-1, 1].map(offset =>
    viewerPhotos[(current + offset + viewerPhotos.length) % viewerPhotos.length]);
  // Retain only the current photo and its neighbors in the decoded-image cache.
  const retained = new Set([index, ...neighbors]);
  for (const cachedIndex of originalCache.keys()) {
    if (!retained.has(cachedIndex)) originalCache.delete(cachedIndex);
  }
  neighbors.forEach(neighbor => loadOriginal(neighbor));
}
function openPhoto(index, source) {
  trigger = source;
  current = viewerPhotos.indexOf(index);
  showPhoto();
  dialog.showModal();
  document.body.classList.add('viewer-open');
  document.querySelector('#close').focus();
}
function step(direction) {
  current = (current + direction + viewerPhotos.length) % viewerPhotos.length;
  showPhoto();
}
document.querySelector('#previous').addEventListener('click', () => step(-1));
document.querySelector('#next').addEventListener('click', () => step(1));
document.querySelector('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  photoRequest++;
  originalCache.clear();
  document.body.classList.remove('viewer-open');
  touchStart = null;
  trigger?.focus({ preventScroll: true });
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  }
});
let touchStart;
stage.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
stage.addEventListener('touchend', event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
renderGallery();
document.querySelectorAll('[data-photo-index]').forEach(button => {
  button.addEventListener('click', () => openPhoto(Number(button.dataset.photoIndex), button));
});
