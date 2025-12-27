/**
 * RANDY COUNSMAN - CINEMATIC NOIR ANIMATIONS
 * Subtle, elegant, understated GSAP animations
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  initHeroAnimations();
  initScrollRevealAnimations();
  initParallaxEffects();
  initNavigationBehavior();
  initSmoothScrolling();
  initVideoHandling();
});

/* ============================================
   HERO ANIMATIONS
   ============================================ */
function initHeroAnimations() {
  const tl = gsap.timeline({
    defaults: {
      duration: 1.4,
      ease: 'power3.out'
    }
  });

  // Elegant sequential reveal
  tl.to('.hero-title-line', {
    opacity: 1,
    y: 0,
    stagger: 0.3,
    duration: 1.6,
    ease: 'power4.out',
    delay: 0.5
  })
  .to('.hero-subtitle', {
    opacity: 1,
    y: 0,
    duration: 1.2
  }, '-=1')
  .to('.scroll-hint', {
    opacity: 1,
    duration: 1
  }, '-=0.6');

  // Subtle floating animation for scroll hint
  gsap.to('.scroll-hint', {
    y: 8,
    duration: 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: 2.5
  });

  // Video parallax on scroll
  gsap.to('.hero-video video', {
    scale: 1.15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5
    }
  });

  // Fade out hero content
  gsap.to('.hero-content', {
    opacity: 0,
    y: -40,
    ease: 'power2.in',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '80% top',
      scrub: 1
    }
  });

  // Hide scroll hint
  gsap.to('.scroll-hint', {
    opacity: 0,
    y: -20,
    ease: 'power2.in',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '40% top',
      scrub: 1
    }
  });
}

/* ============================================
   SCROLL REVEAL ANIMATIONS
   ============================================ */
function initScrollRevealAnimations() {
  // Section titles
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
      opacity: 0,
      y: 30,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: title,
        start: 'top 85%',
        once: true
      }
    });
  });

  // Work carousel initialization
  initWorkCarousel();

  // About section reveal
  gsap.from('.about-grid', {
    opacity: 0,
    y: 50,
    duration: 1.4,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about',
      start: 'top 70%',
      once: true
    }
  });

  // About image reveal
  gsap.to('.about-image img', {
    opacity: 1,
    scale: 1,
    duration: 1.6,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.about-image',
      start: 'top 75%',
      once: true
    }
  });

  // Networks list stagger
  gsap.from('.networks-list span', {
    opacity: 0,
    y: 15,
    stagger: 0.08,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.about-networks',
      start: 'top 85%',
      once: true
    }
  });

  // Newsletter section
  gsap.from('.newsletter-text', {
    opacity: 0,
    y: 40,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.newsletter',
      start: 'top 70%',
      once: true
    }
  });

  gsap.from('.newsletter-form', {
    opacity: 0,
    y: 30,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.newsletter',
      start: 'top 65%',
      once: true
    }
  });

  // Contact section
  gsap.from('.contact-content > *', {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 70%',
      once: true
    }
  });
}

/* ============================================
   PARALLAX EFFECTS
   ============================================ */
function initParallaxEffects() {
  // Project images enhanced parallax - different speeds for variety
  gsap.utils.toArray('.project-image img').forEach((img, index) => {
    const speed = index % 2 === 0 ? 15 : 10; // Alternate speeds
    gsap.to(img, {
      yPercent: speed,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('.project-card'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });
  });

  // About image parallax
  gsap.to('.about-image img', {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about-image',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5
    }
  });
}

/* ============================================
   NAVIGATION BEHAVIOR
   ============================================ */
function initNavigationBehavior() {
  const nav = document.querySelector('.nav');
  const heroHeight = document.querySelector('.hero').offsetHeight;
  let lastScrollY = 0;
  let ticking = false;

  const updateNav = () => {
    const scrollY = window.scrollY;

    // Show nav only after scrolling past 70% of hero
    if (scrollY > heroHeight * 0.7) {
      nav.classList.add('nav-visible');

      // Hide/show based on scroll direction
      if (scrollY > lastScrollY && scrollY > heroHeight) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
    } else {
      // Hide nav completely while in hero section
      nav.classList.remove('nav-visible');
      nav.classList.remove('nav-hidden');
    }

    lastScrollY = scrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateNav);
      ticking = true;
    }
  });
}

/* ============================================
   SMOOTH SCROLLING
   ============================================ */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        const navHeight = document.querySelector('.nav').offsetHeight;
        const targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ============================================
   VIDEO HANDLING
   ============================================ */
function initVideoHandling() {
  const video = document.querySelector('.hero-video video');

  if (video) {
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
}

/* ============================================
   WORK CAROUSEL
   ============================================ */
function initWorkCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const thumbnails = document.querySelectorAll('.thumbnail');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const progressBar = document.querySelector('.progress-bar');

  if (!slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Set first slide as active
  slides[0].classList.add('active');
  thumbnails[0].classList.add('active');
  updateProgress();

  // Update progress bar
  function updateProgress() {
    const progress = ((currentIndex + 1) / totalSlides) * 100;
    gsap.to(progressBar, {
      width: `${progress}%`,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  // Change slide function with GSAP
  function goToSlide(index) {
    if (index === currentIndex) return;

    const oldSlide = slides[currentIndex];
    const newSlide = slides[index];
    const oldThumb = thumbnails[currentIndex];
    const newThumb = thumbnails[index];

    // Animate out current slide
    gsap.to(oldSlide, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        oldSlide.classList.remove('active');
      }
    });

    // Animate in new slide
    gsap.fromTo(newSlide,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.2,
        onStart: () => {
          newSlide.classList.add('active');
        }
      }
    );

    // Animate slide info
    gsap.fromTo(newSlide.querySelector('.slide-info'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.5
      }
    );

    // Update thumbnails
    oldThumb.classList.remove('active');
    newThumb.classList.add('active');

    // Scroll thumbnail into view
    newThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

    currentIndex = index;
    updateProgress();
  }

  // Navigation functions
  function nextSlide() {
    const nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  }

  function prevSlide() {
    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    goToSlide(prevIndex);
  }

  // Event listeners
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => goToSlide(index));
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const carousel = document.querySelector('.work-carousel');
    if (!carousel) return;

    const carouselRect = carousel.getBoundingClientRect();
    const isInView = carouselRect.top < window.innerHeight && carouselRect.bottom > 0;

    if (isInView) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    }
  });

  // Initial animations on scroll
  gsap.from('.carousel-stage', {
    opacity: 0,
    y: 40,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.work-carousel',
      start: 'top 70%',
      once: true
    }
  });

  gsap.from('.carousel-thumbnails', {
    opacity: 0,
    y: 20,
    duration: 1,
    ease: 'power3.out',
    delay: 0.3,
    scrollTrigger: {
      trigger: '.work-carousel',
      start: 'top 70%',
      once: true
    }
  });
}

/* ============================================
   REFRESH SCROLLTRIGGER
   ============================================ */
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
