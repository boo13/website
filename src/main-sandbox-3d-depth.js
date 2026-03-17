/**
 * 3D Depth Displacement Sandbox
 *
 * Flat photo → depth-displaced mesh on scroll.
 * Uses source photo as color texture and a pre-generated depth map
 * for vertex displacement. Single draw call, ~300KB total payload.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Shaders ────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform sampler2D uDepthMap;
  uniform float uDepthScale;
  uniform float uTime;

  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vUv = uv;

    // Sample depth map — white = close, black = far
    float depth = texture2D(uDepthMap, uv).r;
    vDepth = depth;

    // Displace vertex along Z based on depth
    vec3 pos = position;
    pos.z += depth * uDepthScale;

    // Subtle breathing motion when displaced
    if (uDepthScale > 0.01) {
      float wave = sin(uTime * 0.8 + pos.x * 3.0 + pos.y * 2.0) * 0.015 * uDepthScale;
      pos.z += wave * depth;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uColorMap;
  uniform float uDepthScale;

  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vec4 color = texture2D(uColorMap, vUv);

    // Subtle depth-based edge darkening when displaced
    float edgeDarken = 1.0 - smoothstep(0.0, 0.3, uDepthScale) * (1.0 - vDepth) * 0.15;
    color.rgb *= edgeDarken;

    gl_FragColor = color;
  }
`;

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

// ─── Displaced Mesh ─────────────────────────────────────────

function createDisplacedMesh(scene, colorTex, depthTex, camera, segments = 256) {
  const imgAspect = colorTex.image.width / colorTex.image.height;

  // Size to fill ~70% of viewport at z=0
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

  // Subdivide proportionally
  const segW = segments;
  const segH = Math.round(segments / imgAspect);

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segW, segH);

  const uniforms = {
    uColorMap: { value: colorTex },
    uDepthMap: { value: depthTex },
    uDepthScale: { value: 0.0 },
    uTime: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return { mesh, uniforms, geometry, material };
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

  // Phase 1 (0–35%): Depth reveal
  tl.to(uniforms.uDepthScale, { value: 1.2, duration: 3.5, ease: 'power2.out' }, 0);

  // Phase 2 (30–65%): Camera orbit to reveal depth
  tl.to(
    cameraBasePos,
    { x: 1.8, y: 0.3, z: 3.2, duration: 3.5, ease: 'power1.inOut' },
    3,
  );

  // Phase 3 (60–80%): Peak displacement + orbit further
  tl.to(uniforms.uDepthScale, { value: 1.8, duration: 2, ease: 'power1.in' }, 6);
  tl.to(cameraBasePos, { x: -0.8, y: -0.2, z: 3.5, duration: 2, ease: 'power1.inOut' }, 6);

  // Phase 4 (80–100%): Return to flat
  tl.to(uniforms.uDepthScale, { value: 0, duration: 2, ease: 'power2.inOut' }, 8);
  tl.to(cameraBasePos, { x: 0, y: 0, z: 4, duration: 2, ease: 'power2.out' }, 8);

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
  const depthSlider = document.getElementById('depth-strength');
  const depthVal = document.getElementById('depth-val');
  depthSlider.addEventListener('input', () => {
    depthVal.textContent = parseFloat(depthSlider.value).toFixed(2);
  });

  // Detail slider — just show value, user reloads to apply
  const detailSlider = document.getElementById('mesh-detail');
  const detailVal = document.getElementById('detail-val');
  detailSlider.addEventListener('input', () => {
    detailVal.textContent = detailSlider.value;
  });
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const canvas = document.getElementById('canvas');
  const loader = document.getElementById('loader');
  const controlsEl = document.getElementById('controls');
  const statsEl = document.getElementById('stats');

  // Load both textures
  const textureLoader = new THREE.TextureLoader();
  const loadTex = (url) =>
    new Promise((resolve, reject) => {
      textureLoader.load(url, resolve, undefined, reject);
    });

  let colorTex, depthTex;
  try {
    [colorTex, depthTex] = await Promise.all([
      loadTex('/images/RandyHeroPic.JPG'),
      loadTex('/images/RandyHeroPic-depth.png'),
    ]);
  } catch (err) {
    console.error('Failed to load textures:', err);
    return;
  }

  colorTex.colorSpace = THREE.SRGBColorSpace;

  // Scene
  const { renderer, camera, scene } = initScene(canvas);
  const cameraBasePos = { x: 0, y: 0, z: 4 };

  // Displaced mesh
  const { uniforms } = createDisplacedMesh(scene, colorTex, depthTex, camera);

  // Mouse parallax
  const updateParallax = setupMouseParallax(camera, cameraBasePos);

  // Scroll animation
  setupScrollAnimation(uniforms, camera, cameraBasePos);

  // UI
  loader.classList.add('hidden');
  controlsEl.classList.add('visible');
  setupControls(uniforms);

  // Render loop
  let lastTime = performance.now();
  let elapsed = 0;

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += dt;

    uniforms.uTime.value = elapsed;
    updateParallax();
    renderer.render(scene, camera);

    statsEl.innerHTML = [
      `${Math.round(1 / Math.max(dt, 0.001))} fps`,
      `depth: ${uniforms.uDepthScale.value.toFixed(2)}`,
    ].join('<br>');
  }

  animate();
}

main();
