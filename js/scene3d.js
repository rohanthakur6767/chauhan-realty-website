/* ==========================================================================
   scene3d.js — subtle architectural "massing" wireframe for the brand section
   Isolated Three.js module. Bronze edges on a blueprint grid, slow rotation,
   mouse parallax. Bails out gracefully on mobile / no-WebGL / reduced-motion.
   ========================================================================== */
import * as THREE from "three";

export function initArchScene(canvas) {
  if (!canvas) return null;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 760px)").matches;
  if (reduce || small) return null;

  // WebGL support check
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(4.6, 3.4, 6.4);
  camera.lookAt(0, 0.6, 0);

  const bronze = new THREE.Color("#c69a44");
  const faint = new THREE.Color("#6a5c46");

  const group = new THREE.Group();
  scene.add(group);

  // --- Stepped building massing: offset boxes rendered as glowing edges ------
  const blocks = [
    { w: 2.6, h: 1.0, d: 2.6, y: 0.0,  x: 0,     z: 0 },
    { w: 2.0, h: 1.3, d: 2.0, y: 1.15, x: 0.15,  z: -0.1 },
    { w: 1.35,h: 1.6, d: 1.35,y: 2.55, x: -0.1,  z: 0.15 },
    { w: 0.8, h: 1.2, d: 0.8, y: 3.85, x: 0.2,   z: -0.05 },
  ];
  const solidMat = new THREE.MeshBasicMaterial({ color: "#12100c", transparent: true, opacity: 0.55 });
  blocks.forEach((b) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const solid = new THREE.Mesh(geo, solidMat);
    solid.position.set(b.x, b.y + b.h / 2 - 0.9, b.z);
    group.add(solid);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: bronze, transparent: true, opacity: 0.85 })
    );
    edges.position.copy(solid.position);
    group.add(edges);
  });

  // --- Blueprint ground grid --------------------------------------------------
  const grid = new THREE.GridHelper(14, 28, faint, faint);
  grid.position.y = -1.0;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  group.add(grid);

  // --- A slow-floating reference ring (survey / plan hint) -------------------
  const ring = new THREE.LineLoop(
    new THREE.RingGeometry(3.1, 3.1, 64),
    new THREE.LineBasicMaterial({ color: faint, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.98;
  group.add(ring);

  // --- Resize (self-correcting via ResizeObserver) ----------------------------
  function resize() {
    const host = canvas.parentElement || canvas;
    const r = host.getBoundingClientRect();
    const w = r.width || host.clientWidth || canvas.clientWidth;
    const h = r.height || host.clientHeight || canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);

  // --- Mouse parallax ---------------------------------------------------------
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.35;
  });

  // --- Render loop (paused when offscreen) -----------------------------------
  let visible = true;
  const io = new IntersectionObserver(
    (ents) => ents.forEach((en) => (visible = en.isIntersecting)),
    { threshold: 0 }
  );
  io.observe(canvas);

  let raf;
  const clock = new THREE.Clock();
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    group.rotation.y = t * 0.12 + cur.x;
    group.rotation.x = cur.y * 0.6;
    group.position.y = Math.sin(t * 0.5) * 0.08;
    renderer.render(scene, camera);
  }
  tick();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
