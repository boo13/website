import './styles.css';
import {
  gsap,
  ScrollTrigger,
  initSmooth,
  prefersReducedMotion,
} from './shared.js';

const isMobile = window.innerWidth < 768;

function init() {
  initSmooth();

  const scene = document.querySelector('.portal-scene--aperture');
  const videoShell = scene?.querySelector('.aperture-video-shell');
  const video = scene?.querySelector('.hero-video');
  const content = scene?.querySelector('.hero-content');
  const about = scene?.querySelector('.portal-scene__about');
  const aboutInner = scene?.querySelector('.portal-scene__about-inner');
  const vignette = scene?.querySelector('.aperture-edge-vignette');

  if (!scene || !videoShell || !about) return;

  gsap.set('.hero-name', { autoAlpha: 1 });

  const finalHole = isMobile ? '64vmin' : '54vmin';
  const finalFeather = isMobile ? '22vmin' : '24vmin';

  if (prefersReducedMotion) {
    gsap.set(content, { autoAlpha: 0 });
    gsap.set(about, { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
    gsap.set(videoShell, {
      '--aperture-hole': finalHole,
      '--aperture-feather': finalFeather,
      opacity: 0.7,
    });
    return;
  }

  gsap.set(scene, { '--portal-shade': 0 });
  gsap.set(videoShell, {
    '--aperture-hole': '0vmin',
    '--aperture-feather': '10vmin',
    autoAlpha: 1,
  });
  gsap.set(video, { scale: 1.02, filter: 'blur(0px) saturate(1)' });
  gsap.set(about, {
    autoAlpha: 0,
    scale: 0.84,
    filter: 'blur(22px)',
  });
  gsap.set(aboutInner, { y: 40 });
  gsap.set(vignette, { autoAlpha: 0 });

  gsap.context(() => {
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
          filter: 'blur(16px) saturate(0.58)',
          duration: 1,
          ease: 'none',
        },
        0
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
          duration: 0.66,
          ease: 'none',
        },
        0.2
      )
      .to(aboutInner, { y: 0, duration: 0.66, ease: 'none' }, 0.2)
      .to(videoShell, { opacity: 0.76, duration: 0.62, ease: 'none' }, 0.24)
      .to(vignette, { autoAlpha: 0.86, duration: 0.62, ease: 'none' }, 0.26)
      .to(scene, { '--portal-shade': 0.24, duration: 0.48, ease: 'none' }, 0.44);

    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: 1.35,
      anticipatePin: 1,
      animation: tl,
    });
  }, scene);
}

document.addEventListener('DOMContentLoaded', init);
