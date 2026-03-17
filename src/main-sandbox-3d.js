/**
 * 3D Portrait Sandbox — Photo → Particle Depth Reveal
 *
 * Starts with a crisp photo overlay, scroll dissolves into a
 * point cloud with depth separation, camera orbit, and particle scatter.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Shaders ────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  uniform float uDepthScale;
  uniform float uScatter;
  uniform float uPointSize;
  uniform float uOpacityScale;
  uniform float uTime;

  attribute vec3 aColor;
  attribute float aOpacity;
  attribute float aScale;
  attribute vec3 aScatter;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vec3 pos = position;

    // Depth reveal: Z starts at 0 (flat), expands to full depth
    pos.z *= uDepthScale;

    // Scatter: particles drift along their random vector
    float scatter = uScatter;
    scatter = scatter * scatter * (3.0 - 2.0 * scatter);
    pos += aScatter * scatter * 4.0;

    // Subtle float during scatter
    if (uScatter > 0.01) {
      float drift = sin(uTime * 0.5 + pos.x * 2.0 + pos.y * 3.0) * 0.02 * scatter;
      pos += aScatter * drift;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation with Gaussian scale
    float sizeScale = clamp(aScale * 50.0, 0.3, 3.0);
    gl_PointSize = uPointSize * sizeScale * (300.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 0.5);

    vColor = aColor;
    vOpacity = aOpacity * uOpacityScale * (1.0 - scatter * 0.6);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ─── PLY Parser ─────────────────────────────────────────────

async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);

  const contentLength = response.headers.get('content-length');
  if (!contentLength || !response.body) {
    const buffer = await response.arrayBuffer();
    onProgress?.(1);
    return buffer;
  }

  const total = parseInt(contentLength, 10);
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(received / total);
  }

  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

function parsePLY(buffer, { maxPoints = 600000, opacityThreshold = 0.5 } = {}) {
  const bytes = new Uint8Array(buffer);
  const endMarker = 'end_header\n';
  const decoder = new TextDecoder();
  const headerSearch = decoder.decode(bytes.subarray(0, 4096));
  const markerIdx = headerSearch.indexOf(endMarker);
  if (markerIdx === -1) throw new Error('Invalid PLY: no end_header found');
  const headerEnd = markerIdx + endMarker.length;

  const headerText = headerSearch.substring(0, markerIdx);
  const lines = headerText.split('\n');
  let vertexCount = 0;
  const properties = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'element' && parts[1] === 'vertex') {
      vertexCount = parseInt(parts[2], 10);
    } else if (parts[0] === 'property') {
      properties.push({ type: parts[1], name: parts[2] });
    }
  }

  const propIndex = {};
  properties.forEach((p, i) => (propIndex[p.name] = i));
  const stride = properties.length * 4;
  const data = new DataView(buffer, headerEnd);

  const xIdx = propIndex['x'];
  const yIdx = propIndex['y'];
  const zIdx = propIndex['z'];
  const dc0Idx = propIndex['f_dc_0'];
  const dc1Idx = propIndex['f_dc_1'];
  const dc2Idx = propIndex['f_dc_2'];
  const opIdx = propIndex['opacity'];
  const s0Idx = propIndex['scale_0'];
  const s1Idx = propIndex['scale_1'];

  const SH_C0 = 0.28209479177387814;
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  // First pass: count eligible + find bounds
  let eligible = 0;
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (let i = 0; i < vertexCount; i++) {
    const off = i * stride;
    const op = sigmoid(data.getFloat32(off + opIdx * 4, true));
    if (op >= opacityThreshold) {
      eligible++;
      const x = data.getFloat32(off + xIdx * 4, true);
      const y = data.getFloat32(off + yIdx * 4, true);
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
  }

  const step = Math.max(1, Math.ceil(eligible / maxPoints));
  const count = Math.ceil(eligible / step);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const scales = new Float32Array(count);

  let written = 0;
  let eligibleIdx = 0;

  for (let i = 0; i < vertexCount && written < count; i++) {
    const off = i * stride;
    const op = sigmoid(data.getFloat32(off + opIdx * 4, true));
    if (op < opacityThreshold) continue;

    if (eligibleIdx % step !== 0) {
      eligibleIdx++;
      continue;
    }
    eligibleIdx++;

    positions[written * 3] = data.getFloat32(off + xIdx * 4, true);
    positions[written * 3 + 1] = data.getFloat32(off + yIdx * 4, true);
    positions[written * 3 + 2] = data.getFloat32(off + zIdx * 4, true);

    const r = Math.max(
      0,
      Math.min(1, SH_C0 * data.getFloat32(off + dc0Idx * 4, true) + 0.5),
    );
    const g = Math.max(
      0,
      Math.min(1, SH_C0 * data.getFloat32(off + dc1Idx * 4, true) + 0.5),
    );
    const b = Math.max(
      0,
      Math.min(1, SH_C0 * data.getFloat32(off + dc2Idx * 4, true) + 0.5),
    );
    colors[written * 3] = r;
    colors[written * 3 + 1] = g;
    colors[written * 3 + 2] = b;

    opacities[written] = op;

    const s0 = Math.exp(data.getFloat32(off + s0Idx * 4, true));
    const s1 = Math.exp(data.getFloat32(off + s1Idx * 4, true));
    scales[written] = (s0 + s1) * 0.5;

    written++;
  }

  console.log(
    `PLY: ${eligible}/${vertexCount} eligible (${((eligible / vertexCount) * 100).toFixed(1)}%), kept ${written}`,
  );

  return {
    positions: positions.subarray(0, written * 3),
    colors: colors.subarray(0, written * 3),
    opacities: opacities.subarray(0, written),
    scales: scales.subarray(0, written),
    count: written,
    bounds: { xMin, xMax, yMin, yMax },
  };
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

// ─── Photo Plane ────────────────────────────────────────────

function createPhotoPlane(scene, texture, cloudExtent, camera) {
  // Size the plane to fill the camera's view at z=0
  // Calculate visible height at z=0 from camera at z=4
  const dist = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * dist;
  const visibleWidth = visibleHeight * camera.aspect;

  const aspect = texture.image.width / texture.image.height;
  // Fit the image to fill viewport width (or height, whichever is tighter)
  let planeWidth, planeHeight;
  if (visibleWidth / visibleHeight > aspect) {
    // Viewport is wider than image — fit to height
    planeHeight = visibleHeight * 0.7; // 70% of viewport height
    planeWidth = planeHeight * aspect;
  } else {
    // Viewport is taller than image — fit to width
    planeWidth = visibleWidth * 0.7;
    planeHeight = planeWidth / aspect;
  }

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Place slightly in front of the point cloud (which starts at z=0)
  mesh.position.z = 0.01;
  scene.add(mesh);

  return { mesh, material };
}

// ─── Point Cloud ────────────────────────────────────────────

function createPointCloud(scene, data) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(data.opacities, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(data.scales, 1));

  // Random scatter directions
  const scatter = new Float32Array(data.count * 3);
  for (let i = 0; i < data.count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.5 + Math.random() * 1.5;
    scatter[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    scatter[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    scatter[i * 3 + 2] = Math.cos(phi) * r;
  }
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));

  // Center
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  // Flip Y (image Y-down → Y-up) and Z (depth away → toward camera)
  geometry.scale(1, -1, -1);

  // Scale to fit view
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.5 / maxDim;
  geometry.scale(scale, scale, scale);

  // Get final extent for photo plane sizing
  geometry.computeBoundingBox();
  const finalSize = new THREE.Vector3();
  geometry.boundingBox.getSize(finalSize);

  const uniforms = {
    uDepthScale: { value: 0.0 },
    uScatter: { value: 0.0 },
    uPointSize: { value: 2.0 },
    uOpacityScale: { value: 0.0 }, // Start hidden — photo is visible first
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

  return { points, uniforms, geometry, extent: { x: finalSize.x, y: finalSize.y } };
}

// ─── Scroll Animation ───────────────────────────────────────

function setupScrollAnimation(cloudUniforms, photoMaterial, camera, cameraBasePos) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-proxy',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate(self) {
        if (self.progress > 0.02) {
          document.getElementById('scroll-hint')?.classList.add('hidden');
        }
      },
    },
  });

  // Phase 1 (0–15%): Photo fades out, particles fade in
  tl.to(photoMaterial, { opacity: 0, duration: 1.5, ease: 'power2.in' }, 0);
  tl.to(cloudUniforms.uOpacityScale, { value: 1, duration: 1.5, ease: 'power2.out' }, 0);

  // Phase 2 (10–40%): Depth reveal
  tl.to(cloudUniforms.uDepthScale, { value: 1, duration: 3, ease: 'power2.out' }, 1);

  // Phase 3 (35–60%): Camera orbit
  tl.to(cameraBasePos, { x: 1.5, z: 3.5, duration: 2.5, ease: 'power1.inOut' }, 3.5);

  // Phase 4 (55–75%): Scatter
  tl.to(cloudUniforms.uScatter, { value: 1, duration: 2.5, ease: 'power2.in' }, 5.5);

  // Phase 5 (70–85%): Fade during scatter
  tl.to(cloudUniforms.uOpacityScale, { value: 0.0, duration: 2, ease: 'power2.in' }, 7);

  // Phase 6 (80–100%): Reform
  tl.to(cloudUniforms.uScatter, { value: 0, duration: 1.5, ease: 'power3.out' }, 8.5);
  tl.to(cloudUniforms.uOpacityScale, { value: 1, duration: 1.5, ease: 'power2.out' }, 8.5);
  tl.to(cloudUniforms.uDepthScale, { value: 0, duration: 1.5, ease: 'power2.inOut' }, 8.5);
  tl.to(cameraBasePos, { x: 0, z: 4, duration: 1.5, ease: 'power2.out' }, 8.5);

  // Phase 7 (95–100%): Photo fades back in
  tl.to(photoMaterial, { opacity: 1, duration: 1, ease: 'power2.out' }, 9.5);
  tl.to(cloudUniforms.uOpacityScale, { value: 0, duration: 1, ease: 'power2.in' }, 9.5);

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

function setupControls(state) {
  const sizeSlider = document.getElementById('point-size');
  const sizeVal = document.getElementById('size-val');
  sizeSlider.addEventListener('input', () => {
    const v = parseFloat(sizeSlider.value);
    state.uniforms.uPointSize.value = v;
    sizeVal.textContent = v.toFixed(1);
  });

  const countSlider = document.getElementById('point-count');
  const countVal = document.getElementById('count-val');
  countSlider.addEventListener('input', () => {
    const v = parseInt(countSlider.value, 10);
    countVal.textContent =
      v >= 1000000 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1000)}K`;
  });
  countSlider.addEventListener('change', () => {
    const opThresh = parseFloat(document.getElementById('opacity-thresh').value);
    state.rebuildCloud(parseInt(countSlider.value, 10), opThresh);
  });

  const opSlider = document.getElementById('opacity-thresh');
  const opVal = document.getElementById('opacity-val');
  opSlider.addEventListener('input', () => {
    opVal.textContent = parseFloat(opSlider.value).toFixed(2);
  });
  opSlider.addEventListener('change', () => {
    state.rebuildCloud(
      parseInt(countSlider.value, 10),
      parseFloat(opSlider.value),
    );
  });
}

// ─── Stats ──────────────────────────────────────────────────

function updateStats(el, data) {
  el.innerHTML = [
    `${(data.count / 1000).toFixed(0)}K pts`,
    `${data.fps} fps`,
    `depth: ${data.depth.toFixed(2)}`,
    `scatter: ${data.scatter.toFixed(2)}`,
  ].join('<br>');
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  const canvas = document.getElementById('canvas');
  const loader = document.getElementById('loader');
  const progressFill = document.getElementById('progress-fill');
  const progressPct = document.getElementById('progress-pct');
  const controlsEl = document.getElementById('controls');
  const statsEl = document.getElementById('stats');

  // 1. Load PLY and photo texture in parallel
  const textureLoader = new THREE.TextureLoader();
  const photoTexPromise = new Promise((resolve, reject) => {
    textureLoader.load(
      '/images/RandyHeroPic.JPG',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });

  let plyBuffer;
  try {
    [plyBuffer] = await Promise.all([
      fetchWithProgress('/3d/RandyHeroPic.ply', (p) => {
        const pct = Math.round(p * 100);
        progressFill.style.width = `${pct}%`;
        progressPct.textContent = `${pct}%`;
      }),
      photoTexPromise.catch(() => null), // don't block on photo failure
    ]);
  } catch (err) {
    progressPct.textContent = `Error: ${err.message}`;
    progressPct.style.color = '#f06b4a';
    console.error(err);
    return;
  }

  const photoTexture = await photoTexPromise.catch(() => null);

  // 2. Parse PLY
  progressPct.textContent = 'Parsing...';
  await new Promise((r) => requestAnimationFrame(r));
  let parsedData = parsePLY(plyBuffer, { maxPoints: 600000 });
  console.log(`Parsed ${parsedData.count} points`);

  // 3. Setup scene
  const { renderer, camera, scene } = initScene(canvas);
  const cameraBasePos = { x: 0, y: 0, z: 4 };

  // 4. Create point cloud
  let cloud = createPointCloud(scene, parsedData);

  // 5. Create photo plane overlay (if photo loaded)
  let photo = null;
  if (photoTexture) {
    photo = createPhotoPlane(scene, photoTexture, cloud.extent, camera);
  }

  // 6. Mouse parallax
  const updateParallax = setupMouseParallax(camera, cameraBasePos);

  // 7. Scroll animation
  const photoMat = photo ? photo.material : { opacity: 0 };
  let scrollTl = setupScrollAnimation(cloud.uniforms, photoMat, camera, cameraBasePos);

  // 8. UI
  loader.classList.add('hidden');
  controlsEl.classList.add('visible');

  // 9. Controls
  const state = {
    get uniforms() {
      return cloud.uniforms;
    },
    rebuildCloud(maxPoints, opacityThreshold = 0.5) {
      scene.remove(cloud.points);
      cloud.geometry.dispose();
      cloud.points.material.dispose();

      parsedData = parsePLY(plyBuffer, { maxPoints, opacityThreshold });
      cloud = createPointCloud(scene, parsedData);
      cloud.uniforms.uPointSize.value = parseFloat(
        document.getElementById('point-size').value,
      );

      // Photo plane doesn't need resizing on rebuild — it's viewport-relative

      scrollTl.kill();
      const pm = photo ? photo.material : { opacity: 0 };
      scrollTl = setupScrollAnimation(cloud.uniforms, pm, camera, cameraBasePos);
      ScrollTrigger.refresh();
    },
  };
  setupControls(state);

  // 10. Render loop
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;
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

    frameCount++;
    if (frameCount % 30 === 0) {
      fps = Math.round(30000 / (now - (lastTime - dt * 30000)));
    }
    // Simpler FPS: just track last 500ms
    if (now - (lastTime - dt * 1000) > 0) {
      // Use a running counter
    }

    updateStats(statsEl, {
      count: parsedData.count,
      fps: Math.round(1 / Math.max(dt, 0.001)),
      depth: cloud.uniforms.uDepthScale.value,
      scatter: cloud.uniforms.uScatter.value,
    });
  }

  animate();
}

main();
