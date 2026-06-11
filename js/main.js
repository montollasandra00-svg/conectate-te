/**
 * js/main.js — conectaTE Masterwork V3
 * ──────────────────────────────────────────────────────────────────
 *  1. Cosmic Canvas Background   — Constellations & Sky Grids
 *  2. Three.js 3D Engine         — Full-screen meshopt GLB
 *  3. Title Glitch & Shatter     — Canvas Text Glitch Engine
 *  4. Parallax Horizontal Scroll — 2.5D Depth translation
 *  5. Betelgeuse Star Canvas     — Animated convective plasma sun
 *  6. Encuentros Physics Canvas  — Elastic node-graph simulation
 *  7. UI & Interaction Helpers   — Validation & micro-effects
 * ──────────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════════════ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ═══════════════════════════════════════════════════════════════════
   1. COSMIC CANVAS BACKGROUND (Constellations & Sky Grids)
   ═══════════════════════════════════════════════════════════════════ */
(function initCosmicCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouse = { x: -9999, y: -9999 };
  let stars = [];
  let constellations = [];
  let gridAlpha = 0;
  let targetGridAlpha = 0;

  // Real astronomical constellations local coordinates
  const CONSTELLATION_TEMPLATES = [
    {
      name: "ORION [DIV. BETELGEUSE]",
      stars: [
        { id: "α-Ori", x: 0, y: -50, label: "Betelgeuse" },   // Betelgeuse
        { id: "γ-Ori", x: -35, y: -45, label: "Bellatrix" },  // Bellatrix
        { id: "ζ-Ori", x: -10, y: 10, label: "Alnitak" },     // Belt L
        { id: "ε-Ori", x: 0, y: 10, label: "Alnilam" },       // Belt M
        { id: "δ-Ori", x: 10, y: 10, label: "Mintaka" },      // Belt R
        { id: "κ-Ori", x: -25, y: 65, label: "Saiph" },       // Saiph
        { id: "β-Ori", x: 25, y: 65, label: "Rigel" }         // Rigel
      ],
      links: [[0, 3], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [5, 6], [0, 1]]
    },
    {
      name: "URSA MAJOR",
      stars: [
        { id: "η-UMa", x: -75, y: 15, label: "Alkaid" },
        { id: "ζ-UMa", x: -45, y: 10, label: "Mizar" },
        { id: "ε-UMa", x: -20, y: 15, label: "Alioth" },
        { id: "δ-UMa", x: 0, y: 20, label: "Megrez" },
        { id: "γ-UMa", x: -5, y: 45, label: "Phecda" },
        { id: "β-UMa", x: 30, y: 50, label: "Merak" },
        { id: "α-UMa", x: 35, y: 20, label: "Dubhe" }
      ],
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
    },
    {
      name: "CASSIOPEIA",
      stars: [
        { id: "ε-Cas", x: -50, y: -10, label: "Segin" },
        { id: "δ-Cas", x: -20, y: 15, label: "Ruchbah" },
        { id: "γ-Cas", x: 0, y: 0, label: "Gamma Cas" },
        { id: "α-Cas", x: 20, y: 20, label: "Shedar" },
        { id: "β-Cas", x: 50, y: -5, label: "Caph" }
      ],
      links: [[0, 1], [1, 2], [2, 3], [3, 4]]
    },
    {
      name: "CRUX [CRUZ DEL SUR]",
      stars: [
        { id: "γ-Cru", x: 0, y: -45, label: "Gacrux" },
        { id: "δ-Cru", x: -25, y: -5, label: "Delta Cru" },
        { id: "β-Cru", x: 25, y: 0, label: "Mimosa" },
        { id: "α-Cru", x: 0, y: 45, label: "Acrux" }
      ],
      links: [[0, 3], [1, 2], [0, 1], [0, 2], [3, 1], [3, 2]]
    }
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    const count = W < 768 ? 60 : 150;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.1,
        alpha: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    // Spawn constellations at spread out positions
    const cCount = W < 768 ? 2 : 4;
    const padding = 120;
    const zones = [
      { minX: padding, maxX: W * 0.35, minY: padding, maxY: H * 0.4 },
      { minX: W * 0.6, maxX: W - padding, minY: padding, maxY: H * 0.4 },
      { minX: padding, maxX: W * 0.35, minY: H * 0.6, maxY: H - padding },
      { minX: W * 0.6, maxX: W - padding, minY: H * 0.6, maxY: H - padding }
    ];

    constellationInstances = [];
    for (let i = 0; i < cCount; i++) {
      const template = CONSTELLATION_TEMPLATES[i % CONSTELLATION_TEMPLATES.length];
      const zone = zones[i % zones.length];
      const cx = zone.minX + Math.random() * (zone.maxX - zone.minX);
      const cy = zone.minY + Math.random() * (zone.maxY - zone.minY);

      constellationInstances.push({
        name: template.name,
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.0005,
        scale: 0.8 + Math.random() * 0.4,
        stars: template.stars.map(s => ({ ...s })),
        links: template.links,
        hoverActive: false,
        hoverProgress: 0
      });
    }
  }

  let constellationInstances = [];

  function drawAstroGrid() {
    ctx.strokeStyle = `rgba(0, 243, 255, ${gridAlpha * 0.04})`;
    ctx.lineWidth = 0.5;

    // Draw coordinate grid lines
    const step = 80;
    ctx.beginPath();
    for (let x = 0; x < W; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Draw central sky horizon arcs
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.35, 0, Math.PI * 2);
    ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // Astro-Grid alpha interpolation
    gridAlpha = lerp(gridAlpha, targetGridAlpha, 0.08);
    if (gridAlpha > 0.01) {
      drawAstroGrid();
    }

    // Twinkling Background Stars
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      s.phase += s.speed;
      s.alpha = s.baseAlpha + Math.sin(s.phase) * 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    // Draw Constellations
    let isAnyHovered = false;

    for (const c of constellationInstances) {
      // Drift & rotate
      c.x += c.vx; c.y += c.vy;
      c.rotation += c.rotSpeed;

      // Keep inside bounds
      const rBound = 150;
      if (c.x < rBound || c.x > W - rBound) c.vx *= -1;
      if (c.y < rBound || c.y > H - rBound) c.vy *= -1;

      // Check hover on any star in this constellation
      let hoveredStar = null;
      let minDistance = Infinity;

      // Pre-calculate world coords of stars
      const cos = Math.cos(c.rotation);
      const sin = Math.sin(c.rotation);

      const worldStars = c.stars.map(s => {
        const rx = (s.x * cos - s.y * sin) * c.scale;
        const ry = (s.x * sin + s.y * cos) * c.scale;
        return {
          ...s,
          wx: c.x + rx,
          wy: c.y + ry
        };
      });

      for (const s of worldStars) {
        const dx = s.wx - mouse.x;
        const dy = s.wy - mouse.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 100) { // Hover radius threshold
          if (d < minDistance) {
            minDistance = d;
            hoveredStar = s;
          }
        }
      }

      if (hoveredStar) {
        c.hoverActive = true;
        isAnyHovered = true;
      } else {
        c.hoverActive = false;
      }

      c.hoverProgress = lerp(c.hoverProgress, c.hoverActive ? 1 : 0, 0.1);

      // Draw constellation connection lines
      ctx.lineWidth = c.hoverProgress > 0.1 ? 0.8 + c.hoverProgress * 0.4 : 0.5;
      for (const link of c.links) {
        const sa = worldStars[link[0]];
        const sb = worldStars[link[1]];
        ctx.beginPath();
        ctx.moveTo(sa.wx, sa.wy);
        ctx.lineTo(sb.wx, sb.wy);

        if (c.hoverProgress > 0.05) {
          ctx.strokeStyle = `rgba(0, 243, 255, ${0.1 + c.hoverProgress * 0.65})`;
          ctx.setLineDash([3 + c.hoverProgress * 3, 2]);
        } else {
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.11)';
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dash

      // Draw constellation stars
      for (const s of worldStars) {
        const isThisHovered = hoveredStar && hoveredStar.id === s.id;
        const starGlow = isThisHovered ? 1.0 : c.hoverProgress * 0.4;

        ctx.beginPath();
        ctx.arc(s.wx, s.wy, isThisHovered ? 3.5 : 1.8 + c.hoverProgress * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + starGlow * 0.55})`;
        ctx.fill();

        if (starGlow > 0.05) {
          ctx.beginPath();
          ctx.arc(s.wx, s.wy, 6 + starGlow * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 243, 255, ${starGlow * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Draw individual star label if constellation is active
        if (c.hoverProgress > 0.25) {
          ctx.font = '8px "Space Mono", monospace';
          ctx.fillStyle = `rgba(0, 243, 255, ${c.hoverProgress * 0.6})`;
          ctx.fillText(s.id, s.wx + 10, s.wy - 2);
          if (isThisHovered) {
            ctx.fillStyle = `rgba(255, 255, 255, ${c.hoverProgress * 0.85})`;
            ctx.fillText(s.label.toUpperCase(), s.wx + 10, s.wy + 7);
          }
        }
      }

      // Draw active telemetry around the constellation center
      if (c.hoverProgress > 0.15) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation * 0.5);

        // Circular dashboard coordinate ring
        ctx.beginPath();
        ctx.arc(0, 0, 75 * c.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${c.hoverProgress * 0.08})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 15]);
        ctx.stroke();

        ctx.restore();

        // Constellation Name HUD
        ctx.font = '9px "Space Mono", monospace';
        ctx.fillStyle = `rgba(0, 243, 255, ${c.hoverProgress * 0.8})`;
        ctx.fillText(`SYS://CONSTELLATION.${c.name.replace(/\s+/g, '_')}`, c.x - 70, c.y - 70 * c.scale);
      }
    }

    targetGridAlpha = isAnyHovered ? 1 : 0;
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });

  resize(); initStars(); frame();
  window.addEventListener('resize', () => { resize(); initStars(); });
})();


/* ═══════════════════════════════════════════════════════════════════
   2. THREE.JS 3D ENGINE — Full-Screen Studio Model
   ═══════════════════════════════════════════════════════════════════ */
(function initThreeJS() {
  if (typeof THREE === 'undefined' || typeof MeshoptDecoder === 'undefined') {
    console.error('[conectaTE 3D] THREE or MeshoptDecoder not loaded.');
    return;
  }

  const viewer      = document.getElementById('hero-viewer');
  const threeCanvas = document.getElementById('three-canvas');
  const loaderEl    = document.getElementById('three-loader');
  const loaderFill  = document.getElementById('loader-fill');
  const progressEl  = document.getElementById('loader-progress');

  if (!viewer || !threeCanvas) return;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(
    38,
    threeCanvas.clientWidth / threeCanvas.clientHeight,
    0.01, 1000
  );
  camera.position.set(0, 0, 4.5);

  const renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(threeCanvas.clientWidth, threeCanvas.clientHeight);
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.physicallyCorrectLights = true;

  scene.add(new THREE.AmbientLight(0xffffff, 2.0));

  const keyLight = new THREE.DirectionalLight(0x00f3ff, 4.0);
  keyLight.position.set(-3, 5, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
  fillLight.position.set(4, 1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x8080ff, 1.2);
  rimLight.position.set(0, -3, -4);
  scene.add(rimLight);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.05;
  controls.enableZoom       = false;
  controls.autoRotate       = true;
  controls.autoRotateSpeed  = 0.9;
  controls.enablePan        = false;
  controls.minPolarAngle    = Math.PI * 0.2;
  controls.maxPolarAngle    = Math.PI * 0.8;

  const loader = new THREE.GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const MODEL_PATH = 'assets/tripo_pbr_model_dc221f92-5a5c-436f-b8a2-e467e2e7b488_meshopt.glb';

  loader.load(
    MODEL_PATH,
    (gltf) => {
      const model = gltf.scene;
      const box    = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);

      const size   = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) model.scale.setScalar(2.8 / maxDim);

      scene.add(model);

      loaderEl.classList.add('hidden');
      setTimeout(() => loaderEl?.remove(), 700);
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        if (loaderFill) loaderFill.style.width = `${pct}%`;
        if (progressEl) progressEl.textContent = `${pct}%`;
      }
    },
    (err) => {
      console.error('[conectaTE 3D] Failed to load model:', err);
      if (progressEl) progressEl.textContent = 'ERROR';
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(() => {
    const w = threeCanvas.clientWidth;
    const h = threeCanvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(viewer);
})();


/* ═══════════════════════════════════════════════════════════════════
   3. TITLE GLITCH & SHATTER ENGINE (Hero Text Glitch & Particles)
   ═══════════════════════════════════════════════════════════════════ */
(function initTitleGlitchEngine() {
  const wrap   = document.getElementById('glass-title-wrap');
  const title  = document.getElementById('glass-title');
  const canvas = document.getElementById('shatter-canvas');
  if (!wrap || !title || !canvas) return;

  const ctx = canvas.getContext('2d');
  let isHovered = false;
  let animFrame = null;
  let timer = 0;

  // Configuration
  const SCRAMBLE_CHARS = "01$#@%ΞØ[]+_*█";
  const GLITCH_DURATION = 20; // tick count for entry burst
  const PARTICLE_COUNT = 25;

  let particles = [];

  class GlitchParticle {
    constructor(x, y, char) {
      this.baseX = x;
      this.baseY = y;
      this.x = x;
      this.y = y;
      this.char = char;
      this.size = Math.random() * 6 + 4;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.alpha = 1;
      this.decay = 0.01 + Math.random() * 0.015;
    }
    update(mX, mY) {
      // Magnetic pull to mouse on hover
      if (mX !== undefined && mX !== null) {
        const dx = mX - this.x;
        const dy = mY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          this.vx += (dx / dist) * 0.05;
          this.vy += (dy / dist) * 0.05;
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.alpha = Math.max(0, this.alpha - this.decay);
    }
    draw(cCtx) {
      cCtx.fillStyle = `rgba(0, 243, 255, ${this.alpha})`;
      cCtx.font = `${this.size}px "Space Mono", monospace`;
      cCtx.fillText(this.char, this.x, this.y);
    }
  }

  function getScrambledText(txt, intensity) {
    if (intensity === 0) return txt;
    let chars = txt.split('');
    for (let i = 0; i < chars.length; i++) {
      if (Math.random() < intensity) {
        chars[i] = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    return chars.join('');
  }

  function renderTitleGlitch(mX, mY) {
    const rect = title.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    canvas.width  = wrapRect.width;
    canvas.height = wrapRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const txt = "conectaTE";
    const x = rect.left - wrapRect.left;
    const y = rect.bottom - wrapRect.top - (rect.height * 0.18); // text baseline alignment

    // Text size/font resolution matching styles
    const computedFontSize = window.getComputedStyle(title).fontSize;
    ctx.font = `bold ${computedFontSize} var(--font-display)`;
    ctx.textBaseline = "alphabetic";

    if (!isHovered) {
      // Reassemble and decay particles
      particles.forEach(p => { p.update(); p.draw(ctx); });
      particles = particles.filter(p => p.alpha > 0);
      if (particles.length === 0) {
        title.classList.remove('shattering');
        cancelAnimationFrame(animFrame);
        animFrame = null;
      } else {
        animFrame = requestAnimationFrame(() => renderTitleGlitch());
      }
      return;
    }

    timer++;

    // Emit particles dynamically
    if (particles.length < PARTICLE_COUNT && Math.random() < 0.3) {
      const px = x + Math.random() * rect.width;
      const py = y - Math.random() * rect.height * 0.6;
      const ch = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      particles.push(new GlitchParticle(px, py, ch));
    }

    // Update and draw particles
    particles.forEach(p => { p.update(mX, mY); p.draw(ctx); });
    particles = particles.filter(p => p.alpha > 0);

    // Glitch rendering intensities
    const isGlitchTick = timer % 12 < 4;
    const scrambleIntensity = isGlitchTick ? 0.35 : 0.08;
    const shiftX = isGlitchTick ? (Math.random() - 0.5) * 14 : (Math.random() - 0.5) * 3;
    const shiftY = isGlitchTick ? (Math.random() - 0.5) * 6 : 0;

    // Draw layers for RGB Split (Chromatic Aberration)
    ctx.save();

    // Slicing Glitch: slice text into vertical strips
    const sliceCount = 5;
    const sliceH = rect.height / sliceCount;

    for (let i = 0; i < sliceCount; i++) {
      const sy = i * sliceH;
      const offsetSlice = (Math.random() - 0.5) * (isGlitchTick ? 18 : 2);

      ctx.save();
      // Clip to horizontal slice rect
      ctx.beginPath();
      ctx.rect(0, sy + (rect.top - wrapRect.top), canvas.width, sliceH);
      ctx.clip();

      const scrambled = getScrambledText(txt, scrambleIntensity);

      // Red/Magenta Channel Offset
      ctx.fillStyle = "rgb(255, 0, 85)";
      ctx.fillText(scrambled, x + shiftX + offsetSlice - 2, y + shiftY);

      // Cyan Channel Offset
      ctx.fillStyle = "rgb(0, 243, 255)";
      ctx.fillText(scrambled, x + shiftX + offsetSlice + 2, y + shiftY);

      // Main White overlay
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillText(scrambled, x + shiftX + offsetSlice, y + shiftY);

      ctx.restore();
    }

    ctx.restore();
    animFrame = requestAnimationFrame(() => {
      // Get current local mouse positions relative to container
      const wRect = wrap.getBoundingClientRect();
      const lx = window.currentMouseX ? window.currentMouseX - wRect.left : null;
      const ly = window.currentMouseY ? window.currentMouseY - wRect.top : null;
      renderTitleGlitch(lx, ly);
    });
  }

  // Mouse coordinate tracker
  window.addEventListener('mousemove', e => {
    window.currentMouseX = e.clientX;
    window.currentMouseY = e.clientY;
  });

  wrap.addEventListener('mouseenter', () => {
    isHovered = true;
    title.classList.add('shattering');
    timer = 0;
    if (!animFrame) {
      renderTitleGlitch();
    }
  });

  wrap.addEventListener('mouseleave', () => {
    isHovered = false;
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   4. PARALLAX HORIZONTAL SCROLL (2.5D Depth Translation)
   ═══════════════════════════════════════════════════════════════════ */
(function initNarrativeParallax() {
  const wrapper = document.getElementById('narrative-wrapper');
  const track   = document.getElementById('narrative-track');
  const fill    = document.getElementById('np-fill');
  const panelTotal   = document.getElementById('panel-total');
  const panelCurrent = document.getElementById('panel-current');

  if (!wrapper || !track || !fill) return;

  const isMobileQuery = () => window.innerWidth <= 768;
  let ticking = false;
  let currentX = 0;
  let targetX  = 0;

  const panels = track.querySelectorAll('.narrative-panel');
  if (panelTotal) panelTotal.textContent = String(panels.length).padStart(2, '0');

  function getProgress() {
    const rect       = wrapper.getBoundingClientRect();
    const scrolled   = -rect.top;
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    return clamp(scrolled / scrollable, 0, 1);
  }

  function applyParallax() {
    if (isMobileQuery()) {
      track.style.transform = '';
      track.querySelectorAll('.panel-bg, .panel-fg').forEach(el => {
        el.style.transform = '';
      });
      return;
    }

    const progress = getProgress();
    const maxX = track.scrollWidth - window.innerWidth;
    targetX = progress * maxX;

    // Smooth lerping
    currentX = lerp(currentX, targetX, 0.08);

    // Translate main track
    track.style.transform = `translateX(-${currentX}px)`;
    if (fill) fill.style.width = `${progress * 100}%`;

    // Apply Parallax translation factors to children layers
    panels.forEach(panel => {
      const bg = panel.querySelector('.panel-bg');
      const fg = panel.querySelector('.panel-fg');

      if (bg) {
        // Shift in same direction as scroll (pos offset) -> scrolls slower (0.45x)
        bg.style.transform = `translateX(${currentX * 0.55}px)`;
      }
      if (fg) {
        // Shift in opposite direction (neg offset) -> scrolls faster (1.35x)
        fg.style.transform = `translateX(${-currentX * 0.35}px)`;
      }
    });

    if (panelCurrent) {
      const panelIdx = Math.min(
        Math.floor(progress * panels.length) + 1,
        panels.length
      );
      panelCurrent.textContent = String(panelIdx).padStart(2, '0');
    }

    if (Math.abs(currentX - targetX) > 0.1) {
      requestAnimationFrame(applyParallax);
    } else {
      ticking = false;
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    currentX = 0; targetX = 0;
    track.style.transform = '';
    track.querySelectorAll('.panel-bg, .panel-fg').forEach(el => {
      el.style.transform = '';
    });
    applyParallax();
  });

  applyParallax();
})();


/* ═══════════════════════════════════════════════════════════════════
   5. BETELGEUSE STAR CANVAS (Animated convective plasma sun)
   ═══════════════════════════════════════════════════════════════════ */
(function initBetelgeuseSun() {
  const canvas = document.getElementById('canvas-betelgeuse');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = canvas.width = 320;
  let H = canvas.height = 320;
  let time = 0;
  let hoverFactor = 0;
  let isHovered = false;

  // Simple procedural noise via trigonometry waves for convective plasma currents
  function plasmaNoise(x, y, t) {
    const nx = x * 0.035;
    const ny = y * 0.035;
    let val = Math.sin(nx + t) * Math.cos(ny - t);
    val += Math.sin(ny + t * 1.5) * Math.sin(nx * 0.8 - t * 0.8);
    val += Math.cos(Math.sqrt(nx*nx + ny*ny) - t * 0.5);
    return (val + 3) / 6; // map to [0, 1]
  }

  function drawSun() {
    ctx.clearRect(0, 0, W, H);
    time += 0.025 + hoverFactor * 0.05;

    const cx = W / 2;
    const cy = H / 2;
    const rBase = 85;
    const r = rBase + Math.sin(time * 2) * 1.5;

    // 1. Draw soft outer convective corona
    const outerCorona = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 45 + hoverFactor * 25);
    outerCorona.addColorStop(0, `rgba(255, 60, 0, ${0.45 + hoverFactor * 0.35})`);
    outerCorona.addColorStop(0.3, `rgba(255, 120, 0, ${0.25 + hoverFactor * 0.15})`);
    outerCorona.addColorStop(0.6, 'rgba(255, 200, 0, 0.08)');
    outerCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerCorona;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 50 + hoverFactor * 30, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Solar prominence solar flares (bezier loops)
    ctx.lineWidth = 1.8 + hoverFactor * 1.5;
    const flareCount = 6 + Math.floor(hoverFactor * 4);
    ctx.strokeStyle = `rgba(255, 110, 0, ${0.4 + hoverFactor * 0.5})`;
    for (let i = 0; i < flareCount; i++) {
      const angle = (i / flareCount) * Math.PI * 2 + time * 0.15;
      const startX = cx + Math.cos(angle) * r;
      const startY = cy + Math.sin(angle) * r;

      const flareL = 25 + Math.sin(time * 4 + i) * 12 + hoverFactor * 20;
      const midAngle = angle + 0.15 + Math.cos(time + i) * 0.05;
      const cpX = cx + Math.cos(midAngle) * (r + flareL);
      const cpY = cy + Math.sin(midAngle) * (r + flareL);

      const endAngle = angle + 0.3;
      const endX = cx + Math.cos(endAngle) * r;
      const endY = cy + Math.sin(endAngle) * r;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();
    }

    // 3. Draw plasma convective cells inside solar disk
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    for (let y = 0; y < H; y++) {
      const dy = y - cy;
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < r) {
          // Calculate 3D sphere mapping offset coordinates
          const z = Math.sqrt(r*r - dist*dist);
          // Distort coordinates slightly with noise to simulate spherical projection
          const sx = dx * (r / (z + r * 0.5));
          const sy = dy * (r / (z + r * 0.5));

          const noiseVal = plasmaNoise(sx + time * 12, sy, time);

          // Color ramp mapping (Red -> Orange -> Yellow)
          let R = 255;
          let G = Math.floor(noiseVal * 160 + 40 + hoverFactor * 55);
          let B = Math.floor(noiseVal * 50 + hoverFactor * 40);

          // Shading index for spherical depth (rim darking)
          const shade = z / r;
          R = Math.floor(R * (0.35 + shade * 0.65));
          G = Math.floor(G * (0.2 + shade * 0.8));
          B = Math.floor(B * shade);

          const idx = (y * W + x) * 4;
          data[idx]     = R;
          data[idx + 1] = G;
          data[idx + 2] = B;
          data[idx + 3] = 255;
        }
      }
    }

    // Create temporary canvas to put pixels and overlay solar disk smoothly
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = W; tempCanvas.height = H;
    tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);

    // Inner glowing sphere overlay
    const innerGlow = ctx.createRadialGradient(cx, cy, r - 30, cx, cy, r);
    innerGlow.addColorStop(0, 'rgba(255,255,255,0)');
    innerGlow.addColorStop(0.85, 'rgba(255, 180, 0, 0.15)');
    innerGlow.addColorStop(1, `rgba(255, 255, 255, ${0.45 + hoverFactor * 0.35})`);
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 4. Telemetry Dashboard HUD inside Betelgeuse Star graphic
    if (hoverFactor > 0.05) {
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillStyle = `rgba(0, 243, 255, ${hoverFactor * 0.75})`;
      ctx.fillText(`TEMP: ${Math.floor(3500 + hoverFactor * 240)} K`, cx - 60, cy - r - 12);
      ctx.fillText(`MASS: 19 M☉`, cx - 60, cy + r + 16);
      ctx.fillText(`RADIUS: 887 R☉`, cx - 60, cy + r + 26);
    }
  }

  function loop() {
    hoverFactor = lerp(hoverFactor, isHovered ? 1 : 0, 0.08);
    drawSun();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mouseenter', () => { isHovered = true; });
  canvas.addEventListener('mouseleave', () => { isHovered = false; });

  // Handle ResizeObserver updates
  const ro = new ResizeObserver(entries => {
    for (let entry of entries) {
      W = canvas.width = Math.floor(entry.contentRect.width || 320);
      H = canvas.height = Math.floor(entry.contentRect.height || 320);
    }
  });
  ro.observe(canvas.parentElement);

  loop();
})();


/* ═══════════════════════════════════════════════════════════════════
   6. ENCUENTROS PHYSICS CANVAS (Elastic node-graph simulation)
   ═══════════════════════════════════════════════════════════════════ */
(function initEncuentrosPhysics() {
  const canvas = document.getElementById('canvas-encuentros');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = canvas.width = 320;
  let H = canvas.height = 320;

  let nodes = [];
  let springs = [];
  let cursor = { x: -9999, y: -9999, active: false };
  let clicks = [];

  const NODE_COUNT = 8;
  const SPRING_LEN = 75;
  const K = 0.012; // Spring stiffness
  const DAMP = 0.94; // Velocity damping factor

  class GraphNode {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.r = 6;
      this.active = false;
      this.pulse = 0;
    }
    update(mX, mY, mActive) {
      // Gravitational attraction to cursor
      if (mActive) {
        const dx = mX - this.x;
        const dy = mY - this.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          const force = (110 - d) * 0.0035;
          this.vx += (dx / d) * force;
          this.vy += (dy / d) * force;
          this.active = d < 18;
        } else {
          this.active = false;
        }
      } else {
        this.active = false;
      }

      this.x += this.vx;
      this.y += this.vy;
      this.vx *= DAMP;
      this.vy *= DAMP;

      // Keep nodes contained within canvas bounding rect
      const padding = 15;
      if (this.x < padding) { this.x = padding; this.vx *= -0.5; }
      if (this.x > W - padding) { this.x = W - padding; this.vx *= -0.5; }
      if (this.y < padding) { this.y = padding; this.vy *= -0.5; }
      if (this.y > H - padding) { this.y = H - padding; this.vy *= -0.5; }
    }
    draw(cCtx) {
      cCtx.beginPath();
      cCtx.arc(this.x, this.y, this.r + (this.active ? 2 : 0), 0, Math.PI * 2);
      cCtx.fillStyle = this.active ? '#ffffff' : 'rgba(0, 243, 255, 0.85)';
      cCtx.fill();

      if (this.active) {
        cCtx.beginPath();
        cCtx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2);
        cCtx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
        cCtx.lineWidth = 1;
        cCtx.stroke();
      }
    }
  }

  function initGraph() {
    nodes = [];
    springs = [];

    // Create random nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push(new GraphNode(
        40 + Math.random() * (W - 80),
        40 + Math.random() * (H - 80)
      ));
    }

    // Connect node indices logically
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    connections.forEach(pair => {
      springs.push({ a: nodes[pair[0]], b: nodes[pair[1]], length: SPRING_LEN });
    });
  }

  function triggerSpark(x, y) {
    for (let i = 0; i < 15; i++) {
      clicks.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);

    // Apply Spring forces physics
    for (const sp of springs) {
      const dx = sp.b.x - sp.a.x;
      const dy = sp.b.y - sp.a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const force = (dist - sp.length) * K;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      sp.a.vx += fx;
      sp.a.vy += fy;
      sp.b.vx -= fx;
      sp.b.vy -= fy;
    }

    // Draw Spring links
    for (const sp of springs) {
      const isAnyActive = sp.a.active || sp.b.active;
      ctx.beginPath();
      ctx.moveTo(sp.a.x, sp.a.y);
      ctx.lineTo(sp.b.x, sp.b.y);
      ctx.strokeStyle = isAnyActive ? 'rgba(0, 243, 255, 0.7)' : 'rgba(0, 243, 255, 0.18)';
      ctx.lineWidth = isAnyActive ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Update and draw Nodes
    nodes.forEach(n => {
      n.update(cursor.x, cursor.y, cursor.active);
      n.draw(ctx);
    });

    // Handle Spark particles
    clicks.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 243, 255, ${p.alpha})`;
      ctx.fill();
    });
    clicks = clicks.filter(p => p.alpha > 0);

    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    cursor.x = e.clientX - rect.left;
    cursor.y = e.clientY - rect.top;
    cursor.active = true;
  });

  canvas.addEventListener('mouseleave', () => {
    cursor.active = false;
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const lx = e.clientX - rect.left;
    const ly = e.clientY - rect.top;
    triggerSpark(lx, ly);

    // Apply explosion impulse force to all graph nodes
    nodes.forEach(n => {
      const dx = n.x - lx;
      const dy = n.y - ly;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120 && d > 0) {
        n.vx += (dx / d) * 4.5;
        n.vy += (dy / d) * 4.5;
      }
    });
  });

  const ro = new ResizeObserver(entries => {
    for (let entry of entries) {
      W = canvas.width = Math.floor(entry.contentRect.width || 320);
      H = canvas.height = Math.floor(entry.contentRect.height || 320);
      initGraph();
    }
  });
  ro.observe(canvas.parentElement);

  initGraph();
  loop();
})();


/* ═══════════════════════════════════════════════════════════════════
   7. UI & INTERACTION HELPERS (Header & Forms)
   ═══════════════════════════════════════════════════════════════════ */
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  let ticking = false;
  function update() {
    header.classList.toggle('scrolled', window.scrollY > 10);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();

(function initActiveNavTracker() {
  const links    = document.querySelectorAll('.nav-link[data-section]');
  const sections = document.querySelectorAll('main > section[id]');
  if (!links.length || !sections.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => obs.observe(s));
})();

(function initRevealStackItems() {
  const items = document.querySelectorAll('.stack-item');
  if (!items.length) return;

  items.forEach((el, i) => {
    el.style.transitionDelay = `${i * 100}ms`;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => obs.observe(el));
})();

(function initTerminalRegistration() {
  const form        = document.getElementById('join-form');
  const successPanel = document.getElementById('terminal-success');
  const pilotNameEl  = document.getElementById('ts-pilot-name');
  const resetBtn     = document.getElementById('ts-reset');

  if (!form || !successPanel) return;

  function shake(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 300ms ease';
    setTimeout(() => el.style.animation = '', 300);
    el.style.borderColor = '#ff5f57';
    setTimeout(() => el.style.borderColor = '', 2000);
  }

  if (!document.getElementById('shake-style')) {
    const s = document.createElement('style');
    s.id = 'shake-style';
    s.textContent = `@keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }`;
    document.head.appendChild(s);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name  = document.getElementById('f-name');
    const grade = document.getElementById('f-grade');
    const node  = document.getElementById('f-node');

    if (!name.value.trim()) { shake(name); name.focus(); return; }
    if (!grade.value)        { shake(grade); grade.focus(); return; }
    if (!node.value)         { shake(node); node.focus(); return; }

    if (pilotNameEl) pilotNameEl.textContent = `// ${name.value.trim().toUpperCase()}`;
    form.style.display  = 'none';
    successPanel.hidden = false;
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display  = '';
      successPanel.hidden = true;
    });
  }
})();
