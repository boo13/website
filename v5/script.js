console.clear();

gsap.registerPlugin(Observer);

/**
 * CONFIGURATION
 */
const CONF = {
  zSpacing: 1000, // Distance between items (should match HTML/CSS logic if generated, but we read from DOM)
  scrollSpeed: 1.5, // Multiplier for wheel input
  dampening: 1, // Inertia (duration of tween)
  snap: false, // Whether to strict snap or just free float
  viewDepth: 2500, // How far back we can see (opacity fade out)
};

/**
 * STATE
 */
const state = {
  z: 0, // Current camera position
  targetZ: 0,
  maxZ: 0,
};

/**
 * SETUP
 */
const world = document.getElementById("world");
const layers = Array.from(document.querySelectorAll(".z-layer"));
const navDotsContainer = document.querySelector(".nav-dots");
const progressFill = document.querySelector(".progress-fill");

function init() {
  // 1. Position Initial Layers & Calculate MaxZ
  let minZ = 0;

  layers.forEach((layer, i) => {
    // Read Z from data attribute or calculate based on index
    const zVal = parseInt(layer.dataset.z || i * -CONF.zSpacing);
    layer.dataset.zPos = zVal; // Store for easy access

    // Set initial CSS transform
    // Note: We use xPercent/yPercent in CSS (-50%), so we only touch Z here via properties
    gsap.set(layer, { z: zVal });

    // Create Navigation Dot
    const dot = document.createElement("div");
    dot.classList.add("nav-dot");
    dot.dataset.target = -zVal; // We want to move World to +Z to counter the layer's -Z
    dot.title = layer.dataset.id;
    dot.addEventListener("click", () => navigateTo(-zVal));
    navDotsContainer.appendChild(dot);

    if (zVal < minZ) minZ = zVal;
  });

  // MaxZ is the positive value needed to bring the furthest item (lowest Z) to 0
  state.maxZ = Math.abs(minZ);

  // 2. Start Animation Loop
  gsap.ticker.add(render);

  // 3. Init Observer
  let snapTimer;
  let isSnapping = false; // FLAG: Are we currently animating the snap?

  const performSnap = () => {
     // Don't snap if we are already doing it
     if (isSnapping) return;

     // Find closest layer Z
     let bestZ = 0;
     let minDist = Infinity;
     
     layers.forEach(layer => {
         const z = Math.abs(parseInt(layer.dataset.zPos));
         const dist = Math.abs(state.targetZ - z);
         if(dist < minDist) {
             minDist = dist;
             bestZ = z;
         }
     });
     
     // Only snap if we are not already super close
     if (Math.abs(state.targetZ - bestZ) < 1) return;

     isSnapping = true; // Lock physics interactions
     
     // Animate targetZ to the snap position
     gsap.to(state, {
         targetZ: bestZ,
        duration: 1.5,
        ease: "power2.out",
         onUpdate: () => {
             // Force state.z to follow target immediately during snap to prevent fighting?
             // No, let the render loop handle smoothing, but ensure targetZ is fixed.
         },
         onComplete: () => {
             isSnapping = false; // Release lock
         }
     });
  };

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    onChange: (self) => {
      // 1. IF we were snapping, KILL IT immediately to give user control back
      if (isSnapping) {
          gsap.killTweensOf(state);
          isSnapping = false;
      }

      // 2. Clear pending snaps
      clearTimeout(snapTimer);
      
      // 3. Update physics
      const d = self.deltaY * CONF.scrollSpeed;
      state.targetZ += d;
      state.targetZ = gsap.utils.clamp(0, state.maxZ, state.targetZ);
      
      // 4. Queue new snap
      // Wait for user to actually STOP scrolling.
      // 200ms is a good "debounced" stop time.
      snapTimer = setTimeout(performSnap, 200);
    },
    tolerance: 10,
    preventDefault: true,
  });

  // Initial render
  updateDots();
}

/**
 * NAVIGATION
 */
function navigateTo(val) {
  state.targetZ = gsap.utils.clamp(0, state.maxZ, val);
}

/**
 * RENDER LOOP
 */
function render() {
  // Lerp current Z to target Z
  // Maps to: z += (target - z) * factor
  state.z += (state.targetZ - state.z) * 0.05; // 0.05 factor for smoothness

  // 1. Move the World
  // If layer is at -1000, we need world at +1000 to see it at 0.
  // So world moves positively.
  world.style.transform = `translate3d(0,0,${state.z}px)`;

  // 2. Update Layers (Opacity/Fog)
  layers.forEach((layer) => {
    const layerZ = parseInt(layer.dataset.zPos);
    // Distance from camera (0 point of world relative to layer)
    // The "absolute Z" of the layer in screen space is: layerZ + worldZ
    const absoluteZ = layerZ + state.z;

    // --- OPACITY & FADE LOGIC ---
    // The "absolute Z" tells us where the layer is relative to the camera (0).
    // range:
    // > 0     : Layer is behind camera (or passing through)
    // 0       : Layer is perfectly in focus
    // -1000   : Layer is approaching
    
    // 1. Layer Visibility (Optimization)
    let layerOpacity = 0;
    
    // Adjusted: Visible from -1200 (fade in start) to +500.
    // At -1500 (start pos), opacity will be 0.
    
    if (absoluteZ > 800) {
      layerOpacity = 0;
    } else if (absoluteZ < -1200) {
      layerOpacity = 0; // Hidden if further than -1200
    } else {
      // Fade in range: -1200 to -400
      // normalized: 0 at -1200, 1 at -400.
      layerOpacity = gsap.utils.normalize(-1200, -400, absoluteZ);
      
      // Face out as it hits camera
      if (absoluteZ > 100) {
        layerOpacity = 1 - gsap.utils.normalize(100, 800, absoluteZ);
      }
    }
    
    layer.style.opacity = layerOpacity;
    layer.style.visibility = layerOpacity <= 0.01 ? "hidden" : "visible";

    // 2. Sub-Element Animations (The "Cinematic" Polish)
    // We want text to fade OUT before the image passes the camera.
    // We want text to fade IN only when the image is relatively close.
    
    // 2. Sub-Element Animations
    // Split logic: .caption-panel (Zoom Past) vs others (Standard Fade)
    
    // A. Standard Overlays (Hero, About)
    const stdOverlay = layer.querySelector('.hero-overlay, .about-text-panel, .about-overlay');
    if (stdOverlay) {
        let op = 1;
        // Fade in approaching
        if (absoluteZ < -800) op = 0;
        else if (absoluteZ < -400) op = gsap.utils.normalize(-800, -400, absoluteZ);
        
        // Fade out passing
        if (absoluteZ > 0) op = 1 - gsap.utils.normalize(0, 300, absoluteZ);
        
        stdOverlay.style.opacity = op;
    }

    // B. Zoom-Past Captions (FEATURED)
    // We moved them translateZ(600px).
    // When absoluteZ = -600, the text is AT the camera (0).
    // So we must fade out BEFORE -600.
    const caption = layer.querySelector('.caption-panel');
    if (caption) {
        let op = 1;
        
        // Fade in: -1800 to -1200 (Start MUCH earlier)
        if (absoluteZ < -1800) op = 0;
        else if (absoluteZ < -1200) op = gsap.utils.normalize(-1800, -1200, absoluteZ);
        
        // Fade out: -750 to -450
        // Text is at -600. So this fades out rapidly right as it passes.
        if (absoluteZ > -750) {
             op = 1 - gsap.utils.normalize(-750, -450, absoluteZ);
        }
        
        caption.style.opacity = op;
    }
  });

  // 3. Update UI
  updateProgress();
}

function updateProgress() {
  // Update Bar
  const p = state.z / state.maxZ; // 0 to 1
  progressFill.style.width = `${p * 100}%`;

  // Update Dots
  // Find closest layer
  // Closest is the one where abs(layerZ + state.z) is smallest
  let closestIdx = 0;
  let minDist = Infinity;

  layers.forEach((layer, i) => {
    const layerZ = parseInt(layer.dataset.zPos);
    const dist = Math.abs(layerZ + state.z);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  });

  updateDots(closestIdx);
}

function updateDots(activeIdx) {
  const dots = document.querySelectorAll(".nav-dot");
  dots.forEach((dot, i) => {
    if (i === activeIdx) dot.classList.add("active");
    else dot.classList.remove("active");
  });
}

// Start
init();
