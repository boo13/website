/**
 * About Portrait Section
 * Scroll-driven particle portrait — photo dissolves into 3D particles.
 *
 * DOM layer: <img> + <p> tagline sit on top.
 * WebGL layer: Three.js particle system behind them.
 * A single ScrollTrigger scrub timeline drives both DOM and WebGL uniforms.
 *
 * Layout: Section is pinned by ScrollTrigger (not CSS sticky) for
 * compatibility with ScrollSmoother's transform-based scrolling.
 */

import * as THREE from 'three';
import { gsap } from '../animations/scroll-defaults.js';
import { SCRUB } from '../config.js';

// ─── Shaders ────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float uDepthScale;
  uniform float uScatter;
  uniform float uPointSize;
  uniform float uOpacity;
  uniform float uTime;

  attribute vec3 aColor;
  attribute float aDepth;
  attribute vec3 aScatterDir;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Depth: push particles along Z based on depth map
    pos.z += aDepth * uDepthScale;

    // Scatter: particles fly outward
    float scatter = uScatter;
    scatter = scatter * scatter * (3.0 - 2.0 * scatter); // smoothstep

    pos += aScatterDir * scatter * 5.0;

    // Drift during scatter
    if (uScatter > 0.01) {
      float drift = sin(uTime * 0.6 + pos.x * 2.5 + pos.y * 1.8) * 0.03 * scatter;
      pos += aScatterDir * drift;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size: base pixel size with perspective attenuation
    float refDist = 4.0;
    gl_PointSize = uPointSize * (refDist / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 0.5);

    vColor = aColor;
    vAlpha = uOpacity * (1.0 - scatter * 0.5);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circle
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, d) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ─── Image Sampler ──────────────────────────────────────────

/**
 * Sample color and depth images into typed arrays for the particle system.
 * Uses naturalWidth/naturalHeight for consistent full-resolution sampling.
 * Particle positions are aligned to the photo's viewport rect for seamless crossfade.
 * step=2 → every 2nd pixel → ~273K particles for a 1280×853 source.
 *
 * @param {HTMLImageElement} colorImg - Photo element
 * @param {HTMLImageElement} depthImg - Depth map image
 * @param {THREE.PerspectiveCamera} camera
 * @param {DOMRect} photoRect - Photo's bounding client rect
 */
function sampleImage(colorImg, depthImg, camera, photoRect) {
  const natW = colorImg.naturalWidth || colorImg.width;
  const natH = colorImg.naturalHeight || colorImg.height;

  // Read color and depth pixels at full natural resolution
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = natW;
  colorCanvas.height = natH;
  const colorCtx = colorCanvas.getContext('2d');
  colorCtx.drawImage(colorImg, 0, 0, natW, natH);
  const colorData = colorCtx.getImageData(0, 0, natW, natH).data;

  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = natW;
  depthCanvas.height = natH;
  const depthCtx = depthCanvas.getContext('2d');
  depthCtx.drawImage(depthImg, 0, 0, natW, natH);
  const depthData = depthCtx.getImageData(0, 0, natW, natH).data;

  // Grid resolution based on display dimensions (not natural) so particle
  // density matches the on-screen pixel density. Pixel lookups are mapped
  // back to natural resolution for color/depth accuracy.
  const displayW = photoRect.width;
  const displayH = photoRect.height;
  const step = 2;
  const cols = Math.ceil(displayW / step);
  const rows = Math.ceil(displayH / step);
  const count = cols * rows;
  const scaleX = natW / displayW;
  const scaleY = natH / displayH;

  // Convert photo's viewport rect to Three.js world coordinates.
  // Camera frustum at z=0 (particle plane):
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dist = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
  const visibleWidth = visibleHeight * camera.aspect;

  // Photo edges in NDC (-1 to 1):
  const ndcLeft = (photoRect.left / vw) * 2 - 1;
  const ndcRight = ((photoRect.left + photoRect.width) / vw) * 2 - 1;
  const ndcTop = -((photoRect.top / vh) * 2 - 1); // flip Y
  const ndcBottom = -(((photoRect.top + photoRect.height) / vh) * 2 - 1);

  // World coordinates:
  const worldLeft = (ndcLeft * visibleWidth) / 2;
  const worldRight = (ndcRight * visibleWidth) / 2;
  const worldTop = (ndcTop * visibleHeight) / 2;
  const worldBottom = (ndcBottom * visibleHeight) / 2;

  const planeWidth = worldRight - worldLeft;
  const planeHeight = worldTop - worldBottom;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const depths = new Float32Array(count);
  const scatterDirs = new Float32Array(count * 3);

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.min(Math.round(col * step * scaleX), natW - 1);
      const py = Math.min(Math.round(row * step * scaleY), natH - 1);
      const pi = (py * natW + px) * 4;

      // Map grid position to world coordinates matching photo rect
      const u = col / (cols - 1); // 0..1
      const v = row / (rows - 1); // 0..1
      positions[idx * 3] = worldLeft + u * planeWidth;
      positions[idx * 3 + 1] = worldTop - v * planeHeight; // top-to-bottom
      positions[idx * 3 + 2] = 0;

      colors[idx * 3] = colorData[pi] / 255;
      colors[idx * 3 + 1] = colorData[pi + 1] / 255;
      colors[idx * 3 + 2] = colorData[pi + 2] / 255;

      depths[idx] = depthData[pi] / 255;

      // Random scatter direction (spherical uniform)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 1.0;
      scatterDirs[idx * 3] = Math.sin(phi) * Math.cos(theta) * r;
      scatterDirs[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      scatterDirs[idx * 3 + 2] = Math.cos(phi) * r;

      idx++;
    }
  }

  // Ideal point size: fill grid cells exactly
  // Grid cell width in world units = planeWidth / cols
  // Screen pixels per unit = windowWidth / visibleWidth
  const cellWorld = planeWidth / cols;
  const pxPerUnit = vw / visibleWidth;
  const idealSize = cellWorld * pxPerUnit;

  return { positions, colors, depths, scatterDirs, count, idealSize };
}

// ─── Particle Cloud ─────────────────────────────────────────

function createParticleCloud(scene, data) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(data.positions, 3)
  );
  geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(data.depths, 1));
  geometry.setAttribute(
    'aScatterDir',
    new THREE.BufferAttribute(data.scatterDirs, 3)
  );

  const uniforms = {
    uDepthScale: { value: 0.0 },
    uScatter: { value: 0.0 },
    uPointSize: { value: 3.0 },
    uOpacity: { value: 0.0 }, // starts hidden behind the photo
    uTime: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return { points, uniforms, geometry, material };
}

// ─── 3D Text Plane ──────────────────────────────────────────

/**
 * Render text to a canvas and place it as a textured plane in the scene.
 * Because the plane lives in the same 3D space as the particles, it
 * responds naturally to camera drift, orbit, and mouse parallax.
 *
 * @param {THREE.Scene} scene
 * @param {string} text - The text to render
 * @param {THREE.Vector3} position - World position for the plane
 * @param {HTMLElement} fontSource - DOM element to read computed font from
 */
function createTextPlane(scene, text, position, fontSource) {
  const cvs = document.createElement('canvas');
  const c = cvs.getContext('2d');

  // High-res canvas for crisp text at any zoom
  const canvasW = 2048;
  const canvasH = 192;
  cvs.width = canvasW;
  cvs.height = canvasH;

  // Match the site's display font
  const style = fontSource
    ? window.getComputedStyle(fontSource)
    : null;
  const family = style ? style.fontFamily : 'Georgia, serif';

  c.clearRect(0, 0, canvasW, canvasH);
  c.fillStyle = '#f0ede6'; // --color-offwhite
  c.font = `italic 300 80px ${family}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, canvasW / 2, canvasH / 2);

  const texture = new THREE.CanvasTexture(cvs);
  texture.needsUpdate = true;

  // Size the plane in world units — roughly 2.4 units wide
  const aspect = canvasW / canvasH;
  const planeH = 0.22;
  const planeW = planeH * aspect;

  const geometry = new THREE.PlaneGeometry(planeW, planeH);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  scene.add(mesh);

  return { mesh, material, geometry, texture };
}

// ─── Init ───────────────────────────────────────────────────

export function initAboutPortrait() {
  const section = document.querySelector('.about-portrait');
  if (!section) return () => {};

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (prefersReducedMotion) return () => {};

  const canvas = section.querySelector('.about-portrait__canvas');
  const photoEl = section.querySelector('.about-portrait__photo');
  const taglineInner = section.querySelector('.about-portrait__tagline-inner');
  const midtextSource = section.querySelector('.about-portrait__midtext-inner');
  if (!canvas || !photoEl) return () => {};

  // Three.js resources to dispose on cleanup
  let renderer, scene, camera, cloud, animId;
  let isActive = false;

  const ctx = gsap.context(() => {
    // ── Three.js setup ──
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x08090c, 1); // matches --color-nearblack

    camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 4);
    scene = new THREE.Scene();

    // ── Load images ──
    const loadImg = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    // The photo should already be loaded (loading="eager"), but guard it
    const colorReady = photoEl.complete
      ? Promise.resolve(photoEl)
      : new Promise((r) =>
          photoEl.addEventListener('load', () => r(photoEl), { once: true })
        );

    Promise.all([colorReady, loadImg('/images/RandyHeroPic-depth.png')])
      .then(([colorImg, depthImg]) => {
        // ── Sample images into particle data ──
        // Photo position relative to its section (CSS-determined, scroll-
        // independent). When pinned, the section fills the viewport at (0,0),
        // so these offsets become the photo's viewport coordinates.
        const sectionRect = section.getBoundingClientRect();
        const rawPhotoRect = photoEl.getBoundingClientRect();
        const pinnedPhotoRect = {
          left: rawPhotoRect.left - sectionRect.left,
          top: rawPhotoRect.top - sectionRect.top,
          width: rawPhotoRect.width,
          height: rawPhotoRect.height,
        };
        const data = sampleImage(colorImg, depthImg, camera, pinnedPhotoRect);

        // ── Create particle cloud ──
        cloud = createParticleCloud(scene, data);
        cloud.uniforms.uPointSize.value = data.idealSize * 1.8;

        // ── 3D text in the scene ──
        // Position below the particle field center, pushed forward in Z
        // so it parallaxes differently from the particles.
        const textContent = midtextSource
          ? midtextSource.textContent
          : 'Every frame has a purpose';
        const textPlane = createTextPlane(
          scene,
          textContent,
          new THREE.Vector3(0, -1.1, 1.2),
          midtextSource
        );

        // ── Camera base position (animated by scroll) ──
        // Camera starts at origin looking straight ahead — matches the
        // NDC-to-world mapping used for particle positioning.
        const cameraBasePos = { x: 0, y: 0, z: 4 };

        // ── Mouse parallax ──
        const mouse = { x: 0, y: 0 };
        const mouseTarget = { x: 0, y: 0 };
        const onMouseMove = (e) => {
          mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        // ── Build scroll timeline ──
        // Pin with +=400% for a long, deliberate sequence.
        // 24 timeline units. Designed so the user barely sees the photo
        // before particles take over, then the 3D depth effect is savored
        // through a long hold phase with idle camera drift.
        //
        //  0–0.5   Tagline wipes out fast
        //  0.3–3   Quick crossfade into particles
        //  1.5–7   Depth ramps up
        //  5–9     Camera shifts to reveal 3D
        //  9–16    HOLD — savor the depth, idle drift does its thing
        //  16–19   Mid-text fades in, holds
        //  19–24   Text fades, scatter, particles fade out
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=400%',
            pin: true,
            scrub: SCRUB.smooth,
            onToggle: (self) => {
              isActive = self.isActive;
            },
          },
        });

        // Tagline wipes out fast
        if (taglineInner) {
          tl.to(
            taglineInner,
            { yPercent: 110, duration: 0.5, ease: 'power2.in' },
            0
          );
        }

        // Quick crossfade — particles build fast, photo fades right after
        tl.to(
          cloud.uniforms.uOpacity,
          { value: 1, duration: 2, ease: 'power2.out' },
          0.3
        );
        tl.to(
          photoEl,
          { opacity: 0, duration: 2, ease: 'power1.inOut' },
          0.8
        );

        // Depth displacement — dramatic push
        tl.to(
          cloud.uniforms.uDepthScale,
          { value: 2.5, duration: 5.5, ease: 'power2.out' },
          1.5
        );

        // Camera shifts to reveal 3D layering
        tl.to(
          cameraBasePos,
          { x: 1.2, y: 0.15, duration: 4, ease: 'power1.inOut' },
          5
        );

        // ── HOLD PHASE (9–16) ──
        // No new scroll-driven animations here. The idle camera drift
        // in the render loop sways gently, letting the user savor the
        // parallax depth effect. A slow subtle camera drift via scroll
        // adds slight movement even while scrolling through this zone.
        tl.to(
          cameraBasePos,
          { x: 0.8, y: -0.1, duration: 7, ease: 'sine.inOut' },
          9
        );

        // Mid-text fades in (3D plane in scene)
        tl.to(
          textPlane.material,
          { opacity: 1, duration: 2, ease: 'power2.out' },
          16
        );
        // Subtle rise: animate mesh Y position
        tl.fromTo(
          textPlane.mesh.position,
          { y: -1.3 },
          { y: -1.1, duration: 2, ease: 'power2.out' },
          16
        );

        // Text fades out, scatter, particles fade
        tl.to(
          textPlane.material,
          { opacity: 0, duration: 1.5, ease: 'power1.in' },
          19
        );
        tl.to(
          cloud.uniforms.uScatter,
          { value: 1, duration: 4, ease: 'power2.in' },
          19.5
        );
        tl.to(
          cloud.uniforms.uOpacity,
          { value: 0, duration: 3, ease: 'power1.in' },
          21
        );

        // ── Render loop ──
        let lastTime = performance.now();
        let elapsed = 0;

        function animate() {
          animId = requestAnimationFrame(animate);

          if (!isActive) return; // skip rendering when off-screen

          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          lastTime = now;
          elapsed += dt;

          cloud.uniforms.uTime.value = elapsed;

          // Mouse parallax (smooth lerp)
          mouseTarget.x += (mouse.x - mouseTarget.x) * 0.05;
          mouseTarget.y += (mouse.y - mouseTarget.y) * 0.05;

          // Idle drift — gentle sway that reveals depth when not scrolling.
          // Scales with current depth so it's invisible when flat.
          const depthAmt = cloud.uniforms.uDepthScale.value / 2.5;
          const driftX = Math.sin(elapsed * 0.3) * 0.2 * depthAmt;
          const driftY = Math.cos(elapsed * 0.2) * 0.1 * depthAmt;

          camera.position.x =
            cameraBasePos.x + mouseTarget.x * 0.15 + driftX;
          camera.position.y =
            cameraBasePos.y - mouseTarget.y * 0.1 + driftY;
          camera.position.z = cameraBasePos.z;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        }
        animate();

        // ── Resize handler ──
        const onResize = () => {
          renderer.setSize(canvas.clientWidth, canvas.clientHeight);
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        // Store cleanup refs for the outer return function
        ctx._threeCleanup = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('resize', onResize);
          if (animId) cancelAnimationFrame(animId);
          cloud.geometry.dispose();
          cloud.material.dispose();
          textPlane.geometry.dispose();
          textPlane.material.dispose();
          textPlane.texture.dispose();
          renderer.dispose();
        };
      })
      .catch((err) => {
        console.error('[about-portrait] Failed to load images:', err);
      });
  }, section);

  return () => {
    if (ctx._threeCleanup) ctx._threeCleanup();
    ctx.revert();
  };
}
