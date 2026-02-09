import { gsap } from 'gsap';

const FORCE_COMPLETE_AFTER_MS = 15000;
const FONT_TASK_WEIGHT = 3;
const VIDEO_TASK_WEIGHT = 4;
const IMAGE_TASK_WEIGHT = 1;

const VIDEO_ASPECT_RATIO = 16 / 9;
const DESKTOP_SIZES = { minWidth: 96, maxWidth: 520 };
const MOBILE_SIZES = { minWidth: 64, maxWidth: 360 };

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

function waitForImageLoad(image, onLoaded) {
  if (image.complete && image.naturalWidth > 0) {
    onLoaded();
    return () => {};
  }

  const onDone = () => {
    image.removeEventListener('load', onDone);
    image.removeEventListener('error', onDone);
    onLoaded();
  };

  image.addEventListener('load', onDone);
  image.addEventListener('error', onDone);
  return () => {
    image.removeEventListener('load', onDone);
    image.removeEventListener('error', onDone);
  };
}

function shouldTrackImage(image) {
  if (image.loading === 'lazy' && !image.complete) {
    return false;
  }
  return true;
}

function shouldTrackVideo(video) {
  if (video.preload === 'none' && !video.autoplay) {
    return false;
  }
  return true;
}

function getCollectionRoot(criticalRootSelector) {
  if (!criticalRootSelector) {
    return document;
  }

  const rootEl = document.querySelector(criticalRootSelector);
  return rootEl || document;
}

function waitForFonts(onLoaded) {
  if (!document.fonts?.ready) {
    onLoaded();
    return () => {};
  }

  let isCancelled = false;
  document.fonts.ready
    .catch(() => {})
    .finally(() => {
      if (!isCancelled) {
        onLoaded();
      }
    });

  return () => {
    isCancelled = true;
  };
}

function startCountdown(timerEl) {
  if (!timerEl) {
    return () => {};
  }

  const FPS = 24;
  let totalFrames = 6 * FPS;

  const updateTime = () => {
    totalFrames -= 1;

    if (totalFrames <= 0) {
      timerEl.textContent = '00:00:00';
      return;
    }

    const mins = Math.floor(totalFrames / (60 * FPS));
    const secs = Math.floor((totalFrames % (60 * FPS)) / FPS);
    const frames = totalFrames % FPS;

    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    const ff = String(frames).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}:${ff}`;
  };

  const timerId = window.setInterval(updateTime, 1000 / FPS);
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

export function runPreloader(options = {}) {
  return new Promise((resolve) => {
    const { overlaySelector = '.loading-overlay', criticalRootSelector } = options;
    const overlayEl = document.querySelector(overlaySelector);
    if (!overlayEl) {
      resolve();
      return;
    }

    const edgesEl = overlayEl.querySelector('.preloader-edges');
    const timeEl = overlayEl.querySelector('.preloader-time');
    const progressSmoother = createProgressSmoother(edgesEl);
    const clearCountdown = startCountdown(timeEl);

    const collectionRoot = getCollectionRoot(criticalRootSelector);
    const videos = Array.from(collectionRoot.querySelectorAll('video')).filter(shouldTrackVideo);
    const images = Array.from(collectionRoot.querySelectorAll('img')).filter(shouldTrackImage);

    let loadedWeight = 0;
    let isComplete = false;

    const taskCleanupFns = [];

    const tasks = [
      { weight: FONT_TASK_WEIGHT, register: waitForFonts },
      ...videos.map((video) => ({
        weight: VIDEO_TASK_WEIGHT,
        register: (onLoaded) => waitForVideoFrame(video, onLoaded),
      })),
      ...images.map((image) => ({
        weight: IMAGE_TASK_WEIGHT,
        register: (onLoaded) => waitForImageLoad(image, onLoaded),
      })),
    ];
    const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);

    const updateProgress = () => {
      if (isComplete) {
        return;
      }

      const progress = totalWeight > 0 ? clamp(loadedWeight / totalWeight, 0, 1) : 1;
      progressSmoother.to(progress);

      if (progress >= 1) {
        finish();
      }
    };

    const markTaskLoaded = (weight) => {
      loadedWeight += weight;
      updateProgress();
    };

    const cleanup = () => {
      window.clearTimeout(forceCompleteTimeoutId);
      clearCountdown();
      progressSmoother.kill();
      taskCleanupFns.forEach((cleanupFn) => cleanupFn());
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

    const forceComplete = () => {
      loadedWeight = totalWeight;
      updateProgress();
    };

    const forceCompleteTimeoutId = window.setTimeout(forceComplete, FORCE_COMPLETE_AFTER_MS);

    tasks.forEach((task) => {
      const cleanupTaskListener = task.register(() => markTaskLoaded(task.weight));
      taskCleanupFns.push(cleanupTaskListener);
    });

    updateProgress();
  });
}
