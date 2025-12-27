/**
 * FeaturedWorkZoom - Cinematic zoom transitions for featured work sections
 *
 * Creates a "flying through work" effect by chaining zoom-in/zoom-out transitions
 * across multiple fullscreen project sections. Based on the zoom pattern from index2.html.
 */
class FeaturedWorkZoom {
  constructor(config = {}) {
    this.sections = document.querySelectorAll('.featured-work');
    this.currentIndex = 0;
    this.timelines = [];

    // Mobile detection
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Configuration with mobile optimizations
    this.config = {
      scaleFrom: 1.0,
      scaleTo: this.isMobile ? 2.0 : 2.5,
      blurMax: this.isMobile ? 12 : 20,
      scrubAmount: 1.2,
      holdDuration: 0.6, // seconds for empty tween
      ...config
    };

    if (!this.prefersReducedMotion) {
      this.init();
    }
  }

  init() {
    if (!this.sections.length || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Initialize all sections except first to be invisible
    this.sections.forEach((section, index) => {
      if (index > 0) {
        const wrapper = section.querySelector('.featured-image-wrapper');
        const overlay = section.querySelector('.featured-overlay');
        gsap.set(wrapper, { opacity: 0, scale: 0.3 });
        gsap.set(overlay, { opacity: 0 });
      }
    });

    // Create timeline for each section
    this.sections.forEach((section, index) => {
      this.createSectionTimeline(section, index);
    });
  }

  createSectionTimeline(section, index) {
    const imageWrapper = section.querySelector('.featured-image-wrapper');
    const overlay = section.querySelector('.featured-overlay');
    const networkLogo = section.querySelector('.network-logo');
    const projectTitle = section.querySelector('.project-title');
    const quotes = section.querySelectorAll('.quote');
    const gradient = section.querySelector('.featured-gradient');
    const progressCurrent = section.querySelector('.progress-current');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=200%', // Longer scroll distance for smoother z-space effect
        scrub: 1.0, // Slightly less scrub for more responsive feel
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => this.onSectionEnter(index),
        onLeave: () => this.onSectionLeave(index),
      }
    });

    // Phase 1: Show image only (no overlay initially)
    tl.set(overlay, { opacity: 0 }, 0);
    tl.set([networkLogo, projectTitle, ...quotes], { opacity: 0 }, 0);

    // Phase 2: Hold to view image briefly
    tl.to({}, { duration: 0.4 }); // Shortened from holdDuration

    // Phase 3: Start zoom/blur - image scales and blurs
    const zoomStart = '>';
    tl.to(imageWrapper, {
      scale: this.config.scaleTo,
      filter: `blur(${this.config.blurMax}px)`,
      ease: 'power2.inOut',
      duration: 1.0
    }, zoomStart);

    // Darken gradient as image blurs
    tl.to(gradient, {
      background: 'rgba(0, 0, 0, 0.85)',
      ease: 'power2.in',
      duration: 0.5
    }, zoomStart);

    // Phase 4: IMMEDIATELY as blur starts, fade in overlay with title and quotes
    tl.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' },
      '<' // Start immediately with the blur
    );

    tl.fromTo(networkLogo,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.2)' },
      '<0.05'
    );

    tl.fromTo(projectTitle,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
      '<0.05'
    );

    // Stagger in quotes quickly
    quotes.forEach((quote, i) => {
      tl.fromTo(quote,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '<0.1' // Overlap more
      );
    });

    // Phase 5: Hold quotes visible
    tl.to({}, { duration: 0.4 });

    // Phase 6: Fade out quotes
    tl.to([overlay, networkLogo, projectTitle, ...quotes], {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in'
    }, '>');

    // Phase 7: Z-SPACE TRANSITION - Zoom INTO current image
    tl.to(imageWrapper, {
      scale: 4.0, // Zoom way in - like flying into the image
      filter: `blur(${this.config.blurMax * 1.5}px)`,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in'
    }, '<0.1');

    tl.to(gradient, {
      background: 'rgba(0, 0, 0, 1)',
      duration: 0.4,
      ease: 'power2.in'
    }, '<');

    // Phase 8: Next image emerges from the VOID (z-space)
    if (index < this.sections.length - 1) {
      const nextSection = this.sections[index + 1];
      const nextWrapper = nextSection.querySelector('.featured-image-wrapper');
      const nextGradient = nextSection.querySelector('.featured-gradient');

      // Set up next image to emerge from center point
      tl.set(nextWrapper, {
        scale: 0.3,
        filter: `blur(${this.config.blurMax}px)`,
        opacity: 0,
        transformOrigin: 'center center'
      });

      tl.set(nextGradient, {
        background: 'rgba(0, 0, 0, 1)'
      });

      // Emerge from z-space - scale up from tiny point
      tl.to(nextWrapper,
        {
          scale: 1.0,
          filter: 'blur(0px)',
          opacity: 1,
          duration: 1.0,
          ease: 'power2.out'
        },
        '>-0.4' // Overlap to create seamless tunnel effect
      );

      tl.to(nextGradient, {
        background: 'rgba(0, 0, 0, 0.4)',
        duration: 0.6,
        ease: 'power2.out'
      }, '<0.2');
    }

    this.timelines.push(tl);
    return tl;
  }

  onSectionEnter(index) {
    this.currentIndex = index;
    this.updateProgress(index);
  }

  onSectionLeave(index) {
    // Optional cleanup
  }

  updateProgress(index) {
    // Emit custom event for global progress tracking
    const progressEvent = new CustomEvent('featuredWorkProgress', {
      detail: {
        current: index + 1,
        total: this.sections.length
      }
    });
    document.dispatchEvent(progressEvent);
  }

  destroy() {
    this.timelines.forEach(tl => tl.kill());
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}

// Export to window for easy access
window.FeaturedWorkZoom = FeaturedWorkZoom;
