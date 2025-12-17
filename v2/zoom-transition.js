// Scroll-driven zoom transition from Latest to About
(() => {
  const initZoomTransition = () => {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scaleTarget = window.innerWidth < 768 ? 2.0 : 2.5;
    const blurTarget = window.innerWidth < 768 ? 12 : 20;

    const videoWrapper = document.querySelector('.latest-video-wrapper');
    const latestContent = document.querySelector('.latest-content');
    const aboutSection = document.querySelector('#about');
    const aboutContent = document.querySelector('#about .about-content');
    const scroller = window;
    const scrollerEl = document.body;
    const originalSnap = scrollerEl ? getComputedStyle(scrollerEl).scrollSnapType : '';

    const disableSnap = () => {
      if (scrollerEl) scrollerEl.style.scrollSnapType = 'none';
    };

    const restoreSnap = () => {
      if (scrollerEl) scrollerEl.style.scrollSnapType = originalSnap || '';
    };

    if (!videoWrapper || !aboutSection || !aboutContent) return;

    if (prefersReducedMotion) {
      gsap.to(videoWrapper, { opacity: 0, duration: 0.3 });
      gsap.fromTo('#about', { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.2 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#latest',
        start: 'top top',
        end: '+=150%',
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        scroller,
        onEnter: () => disableSnap(),
        onLeave: () => restoreSnap(),
        onEnterBack: () => disableSnap(),
        onLeaveBack: () => restoreSnap()
      }
    });

    tl.to(videoWrapper, {
      scale: scaleTarget,
      filter: `blur(${blurTarget}px)`,
      ease: 'power2.inOut',
      duration: 1
    }, 0);

    tl.to('.latest-gradient', {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      ease: 'power2.in',
      duration: 0.7
    }, 0.3);

    tl.to(latestContent, {
      opacity: 0,
      y: -30,
      ease: 'power2.in',
      duration: 0.5
    }, 0);

    tl.set('#about', { opacity: 0 }, 0);

    tl.fromTo('#about',
      {
        opacity: 0,
      },
      {
        opacity: 1,
        ease: 'power2.out',
        duration: 0.9
      },
      0.05
    );

    tl.fromTo(aboutContent,
      {
        opacity: 0,
        filter: 'blur(18px)',
        scale: 0.9
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        ease: 'power2.out',
        duration: 0.9
      },
      0.1
    );

    tl.to({}, { duration: 0.6 }); // hold

    tl.to(aboutContent, {
      opacity: 0,
      filter: 'blur(18px)',
      scale: 1.15,
      ease: 'power1.out',
      duration: 0.5
    }, '>-0.2');

    tl.to('#about', {
      opacity: 0,
      ease: 'power1.out',
      duration: 0.4
    }, '>-0.25');

    tl.to('.latest-gradient', {
      backgroundColor: 'rgba(0, 0, 0, 1)',
      duration: 0.5,
      ease: 'power2.out'
    }, '>-0.2');

    tl.to(videoWrapper, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '>-0.2');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZoomTransition);
  } else {
    initZoomTransition();
  }
})();
