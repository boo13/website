/**
 * Credits Table with Cursor-Following Preview
 * Hover on credit row shows image preview that follows cursor
 */

function initCreditsPreview() {
  const table = document.querySelector('.credits-table');
  const rows = document.querySelectorAll('.credit-row');
  const preview = document.querySelector('.cursor-preview');
  const previewImg = preview?.querySelector('img');

  if (!table || !rows.length || !preview || !previewImg) return () => {};
  if ('ontouchstart' in window) return () => {};

  let isVisible = false;
  let currentSrc = null;
  let rafId = null;
  let mouseX = -1;
  let mouseY = -1;

  const edgePadding = 16;
  const cursorInsetX = 8;
  const cursorInsetY = 8;
  const defaultLeftTitleSafeZone = 120;
  const defaultLeftTitleBlendWidth = 80;
  const defaultCursorRightOffset = 16;
  let leftTitleSafeZone = defaultLeftTitleSafeZone;
  let leftTitleBlendWidth = defaultLeftTitleBlendWidth;
  let cursorRightOffset = defaultCursorRightOffset;

  function readPxVariable(name, fallback) {
    const value = parseFloat(getComputedStyle(table).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function syncCursorPositioningVars() {
    // These values are defined in CSS so table layout changes stay in sync
    // with JS cursor-positioning behavior.
    leftTitleSafeZone = readPxVariable(
      '--credits-title-safe-zone',
      defaultLeftTitleSafeZone,
    );
    leftTitleBlendWidth = readPxVariable(
      '--credits-title-blend-width',
      defaultLeftTitleBlendWidth,
    );
    cursorRightOffset = readPxVariable(
      '--credits-cursor-right-offset',
      defaultCursorRightOffset,
    );
  }

  syncCursorPositioningVars();

  function updatePosition() {
    if (!isVisible) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewRect = preview.getBoundingClientRect();

    const tableRect = table.getBoundingClientRect();
    const blendStartX = tableRect.left + leftTitleSafeZone;
    const blendWidth = Math.max(leftTitleBlendWidth, 1);
    const blendEndX = blendStartX + blendWidth;
    const xWhenRightOfCursor = mouseX + cursorRightOffset;
    const xWhenInset = mouseX - cursorInsetX;

    let x = xWhenInset;
    if (mouseX <= blendStartX) {
      x = xWhenRightOfCursor;
    } else if (mouseX < blendEndX) {
      // Smoothly blend from "right of cursor" to "inset left of cursor"
      // near the title column to avoid abrupt flips/flicker.
      const t = (mouseX - blendStartX) / blendWidth;
      x = xWhenRightOfCursor + (xWhenInset - xWhenRightOfCursor) * t;
    }
    let y = mouseY - cursorInsetY;

    if (x + previewRect.width > viewportWidth - edgePadding) {
      x = viewportWidth - previewRect.width - edgePadding;
    }
    if (y + previewRect.height > viewportHeight - edgePadding) {
      y = viewportHeight - previewRect.height - edgePadding;
    }
    if (x < edgePadding) x = edgePadding;
    if (y < edgePadding) y = edgePadding;

    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
  }

  function setPreviewForRow(row) {
    if (!row) {
      hidePreview();
      return;
    }

    const previewSrc = row.dataset.preview;
    if (!previewSrc) {
      hidePreview();
      return;
    }

    if (previewSrc !== currentSrc) {
      currentSrc = previewSrc;
      previewImg.src = previewSrc;
      previewImg.alt = row.querySelector('.credit-title')?.textContent || '';
    }

    showPreview();
  }

  function syncRowUnderCursor() {
    if (mouseX < 0 || mouseY < 0) return;
    const tableRect = table.getBoundingClientRect();
    const withinTableY = mouseY >= tableRect.top && mouseY <= tableRect.bottom;

    const element = document.elementFromPoint(mouseX, mouseY);
    let row = element?.closest('.credit-row');

    // If cursor is left of the table, resolve row by Y using a probe point
    // just inside the table so hover previews still work in the left margin.
    if ((!row || !table.contains(row)) && withinTableY && mouseX < tableRect.left) {
      const probeX = Math.min(Math.max(Math.floor(tableRect.left + 1), 0), window.innerWidth - 1);
      const probeElement = document.elementFromPoint(probeX, mouseY);
      row = probeElement?.closest('.credit-row');
    }

    if (row && table.contains(row)) {
      setPreviewForRow(row);
    } else {
      hidePreview();
    }
  }

  function requestUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      syncRowUnderCursor();
      updatePosition();
    });
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

  function handlePreviewImageLoad() {
    requestUpdate();
  }

  function handlePreviewImageError() {
    hidePreview();
  }

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    requestUpdate();
  }

  function handleScroll() {
    requestUpdate();
  }

  function handleResize() {
    syncCursorPositioningVars();
    requestUpdate();
  }

  previewImg.addEventListener('load', handlePreviewImageLoad);
  previewImg.addEventListener('error', handlePreviewImageError);

  const rowListeners = [];
  rows.forEach((row) => {
    const handleMouseEnter = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setPreviewForRow(row);
      requestUpdate();
    };
    const handleMouseLeave = () => requestUpdate();

    row.addEventListener('mouseenter', handleMouseEnter);
    row.addEventListener('mouseleave', handleMouseLeave);
    rowListeners.push({ row, handleMouseEnter, handleMouseLeave });
  });

  document.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    rowListeners.forEach(({ row, handleMouseEnter, handleMouseLeave }) => {
      row.removeEventListener('mouseenter', handleMouseEnter);
      row.removeEventListener('mouseleave', handleMouseLeave);
    });
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
    previewImg.removeEventListener('load', handlePreviewImageLoad);
    previewImg.removeEventListener('error', handlePreviewImageError);
    hidePreview();
  };
}

function initCreditsRowReveal() {
  const rows = document.querySelectorAll('.credit-row');
  if (!rows.length) return () => {};
  const revealTimeouts = [];

  const observer = new IntersectionObserver(
    (entries) => {
      // Only process newly-intersecting rows, staggered within this batch
      let batchIndex = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const row = entry.target;
          const timeoutId = window.setTimeout(() => {
            row.classList.add('revealed');
          }, batchIndex * 80);
          batchIndex++;
          revealTimeouts.push(timeoutId);
          observer.unobserve(row);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
  );

  rows.forEach((row) => observer.observe(row));

  return () => {
    observer.disconnect();
    revealTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  };
}

export function initCredits() {
  const tableBody = document.querySelector('.credits-table tbody');
  if (!tableBody) return () => {};
  let isDisposed = false;
  let cleanupPreview = () => {};
  let cleanupRowReveal = () => {};

  function initCreditsEffects() {
    cleanupPreview();
    cleanupRowReveal();
    cleanupPreview = initCreditsPreview();
    cleanupRowReveal = initCreditsRowReveal();
  }

  fetch('data/Projects.json')
    .then((response) => response.json())
    .then((data) => {
      if (isDisposed) return;
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

      initCreditsEffects();
    })
    .catch((err) => {
      if (isDisposed) return;
      console.error('Error loading projects:', err);
      initCreditsEffects();
    });

  return () => {
    isDisposed = true;
    cleanupPreview();
    cleanupRowReveal();
  };
}
