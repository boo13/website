/**
 * INDEX3 V2 - Archival Cinematic Animations
 * Film-inspired scroll effects and documentary-style transitions
 */

// Wait for DOM and GSAP to load
document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    initAnimations();
  } else {
    console.error("GSAP or ScrollTrigger not loaded");
  }
});

function initAnimations() {
  // ============================================
  // VIDEO PARALLAX EFFECT - Slower, more cinematic
  // ============================================
  const videoWrapper = document.querySelector(".video-wrapper");

  if (videoWrapper) {
    gsap.to(videoWrapper, {
      y: "25%",
      scale: 1.2,
      ease: "none",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "bottom top",
        scrub: 2,
      },
    });
  }

  // ============================================
  // FILM STRIP PARALLAX
  // ============================================
  const filmStrip = document.querySelector(".film-strip");

  if (filmStrip) {
    gsap.to(filmStrip, {
      y: 150,
      opacity: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "60% top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // HERO CONTENT FADE OUT ON SCROLL
  // ============================================
  const heroContent = document.querySelector(".hero-content");

  if (heroContent) {
    gsap.to(heroContent, {
      opacity: 0,
      y: -100,
      ease: "power2.in",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "60% top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // CINEMATIC FRAME PARALLAX
  // ============================================
  const cinematicFrame = document.querySelector(".cinematic-frame");

  if (cinematicFrame) {
    gsap.to(cinematicFrame, {
      opacity: 0,
      scale: 0.9,
      ease: "power1.out",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "50% top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // COLOR GRADE OVERLAY SHIFT
  // ============================================
  const colorGrade = document.querySelector(".color-grade");

  if (colorGrade) {
    gsap.to(colorGrade, {
      opacity: 0.3,
      ease: "none",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // ABOUT SECTION REVEAL
  // ============================================
  const aboutContainer = document.querySelector(".about-container");

  if (aboutContainer) {
    ScrollTrigger.create({
      trigger: "#about",
      start: "top 70%",
      onEnter: () => {
        aboutContainer.classList.add("visible");
      },
      once: true,
    });
  }

  // ============================================
  // STAGGERED CLIENTS ANIMATION
  // ============================================
  const clientsItems = document.querySelectorAll(".clients-grid li");

  if (clientsItems.length > 0) {
    gsap.from(clientsItems, {
      opacity: 0,
      y: 20,
      stagger: 0.08,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".clients-section",
        start: "top 80%",
        once: true,
      },
    });
  }

  // ============================================
  // SMOOTH PARALLAX FOR ABOUT COLUMNS
  // ============================================
  const aboutLabel = document.querySelector(".about-label");
  const aboutContent = document.querySelector(".about-content");

  if (aboutLabel && aboutContent) {
    gsap.from(aboutLabel, {
      x: -50,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#about",
        start: "top 60%",
        once: true,
      },
    });

    gsap.from(aboutContent, {
      x: 50,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#about",
        start: "top 60%",
        once: true,
      },
    });
  }

  // ============================================
  // VIDEO ZOOM TRANSITION (Latest -> About) - Enhanced
  // ============================================
  const videoContainer = document.querySelector(".video-container");
  const videoOverlay = document.querySelector(".video-overlay");

  if (videoContainer && videoOverlay) {
    // Create dramatic zoom and blur effect
    gsap.to(videoContainer, {
      scale: 1.6,
      filter: "blur(15px) brightness(0.5)",
      opacity: 0.2,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: "#about",
        start: "top bottom",
        end: "top 20%",
        scrub: 2,
      },
    });

    gsap.to(videoOverlay, {
      background:
        "radial-gradient(ellipse at center, transparent 0%, rgba(13, 13, 13, 0.98) 70%)",
      ease: "none",
      scrollTrigger: {
        trigger: "#about",
        start: "top bottom",
        end: "top 20%",
        scrub: 1.5,
      },
    });
  }

  // ============================================
  // DECORATIVE LINE REVEAL ON SCROLL
  // ============================================
  const decorativeLine = document.querySelector(".decorative-line");

  if (decorativeLine) {
    gsap.to(decorativeLine, {
      scaleX: 0,
      transformOrigin: "left center",
      ease: "power2.in",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "40% top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // SCROLL INDICATOR HIDE ON SCROLL
  // ============================================
  const scrollIndicator = document.querySelector(".scroll-indicator");

  if (scrollIndicator) {
    gsap.to(scrollIndicator, {
      opacity: 0,
      y: -20,
      ease: "power1.out",
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "20% top",
        scrub: 1,
      },
    });
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // ============================================
  // REFRESH SCROLLTRIGGER ON LOAD
  // ============================================
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });

  // Refresh on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
  });
}

// ============================================
// VIDEO AUTOPLAY FALLBACK
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector(".video-wrapper video");

  if (video) {
    // Attempt to play video
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Video autoplay prevented:", error);
        // Could show a play button overlay here if needed
      });
    }

    // Ensure video loops smoothly
    video.addEventListener("ended", () => {
      video.currentTime = 0;
      video.play();
    });
  }
});
