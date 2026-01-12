/**
 * CinematicZoom - Continuous Z-Axis Scroll Experience
 *
 * Creates a single pinned container with all content layers stacked in z-space.
 * Scroll drives camera movement through the z-axis (translateZ on layers).
 * No individual pins = no vertical scroll sensation between sections.
 */
class CinematicZoom {
  constructor(config = {}) {
    this.container = document.getElementById('z-zoom-container');
    this.perspective = document.querySelector('.z-zoom-perspective');
    this.layersWrapper = document.querySelector('.z-zoom-layers');
    this.layers = document.querySelectorAll('.z-layer');

    // Mobile detection
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Configuration with mobile optimizations
    // HIGH scrub values = buttery smooth like film dolly zoom
    this.config = {
      zDepthPerLayer: this.isMobile ? 800 : 1000,  // Reduced for subtler z-movement
      blurMax: this.isMobile ? 12 : 18,
      scrollDistance: '800%',   // Lots of scroll room for gentle pacing
      scrubAmount: 4,           // Very high = ultra smooth (was 1.2)
      ...config
    };

    // State
    this.currentLayerIndex = 0;
    this.masterTimeline = null;
    this.scrollTrigger = null;
    
    // Parallax rack-focus config
    // Foreground stays locked to camera, background moves. Rack focus to BG.
    this.parallaxConfig = {
      bgBlurStart: 6,          // Background starts blurred
      bgBlurEnd: 0,            // Background comes into focus
      fgBlurStart: 0,          // Foreground starts sharp
      fgBlurEnd: 5,            // Foreground blurs as focus racks to BG
      bgYStart: 80,            // Background starts lower
      bgYEnd: -100,            // Background moves up significantly (parallax)
      fgYStart: 0,             // Foreground stays locked
      fgYEnd: -15,             // Foreground minimal movement (locked to camera)
      bgScaleStart: 1.08,      // Background slightly zoomed
      bgScaleEnd: 1.18,        // Background zooms as it moves
      fgScaleStart: 1,         // Foreground normal
      fgScaleEnd: 1.12         // Foreground scales UP (out of focus = larger)
    };

    // Accessibility
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.prefersReducedMotion) {
      this.init();
    } else {
      this.initReducedMotion();
    }
  }

  init() {
    if (!this.container || !this.layers.length) {
      console.warn('CinematicZoom: Required elements not found');
      return;
    }

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('CinematicZoom: GSAP or ScrollTrigger not loaded');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    
    // Force GPU compositing on all layers to prevent flicker
    this.forceGPULayers();

    // 1. Position all layers in z-space
    this.positionLayers();

    // 2. Create master timeline
    this.createMasterTimeline();

    // 3. Set up scroll trigger (single pin)
    this.createScrollTrigger();

    // 4. Initialize first layer as visible
    this.initializeFirstLayer();
    
    // 5. Set up parallax layers
    this.initParallaxLayers();
  }

  /**
   * Force GPU layer creation to prevent black flash during compositing
   */
  forceGPULayers() {
    // Apply transform to force GPU layer creation before any animation
    this.layers.forEach(layer => {
      layer.style.transform = 'translate3d(0, 0, 0)';
      layer.style.webkitTransform = 'translate3d(0, 0, 0)';
      
      const media = layer.querySelector('.z-layer-media');
      if (media) {
        media.style.transform = 'translate3d(0, 0, 0)';
        media.style.webkitTransform = 'translate3d(0, 0, 0)';
      }
      
      // Also force layer for images/video
      const imgs = layer.querySelectorAll('img, video');
      imgs.forEach(img => {
        img.style.transform = 'translate3d(0, 0, 0)';
        img.style.webkitTransform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /**
   * Position each layer at its starting state
   *
   * CINEMATIC APPROACH: NO z-positioning (perspective makes things tiny).
   * Instead, use blur + opacity + subtle scale as depth cues.
   * All layers stack at z=0, visibility controlled by opacity/blur.
   */
  positionLayers() {
    this.layers.forEach((layer, index) => {
      // ALL layers at z=0 - no perspective shrinking!
      gsap.set(layer, {
        z: 0,
        transformOrigin: 'center center'
      });

      // Initially hide layers behind first
      // Depth is conveyed through blur and opacity, not z-position
      // CROSSFADE: Start at very low opacity (not zero) for seamless transitions
      if (index > 0) {
        // Layer starts nearly invisible but not fully
        gsap.set(layer, {
          opacity: 0.05,  // Tiny bit visible for crossfade effect
          scale: 0.98     // Very subtle - blur is the real depth cue
        });

        // Media element gets heavy blur for depth perception
        // Skip blur for parallax layers - they handle their own blur
        const isParallax = layer.dataset.parallax === 'true';
        const layerMedia = layer.querySelector('.z-layer-media');
        if (layerMedia && !isParallax) {
          gsap.set(layerMedia, {
            filter: `blur(${this.config.blurMax * 1.2}px)`
          });
        }

        // Overlay starts hidden (will fade in sharp later)
        const overlay = layer.querySelector('.z-layer-overlay');
        if (overlay) {
          gsap.set(overlay, { opacity: 0 });
        }
      }
    });
  }

  /**
   * Initialize parallax rack-focus layers
   */
  initParallaxLayers() {
    const parallaxContainers = document.querySelectorAll('.parallax-container');
    const p = this.parallaxConfig;
    
    parallaxContainers.forEach(container => {
      const bg = container.querySelector('.parallax-bg');
      const fg = container.querySelector('.parallax-fg');
      const text = container.querySelector('.parallax-text');
      const bgFade = container.querySelector('.parallax-bg-fade');
      const fgFade = container.querySelector('.parallax-fg-fade');
      
      if (bg && fg) {
        // Set initial state: FG sharp, BG blurred (reversed rack focus)
        gsap.set(bg, {
          filter: `blur(${p.bgBlurStart}px)`,
          scale: p.bgScaleStart,
          y: p.bgYStart,
          opacity: 1
        });
        
        gsap.set(fg, {
          filter: `blur(${p.fgBlurStart}px)`,
          scale: p.fgScaleStart,
          y: p.fgYStart,
          opacity: 1
        });
      }
      
      // Text starts blurred
      if (text) {
        gsap.set(text, {
          filter: 'blur(3px)',
          y: 40,
          opacity: 1
        });
      }
      
      // Fade overlays start invisible
      if (bgFade) gsap.set(bgFade, { opacity: 0 });
      if (fgFade) gsap.set(fgFade, { opacity: 0 });
    });
  }

  /**
   * Initialize the first layer as visible
   */
  initializeFirstLayer() {
    const firstLayer = this.layers[0];
    if (!firstLayer) return;

    gsap.set(firstLayer, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    });

    const heroOverlay = firstLayer.querySelector('.z-layer-overlay');
    if (heroOverlay) {
      gsap.set(heroOverlay, { opacity: 1 });
    }

    firstLayer.classList.add('z-active');
  }

  /**
   * Create the master timeline that controls entire z-journey
   *
   * FEATURED WORK SEQUENCE:
   * 1. Image arrives at z=0, clear, full screen (no overlay)
   * 2. Brief hold to view image
   * 3. Image starts to blur/darken
   * 4. AS image blurs, overlay (logo, title, quotes) fades IN
   * 5. Hold for reading
   * 6. Overlay fades out
   * 7. Image zooms past to next layer
   */
  createMasterTimeline() {
    const tl = gsap.timeline({ paused: true });
    const totalLayers = this.layers.length;
    const segmentDuration = 1 / totalLayers;
    const zDepth = this.config.zDepthPerLayer;
    const blurMax = this.config.blurMax;

    this.layers.forEach((layer, index) => {
      const overlay = layer.querySelector('.z-layer-overlay');
      const media = layer.querySelector('.z-layer-media');
      const gradient = layer.querySelector('.z-layer-gradient');
      const layerType = layer.dataset.layer;
      const isFeatured = layerType && layerType.startsWith('featured-');
      const isAbout = layerType === 'about';
      const isHero = index === 0;
      const isLast = index === totalLayers - 1;

      // Calculate timing for this layer
      const layerStart = index * segmentDuration;

      // Add label for this layer
      tl.addLabel(`layer-${index}`, layerStart);

      if (isHero) {
        // === HERO LAYER ===
        // Already visible with overlay
        // CROSSFADE: Never go full black - keep some image visible

        // Hold hero visible
        tl.to({}, { duration: segmentDuration * 0.4 }, layerStart);

        // Fade out hero overlay gently
        tl.to(overlay, {
          opacity: 0,
          duration: segmentDuration * 0.2,
          ease: 'none'
        }, '>');

        // Hero fades but stays slightly visible (crossfade effect)
        tl.to(layer, {
          scale: 1.06,
          opacity: 0.12,  // Never fully transparent
          duration: segmentDuration * 0.4,
          ease: 'none'
        }, '<');

        // Blur only the media element
        if (media) {
          tl.to(media, {
            filter: `blur(${blurMax}px)`,
            duration: segmentDuration * 0.35,
            ease: 'none'
          }, '<');
        }

        if (gradient) {
          tl.to(gradient, {
            background: 'rgba(0, 0, 0, 0.8)',  // Not full black
            duration: segmentDuration * 0.35,
            ease: 'none'
          }, '<');
        }

      } else if (isAbout) {
        // === ABOUT LAYER ===
        // Text content - overlay appears with the layer
        // CROSSFADE: Start earlier, never go full black

        // Layer fades in smoothly - start slightly earlier for overlap
        tl.to(layer, {
          opacity: 1,
          scale: 1,
          duration: segmentDuration * 0.25,
          ease: 'none'
        }, `layer-${index}-=${segmentDuration * 0.08}`);  // Start before segment

        // Clear any media blur
        if (media) {
          tl.to(media, {
            filter: 'blur(0px)',
            duration: segmentDuration * 0.2,
            ease: 'none'
          }, '<');
        }

        // About overlay fades in with content
        if (overlay) {
          tl.to(overlay, {
            opacity: 1,
            duration: segmentDuration * 0.2,
            ease: 'none'
          }, `<+=${segmentDuration * 0.05}`);
        }

        // Hold for reading
        tl.to({}, { duration: segmentDuration * 0.25 }, '>');

        // Fade out about overlay
        if (overlay) {
          tl.to(overlay, {
            opacity: 0,
            duration: segmentDuration * 0.15,
            ease: 'none'
          }, '>');
        }

        // About fades but stays slightly visible
        tl.to(layer, {
          scale: 1.04,
          opacity: 0.1,  // Never fully transparent
          duration: segmentDuration * 0.25,
          ease: 'none'
        }, '<');

        // Blur media as it passes (if any)
        if (media) {
          tl.to(media, {
            filter: `blur(${blurMax}px)`,
            duration: segmentDuration * 0.2,
            ease: 'none'
          }, '<');
        }

      } else if (isFeatured) {
        // === FEATURED WORK LAYERS ===
        const hasParallax = layer.dataset.parallax === 'true';
        const p = this.parallaxConfig;
        
        // Get parallax elements if present
        const parallaxBg = media?.querySelector('.parallax-bg');
        const parallaxFg = media?.querySelector('.parallax-fg');
        const parallaxText = media?.querySelector('.parallax-text');
        const bgFade = media?.querySelector('.parallax-bg-fade');
        const fgFade = media?.querySelector('.parallax-fg-fade');

        // Phase 1: Layer fades in
        tl.to(layer, {
          opacity: 1,
          scale: 1,
          duration: segmentDuration * 0.18,
          ease: 'none'
        }, `layer-${index}-=${segmentDuration * 0.06}`);

        if (hasParallax && parallaxBg && parallaxFg) {
          // === PARALLAX RACK-FOCUS ANIMATION ===
          
          // Initial state: FG sharp, BG blurred
          tl.to(parallaxBg, {
            filter: `blur(${p.bgBlurStart}px)`,
            scale: p.bgScaleStart,
            y: p.bgYStart,
            duration: segmentDuration * 0.15,
            ease: 'none'
          }, '<');
          tl.to(parallaxFg, {
            filter: `blur(${p.fgBlurStart}px)`,
            scale: p.fgScaleStart,
            y: p.fgYStart,
            duration: segmentDuration * 0.15,
            ease: 'none'
          }, '<');
          
          // Text starts blurred
          if (parallaxText) {
            tl.set(parallaxText, {
              filter: 'blur(3px)',
              y: 40
            }, `layer-${index}`);
          }

          // Phase 2: Rack focus - BG sharpens, FG blurs, parallax movement
          const rackFocusStart = `layer-${index}+=${segmentDuration * 0.15}`;
          
          // Background: sharpens and moves up
          tl.to(parallaxBg, {
            filter: `blur(${p.bgBlurEnd}px)`,
            scale: p.bgScaleEnd,
            y: p.bgYEnd,
            duration: segmentDuration * 0.35,
            ease: 'power1.inOut'
          }, rackFocusStart);
          
          // Foreground: blurs and scales up (out of focus effect), minimal Y movement
          tl.to(parallaxFg, {
            filter: `blur(${p.fgBlurEnd}px)`,
            scale: p.fgScaleEnd,
            y: p.fgYEnd,
            duration: segmentDuration * 0.35,
            ease: 'power1.inOut'
          }, rackFocusStart);
          
          // Text: sharpens quickly, stays sharp, parallax movement
          if (parallaxText) {
            // Sharpen early
            tl.to(parallaxText, {
              filter: 'blur(0px)',
              duration: segmentDuration * 0.15,
              ease: 'power2.out'
            }, rackFocusStart);
            // Y movement throughout
            tl.to(parallaxText, {
              y: -60,
              duration: segmentDuration * 0.6,
              ease: 'none'
            }, rackFocusStart);
          }

          // Phase 3: Fade to black (around 55% of segment)
          const fadeStart = `layer-${index}+=${segmentDuration * 0.55}`;
          
          // BG fade gradient appears
          if (bgFade) {
            tl.to(bgFade, {
              opacity: 1,
              duration: segmentDuration * 0.2,
              ease: 'power1.in'
            }, fadeStart);
          }
          
          // BG image fades aggressively
          tl.to(parallaxBg, {
            opacity: 0.15,
            duration: segmentDuration * 0.15,
            ease: 'power1.in'
          }, fadeStart);
          
          // Continue to near black
          tl.to(parallaxBg, {
            opacity: 0.03,
            filter: 'blur(12px)',
            duration: segmentDuration * 0.2,
            ease: 'power1.in'
          }, `${fadeStart}+=${segmentDuration * 0.15}`);
          
          // FG fade gradient appears slightly after
          if (fgFade) {
            tl.to(fgFade, {
              opacity: 1,
              duration: segmentDuration * 0.18,
              ease: 'power1.in'
            }, `${fadeStart}+=${segmentDuration * 0.05}`);
          }
          
          // FG image fades
          tl.to(parallaxFg, {
            opacity: 0.25,
            duration: segmentDuration * 0.15,
            ease: 'power1.in'
          }, `${fadeStart}+=${segmentDuration * 0.1}`);
          
          // Continue to near black
          tl.to(parallaxFg, {
            opacity: 0.05,
            filter: 'blur(10px)',
            duration: segmentDuration * 0.15,
            ease: 'power1.in'
          }, `${fadeStart}+=${segmentDuration * 0.25}`);
          
          // Text stays readable, only slight fade at very end
          if (parallaxText) {
            tl.to(parallaxText, {
              opacity: 0.85,
              duration: segmentDuration * 0.1,
              ease: 'none'
            }, `layer-${index}+=${segmentDuration * 0.85}`);
          }

        } else {
          // === NON-PARALLAX FEATURED (original behavior) ===
          if (media) {
            tl.to(media, {
              filter: 'blur(0px)',
              duration: segmentDuration * 0.18,
              ease: 'none'
            }, '<');
          }

          // Hold to appreciate the clear image
          tl.to({}, { duration: segmentDuration * 0.1 }, '>');

          // Media blurs + darken
          const blurLabel = `blur-${index}`;
          tl.addLabel(blurLabel, `layer-${index}+=${segmentDuration * 0.28}`);

          if (media) {
            tl.to(media, {
              filter: `blur(${blurMax * 0.5}px)`,
              scale: 1.01,
              duration: segmentDuration * 0.15,
              ease: 'none'
            }, blurLabel);
          }

          if (gradient) {
            tl.to(gradient, {
              background: 'rgba(0, 0, 0, 0.65)',
              duration: segmentDuration * 0.15,
              ease: 'none'
            }, blurLabel);
          }

          // Overlay fades IN
          if (overlay) {
            tl.to(overlay, {
              opacity: 1,
              duration: segmentDuration * 0.12,
              ease: 'none'
            }, `${blurLabel}+=${segmentDuration * 0.05}`);
          }
        }

        // Hold for reading
        const holdLabel = `hold-${index}`;
        tl.addLabel(holdLabel, `layer-${index}+=${segmentDuration * 0.7}`);
        tl.to({}, { duration: segmentDuration * 0.15 }, holdLabel);

        if (!isLast) {
          // Phase 6: Overlay fades out
          const fadeOutLabel = `fadeout-${index}`;
          tl.addLabel(fadeOutLabel, `${holdLabel}+=${segmentDuration * 0.2}`);

          if (overlay) {
            tl.to(overlay, {
              opacity: 0,
              duration: segmentDuration * 0.1,
              ease: 'none'
            }, fadeOutLabel);
          }

          // Phase 7: Layer fades but stays visible (crossfade into next)
          tl.to(layer, {
            scale: 1.04,
            opacity: 0.15,  // Never fully transparent - next image shows through
            duration: segmentDuration * 0.16,
            ease: 'none'
          }, fadeOutLabel);

          // Media blurs more as it passes
          if (media) {
            tl.to(media, {
              filter: `blur(${blurMax * 0.8}px)`,  // Heavy but not max blur
              duration: segmentDuration * 0.14,
              ease: 'none'
            }, fadeOutLabel);
          }

          if (gradient) {
            tl.to(gradient, {
              background: 'rgba(0, 0, 0, 0.75)',  // Darken but not full black
              duration: segmentDuration * 0.12,
              ease: 'none'
            }, fadeOutLabel);
          }
        } else {
          // Last featured work - hold visible with overlay longer
          tl.to({}, { duration: segmentDuration * 0.3 }, `${holdLabel}+=${segmentDuration * 0.2}`);
        }
      }
    });

    this.masterTimeline = tl;
  }

  /**
   * Create single ScrollTrigger that pins container and scrubs timeline
   */
  createScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      start: 'top top',
      end: `+=${this.config.scrollDistance}`,
      pin: true,
      scrub: this.config.scrubAmount,
      anticipatePin: 1,
      animation: this.masterTimeline,
      onUpdate: (self) => {
        this.onScrollUpdate(self.progress);
      },
      onLeave: () => {
        this.onZoomComplete();
      },
      onEnterBack: () => {
        this.onZoomReenter();
      }
    });
  }

  /**
   * Called on each scroll update
   */
  onScrollUpdate(progress) {
    const layerIndex = Math.min(
      Math.floor(progress * this.layers.length),
      this.layers.length - 1
    );

    if (layerIndex !== this.currentLayerIndex) {
      this.updateLayerVisibility(layerIndex);
      this.currentLayerIndex = layerIndex;

      // Emit progress event
      this.emitProgress(layerIndex);
    }
  }

  /**
   * Update which layer is considered "active"
   */
  updateLayerVisibility(activeIndex) {
    this.layers.forEach((layer, i) => {
      if (i === activeIndex) {
        layer.classList.add('z-active');
      } else {
        layer.classList.remove('z-active');
      }
    });
  }

  /**
   * Called when z-zoom completes (entering gallery section)
   */
  onZoomComplete() {
    document.body.classList.add('z-zoom-complete');

    // Ensure last layer is fully visible
    const lastLayer = this.layers[this.layers.length - 1];
    const lastOverlay = lastLayer?.querySelector('.z-layer-overlay');
    if (lastOverlay) {
      gsap.set(lastOverlay, { opacity: 1 });
    }
  }

  /**
   * Called when scrolling back into z-zoom from gallery
   */
  onZoomReenter() {
    document.body.classList.remove('z-zoom-complete');
  }

  /**
   * Emit progress event for external tracking
   */
  emitProgress(layerIndex) {
    const layer = this.layers[layerIndex];
    const layerType = layer?.dataset.layer || 'unknown';

    // Determine section name
    let sectionName = 'Portfolio';
    if (layerType === 'hero') {
      sectionName = 'Latest';
    } else if (layerType === 'about') {
      sectionName = 'About';
    } else if (layerType.startsWith('featured-')) {
      sectionName = 'Featured Work';
    }

    // Get featured work index if applicable
    let featuredIndex = 0;
    let featuredTotal = 0;
    if (layerType.startsWith('featured-')) {
      featuredIndex = parseInt(layerType.replace('featured-', ''), 10);
      featuredTotal = document.querySelectorAll('.z-layer[data-layer^="featured-"]').length;
    }

    const event = new CustomEvent('cinematicZoomProgress', {
      detail: {
        current: layerIndex + 1,
        total: this.layers.length,
        layerType: layerType,
        sectionName: sectionName,
        featuredIndex: featuredIndex,
        featuredTotal: featuredTotal
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Reduced motion fallback - simple fades, no 3D
   */
  initReducedMotion() {
    if (!this.container || !this.layers.length) return;

    // Stack layers normally
    this.layers.forEach((layer, index) => {
      gsap.set(layer, {
        position: 'relative',
        height: '100vh',
        z: 0,
        transform: 'none'
      });

      const overlay = layer.querySelector('.z-layer-overlay');
      if (overlay) {
        gsap.set(overlay, { opacity: 1 });
      }
    });

    // Remove 3D perspective
    if (this.perspective) {
      gsap.set(this.perspective, { perspective: 'none' });
    }

    // Set container to auto height
    gsap.set(this.container, { height: 'auto' });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.masterTimeline) {
      this.masterTimeline.kill();
    }
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }
}

// Export globally
window.CinematicZoom = CinematicZoom;
