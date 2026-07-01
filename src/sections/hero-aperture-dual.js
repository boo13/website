import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';
import ScrollSmoother from 'gsap/ScrollSmoother';
import SplitText from 'gsap/SplitText';
import { textMaskRiseWords } from '../animations/text-mask-rise.js';
import { initGlitchText } from '../components/glitch-text.js';
import {
  TRAIL_K,
  TRAIL_MAX_PX,
  TRAIL_THRESH,
  TRAIL_OPACITY,
  BREAKPOINTS,
  SCRUB,
} from '../config.js';
import { prefersReducedMotion } from '../utils/dom.js';
import { isDebugMode, mountPane } from '../utils/debug-pane.js';

gsap.registerPlugin(SplitText);

// Per-layer opacity caps for the hero name color trail (blue, red, cyan, yellow) —
// outer spectral hues stay fainter than the inner pair.
const TRAIL_LAYER_OPACITY = [
  TRAIL_OPACITY,
  TRAIL_OPACITY,
  TRAIL_OPACITY * 0.65,
  TRAIL_OPACITY * 0.65,
];

// ─── Social icon chromatic aberration (hover + entrance) ────────────────────
// Four stacked drop-shadows simulate RGB-channel offset: an inner blue/red
// pair plus a fainter, wider cyan/yellow halo (halo = inner * haloScale).
const SOCIAL_CA_HUES = {
  blue: '0.804 0.146 220',
  red: '0.656 0.235 13',
  cyan: '0.86 0.15 195',
  yellow: '0.85 0.17 85',
};

const SOCIAL_CA_STORAGE_KEY = 'social-ca-config';

const SOCIAL_CA_DEFAULT_CONFIG = {
  // Rise (hover-in)
  offsetX: 2,
  offsetY: 4,
  blur: 2,
  alpha: 0.9,
  haloScale: 1.5,
  haloAlpha: 0.5,
  liftY: -5,
  riseDuration: 0.14,
  ease: 'expo.out',

  // Settle (secondary wobble before resting)
  settleOffsetX: 1,
  settleOffsetY: -2,
  settleAlpha: 0.66,
  settleHaloAlpha: 0.35,
  settleLiftY: 2,
  settleDuration: 0.16,
  settleEase: 'power2.out',

  // Release (hover-out)
  releaseDuration: 0.48,

  // Entrance (hero chrome reveal)
  entranceRiseY: 28,
  entranceTrailY: 3,
  entranceBlur: 1.5,
  entranceAlpha: 0.7,
  entranceHaloAlpha: 0.35,
  entranceDuration: 0.85,
  entranceStagger: 0.15,
};

function loadSocialCAConfig() {
  if (!isDebugMode()) return { ...SOCIAL_CA_DEFAULT_CONFIG };
  try {
    const saved = JSON.parse(localStorage.getItem(SOCIAL_CA_STORAGE_KEY) || 'null');
    return { ...SOCIAL_CA_DEFAULT_CONFIG, ...saved };
  } catch {
    return { ...SOCIAL_CA_DEFAULT_CONFIG };
  }
}

// Color-first argument order matches the browser's canonical computed-style
// serialization of drop-shadow(), so the filter looks identical to the CSS
// resting state once cleared. Values are never handed to GSAP as a single
// string to interpolate — see socialCAState()/applySocialCAFilter() below —
// GSAP only does numeric-token-position interpolation on arbitrary strings,
// which silently blends hue/alpha numbers with pixel offsets mid-tween.
function socialCAShadow(x, y, blur, hue, alpha) {
  return `drop-shadow(oklch(${hue} / ${alpha}) ${x}px ${y}px ${blur}px)`;
}

// offsetX/offsetY describe the blue channel; red mirrors X and halves Y.
// The halo pair (cyan/yellow) is the inner pair scaled by haloScale.
function socialCAFilter({ offsetX, offsetY, blur, alpha, haloScale, haloAlpha }) {
  const blueY = offsetY;
  const redY = offsetY / 2;
  return [
    socialCAShadow(-offsetX, blueY, blur, SOCIAL_CA_HUES.blue, alpha),
    socialCAShadow(offsetX, redY, blur, SOCIAL_CA_HUES.red, alpha),
    socialCAShadow(
      -offsetX * haloScale,
      blueY * haloScale,
      blur * haloScale,
      SOCIAL_CA_HUES.cyan,
      haloAlpha
    ),
    socialCAShadow(
      offsetX * haloScale,
      redY * haloScale,
      blur * haloScale,
      SOCIAL_CA_HUES.yellow,
      haloAlpha
    ),
  ].join(' ');
}

// Per-element numeric state that GSAP tweens directly (no string parsing
// involved). onUpdate rebuilds the filter string from the current numbers
// and assigns it to the target's inline style each tick.
function socialCAState() {
  return { offsetX: 0, offsetY: 0, blur: 0, alpha: 0, haloScale: 1, haloAlpha: 0 };
}

function applySocialCAFilter(svg, state) {
  svg.style.filter = socialCAFilter(state);
}

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
  const heroName = content?.querySelector('.hero-name');
  const heroSubtitle = content?.querySelector('.hero-subtitle');
  const heroSocial = content?.querySelector('.hero-social');
  const about = scene?.querySelector('.portal-scene__about');
  const aboutInner = scene?.querySelector('.portal-scene__about-inner');
  const vignette = scene?.querySelector('.aperture-edge-vignette');
  const topGradient = document.querySelector('.hero-top-transition-gradient');
  const textFillEls = [...scene.querySelectorAll('[data-aperture-text-fill]')];

  if (!scene || !videoShell || !about) return () => {};

  const fixedName = document.getElementById('hero-name-fixed');
  const fixedOverlays = [fixedName].filter(Boolean);
  const marquee = scene.querySelector('.about-intro__marquee');
  const galleryEl = document.querySelector('.featured-work-section');

  const isMobile = window.innerWidth <= BREAKPOINTS.tablet;
  const hasBackVideo = Boolean(backShell && backVideo);
  const finalHole = isMobile ? '64vmin' : '54vmin';
  const finalFeather = isMobile ? '22vmin' : '24vmin';
  const edgeOpacity = hasBackVideo ? 0.5 : 0.76;
  const finalShade = hasBackVideo ? 0.38 : 0.24;

  // ─── Reduced motion ───────────────────────────────────────────────────────
  if (prefersReducedMotion()) {
    pauseDecorativeVideo(backVideo);
    pauseDecorativeVideo(video);
    if (content) gsap.set(content, { autoAlpha: 0 });
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
    if (fixedOverlays.length) gsap.set(fixedOverlays, { autoAlpha: 1 });
    if (topGradient) gsap.set(topGradient, { autoAlpha: 0.85 });
    if (marquee) gsap.set(marquee, { autoAlpha: 1 });
    return () => {};
  }

  // ─── Initial state ────────────────────────────────────────────────────────
  gsap.set(scene, { '--portal-shade': 0 });
  if (hasBackVideo) {
    gsap.set(backShell, { autoAlpha: 0 });
    gsap.set(backVideo, { scale: 1.22, filter: 'blur(24px) saturate(0.62)' });
  }
  gsap.set(videoShell, {
    '--aperture-hole': '-1vmin',
    '--aperture-feather': '1vmin',
    autoAlpha: 1,
  });
  gsap.set(video, { scale: 1.02, filter: 'blur(0px) saturate(1)' });
  gsap.set(about, { autoAlpha: 0, scale: 0.84, filter: 'blur(14px)' });
  gsap.set(aboutInner, { y: 40 });
  gsap.set(vignette, { autoAlpha: 0 });
  if (topGradient) gsap.set(topGradient, { autoAlpha: 0 });
  if (fixedOverlays.length)
    gsap.set(fixedOverlays, { autoAlpha: 0, filter: 'blur(10px)' });
  if (marquee) gsap.set(marquee, { autoAlpha: 0 });

  // Hero content hidden until textMaskRiseWords reveals it
  if (heroSubtitle) gsap.set(heroSubtitle, { autoAlpha: 0, y: 20 });
  if (heroSocial) gsap.set(heroSocial, { autoAlpha: 0 });

  // ─── Ticker state (velocity-driven chromatic trail) ───────────────────────
  let tickerFn = null;
  let springBackTween = null;
  let heroChromeTl = null;
  let heroChromePlayed = false;
  let cleanupGlitch = () => {};
  const cleanupSocialHover = [];
  let cleanupMaskRise = () => {};
  let socialCAPane = null;

  const socialCACfg = loadSocialCAConfig();
  const socialCAStates = new WeakMap();

  function getSocialCAState(svg) {
    let state = socialCAStates.get(svg);
    if (!state) {
      state = socialCAState();
      socialCAStates.set(svg, state);
    }
    return state;
  }

  function animateSocialIcon(svg) {
    const cfg = socialCACfg;
    const state = getSocialCAState(svg);
    const onUpdate = () => applySocialCAFilter(svg, state);
    // Kill any in-flight tween from a prior hover before starting a new one.
    // The timeline below intentionally omits `overwrite: true` — sequential
    // same-target tweens within one timeline don't need it, and applying it
    // per-tween can cause a later phase to strip properties from an earlier
    // one if their start boundaries are ever evaluated in the same tick.
    gsap.killTweensOf(svg);
    gsap.killTweensOf(state);
    gsap
      .timeline()
      .to(svg, { y: cfg.liftY, opacity: 0.96, duration: cfg.riseDuration, ease: cfg.ease })
      .to(
        state,
        {
          offsetX: cfg.offsetX,
          offsetY: cfg.offsetY,
          blur: cfg.blur,
          alpha: cfg.alpha,
          haloScale: cfg.haloScale,
          haloAlpha: cfg.haloAlpha,
          duration: cfg.riseDuration,
          ease: cfg.ease,
          onUpdate,
        },
        '<'
      )
      .to(svg, { y: cfg.settleLiftY, duration: cfg.settleDuration, ease: cfg.settleEase })
      .to(
        state,
        {
          offsetX: cfg.settleOffsetX,
          offsetY: cfg.settleOffsetY,
          alpha: cfg.settleAlpha,
          haloAlpha: cfg.settleHaloAlpha,
          duration: cfg.settleDuration,
          ease: cfg.settleEase,
          onUpdate,
        },
        '<'
      )
      .to(svg, {
        y: 0,
        opacity: 1,
        duration: cfg.releaseDuration,
        ease: cfg.ease,
        clearProps: 'transform,opacity',
      })
      .to(
        state,
        {
          offsetX: 0,
          offsetY: 0,
          alpha: 0,
          haloAlpha: 0,
          duration: cfg.releaseDuration,
          ease: cfg.ease,
          onUpdate,
          onComplete: () => {
            svg.style.filter = '';
          },
        },
        '<'
      );
  }

  if (heroSocial) {
    const playSocialHover = (icon) => {
      const svg = icon.querySelector('svg');
      if (!svg) return;
      animateSocialIcon(svg);
    };
    const handleSocialMouseOver = (event) => {
      const icon = event.target.closest('.social-icon');
      if (!icon || !heroSocial.contains(icon)) return;
      if (icon.contains(event.relatedTarget)) return;
      playSocialHover(icon);
    };
    const handleSocialFocusIn = (event) => {
      const icon = event.target.closest('.social-icon');
      if (!icon || !heroSocial.contains(icon)) return;
      playSocialHover(icon);
    };
    heroSocial.addEventListener('mouseover', handleSocialMouseOver);
    heroSocial.addEventListener('focusin', handleSocialFocusIn);
    cleanupSocialHover.push(() => {
      heroSocial.removeEventListener('mouseover', handleSocialMouseOver);
      heroSocial.removeEventListener('focusin', handleSocialFocusIn);
      heroSocial.querySelectorAll('.social-icon svg').forEach((svg) => {
        gsap.killTweensOf(svg);
      });
    });

    if (isDebugMode()) {
      mountPane('Social Icon CA').then((pane) => {
        socialCAPane = pane;
        const persist = () => {
          localStorage.setItem(
            SOCIAL_CA_STORAGE_KEY,
            JSON.stringify(socialCACfg)
          );
        };

        const riseFolder = pane.addFolder({ title: 'Rise (hover-in)' });
        riseFolder.addBinding(socialCACfg, 'offsetX', { min: 0, max: 10, step: 0.5 });
        riseFolder.addBinding(socialCACfg, 'offsetY', { min: 0, max: 16, step: 0.5 });
        riseFolder.addBinding(socialCACfg, 'blur', { min: 0, max: 8, step: 0.5 });
        riseFolder.addBinding(socialCACfg, 'alpha', { min: 0, max: 1, step: 0.02 });
        riseFolder.addBinding(socialCACfg, 'haloScale', { min: 1, max: 3, step: 0.05 });
        riseFolder.addBinding(socialCACfg, 'haloAlpha', { min: 0, max: 1, step: 0.02 });
        riseFolder.addBinding(socialCACfg, 'liftY', { min: -20, max: 0, step: 0.5 });
        riseFolder.addBinding(socialCACfg, 'riseDuration', { min: 0.02, max: 1, step: 0.01 });

        const settleFolder = pane.addFolder({ title: 'Settle' });
        settleFolder.addBinding(socialCACfg, 'settleOffsetX', { min: -10, max: 10, step: 0.5 });
        settleFolder.addBinding(socialCACfg, 'settleOffsetY', { min: -10, max: 10, step: 0.5 });
        settleFolder.addBinding(socialCACfg, 'settleAlpha', { min: 0, max: 1, step: 0.02 });
        settleFolder.addBinding(socialCACfg, 'settleHaloAlpha', { min: 0, max: 1, step: 0.02 });
        settleFolder.addBinding(socialCACfg, 'settleLiftY', { min: -10, max: 10, step: 0.5 });
        settleFolder.addBinding(socialCACfg, 'settleDuration', { min: 0.02, max: 1, step: 0.01 });

        const releaseFolder = pane.addFolder({ title: 'Release (hover-out)' });
        releaseFolder.addBinding(socialCACfg, 'releaseDuration', { min: 0.05, max: 1.5, step: 0.01 });

        const entranceFolder = pane.addFolder({ title: 'Entrance' });
        entranceFolder.addBinding(socialCACfg, 'entranceRiseY', { min: 0, max: 60, step: 1 });
        entranceFolder.addBinding(socialCACfg, 'entranceTrailY', { min: 0, max: 12, step: 0.5 });
        entranceFolder.addBinding(socialCACfg, 'entranceBlur', { min: 0, max: 6, step: 0.25 });
        entranceFolder.addBinding(socialCACfg, 'entranceAlpha', { min: 0, max: 1, step: 0.02 });
        entranceFolder.addBinding(socialCACfg, 'entranceHaloAlpha', { min: 0, max: 1, step: 0.02 });
        entranceFolder.addBinding(socialCACfg, 'entranceDuration', { min: 0.1, max: 2, step: 0.05 });
        entranceFolder.addBinding(socialCACfg, 'entranceStagger', { min: 0, max: 0.5, step: 0.01 });

        pane
          .addButton({ title: 'Preview hover on first icon' })
          .on('click', () => {
            const svg = heroSocial.querySelector('.social-icon svg');
            if (svg) animateSocialIcon(svg);
          });
        pane.addButton({ title: 'Copy settings' }).on('click', () => {
          navigator.clipboard.writeText(JSON.stringify(socialCACfg, null, 2));
        });

        pane.on('change', persist);
      });
    }
  }

  function playHeroChromeEntrance() {
    if (heroChromePlayed) return;
    heroChromePlayed = true;

    cleanupGlitch = initGlitchText(scene);

    heroChromeTl = gsap.timeline();
    if (heroSubtitle) {
      heroChromeTl.to(
        heroSubtitle,
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          ease: 'expo.out',
        },
        0
      );
    }

    if (heroSocial) {
      const icons = [...heroSocial.querySelectorAll('.social-icon svg')];
      // Reveal container (snap to natural position, clearing CSS translateY(20px))
      heroChromeTl.set(
        heroSocial,
        { autoAlpha: 1, y: 0 },
        heroSubtitle ? 0.18 : 0
      );
      if (icons.length) {
        // Icons rise from below with vertical CA trails — same distance as
        // the hero title words (28px). Vertical shadows trail beneath each
        // icon during the fast opening of expo.out, contracting to zero as
        // the icon decelerates into place. Reads as motion-blur, not copies.
        // Stagger at 0.15s keeps each icon's rise visually distinct.
        const entranceStates = icons.map((svg) => {
          const state = getSocialCAState(svg);
          state.offsetX = 0;
          state.offsetY = socialCACfg.entranceTrailY;
          state.blur = socialCACfg.entranceBlur;
          state.alpha = socialCACfg.entranceAlpha;
          state.haloScale = socialCACfg.haloScale;
          state.haloAlpha = socialCACfg.entranceHaloAlpha;
          applySocialCAFilter(svg, state);
          return state;
        });

        heroChromeTl.to(
          entranceStates,
          {
            offsetX: 0,
            offsetY: 0,
            alpha: 0,
            haloAlpha: 0,
            duration: socialCACfg.entranceDuration,
            ease: 'expo.out',
            stagger: socialCACfg.entranceStagger,
            onUpdate: function () {
              this.targets().forEach((state) => {
                const svg = icons[entranceStates.indexOf(state)];
                applySocialCAFilter(svg, state);
              });
            },
            onComplete: function () {
              this.targets().forEach((state) => {
                icons[entranceStates.indexOf(state)].style.filter = '';
              });
            },
          },
          heroSubtitle ? 0.18 : 0
        );

        heroChromeTl.fromTo(
          icons,
          {
            y: socialCACfg.entranceRiseY,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: socialCACfg.entranceDuration,
            ease: 'expo.out',
            stagger: socialCACfg.entranceStagger,
            clearProps: 'opacity,transform',
          },
          heroSubtitle ? 0.18 : 0
        );
      }
    }
  }

  // ─── Scroll-driven aperture timeline ─────────────────────────────────────
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
    if (textChars.length) gsap.set(textChars, { opacity: 0.15 });

    const tl = gsap.timeline({ paused: true });

    // Hero content rack-focuses out first (text before video)
    if (content) {
      tl.to(
        content,
        {
          autoAlpha: 0,
          y: -26,
          filter: 'blur(7px)',
          duration: 0.44,
          ease: 'none',
        },
        0
      );
    }

    // Video rack-focus follows slightly after content
    if (video) {
      tl.to(
        video,
        {
          scale: 1.24,
          filter: 'blur(10px) saturate(0.66)',
          duration: 1,
          ease: 'none',
        },
        0.04
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

    // Fixed header name blurs in late — most of the about text is already visible
    if (fixedOverlays.length) {
      tl.to(
        fixedOverlays,
        { autoAlpha: 1, filter: 'blur(0px)', duration: 0.32, ease: 'none' },
        0.62
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
      id: 'hero-aperture-pin',
      trigger: scene,
      start: 'top top',
      end: '+=230%',
      pin: true,
      scrub: SCRUB.default,
      anticipatePin: 1,
      animation: tl,
    });
  }, scene);

  // ─── Phase A: entrance animations (load-driven) ───────────────────────────
  if (heroName) {
    cleanupMaskRise = textMaskRiseWords(heroName, {
      delay: 0.3,
      duration: 2.2,
      stagger: 0.12,
      yOffset: 30,
      colorTrail: {
        // Inner blue/red hug the glyphs; outer cyan/yellow trail further, fainter
        colors: [
          'oklch(0.804 0.146 220)',
          'oklch(0.656 0.235 13)',
          'oklch(0.86 0.15 195)',
          'oklch(0.85 0.17 85)',
        ],
        opacities: TRAIL_LAYER_OPACITY,
        blendMode: 'screen',
        staggerOffset: 0.1,
      },
      retainClones: true,
      onWordsComplete: playHeroChromeEntrance,
      onComplete: (clones) => {
        const allClones = clones.flat();
        if (!allClones.length) return;

        const numLayers = clones.length;
        let isActive = false;
        let isSpringBack = false;

        tickerFn = function trailTicker() {
          const apertureST = ScrollTrigger.getById('hero-aperture-pin');
          const suppressed =
            (apertureST?.isActive ?? false) ||
            (galleryEl?.classList.contains('active') ?? false);

          const vel = ScrollSmoother.get()?.getVelocity() ?? 0;
          const absVel = Math.abs(vel);

          if (!suppressed && absVel > TRAIL_THRESH) {
            if (springBackTween) {
              springBackTween.kill();
              springBackTween = null;
            }
            isSpringBack = false;
            isActive = true;
            const baseYOff = gsap.utils.clamp(
              -TRAIL_MAX_PX,
              TRAIL_MAX_PX,
              vel * -TRAIL_K
            );
            const baseOp = gsap.utils.mapRange(
              TRAIL_THRESH,
              TRAIL_THRESH * 6,
              0,
              TRAIL_OPACITY,
              absVel
            );
            clones.forEach((layerClones, i) => {
              const fraction = (i + 1) / numLayers;
              const layerMax = TRAIL_LAYER_OPACITY[i] ?? TRAIL_OPACITY;
              gsap.set(layerClones, {
                y: baseYOff * fraction,
                opacity: Math.min(baseOp * fraction, layerMax),
              });
            });
          } else if (isActive && !isSpringBack) {
            isSpringBack = true;
            springBackTween = gsap.to(allClones, {
              y: 0,
              opacity: 0,
              ease: 'power2.out',
              duration: 0.5,
              onComplete() {
                isSpringBack = false;
                isActive = false;
                springBackTween = null;
              },
            });
          }
        };

        gsap.ticker.add(tickerFn);
      },
    });
  }

  if (!heroName) playHeroChromeEntrance();

  return function cleanup() {
    if (tickerFn !== null) {
      gsap.ticker.remove(tickerFn);
      tickerFn = null;
    }
    if (springBackTween) {
      springBackTween.kill();
      springBackTween = null;
    }
    heroChromeTl?.kill();
    heroChromeTl = null;
    cleanupGlitch();
    cleanupSocialHover.forEach((cleanup) => cleanup());
    cleanupMaskRise();
    socialCAPane?.dispose();
    socialCAPane = null;
    ctx.revert();
  };
}
