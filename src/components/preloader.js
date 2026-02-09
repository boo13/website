import { gsap } from 'gsap';

const FORCE_COMPLETE_AFTER_MS = 15000;
const FAKE_PROGRESS_TICK_MS = 240;
const FAKE_PROGRESS_MIN_STEP = 0.01;
const FAKE_PROGRESS_MAX_STEP = 0.05;

const VIDEO_ASPECT_RATIO = 16 / 9;
const DESKTOP_SIZES = { minWidth: 96, maxWidth: 520 };
const MOBILE_SIZES = { minWidth: 64, maxWidth: 360 };

function randomStep(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSizeConfig() {
  return window.matchMedia('(max-width: 480px)').matches ? MOBILE_SIZES : DESKTOP_SIZES;
}

function waitForVideoFrame(video, onLoaded) {
  if (video.readyState >= 2) {
    onLoaded();
    return () => {};
  }

  const onFrameLoaded = () => {
    video.removeEventListener('loadeddata', onFrameLoaded);
    onLoaded();
  };

  video.addEventListener('loadeddata', onFrameLoaded);
  return () => video.removeEventListener('loadeddata', onFrameLoaded);
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

function renderEdges(edgesEl, progress) {
  if (!edgesEl) {
    return;
  }

  const { minWidth, maxWidth } = getSizeConfig();
  const width = Math.max(maxWidth * progress, minWidth);
  const height = width / VIDEO_ASPECT_RATIO;
  gsap.set(edgesEl, { width, height });
}

function createProgressSmoother(edgesEl) {
  const state = { value: 0 };

  const render = () => {
    renderEdges(edgesEl, state.value);
  };

  render();

  return {
    to(target) {
      gsap.to(state, {
        value: target,
        duration: 0.65,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: render,
      });
    },
    kill() {
      gsap.killTweensOf(state);
    },
  };
}

function animateExit({ overlayEl, edgesEl, timeEl, onComplete }) {
  const travelDistance = window.matchMedia('(max-width: 480px)').matches ? 28 : 44;
  const cornerAnimations = [
    { selector: '.preloader-corner-lt', x: -travelDistance, y: -travelDistance },
    { selector: '.preloader-corner-lb', x: -travelDistance, y: travelDistance },
    { selector: '.preloader-corner-rt', x: travelDistance, y: -travelDistance },
    { selector: '.preloader-corner-rb', x: travelDistance, y: travelDistance },
  ];

  const timeline = gsap.timeline({
    defaults: {
      ease: 'power2.inOut',
    },
    onComplete,
  });

  if (timeEl) {
    timeline.to(timeEl, { autoAlpha: 0, duration: 0.55, ease: 'power1.out' }, 0);
  }

  cornerAnimations.forEach(({ selector, x, y }) => {
    const cornerEl = overlayEl.querySelector(selector);
    if (!cornerEl) {
      return;
    }

    timeline.to(
      cornerEl,
      {
        x,
        y,
        autoAlpha: 0,
        duration: 1.05,
        ease: 'power1.out',
      },
      0.08,
    );
  });

  if (edgesEl) {
    timeline.to(edgesEl, { scale: 1.04, duration: 1.0, ease: 'power1.out' }, 0.08);
  }

  timeline.to(
    overlayEl,
    {
      delay: 0.5,
      autoAlpha: 0,
      duration: 1.25,
    },
    0.45,
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
    const timeEl = overlayEl.querySelector('.preloader-time');
    const progressSmoother = createProgressSmoother(edgesEl);

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
      progressSmoother.kill();
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
      progressSmoother.to(progress);

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
        const cleanupMetadataListener = waitForVideoFrame(video, () => {
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
