/**
 * project-video.js — Video hero controls for project pages
 * Play/pause, timeline, sound toggle, scroll-to-credits
 */
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/dom.js';

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
  const timelineRail = section.querySelector('.project-hero__timeline');
  const timeCurrent = section.querySelector('.project-hero__time-current');
  const timeTotal = section.querySelector('.project-hero__time-total');

  if (!video) return;

  const ctx = gsap.context(() => {}, section);
  const controller = new AbortController();
  const listenerOptions = { signal: controller.signal };

  // --- Play / Pause ---
  function togglePlay() {
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function updatePlayBtn() {
    if (!playBtn) return;
    playBtn.classList.toggle('is-playing', !video.paused);
    playBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
  }

  if (playBtn) {
    playBtn.innerHTML =
      '<span class="project-hero__play-icon project-hero__play-icon--play" aria-hidden="true">\u25B6</span>' +
      '<span class="project-hero__play-icon project-hero__play-icon--pause" aria-hidden="true">\u275A\u275A</span>';
    updatePlayBtn();
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

  function updateTimeline() {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const currentTime = Math.min(Math.max(video.currentTime, 0), duration);
    if (timeTotal) timeTotal.textContent = formatTime(duration);
    if (timeCurrent) timeCurrent.textContent = formatTime(currentTime);
    if (!timelineRail) return;

    timelineRail.disabled = duration <= 0;
    timelineRail.max = String(duration);
    timelineRail.value = String(currentTime);
    timelineRail.style.setProperty(
      '--video-progress',
      `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
    );
    timelineRail.setAttribute(
      'aria-valuetext',
      `${formatTime(currentTime)} of ${formatTime(duration)}`
    );
  }

  ['loadedmetadata', 'durationchange', 'timeupdate', 'emptied'].forEach(
    (event) => {
      video.addEventListener(event, updateTimeline, listenerOptions);
    }
  );
  updateTimeline();

  if (timelineRail) {
    timelineRail.addEventListener(
      'input',
      () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = Math.min(
          Math.max(Number(timelineRail.value), 0),
          video.duration
        );
        updateTimeline();
      },
      listenerOptions
    );
  }

  // --- Credits scroll ---
  if (creditsBtn) {
    creditsBtn.addEventListener('click', () => {
      const credits = document.querySelector('.project-credits');
      if (credits)
        credits.scrollIntoView({
          behavior: prefersReducedMotion() ? 'instant' : 'smooth',
        });
    });
  }

  // --- Back to video ---
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      });
    });
  }

  return () => {
    controller.abort();
    ctx.revert();
  };
}
