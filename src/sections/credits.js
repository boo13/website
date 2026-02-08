/**
 * Credits Table with Cursor-Following Preview
 * Hover on credit row shows image preview that follows cursor
 */

function initCreditsPreview() {
  const table = document.querySelector('.credits-table');
  const rows = document.querySelectorAll('.credit-row');
  const preview = document.querySelector('.cursor-preview');
  const previewImg = preview?.querySelector('img');

  if (!table || !rows.length || !preview) return;
  if ('ontouchstart' in window) return;

  let isVisible = false;
  let currentSrc = null;
  let rafId = null;
  let mouseY = 0;

  const fixedX = 40;

  function updatePosition() {
    rafId = null;
    if (!isVisible) return;

    const viewportHeight = window.innerHeight;
    const previewRect = preview.getBoundingClientRect();
    let y = mouseY - previewRect.height / 2;
    if (y + previewRect.height > viewportHeight) {
      y = viewportHeight - previewRect.height - 20;
    }
    if (y < 20) y = 20;

    preview.style.left = `${fixedX}px`;
    preview.style.top = `${y}px`;
  }

  function showPreview() {
    isVisible = true;
    preview.classList.add('visible');
    updatePosition();
  }

  function hidePreview() {
    isVisible = false;
    preview.classList.remove('visible');
  }

  rows.forEach((row) => {
    row.addEventListener('mouseenter', () => {
      const previewSrc = row.dataset.preview;
      if (!previewSrc) return;
      if (previewSrc !== currentSrc) {
        currentSrc = previewSrc;
        previewImg.src = previewSrc;
        previewImg.alt =
          row.querySelector('.credit-title')?.textContent || '';
      }
      showPreview();
    });
    row.addEventListener('mouseleave', () => hidePreview());
  });

  document.addEventListener('mousemove', (e) => {
    mouseY = e.clientY;
    if (isVisible && !rafId) {
      rafId = requestAnimationFrame(() => updatePosition());
    }
  });
}

function initCreditsRowReveal() {
  const rows = document.querySelectorAll('.credit-row');
  if (!rows.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const row = entry.target;
          const index = Array.from(rows).indexOf(row);
          setTimeout(() => {
            row.classList.add('revealed');
          }, index * 80);
          observer.unobserve(row);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
  );

  rows.forEach((row) => observer.observe(row));
}

export function initCredits() {
  const tableBody = document.querySelector('.credits-table tbody');
  if (!tableBody) return;

  fetch('data/Projects.json')
    .then((response) => response.json())
    .then((data) => {
      tableBody.innerHTML = '';
      data.projects.forEach((project) => {
        const tr = document.createElement('tr');
        tr.className = 'credit-row';

        if (project.preview) {
          tr.setAttribute('data-preview', project.preview);
        } else if (project.poster) {
          tr.setAttribute('data-preview', project.poster);
        }

        const tdTitle = document.createElement('td');
        tdTitle.className = 'credit-title';
        tdTitle.textContent = project.title;
        tr.appendChild(tdTitle);

        const tdNetwork = document.createElement('td');
        tdNetwork.className = 'credit-network';
        tdNetwork.textContent = project.platform || '';
        tr.appendChild(tdNetwork);

        tableBody.appendChild(tr);
      });

      initCreditsPreview();
      initCreditsRowReveal();
    })
    .catch((err) => {
      console.error('Error loading projects:', err);
      initCreditsPreview();
      initCreditsRowReveal();
    });
}
