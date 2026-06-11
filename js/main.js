/**
 * js/main.js — conectaTE Masterwork V2
 * ──────────────────────────────────────────────────────────────────
 *  1. Neural Canvas Background   — Constellation particles
 *  2. Three.js 3D Engine         — Full-screen meshopt GLB
 *  3. Glass Shatter Effect       — Canvas 2D polygon fragmentation
 *  4. Narrative Horizontal Scroll — 500vh sticky to translateX
 *  5. Header Scroll State        — Glassmorphism toggle
 *  6. Active Nav Tracker         — IntersectionObserver
 *  7. Stack Item Reveal          — Fade-in on viewport entry
 *  8. Join Form                  — Validation + terminal success
 * ──────────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════════ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t) => a + (b - a) * t;


/* ═══════════════════════════════════════════════════════════════════
   1. NEURAL CANVAS BACKGROUND
═══════════════════════════════════════════════════════════════════ */
(function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COUNT      = window.innerWidth < 768 ? 50 : 100;
  const LINK_DIST  = 130;
  const REPEL_DIST = 110;
  const SPEED      = 0.28;

  let W, H, nodes = [];
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkNode() {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * SPEED + 0.05;
    return { x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a)*s, vy: Math.sin(a)*s };
  }

  function populate() {
    const n = window.innerWidth < 768 ? 50 : COUNT;
    nodes = Array.from({ length: n }, mkNode);
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const n = nodes.length;

    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      // Mouse repel
      const mdx = a.x - mouse.x, mdy = a.y - mouse.y;
      const md  = Math.sqrt(mdx*mdx + mdy*mdy);
      if (md < REPEL_DIST && md > 0) {
        const f = (REPEL_DIST - md) / REPEL_DIST * 0.7;
        a.x += (mdx/md)*f; a.y += (mdy/md)*f;
      }

      // Dot
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,243,255,0.25)';
      ctx.fill();

      // Links
      for (let j = i+1; j < n; j++) {
        const b = nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist/LINK_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,243,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });

  resize(); populate(); frame();
  window.addEventListener('resize', () => { resize(); populate(); });
})();


/* ═══════════════════════════════════════════════════════════════════
   2. THREE.JS 3D ENGINE — Bulletproof Full-Screen Model
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

  /* Studio lighting — 3 lights to guarantee PBR visibility */
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

  /* OrbitControls */
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.05;
  controls.enableZoom       = false; // ← CRITICAL: prevents scroll hijack
  controls.autoRotate       = true;
  controls.autoRotateSpeed  = 0.9;
  controls.enablePan        = false;
  controls.minPolarAngle    = Math.PI * 0.2;
  controls.maxPolarAngle    = Math.PI * 0.8;

  /* GLTF + Meshopt */
  const loader = new THREE.GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder); // ← CRITICAL

  const MODEL_PATH = 'assets/tripo_pbr_model_dc221f92-5a5c-436f-b8a2-e467e2e7b488_meshopt.glb';

  loader.load(
    MODEL_PATH,
    (gltf) => {
      const model = gltf.scene;

      /* Auto-center using bounding box */
      const box    = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);

      /* Auto-scale */
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

  /* Responsive resize */
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
   3. GLASS SHATTER EFFECT
   ──────────────────────────────────────────────────────────────────
   Technique:
   a) On hover, capture the bounding box of the text element.
   b) Generate a Voronoi-like set of polygon "shards" covering the text.
   c) Draw each shard as a clipped, slightly offset copy of the title
      using canvas 2D with a glass-gradient fill.
   d) Animate each shard with physics: velocity, gravity, rotation.
   e) On mouse leave, play the animation in reverse (reassembly).
═══════════════════════════════════════════════════════════════════ */
(function initGlassShatter() {
  const wrap    = document.getElementById('glass-title-wrap');
  const title   = document.getElementById('glass-title');
  const canvas  = document.getElementById('shatter-canvas');
  if (!wrap || !title || !canvas) return;

  const ctx = canvas.getContext('2d');

  const SHARD_COUNT  = 18;
  const GRAVITY      = 0.04;

  let shards      = [];
  let animFrame   = null;
  let isShattered = false;
  let startTime   = 0;

  /* ── Helper: generate random polygon points inside a bounding box ── */
  function generateVoronoiShards(W, H, count) {
    // Random seed points
    const seeds = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
    }));

    // For each pixel in a coarse grid, assign it to nearest seed
    const cellSize = 8;
    const cols = Math.ceil(W / cellSize);
    const rows = Math.ceil(H / cellSize);
    const cells = new Array(count).fill(null).map(() => []);

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const px = c * cellSize;
        const py = r * cellSize;
        let minDist = Infinity, minIdx = 0;
        for (let s = 0; s < seeds.length; s++) {
          const dx = px - seeds[s].x, dy = py - seeds[s].y;
          const d  = dx*dx + dy*dy;
          if (d < minDist) { minDist = d; minIdx = s; }
        }
        cells[minIdx].push([px, py]);
      }
    }

    // Convert point clouds to convex hull polygons
    return cells.map((pts, i) => {
      if (pts.length < 3) return null;
      const hull = convexHull(pts);
      if (hull.length < 3) return null;

      const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
      const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;

      return {
        hull,
        cx, cy,
        // Physics state
        x: 0, y: 0,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.8) * 4,
        angle: 0,
        omega: (Math.random() - 0.5) * 0.08,
        alpha: 1,
      };
    }).filter(Boolean);
  }

  /* ── Minimal convex hull (Gift wrapping) ── */
  function convexHull(points) {
    const pts = [...points].sort((a,b) => a[0]-b[0] || a[1]-b[1]);
    const n   = pts.length;
    if (n < 3) return pts;
    const lower = [], upper = [];
    for (const p of pts) {
      while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
      lower.push(p);
    }
    for (let i = n-1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
      upper.push(p);
    }
    upper.pop(); lower.pop();
    return [...lower, ...upper];
  }
  function cross(O, A, B) {
    return (A[0]-O[0])*(B[1]-O[1]) - (A[1]-O[1])*(B[0]-O[0]);
  }

  /* ── Render shards onto canvas ── */
  function renderShards(progress) {
    const rect = title.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    canvas.width  = wrapRect.width;
    canvas.height = wrapRect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = rect.left - wrapRect.left;
    const offsetY = rect.top  - wrapRect.top;

    for (const s of shards) {
      ctx.save();
      ctx.translate(s.cx + offsetX + s.x, s.cy + offsetY + s.y);
      ctx.rotate(s.angle);

      // Clip to shard polygon
      ctx.beginPath();
      const hull = s.hull;
      ctx.moveTo(hull[0][0] - s.cx, hull[0][1] - s.cy);
      for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i][0] - s.cx, hull[i][1] - s.cy);
      }
      ctx.closePath();
      ctx.clip();

      // Glass gradient fill
      const grd = ctx.createLinearGradient(-40, -20, 40, 20);
      grd.addColorStop(0,   `rgba(255,255,255,${0.9 * s.alpha})`);
      grd.addColorStop(0.3, `rgba(180,230,255,${0.7 * s.alpha})`);
      grd.addColorStop(0.6, `rgba(0,243,255,${0.5 * s.alpha})`);
      grd.addColorStop(1,   `rgba(255,255,255,${0.85 * s.alpha})`);
      ctx.fillStyle = grd;
      ctx.fill();

      // Shard border — glass edge highlight
      ctx.beginPath();
      ctx.moveTo(hull[0][0] - s.cx, hull[0][1] - s.cy);
      for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i][0] - s.cx, hull[i][1] - s.cy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0,243,255,${0.4 * s.alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  /* ── Shatter animation: explode outward ── */
  function animateShatter() {
    const elapsed = (performance.now() - startTime) / 1000;
    const done    = elapsed > 1.5;

    for (const s of shards) {
      if (!done) {
        s.x     += s.vx;
        s.y     += s.vy;
        s.vy    += GRAVITY;
        s.angle += s.omega;
        s.alpha  = Math.max(0, 1 - elapsed / 1.2);
      }
    }

    renderShards(elapsed);

    if (!done) {
      animFrame = requestAnimationFrame(animateShatter);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      title.classList.remove('shattering');
      isShattered = false;
    }
  }

  /* ── Assemble animation: converge back ── */
  function animateAssemble() {
    const elapsed = (performance.now() - startTime) / 1000;
    const t       = Math.min(elapsed / 0.4, 1);
    const eased   = 1 - Math.pow(1 - t, 3);
    const done    = t >= 1;

    for (const s of shards) {
      s.x     = s.x * (1 - eased);
      s.y     = s.y * (1 - eased);
      s.angle = s.angle * (1 - eased);
      s.alpha = eased;
    }

    renderShards(elapsed);

    if (!done) {
      animFrame = requestAnimationFrame(animateAssemble);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      title.classList.remove('shattering');
      isShattered = false;
    }
  }

  /* ── Trigger shatter on mouse enter ── */
  wrap.addEventListener('mouseenter', () => {
    if (isShattered) return;
    isShattered = true;

    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    const rect = title.getBoundingClientRect();
    shards     = generateVoronoiShards(rect.width, rect.height, SHARD_COUNT);

    // Reset physics
    shards.forEach(s => { s.x = 0; s.y = 0; s.angle = 0; s.alpha = 1; });

    title.classList.add('shattering');
    startTime = performance.now();
    animateShatter();
  });

  /* ── Reassemble on mouse leave ── */
  wrap.addEventListener('mouseleave', () => {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    // Keep shards but reverse to origin
    title.classList.add('shattering');
    startTime = performance.now();
    animateAssemble();
  });
})();


/* ═══════════════════════════════════════════════════════════════════
   4. NARRATIVE HORIZONTAL SCROLL
   ──────────────────────────────────────────────────────────────────
   Maps vertical scroll progress (through a 500vh wrapper) to a
   horizontal translateX on the narrative track. Silky smooth via RAF.
═══════════════════════════════════════════════════════════════════ */
(function initNarrativeScroll() {
  const wrapper = document.getElementById('narrative-wrapper');
  const track   = document.getElementById('narrative-track');
  const fill    = document.getElementById('np-fill');
  const panelTotal   = document.getElementById('panel-total');
  const panelCurrent = document.getElementById('panel-current');

  if (!wrapper || !track || !fill) return;

  const isMobileQuery = () => window.innerWidth <= 768;
  let   ticking = false;
  let   currentX = 0;
  let   targetX  = 0;

  // Count panels
  const panels = track.querySelectorAll('.narrative-panel');
  if (panelTotal) panelTotal.textContent = String(panels.length).padStart(2, '0');

  function getProgress() {
    const rect      = wrapper.getBoundingClientRect();
    const scrolled  = -rect.top;
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    return clamp(scrolled / scrollable, 0, 1);
  }

  function applyTransform() {
    if (isMobileQuery()) {
      track.style.transform = '';
      return;
    }

    const progress   = getProgress();
    const maxX       = track.scrollWidth - window.innerWidth;
    targetX = progress * maxX;

    // Lerp for smooth feel
    currentX = lerp(currentX, targetX, 0.12);

    track.style.transform = `translateX(-${currentX}px)`;
    if (fill) fill.style.width = `${progress * 100}%`;

    // Update panel counter
    if (panelCurrent) {
      const panelIdx = Math.min(
        Math.floor(progress * panels.length) + 1,
        panels.length
      );
      panelCurrent.textContent = String(panelIdx).padStart(2, '0');
    }

    // Keep looping while animating
    if (Math.abs(currentX - targetX) > 0.5) {
      requestAnimationFrame(applyTransform);
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(applyTransform);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    currentX = 0;
    targetX  = 0;
    track.style.transform = '';
    applyTransform();
  });

  applyTransform();
})();


/* ═══════════════════════════════════════════════════════════════════
   5. HEADER SCROLL STATE
═══════════════════════════════════════════════════════════════════ */
(function initHeader() {
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


/* ═══════════════════════════════════════════════════════════════════
   6. ACTIVE NAV TRACKER
═══════════════════════════════════════════════════════════════════ */
(function initActiveNav() {
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


/* ═══════════════════════════════════════════════════════════════════
   7. STACK ITEM REVEAL
═══════════════════════════════════════════════════════════════════ */
(function initReveal() {
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


/* ═══════════════════════════════════════════════════════════════════
   8. JOIN FORM — Terminal Validation
═══════════════════════════════════════════════════════════════════ */
(function initJoinForm() {
  const form        = document.getElementById('join-form');
  const successPanel = document.getElementById('terminal-success');
  const pilotNameEl  = document.getElementById('ts-pilot-name');
  const resetBtn     = document.getElementById('ts-reset');

  if (!form || !successPanel) return;

  function shake(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 300ms ease';
    setTimeout(() => el.style.animation = '', 300);
    el.style.borderColor = '#ff5f57';
    setTimeout(() => el.style.borderColor = '', 2000);
  }

  // Inject shake keyframes if not present
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
