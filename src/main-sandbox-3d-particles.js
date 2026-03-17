/**
 * 3D Image-to-Particles Sandbox
 *
 * Samples pixels from the source photo into a particle system.
 * Uses a depth map for Z displacement. No PLY file needed.
 * Total payload: ~440KB (photo + depth map).
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Shaders ────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float uDepthScale;
  uniform float uSeparation;
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

    // Separation: particles spread apart from grid
    pos.x *= 1.0 + uSeparation * 0.3;
    pos.y *= 1.0 + uSeparation * 0.3;

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

    // Size: base pixel size with mild perspective attenuation
    float refDist = 4.0; // camera start distance
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

function sampleImage(colorImg, depthImg, camera, density = 1.0) {
  const w = colorImg.width;
  const h = colorImg.height;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const colorCtx = colorCanvas.getContext('2d');
  colorCtx.drawImage(colorImg, 0, 0);
  const colorData = colorCtx.getImageData(0, 0, w, h).data;

  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = w;
  depthCanvas.height = h;
  const depthCtx = depthCanvas.getContext('2d');
  depthCtx.drawImage(depthImg, 0, 0, w, h);
  const depthData = depthCtx.getImageData(0, 0, w, h).data;

  // Sampling step: density=1 → every 2px, density=2 → every 1px
  const step = Math.max(1, Math.round(2 / density));
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  const count = cols * rows;

  // Viewport-relative sizing — fit ~70% of visible area
  const imgAspect = w / h;
  const dist = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
  const visibleWidth = visibleHeight * camera.aspect;

  let planeWidth, planeHeight;
  if (visibleWidth / visibleHeight > imgAspect) {
    planeHeight = visibleHeight * 0.7;
    planeWidth = planeHeight * imgAspect;
  } else {
    planeWidth = visibleWidth * 0.7;
    planeHeight = planeWidth / imgAspect;
  }

  const halfW = planeWidth / 2;
  const halfH = planeHeight / 2;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const depths = new Float32Array(count);
  const scatterDirs = new Float32Array(count * 3);

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.min(col * step, w - 1);
      const py = Math.min(row * step, h - 1);
      const pi = (py * w + px) * 4;

      const x = (col / (cols - 1)) * 2 - 1;
      const y = (row / (rows - 1)) * 2 - 1;
      positions[idx * 3] = x * halfW;
      positions[idx * 3 + 1] = -y * halfH;
      positions[idx * 3 + 2] = 0;

      colors[idx * 3] = colorData[pi] / 255;
      colors[idx * 3 + 1] = colorData[pi + 1] / 255;
      colors[idx * 3 + 2] = colorData[pi + 2] / 255;

      depths[idx] = depthData[pi] / 255;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 1.0;
      scatterDirs[idx * 3] = Math.sin(phi) * Math.cos(theta) * r;
      scatterDirs[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      scatterDirs[idx * 3 + 2] = Math.cos(phi) * r;

      idx++;
    }
  }

  // Compute ideal point size: fill grid cells exactly
  // Grid cell width in world units = planeWidth / cols
  // Screen pixels per unit = windowWidth / visibleWidth
  const cellWorld = planeWidth / cols;
  const pxPerUnit = window.innerWidth / visibleWidth;
  const idealSize = cellWorld * pxPerUnit;

  console.log(
    `Sampled ${count} particles (${cols}x${rows}, step=${step}, idealPtSize=${idealSize.toFixed(1)}px)`,
  );
  return { positions, colors, depths, scatterDirs, count, cols, rows, idealSize };
}

// ─── Scene Setup ────────────────────────────────────────────

function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x08090c, 1);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 4);

  const scene = new THREE.Scene();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { renderer, camera, scene };
}

// ─── Particle Cloud ─────────────────────────────────────────

function createParticleCloud(scene, data) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(data.depths, 1));
  geometry.setAttribute('aScatterDir', new THREE.BufferAttribute(data.scatterDirs, 3));

  const uniforms = {
    uDepthScale: { value: 0.0 },
    uSeparation: { value: 0.0 },
    uScatter: { value: 0.0 },
    uPointSize: { value: 3.0 },
    uOpacity: { value: 1.0 },
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

// ─── Scroll Animation ───────────────────────────────────────

function setupScrollAnimation(uniforms, camera, cameraBasePos) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-proxy',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate(self) {
        if (self.progress > 0.02) {
          document.getElementById('scroll-hint')?.classList.add('hidden');
        }
      },
    },
  });

  // Phase 1 (0–15%): Particles separate slightly — reveals grid structure
  tl.to(uniforms.uSeparation, { value: 0.4, duration: 1.5, ease: 'power2.out' }, 0);

  // Phase 2 (10–35%): Depth reveal
  tl.to(uniforms.uDepthScale, { value: 1.5, duration: 2.5, ease: 'power2.out' }, 1);

  // Phase 3 (30–55%): Camera orbit to show depth
  tl.to(
    cameraBasePos,
    { x: 1.5, y: 0.2, z: 3.2, duration: 2.5, ease: 'power1.inOut' },
    3,
  );

  // Phase 4 (50–70%): Scatter
  tl.to(uniforms.uScatter, { value: 1, duration: 2, ease: 'power2.in' }, 5);
  tl.to(uniforms.uOpacity, { value: 0.3, duration: 2, ease: 'power1.in' }, 5.5);

  // Phase 5 (65–85%): Reform
  tl.to(uniforms.uScatter, { value: 0, duration: 2, ease: 'power3.out' }, 7);
  tl.to(uniforms.uOpacity, { value: 1, duration: 1.5, ease: 'power2.out' }, 7);
  tl.to(cameraBasePos, { x: -0.5, y: -0.1, z: 3.5, duration: 2, ease: 'power1.inOut' }, 7);

  // Phase 6 (80–100%): Return to flat
  tl.to(uniforms.uDepthScale, { value: 0, duration: 2, ease: 'power2.inOut' }, 9);
  tl.to(uniforms.uSeparation, { value: 0, duration: 2, ease: 'power2.inOut' }, 9);
  tl.to(cameraBasePos, { x: 0, y: 0, z: 4, duration: 2, ease: 'power2.out' }, 9);

  return tl;
}

// ─── Mouse Parallax ─────────────────────────────────────────

function setupMouseParallax(camera, cameraBasePos) {
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  return () => {
    target.x += (mouse.x - target.x) * 0.05;
    target.y += (mouse.y - target.y) * 0.05;
    camera.position.x = cameraBasePos.x + target.x * 0.15;
    camera.position.y = cameraBasePos.y - target.y * 0.1;
    camera.position.z = cameraBasePos.z;
    camera.lookAt(0, 0, 0);
  };
}

// ─── Controls ───────────────────────────────────────────────

function setupControls(uniforms) {
  const sizeSlider = document.getElementById('point-size');
  const sizeVal = document.getElementById('size-val');
  sizeSlider.addEventListener('input', () => {
    const v = parseFloat(sizeSlider.value);
    uniforms.uPointSize.value = v;
    sizeVal.textContent = v.toFixed(1);
  });

  const depthSlider = document.getElementById('depth-strength');
  const depthVal = document.getElementById('depth-val');
  depthSlider.addEventListener('input', () => {
    depthVal.textContent = parseFloat(depthSlider.value).toFixed(2);
  });

  const densitySlider = document.getElementById('density');
  const densityVal = document.getElementById('density-val');
  densitySlider.addEventListener('input', () => {
    densityVal.textContent = parseFloat(densitySlider.value).toFixed(2);
  });
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const canvas = document.getElementById('canvas');
  const loader = document.getElementById('loader');
  const controlsEl = document.getElementById('controls');
  const statsEl = document.getElementById('stats');

  // Load images (used for pixel sampling, not as textures)
  const loadImg = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  let colorImg, depthImg;
  try {
    [colorImg, depthImg] = await Promise.all([
      loadImg('/images/RandyHeroPic.JPG'),
      loadImg('/images/RandyHeroPic-depth.png'),
    ]);
  } catch (err) {
    console.error('Failed to load images:', err);
    return;
  }

  // Scene (need camera for viewport-relative sizing)
  const { renderer, camera, scene } = initScene(canvas);
  const cameraBasePos = { x: 0, y: 0, z: 4 };

  // Sample pixels into particle data
  const data = sampleImage(colorImg, depthImg, camera);

  // Particle cloud — use computed ideal size
  const cloud = createParticleCloud(scene, data);
  cloud.uniforms.uPointSize.value = data.idealSize;

  // Mouse parallax
  const updateParallax = setupMouseParallax(camera, cameraBasePos);

  // Scroll animation
  setupScrollAnimation(cloud.uniforms, camera, cameraBasePos);

  // UI
  loader.classList.add('hidden');
  controlsEl.classList.add('visible');
  setupControls(cloud.uniforms);

  // Sync slider to computed ideal size
  const sizeSlider = document.getElementById('point-size');
  sizeSlider.value = data.idealSize.toFixed(1);
  sizeSlider.max = Math.ceil(data.idealSize * 4);
  document.getElementById('size-val').textContent = data.idealSize.toFixed(1);

  // Render loop
  let lastTime = performance.now();
  let elapsed = 0;

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += dt;

    cloud.uniforms.uTime.value = elapsed;
    updateParallax();
    renderer.render(scene, camera);

    statsEl.innerHTML = [
      `${data.count.toLocaleString()} pts`,
      `${Math.round(1 / Math.max(dt, 0.001))} fps`,
      `depth: ${cloud.uniforms.uDepthScale.value.toFixed(2)}`,
      `scatter: ${cloud.uniforms.uScatter.value.toFixed(2)}`,
    ].join('<br>');
  }

  animate();
}

main();
