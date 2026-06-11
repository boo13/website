import './styles.css';
import {
  gsap,
  ScrollTrigger,
  initSmooth,
  prefersReducedMotion,
} from './shared.js';

function init() {
  initSmooth();

  const scene = document.querySelector('.portal-scene--through');
  const hero = scene?.querySelector('.portal-scene__hero');
  const video = scene?.querySelector('.hero-video');
  const content = scene?.querySelector('.hero-content');
  const about = scene?.querySelector('.portal-scene__about');
  const aboutInner = scene?.querySelector('.portal-scene__about-inner');
  const depthLines = scene?.querySelector('.portal-scene__depth-lines');

  if (!scene || !hero || !about) return;

  gsap.set('.hero-name', { autoAlpha: 1 });

  if (prefersReducedMotion) {
    gsap.set(hero, { autoAlpha: 0 });
    gsap.set(about, { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
    return;
  }

  gsap.set(scene, { '--portal-shade': 0 });
  gsap.set(about, {
    autoAlpha: 0,
    scale: 0.68,
    z: -260,
    filter: 'blur(26px)',
  });
  gsap.set(aboutInner, { y: 56 });
  gsap.set(hero, { scale: 1, autoAlpha: 1, filter: 'blur(0px)' });
  gsap.set(video, { scale: 1.04, filter: 'blur(0px) saturate(1)' });
  gsap.set(depthLines, { autoAlpha: 0, scale: 0.7, rotate: -4 });

  gsap.context(() => {
    const tl = gsap.timeline({ paused: true });

    if (content) {
      tl.to(
        content,
        {
          autoAlpha: 0,
          y: -42,
          filter: 'blur(8px)',
          duration: 0.34,
          ease: 'none',
        },
        0
      );
    }

    if (video) {
      tl.to(
        video,
        {
          scale: 1.62,
          filter: 'blur(12px) saturate(0.7)',
          duration: 0.58,
          ease: 'none',
        },
        0
      );
    }

    if (depthLines) {
      tl.to(
        depthLines,
        {
          autoAlpha: 0.48,
          scale: 1.22,
          rotate: 0,
          duration: 0.42,
          ease: 'none',
        },
        0.04
      ).to(
        depthLines,
        { autoAlpha: 0, scale: 2.4, duration: 0.46, ease: 'none' },
        0.42
      );
    }

    tl.to(scene, { '--portal-shade': 0.74, duration: 0.62, ease: 'none' }, 0.08)
      .to(
        hero,
        {
          scale: 3.35,
          autoAlpha: 0,
          filter: 'blur(5px)',
          duration: 0.82,
          ease: 'none',
        },
        0.12
      )
      .to(
        about,
        {
          autoAlpha: 1,
          scale: 1,
          z: 0,
          filter: 'blur(0px)',
          duration: 0.76,
          ease: 'none',
        },
        0.18
      )
      .to(aboutInner, { y: 0, duration: 0.76, ease: 'none' }, 0.18)
      .to(
        scene,
        { '--portal-shade': 0.28, duration: 0.38, ease: 'none' },
        0.68
      );

    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: 1.2,
      anticipatePin: 1,
      animation: tl,
    });
  }, scene);
}

document.addEventListener('DOMContentLoaded', init);
