const grid = document.querySelector('#photo-grid');
const dialog = document.querySelector('.lightbox');
const viewerImage = document.querySelector('#viewer-image');
const stage = document.querySelector('#viewer-stage');
const viewerPhotos = photos.map((_, index) => index);
let current = 0;
let trigger = null;

function renderGallery() {
  grid.replaceChildren(...photos.map((photo, index) => {
    const button = document.createElement('button');
    button.className = 'photo-card';
    button.setAttribute('aria-label', `Открыть фотографию ${index + 1}`);
    button.innerHTML = `<img src="${photo.preview}" alt="Фотография ${index + 1}" loading="lazy" decoding="async" width="600" height="800"><span class="photo-plus" aria-hidden="true">+</span>`;
    button.addEventListener('click', () => openPhoto(index, button));
    return button;
  }));
}
function showPhoto() {
  const index = viewerPhotos[current];
  const photo = photos[index];
  viewerImage.src = photo.src;
  viewerImage.alt = `Фотография ${index + 1}`;
  document.querySelector('#viewer-count').textContent = `${current + 1} / ${viewerPhotos.length}`;
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
const heroPhoto = document.querySelector('.hero-photo');
heroPhoto.addEventListener('click', () => openPhoto(0, heroPhoto));
