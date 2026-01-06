/**
 * V4 ANIMATIONS - Cinematic Zoom Orchestration
 *
 * Coordinates all scroll-driven animations:
 * - CinematicZoom: Unified z-axis zoom experience (Hero → About → Featured Work)
 * - Gallery scroll reveals
 * - Global progress tracking
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    // NEW: Single unified cinematic zoom controller
    initCinematicZoom();
    initCreditsListAnimations();
    initCursorPreview();
    initGlobalProgress();
  } else {
    // Simplified animations for reduced motion
    initReducedMotionMode();
  }

  // Always initialize these regardless of motion preference
  initVideoHandling();
  initSmoothScrolling();
  initResponsiveRefresh();
  initLazyLoading();
  initPerformanceOptimizations();

  // Initialize cursor preview regardless of reduced motion (it's a hover feature, not animation)
  if (prefersReducedMotion) {
    initCursorPreview();
  }
});

/* ============================================
   CINEMATIC ZOOM
   Unified z-axis zoom experience for Hero → About → Featured Work
   ============================================ */
function initCinematicZoom() {
  if (typeof CinematicZoom === 'undefined') {
    console.warn('CinematicZoom class not loaded');
    return;
  }

  // Initialize with smooth cinematic config
  // High scrub = buttery smooth like film dolly zoom
  const cinematicZoom = new CinematicZoom({
    zDepthPerLayer: 1000,    // Subtler z-movement
    scrollDistance: '800%',  // Lots of scroll room for gentle pacing
    blurMax: 18,
    scrubAmount: 4           // Ultra smooth scrolling
  });

  // Store reference globally for debugging
  window.cinematicZoom = cinematicZoom;
}

/* ============================================
   CREDITS LIST ANIMATIONS
   Scroll-triggered reveals for credits table
   ============================================ */
function initCreditsListAnimations() {
  const gallerySection = document.querySelector('#gallery');
  if (!gallerySection) return;

  // Gallery header reveal
  const header = gallerySection.querySelector('.gallery-header');
  if (header) {
    gsap.from(header, {
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 80%',
        once: true
      }
    });
  }

  // Credits table rows subtle entrance - don't hide, just animate subtly
  const rows = gallerySection.querySelectorAll('.credit-row');
  if (rows.length) {
    console.log('Found credit rows:', rows.length); // Debug log

    rows.forEach((row, index) => {
      gsap.fromTo(row,
        {
          opacity: 0.5,
          x: -15
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: index * 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.credits-table',
            start: 'top 90%',
            once: true
          }
        }
      );
    });
  } else {
    console.warn('No credit rows found!'); // Debug warning
  }
}

/* ============================================
   CURSOR PREVIEW
   Image preview that tracks mouse cursor
   ============================================ */
function initCursorPreview() {
  console.log('=== CURSOR PREVIEW INIT ===');

  const cursorPreview = document.querySelector('.cursor-preview');
  const previewImg = cursorPreview?.querySelector('img');
  const creditRows = document.querySelectorAll('.credit-row');

  console.log('Preview container:', cursorPreview);
  console.log('Preview img:', previewImg);
  console.log('Rows found:', creditRows.length);

  if (!cursorPreview || !previewImg) {
    console.error('❌ Missing cursor preview elements');
    return;
  }

  if (!creditRows.length) {
    console.error('❌ No credit rows found');
    return;
  }

  creditRows.forEach((row, index) => {
    const previewSrc = row.dataset.preview;
    console.log(`Row ${index}: ${previewSrc}`);

    row.addEventListener('mouseenter', function(e) {
      console.log('✅ MOUSEENTER on row', index);

      if (!previewSrc) {
        console.warn('No preview image for this row');
        return;
      }

      // Load image
      previewImg.src = previewSrc;
      previewImg.alt = row.querySelector('.credit-title')?.textContent || '';

      // Position at cursor
      const x = e.clientX + 30;
      const y = e.clientY + 30;

      cursorPreview.style.left = x + 'px';
      cursorPreview.style.top = y + 'px';

      // Show it
      cursorPreview.classList.add('active');
      cursorPreview.style.display = 'block';

      console.log(`Positioned at ${x}, ${y}`);
      console.log('Classes:', cursorPreview.classList);
      console.log('Computed opacity:', window.getComputedStyle(cursorPreview).opacity);
    });

    row.addEventListener('mousemove', function(e) {
      if (cursorPreview.classList.contains('active')) {
        const x = e.clientX + 30;
        const y = e.clientY + 30;
        cursorPreview.style.left = x + 'px';
        cursorPreview.style.top = y + 'px';
      }
    });

    row.addEventListener('mouseleave', function() {
      console.log('❌ MOUSELEAVE on row', index);
      cursorPreview.classList.remove('active');
      cursorPreview.style.display = 'none';
    });
  });

  console.log('✅ Cursor preview setup complete');
}

/* ============================================
   GLOBAL PROGRESS TRACKING
   Updates progress bar and label based on scroll
   ============================================ */
function initGlobalProgress() {
  const progressBar = document.querySelector('.progress-fill');
  const progressSection = document.querySelector('.progress-section');
  const progressFraction = document.querySelector('.progress-fraction');
  const globalProgress = document.querySelector('.global-progress');

  if (!progressBar) return;

  // Listen to cinematic zoom progress events
  document.addEventListener('cinematicZoomProgress', (e) => {
    const { sectionName, featuredIndex, featuredTotal, layerType } = e.detail;

    // Update section label
    if (progressSection) {
      progressSection.textContent = sectionName;
    }

    // Update fraction for featured work
    if (progressFraction) {
      if (layerType.startsWith('featured-') && featuredTotal > 0) {
        progressFraction.textContent = `${featuredIndex} / ${featuredTotal}`;
      } else {
        progressFraction.textContent = '';
      }
    }

    // Show progress bar
    if (globalProgress) {
      globalProgress.classList.add('visible');
    }
  });

  // Update progress bar on scroll
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      // Update progress bar width
      const progress = self.progress * 100;
      gsap.to(progressBar, {
        width: `${progress}%`,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  });

  // Handle sections after z-zoom (gallery, newsletter, contact)
  const postZoomSections = [
    { id: 'gallery', name: 'More Work' },
    { id: 'newsletter', name: 'Newsletter' },
    { id: 'contact', name: 'Contact' }
  ];

  postZoomSections.forEach(section => {
    const el = document.getElementById(section.id);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => {
        if (progressSection) progressSection.textContent = section.name;
        if (progressFraction) progressFraction.textContent = '';
      },
      onEnterBack: () => {
        if (progressSection) progressSection.textContent = section.name;
        if (progressFraction) progressFraction.textContent = '';
      }
    });
  });
}

/* ============================================
   VIDEO HANDLING
   Auto-play, loop, and intersection observer
   ============================================ */
function initVideoHandling() {
  // Updated selector for new z-layer structure
  const video = document.querySelector('.z-layer[data-layer="hero"] video') ||
                document.querySelector('.z-layer-media video');

  if (!video) return;

  const playVideo = () => {
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Video autoplay prevented:', error);
      });
    }
  };

  // Try to play on load
  playVideo();

  // Ensure smooth looping
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    playVideo();
  });

  // Pause video when out of view to save resources
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playVideo();
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videoObserver.observe(video);
}

/* ============================================
   SMOOTH SCROLLING
   For anchor links
   ============================================ */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ============================================
   RESPONSIVE REFRESH
   Refresh ScrollTrigger on resize
   ============================================ */
function initResponsiveRefresh() {
  let resizeTimer;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
  });

  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}

/* ============================================
   REDUCED MOTION MODE
   Simplified animations for accessibility
   ============================================ */
function initReducedMotionMode() {
  // Simple fade transitions instead of zoom/blur
  const sections = document.querySelectorAll('section');

  sections.forEach(section => {
    gsap.from(section, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true
      }
    });
  });

  // Simple progress tracking without animations
  const progressBar = document.querySelector('.progress-fill');
  if (progressBar) {
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressBar.style.width = `${self.progress * 100}%`;
      }
    });
  }
}

/* ============================================
   LAZY LOADING
   Load images only when they enter viewport
   ============================================ */
function initLazyLoading() {
  // Target images in z-layers and gallery sections
  const lazyImages = document.querySelectorAll('.z-layer img, .gallery-item img');

  if (!lazyImages.length || !('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // If data-src exists, use it; otherwise image is already loaded
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }

        // Add loaded class for any CSS transitions
        img.classList.add('lazy-loaded');

        // Stop observing this image
        observer.unobserve(img);
      }
    });
  }, {
    // Load images slightly before they enter viewport
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}

/* ============================================
   PERFORMANCE OPTIMIZATIONS
   will-change management and resource hints
   ============================================ */
function initPerformanceOptimizations() {
  // Clean up will-change after animations complete
  ScrollTrigger.addEventListener('scrollEnd', () => {
    // Remove will-change from elements not currently animating
    const animatingElements = document.querySelectorAll('[style*="will-change"]');

    animatingElements.forEach(el => {
      // Check if element has active GSAP animation
      const hasTween = gsap.getTweensOf(el).length > 0;

      if (!hasTween) {
        // Remove will-change after a short delay to ensure animation is done
        setTimeout(() => {
          if (gsap.getTweensOf(el).length === 0) {
            el.style.willChange = 'auto';
          }
        }, 100);
      }
    });
  });

  // Preload critical assets for first featured work layer
  const firstFeaturedImage = document.querySelector('.z-layer[data-layer="featured-1"] img');
  if (firstFeaturedImage && firstFeaturedImage.dataset.src) {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = firstFeaturedImage.dataset.src;
    document.head.appendChild(preloadLink);
  }

  // Optimize network logos (small, should load early)
  const networkLogos = document.querySelectorAll('.network-logo');
  networkLogos.forEach(logo => {
    if (logo.dataset.src && logo.closest('.z-layer[data-layer="featured-1"]')) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = logo.dataset.src;
      document.head.appendChild(preloadLink);
    }
  });

  // Connection-aware loading (reduce quality on slow connections)
  if ('connection' in navigator) {
    const connection = navigator.connection;

    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // Disable some animations on very slow connections
      document.documentElement.classList.add('slow-connection');

      // Reduce blur values in cinematic zoom
      if (window.cinematicZoom) {
        window.cinematicZoom.config.blurMax = Math.min(window.cinematicZoom.config.blurMax, 8);
      }
    }
  }

  // Memory cleanup on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause all GSAP animations when page is hidden
      gsap.globalTimeline.pause();

      // Pause videos
      const videos = document.querySelectorAll('video');
      videos.forEach(v => v.pause());
    } else {
      // Resume when page becomes visible
      gsap.globalTimeline.resume();

      // Resume hero video if in viewport
      const heroVideo = document.querySelector('.z-layer[data-layer="hero"] video');
      if (heroVideo) {
        const rect = heroVideo.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          heroVideo.play().catch(() => {});
        }
      }
    }
  });
}
