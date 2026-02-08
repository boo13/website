import './styles/resume.css';

const preview = document.getElementById('hoverPreview');
const previewImg = document.getElementById('hoverPreviewImg');
const items = document.querySelectorAll('.credits-list li[data-preview]');

let currentSrc = '';

items.forEach((item) => {
  item.addEventListener('mouseenter', () => {
    const src = item.dataset.preview;
    if (src && src !== currentSrc) {
      currentSrc = src;
      previewImg.src = src;
    }
    preview.classList.add('active');
  });

  item.addEventListener('mouseleave', () => {
    preview.classList.remove('active');
  });

  item.addEventListener('mousemove', (e) => {
    preview.style.top = e.clientY + 'px';
  });
});
