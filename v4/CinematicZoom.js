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

    // 1. Position all layers in z-space
    this.positionLayers();

    // 2. Create master timeline
    this.createMasterTimeline();

    // 3. Set up scroll trigger (single pin)
    this.createScrollTrigger();

    // 4. Initialize first layer as visible
    this.initializeFirstLayer();
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
        const layerMedia = layer.querySelector('.z-layer-media');
        if (layerMedia) {
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
        // Sequence: image arrives clear → hold → MEDIA blurs (not overlay!) → overlay IN sharp → hold → out
        //
        // CROSSFADE: Start earlier, never go full black - always some image visible

        // Phase 1: Layer fades in - start slightly earlier for crossfade overlap
        tl.to(layer, {
          opacity: 1,
          scale: 1,
          duration: segmentDuration * 0.18,
          ease: 'none'
        }, `layer-${index}-=${segmentDuration * 0.06}`);  // Start before segment

        // Media clears from blur (rack focus effect)
        if (media) {
          tl.to(media, {
            filter: 'blur(0px)',
            duration: segmentDuration * 0.18,
            ease: 'none'
          }, '<');
        }

        // Phase 2: Hold to appreciate the clear image
        tl.to({}, { duration: segmentDuration * 0.1 }, '>');

        // Phase 3: MEDIA blurs (not the whole layer!) + darken
        const blurStartTime = `layer-${index}+=${segmentDuration * 0.28}`;
        const blurLabel = `blur-${index}`;
        tl.addLabel(blurLabel, blurStartTime);

        // Only blur the media element - overlay stays sharp!
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
            background: 'rgba(0, 0, 0, 0.65)',  // Not too dark
            duration: segmentDuration * 0.15,
            ease: 'none'
          }, blurLabel);
        }

        // Phase 4: Overlay fades IN - text is SHARP over blurred background
        if (overlay) {
          tl.to(overlay, {
            opacity: 1,
            duration: segmentDuration * 0.12,
            ease: 'none'
          }, `${blurLabel}+=${segmentDuration * 0.05}`);
        }

        // Phase 5: Hold for reading quotes (text stays sharp and readable)
        const holdLabel = `hold-${index}`;
        tl.addLabel(holdLabel, `${blurLabel}+=${segmentDuration * 0.2}`);
        tl.to({}, { duration: segmentDuration * 0.2 }, holdLabel);

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
