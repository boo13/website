import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import SplitText from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const isMobile = window.innerWidth < 768;
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

function pauseDecorativeVideo(video) {
  if (!video) return;
  video.removeAttribute('autoplay');
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    // Some browsers cannot seek before metadata is available.
  }
}

function preserveSplitTextAccessibility(element, split) {
  const tag = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return;

  element.removeAttribute('aria-label');
  [...split.words, ...split.chars].forEach((part) => {
    part.removeAttribute('aria-hidden');
    if (part.parentElement !== element) {
      part.parentElement?.removeAttribute('aria-hidden');
    }
  });
}

export function initHeroApertureDual() {
  const scene = document.querySelector('.portal-scene--aperture');
  const backShell = scene?.querySelector('.aperture-back-video-shell');
  const backVideo = scene?.querySelector('.aperture-back-video');
  const videoShell = scene?.querySelector('.aperture-video-shell');
  const video = scene?.querySelector('.hero-video');
  const content = scene?.querySelector('.hero-content');
  const about = scene?.querySelector('.portal-scene__about');
  const aboutInner = scene?.querySelector('.portal-scene__about-inner');
  const vignette = scene?.querySelector('.aperture-edge-vignette');
  const topGradient = document.querySelector('.hero-top-transition-gradient');
  const textFillEls = [...scene.querySelectorAll('[data-aperture-text-fill]')];

  if (!scene || !videoShell || !about) return () => {};

  const fixedName = document.getElementById('hero-name-fixed');
  const fixedOverlays = [fixedName].filter(Boolean);
  const marquee = scene.querySelector('.about-intro__marquee');

  gsap.set('.hero-name', { autoAlpha: 1 });

  const hasBackVideo = Boolean(backShell && backVideo);
  const finalHole = isMobile ? '64vmin' : '54vmin';
  const finalFeather = isMobile ? '22vmin' : '24vmin';
  const edgeOpacity = hasBackVideo ? 0.5 : 0.76;
  const finalShade = hasBackVideo ? 0.38 : 0.24;

  if (prefersReducedMotion) {
    pauseDecorativeVideo(backVideo);
    pauseDecorativeVideo(video);
    gsap.set(content, { autoAlpha: 0 });
    gsap.set(about, { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
    gsap.set(videoShell, {
      '--aperture-hole': finalHole,
      '--aperture-feather': finalFeather,
      opacity: edgeOpacity,
    });
    if (hasBackVideo) {
      gsap.set(backShell, { autoAlpha: 0.72 });
      gsap.set(backVideo, { scale: 1.03, filter: 'blur(2px) saturate(1)' });
    }
    if (fixedOverlays.length) {
      gsap.set(fixedOverlays, { autoAlpha: 1 });
    }
    if (topGradient) {
      gsap.set(topGradient, { autoAlpha: 0.85 });
    }
    if (marquee) {
      gsap.set(marquee, { autoAlpha: 1 });
    }
    return () => {};
  }

  gsap.set(scene, { '--portal-shade': 0 });
  if (hasBackVideo) {
    gsap.set(backShell, { autoAlpha: 0 });
    gsap.set(backVideo, {
      scale: 1.22,
      filter: 'blur(24px) saturate(0.62)',
    });
  }
  gsap.set(videoShell, {
    '--aperture-hole': '-1vmin',
    '--aperture-feather': '1vmin',
    autoAlpha: 1,
  });
  gsap.set(video, { scale: 1.02, filter: 'blur(0px) saturate(1)' });
  gsap.set(about, {
    autoAlpha: 0,
    scale: 0.84,
    filter: 'blur(14px)',
  });
  gsap.set(aboutInner, { y: 40 });
  gsap.set(vignette, { autoAlpha: 0 });
  if (topGradient) {
    gsap.set(topGradient, { autoAlpha: 0 });
  }
  if (fixedOverlays.length) {
    gsap.set(fixedOverlays, { autoAlpha: 0 });
  }
  if (marquee) {
    gsap.set(marquee, { autoAlpha: 0 });
  }

  const ctx = gsap.context(() => {
    const textSplits = textFillEls.map((el) => {
      const split = SplitText.create(el, {
        type: 'words,chars',
        charsClass: 'char',
        wordsClass: 'word',
      });
      preserveSplitTextAccessibility(el, split);
      return split;
    });
    const textChars = textSplits.flatMap((split) => split.chars);

    if (textChars.length) {
      gsap.set(textChars, { opacity: 0.15 });
    }

    const tl = gsap.timeline({ paused: true });

    if (content) {
      tl.to(
        content,
        {
          autoAlpha: 0,
          y: -26,
          filter: 'blur(7px)',
          duration: 0.28,
          ease: 'none',
        },
        0
      );
    }

    if (video) {
      tl.to(
        video,
        {
          scale: 1.24,
          filter: 'blur(10px) saturate(0.66)',
          duration: 1,
          ease: 'none',
        },
        0
      );
    }

    if (hasBackVideo) {
      tl.to(
        backShell,
        {
          autoAlpha: 0.9,
          duration: 0.62,
          ease: 'none',
          onStart() {
            backVideo.play().catch(() => undefined);
          },
        },
        0.16
      ).to(
        backVideo,
        {
          scale: 1.03,
          filter: 'blur(2px) saturate(1.04)',
          duration: 0.9,
          ease: 'none',
        },
        0.12
      );
    }

    tl.to(
      videoShell,
      {
        '--aperture-hole': finalHole,
        '--aperture-feather': finalFeather,
        duration: 0.76,
        ease: 'none',
      },
      0.08
    )
      .to(
        about,
        {
          autoAlpha: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.5,
          ease: 'none',
        },
        0.16
      )
      .to(aboutInner, { y: 0, duration: 0.5, ease: 'none' }, 0.16)
      .to(
        videoShell,
        { opacity: edgeOpacity, duration: 0.62, ease: 'none' },
        0.24
      )
      .to(vignette, { autoAlpha: 0.86, duration: 0.62, ease: 'none' }, 0.26)
      .to(
        scene,
        { '--portal-shade': finalShade, duration: 0.48, ease: 'none' },
        0.44
      );

    if (textChars.length) {
      tl.to(
        textChars,
        {
          opacity: 1,
          duration: 3 / textChars.length,
          stagger: { each: 1 / textChars.length, from: 'start' },
          ease: 'none',
        },
        0.28
      );
    }

    if (fixedOverlays.length) {
      tl.to(
        fixedOverlays,
        { autoAlpha: 1, duration: 0.28, ease: 'none' },
        0.52
      );
    }

    if (topGradient) {
      tl.to(
        topGradient,
        { autoAlpha: 0.85, duration: 0.28, ease: 'none' },
        0.52
      );
    }

    if (marquee) {
      tl.to(marquee, { autoAlpha: 1, duration: 0.25, ease: 'none' }, 0.68);
    }

    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: '+=230%',
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      animation: tl,
    });
  }, scene);

  return () => ctx.revert();
}
