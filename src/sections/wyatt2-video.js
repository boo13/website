/**
 * wyatt2-video.js — Video project page controls
 * Play/pause, timeline, sound toggle, scroll-to-credits
 */
import gsap from 'gsap';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function initWyatt2Video() {
  const video = document.querySelector('.video-container video');
  const playBtn = document.querySelector('.play-btn');
  const soundBtn = document.querySelector('.sound-btn');
  const creditsBtn = document.querySelector('.credits-btn');
  const backBtn = document.querySelector('.back-to-video-btn');
  const timelineFill = document.querySelector('.timeline-progress');
  const timelineRail = document.querySelector('.timeline');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');

  if (!video) return () => {};

  const ctx = gsap.context(() => {});

  // --- Play / Pause ---
  function togglePlay() {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function updatePlayBtn() {
    playBtn.textContent = video.paused ? '\u25B6' : '\u275A\u275A';
  }

  video.addEventListener('play', updatePlayBtn);
  video.addEventListener('pause', updatePlayBtn);
  playBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  // --- Sound toggle ---
  function updateSoundBtn() {
    soundBtn.textContent = video.muted ? 'sound off' : 'sound on';
  }

  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    updateSoundBtn();
  });
  updateSoundBtn();

  // --- Timeline progress ---
  video.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(video.duration);
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    timelineFill.style.width = `${pct}%`;
    timeCurrent.textContent = formatTime(video.currentTime);
  });

  // --- Timeline seek on click ---
  timelineRail.addEventListener('click', (e) => {
    const rect = timelineRail.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  });

  // --- Credits scroll ---
  creditsBtn.addEventListener('click', () => {
    document.getElementById('credits').scrollIntoView({ behavior: 'smooth' });
  });

  // --- Back to video ---
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Return cleanup
  return () => ctx.revert();
}
