/**
 * project-video.js — Video hero controls for project pages
 * Play/pause, timeline, sound toggle, scroll-to-credits
 */
import gsap from 'gsap';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function initProjectVideo() {
  const section = document.querySelector('.project-hero--video');
  if (!section) return;

  const video = section.querySelector('video');
  const playBtn = section.querySelector('.project-hero__play-btn');
  const soundBtn = section.querySelector('.project-hero__sound-btn');
  const creditsBtn = section.querySelector('.project-hero__credits-btn');
  const closeBtn = section.querySelector('.project-hero__close');
  const backBtn = document.querySelector('.project-footer__back-btn');

  // Use history.back() when the visitor came from this site so the browser can
  // restore the previous page from bfcache (preserves scroll + skips preloader).
  // Falls through to the anchor's href="/" for direct/external visitors.
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      const cameFromSameOrigin =
        document.referrer && document.referrer.startsWith(location.origin);
      if (cameFromSameOrigin && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  }
  const timelineFill = section.querySelector(
    '.project-hero__timeline-progress'
  );
  const timelineRail = section.querySelector('.project-hero__timeline');
  const timeCurrent = section.querySelector('.project-hero__time-current');
  const timeTotal = section.querySelector('.project-hero__time-total');

  if (!video) return;

  const ctx = gsap.context(() => {}, section);

  // --- Play / Pause ---
  function togglePlay() {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function updatePlayBtn() {
    if (playBtn) playBtn.textContent = video.paused ? '\u25B6' : '\u275A\u275A';
  }

  video.addEventListener('play', updatePlayBtn);
  video.addEventListener('pause', updatePlayBtn);
  if (playBtn) playBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  // --- Sound toggle ---
  function updateSoundBtn() {
    if (soundBtn) soundBtn.textContent = video.muted ? 'sound off' : 'sound on';
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      updateSoundBtn();
    });
    updateSoundBtn();
  }

  // --- Timeline progress ---
  video.addEventListener('loadedmetadata', () => {
    if (timeTotal) timeTotal.textContent = formatTime(video.duration);
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    if (timelineFill) timelineFill.style.width = `${pct}%`;
    if (timeCurrent) timeCurrent.textContent = formatTime(video.currentTime);
  });

  // --- Timeline seek on click ---
  if (timelineRail) {
    timelineRail.addEventListener('click', (e) => {
      const rect = timelineRail.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      video.currentTime = pct * video.duration;
    });
  }

  // --- Credits scroll ---
  if (creditsBtn) {
    creditsBtn.addEventListener('click', () => {
      const credits = document.querySelector('.project-credits');
      if (credits) credits.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- Back to video ---
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return () => ctx.revert();
}
