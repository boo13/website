import {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
} from '../animations/scroll-defaults.js';
import { prefersReducedMotion } from '../utils/dom.js';

export function initMarquee() {
  const scope = document.querySelector('.portal-scene--aperture-dual');
  const track = scope?.querySelector('.about-intro__marquee-track');
  if (!track) return () => {};

  if (prefersReducedMotion()) return () => {};

  let cleanupPlayback = () => {};

  const ctx = gsap.context(() => {
    const clones = Array.from(track.children, (item) => item.cloneNode(true));
    clones.forEach((item) => track.appendChild(item));

    const halfWidth = track.scrollWidth / 2;
    const marqueeTween = gsap.to(track, {
      x: -halfWidth,
      duration: 30,
      ease: 'none',
      repeat: -1,
      paused: true,
    });

    const marqueeEl = scope.querySelector('.about-intro__marquee');
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    let isHovering = false;
    let sceneVisible = false;

    function suspendMarquee() {
      gsap.killTweensOf(marqueeTween);
      marqueeTween.pause();
    }

    function syncPlayback() {
      if (!sceneVisible || document.hidden || motionPreference.matches) {
        suspendMarquee();
      } else if (marqueeTween.paused()) {
        isHovering = marqueeEl?.matches(':hover') ?? false;
        marqueeTween.timeScale(isHovering ? 0 : 1).resume();
      }
    }

    function updateSceneVisibility(trigger) {
      sceneVisible = trigger.isActive;
      syncPlayback();
    }

    function rampTimeScale(timeScale, duration, ease = 'power2.out') {
      if (marqueeTween.paused()) return;
      gsap.to(marqueeTween, {
        timeScale,
        duration,
        ease,
        overwrite: true,
      });
    }

    const handleMouseEnter = () => {
      isHovering = true;
      rampTimeScale(0, 0.4);
    };
    const handleMouseLeave = () => {
      isHovering = false;
      rampTimeScale(1, 0.6);
    };
    marqueeEl?.addEventListener('mouseenter', handleMouseEnter);
    marqueeEl?.addEventListener('mouseleave', handleMouseLeave);

    const visibilityTrigger = ScrollTrigger.create({
      id: 'hero-marquee-visibility',
      trigger: scope,
      // The hero pin is registered after the preloader; refresh it first.
      refreshPriority: -1,
      start: () => {
        const pin = ScrollTrigger.getById('hero-aperture-pin');
        return pin ? pin.start - window.innerHeight : 'top bottom';
      },
      end: () => {
        const pin = ScrollTrigger.getById('hero-aperture-pin');
        return pin ? pin.end + scope.offsetHeight : 'bottom top';
      },
      onToggle: updateSceneVisibility,
      onRefresh: updateSceneVisibility,
      onUpdate: () => {
        if (isHovering || marqueeTween.paused()) return;
        const v = Math.abs(ScrollSmoother.get()?.getVelocity() ?? 0);
        rampTimeScale(
          v > 50 ? Math.min(4, 1 + v / 800) : 1,
          v > 50 ? 0.4 : 1.5,
          v > 50 ? 'power1.out' : 'power2.out'
        );
      },
    });
    const restorePlayback = () => {
      visibilityTrigger.refresh();
      updateSceneVisibility(visibilityTrigger);
    };
    document.addEventListener('visibilitychange', syncPlayback);
    motionPreference.addEventListener('change', syncPlayback);
    window.addEventListener('pagehide', suspendMarquee);
    window.addEventListener('pageshow', restorePlayback);
    updateSceneVisibility(visibilityTrigger);

    cleanupPlayback = () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      motionPreference.removeEventListener('change', syncPlayback);
      window.removeEventListener('pagehide', suspendMarquee);
      window.removeEventListener('pageshow', restorePlayback);
      marqueeEl?.removeEventListener('mouseenter', handleMouseEnter);
      marqueeEl?.removeEventListener('mouseleave', handleMouseLeave);
      suspendMarquee();
      clones.forEach((item) => item.remove());
    };
  }, scope);

  return () => {
    cleanupPlayback();
    ctx.revert();
  };
}
