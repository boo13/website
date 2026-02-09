import { gsap } from 'gsap';

const FORCE_COMPLETE_AFTER_MS = 15000;
const FAKE_PROGRESS_TICK_MS = 800;
const FAKE_PROGRESS_MIN_STEP = 0.05;
const FAKE_PROGRESS_MAX_STEP = 0.28;

const DESKTOP_SIZES = { minWidth: 67, minHeight: 67, maxWidth: 371, maxHeight: 220 };
const MOBILE_SIZES = { minWidth: 41, minHeight: 41, maxWidth: 229, maxHeight: 136 };

function randomStep(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatCounter(progress) {
  return String(Math.round(progress * 100)).padStart(2, '0');
}

function getSizeConfig() {
  return window.matchMedia('(max-width: 480px)').matches ? MOBILE_SIZES : DESKTOP_SIZES;
}

function waitForLoadedMetadata(video, onLoaded) {
  if (video.readyState >= 1) {
    onLoaded();
    return () => {};
  }

  const onMetadataLoaded = () => {
    video.removeEventListener('loadedmetadata', onMetadataLoaded);
    onLoaded();
  };

  video.addEventListener('loadedmetadata', onMetadataLoaded);
  return () => video.removeEventListener('loadedmetadata', onMetadataLoaded);
}

function startCountdown(timerEl) {
  if (!timerEl) {
    return () => {};
  }

  let hundredths = 999;
  let seconds = 6;
  let minutes = 0;

  const updateTime = () => {
    hundredths -= 50;
    if (hundredths <= 0) {
      seconds -= 1;
      hundredths = 999;
    }

    if (seconds <= 0) {
      minutes -= 1;
      seconds = 60;
    }

    if (hundredths >= 0 && seconds >= 0 && minutes >= 0) {
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      const hh = String(Math.floor(hundredths / 10)).padStart(2, '0');
      timerEl.textContent = `${mm}:${ss}:${hh}`;
      return;
    }

    timerEl.textContent = '00:00:00';
  };

  const timerId = window.setInterval(updateTime, 50);
  return () => window.clearInterval(timerId);
}

function animateEdges(edgesEl, progress) {
  if (!edgesEl) {
    return;
  }

  const { minWidth, minHeight, maxWidth, maxHeight } = getSizeConfig();
  const width = Math.max(Math.round(maxWidth * progress), minWidth);
  const height = Math.max(Math.round(maxHeight * progress), minHeight);

  gsap.to(edgesEl, {
    width,
    height,
    duration: 1,
    ease: 'sine.inOut',
    overwrite: 'auto',
  });
}

function animateExit({ overlayEl, edgesEl, countEl, timeEl, onComplete }) {
  const timeline = gsap.timeline({
    defaults: {
      ease: 'power2.inOut',
    },
    onComplete,
  });

  if (countEl) {
    timeline.to(countEl, { autoAlpha: 0, duration: 0.35 }, 0);
  }

  if (timeEl) {
    timeline.to(timeEl, { autoAlpha: 0, duration: 0.35 }, 0);
  }

  if (edgesEl) {
    timeline.to(edgesEl, { scale: 1.08, duration: 0.55 }, 0.1);
  }

  timeline.to(
    overlayEl,
    {
      delay: 0.5,
      autoAlpha: 0,
      duration: 1.2,
    },
    0.2,
  );
}

export function runPreloader() {
  return new Promise((resolve) => {
    const overlayEl = document.querySelector('.loading-overlay');
    if (!overlayEl) {
      resolve();
      return;
    }

    const edgesEl = overlayEl.querySelector('.preloader-edges');
    const countEl = overlayEl.querySelector('.preloader-count');
    const timeEl = overlayEl.querySelector('.preloader-time');

    const clearCountdown = startCountdown(timeEl);
    const videos = Array.from(document.querySelectorAll('video'));

    let fakeProgress = 0;
    let realProgress = videos.length > 0 ? 0 : 1;
    let loadedVideos = 0;
    let isComplete = false;

    const metadataCleanupFns = [];

    const cleanup = () => {
      window.clearInterval(fakeProgressIntervalId);
      window.clearTimeout(forceCompleteTimeoutId);
      clearCountdown();
      metadataCleanupFns.forEach((cleanupFn) => cleanupFn());
    };

    const finish = () => {
      if (isComplete) {
        return;
      }

      isComplete = true;
      cleanup();

      animateExit({
        overlayEl,
        edgesEl,
        countEl,
        timeEl,
        onComplete: () => {
          overlayEl.remove();
          resolve();
        },
      });
    };

    const updateProgress = () => {
      if (isComplete) {
        return;
      }

      const progress = clamp(0.8 * fakeProgress + 0.2 * realProgress, 0, 1);
      if (countEl) {
        countEl.textContent = formatCounter(progress);
      }
      animateEdges(edgesEl, progress);

      if (progress >= 1) {
        finish();
      }
    };

    const forceComplete = () => {
      fakeProgress = 1;
      realProgress = 1;
      updateProgress();
    };

    const fakeProgressIntervalId = window.setInterval(() => {
      fakeProgress = Math.min(
        fakeProgress + randomStep(FAKE_PROGRESS_MIN_STEP, FAKE_PROGRESS_MAX_STEP),
        1,
      );
      updateProgress();
    }, FAKE_PROGRESS_TICK_MS);

    const forceCompleteTimeoutId = window.setTimeout(forceComplete, FORCE_COMPLETE_AFTER_MS);

    if (videos.length > 0) {
      videos.forEach((video) => {
        const cleanupMetadataListener = waitForLoadedMetadata(video, () => {
          loadedVideos += 1;
          realProgress = loadedVideos / videos.length;
          updateProgress();
        });
        metadataCleanupFns.push(cleanupMetadataListener);
      });
    }

    updateProgress();
  });
}
