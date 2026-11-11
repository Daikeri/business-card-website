const layouts = ['light', 'dark', 'catalog'];
function setLayout(layout) {
  if (!layouts.includes(layout)) layout = 'light';
  document.body.dataset.layout = layout;
  document.querySelectorAll('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === layout)));
  const url = new URL(location.href);
  url.searchParams.set('layout', layout);
  history.replaceState(null, '', url);
  document.querySelector('meta[name="theme-color"]').content = layout === 'dark' ? '#1c221f' : '#f4f1ea';
  try { localStorage.setItem('stone-layout', layout); } catch {}
}
let savedLayout;
try { savedLayout = localStorage.getItem('stone-layout'); } catch {}
setLayout(new URLSearchParams(location.search).get('layout') || savedLayout || 'light');
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => setLayout(button.dataset.choice)));

const grid = document.querySelector('#photo-grid');
const dialog = document.querySelector('.lightbox');
const viewerImage = document.querySelector('#viewer-image');
const stage = document.querySelector('#viewer-stage');
const zoomButton = document.querySelector('#zoom');
let visiblePhotos = photos.map((_, index) => index);
let viewerPhotos = [...visiblePhotos];
let current = 0;
let trigger = null;

function renderGallery(filter = 'all') {
  visiblePhotos = photos.flatMap((photo, index) => filter === 'all' || photo.category === filter ? [index] : []);
  grid.replaceChildren(...visiblePhotos.map(index => {
    const photo = photos[index];
    const button = document.createElement('button');
    button.className = 'photo-card';
    button.setAttribute('aria-label', `Открыть фото ${index + 1}: ${photo.title}`);
    button.innerHTML = `<div class="photo-frame"><img src="${photo.preview}" alt="${photo.title}" loading="lazy" decoding="async" width="600" height="800"><span class="photo-plus" aria-hidden="true">+</span></div><div class="photo-label"><span>${photo.title}</span><span>${String(index + 1).padStart(2, '0')}</span></div>`;
    button.addEventListener('click', () => openPhoto(index, button, visiblePhotos));
    return button;
  }));
  document.querySelector('#photo-count').textContent = `Показано ${visiblePhotos.length} из ${photos.length}`;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderGallery(button.dataset.filter);
}));
function resetZoom() {
  stage.classList.remove('zoomed');
  stage.scrollTop = stage.scrollLeft = 0;
  zoomButton.setAttribute('aria-pressed', 'false');
  zoomButton.setAttribute('aria-label', 'Увеличить фотографию');
  zoomButton.textContent = 'Увеличить +';
}
function showPhoto() {
  const index = viewerPhotos[current];
  const photo = photos[index];
  resetZoom();
  viewerImage.src = photo.src;
  viewerImage.alt = photo.title;
  document.querySelector('#original').href = photo.src;
  document.querySelector('#viewer-count').textContent = `${current + 1} / ${viewerPhotos.length}`;
  document.querySelector('#viewer-caption').textContent = `${String(index + 1).padStart(2, '0')} — ${photo.title}`;
}
function openPhoto(index, source, collection) {
  trigger = source;
  viewerPhotos = [...collection];
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
document.querySelector('[data-photo]').addEventListener('click', event => openPhoto(8, event.currentTarget, photos.map((_, index) => index)));
document.querySelector('#previous').addEventListener('click', () => step(-1));
document.querySelector('#next').addEventListener('click', () => step(1));
document.querySelector('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  resetZoom();
  trigger?.focus({ preventScroll: true });
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  }
});
zoomButton.addEventListener('click', () => {
  if (stage.classList.contains('zoomed')) return resetZoom();
  stage.classList.add('zoomed');
  zoomButton.setAttribute('aria-pressed', 'true');
  zoomButton.setAttribute('aria-label', 'Уменьшить фотографию');
  zoomButton.textContent = 'Уменьшить −';
});
viewerImage.addEventListener('click', () => zoomButton.click());
let touchStart;
stage.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 && !stage.classList.contains('zoomed') ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
stage.addEventListener('touchend', event => {
  if (!touchStart || stage.classList.contains('zoomed')) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
renderGallery();
