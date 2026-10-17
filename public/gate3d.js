// EDEN'S GATE — the 3D entrance.
// Iron gates swing open, mist rolls out, warm light pours through from the garden,
// and the camera walks you up to the threshold. Falls back to the flat SVG gate
// if WebGL isn't available.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const GOLD = 0xc2a24d, LAMP = 0xebd9a0, IVY = 0x3d7d7b, DUSK = 0x12302c;

export function startGate(canvas, { onOpen } = {}) {
  const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(DUSK);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DUSK, 0.085);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  let lookY = 2.25;
  const camStart = new THREE.Vector3(0, 1.5, 13.5), camEnd = new THREE.Vector3(0, 1.85, 7.6);
  camera.position.copy(still ? camEnd : camStart);

  // ── light ──
  scene.add(new THREE.HemisphereLight(0x6fa6a2, 0x0a1a17, 0.35));
  const garden = new THREE.PointLight(LAMP, 0, 30, 1.4); garden.position.set(0, 2.2, -3.5); scene.add(garden);
  const rimL = new THREE.SpotLight(0xffe8b8, 30, 20, Math.PI / 7, 0.7, 1.5); rimL.position.set(-5, 7, 6); rimL.target.position.set(0, 1.5, 0); scene.add(rimL, rimL.target);
  const rimR = rimL.clone(); rimR.position.set(5, 7, 6); rimR.target = rimL.target; scene.add(rimR);

  // ── ground ──
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0f2622, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // a path of light through the gate
  const pathTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, "rgba(235,217,160,0.9)"); grd.addColorStop(1, "rgba(235,217,160,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 9), new THREE.MeshBasicMaterial({ map: pathTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 1.5); scene.add(path);

  // ── stone pillars + arch ──
  const stone = new THREE.MeshStandardMaterial({ color: 0x2c4a45, roughness: 0.85, metalness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1d1a14, metalness: 0.85, roughness: 0.42 });
  const W = 1.55; // half the opening
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.6, 0.62), stone); p.position.set(s * (W + 0.31), 1.8, 0); scene.add(p);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.8), stone); cap.position.set(s * (W + 0.31), 3.69, 0); scene.add(cap);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), gold); ball.position.set(s * (W + 0.31), 3.98, 0); scene.add(ball);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.66), gold); band.position.set(s * (W + 0.31), 3.2, 0); scene.add(band);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(W + 0.31, 0.12, 16, 80, Math.PI), iron); arch.position.set(0, 3.6, 0); scene.add(arch);
  const archGold = new THREE.Mesh(new THREE.TorusGeometry(W + 0.12, 0.035, 10, 80, Math.PI), gold); archGold.position.set(0, 3.6, 0); scene.add(archGold);
  // filigree in the arch: rays of the sun rising over the garden
  for (let i = 1; i < 12; i++) {
    const a = (i / 12) * Math.PI, r = W + 0.1;
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, r * 0.62, 6), gold);
    ray.position.set(Math.cos(a) * r * 0.5, 3.6 + Math.sin(a) * r * 0.5, 0); ray.rotation.z = a - Math.PI / 2; scene.add(ray);
  }
  const sun = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 12, 48, Math.PI), gold); sun.position.set(0, 3.6, 0); scene.add(sun);

  // ── the doors ──
  function makeDoor(side) {
    const hinge = new THREE.Group(); hinge.position.set(side * W, 0, 0); scene.add(hinge);
    const door = new THREE.Group(); hinge.add(door);
    const n = 9, w = W - 0.02;
    for (let i = 0; i < n; i++) {
      const x = -side * (0.08 + (i / (n - 1)) * (w - 0.16));
      const hh = 2.9 + (i / (n - 1)) * 0.35; // bars rise toward the middle
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, hh, 10), iron); bar.position.set(x, hh / 2 + 0.05, 0); door.add(bar);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 10), gold); tip.position.set(x, hh + 0.15, 0); door.add(tip);
    }
    for (const y of [0.35, 1.25, 2.45]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05), iron); rail.position.set(-side * w / 2, y, 0); door.add(rail);
    }
    // scrollwork between the rails
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 10, 36), gold);
      ring.position.set(-side * (0.3 + k * 0.48), 1.85, 0); door.add(ring);
      const ring2 = ring.clone(); ring2.scale.setScalar(0.55); ring2.position.y = 0.8; door.add(ring2);
    }
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.0, 0.07), iron); stile.position.set(-side * (w - 0.02), 1.55, 0); door.add(stile);
    const latch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), gold); latch.position.set(-side * (w - 0.1), 1.3, 0.06); door.add(latch);
    return hinge;
  }
  const left = makeDoor(-1), right = makeDoor(1);

  // ── the garden glow behind the gate ──
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128); grd.addColorStop(0, "rgba(255,240,200,1)"); grd.addColorStop(0.35, "rgba(235,217,160,0.35)"); grd.addColorStop(1, "rgba(235,217,160,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: LAMP, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(9, 7, 1); glow.position.set(0, 1.8, -4); scene.add(glow);
  // tree silhouettes in the garden
  const treeMat = new THREE.MeshBasicMaterial({ color: 0x0c201d });
  for (const [x, z, s] of [[-3.2, -6, 1.3], [2.8, -7, 1.6], [-1.2, -9, 1.9], [4.5, -5, 1.1], [-5, -8, 1.7], [0.9, -11, 2.2]]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 3.2 * s, 7), treeMat); t.position.set(x, 1.6 * s, z); scene.add(t);
  }

  // ── fireflies ──
  const FF = mobile ? 40 : 90, ffPos = new Float32Array(FF * 3), ffSeed = new Float32Array(FF);
  for (let i = 0; i < FF; i++) { ffPos[i * 3] = (Math.random() - 0.5) * 9; ffPos[i * 3 + 1] = 0.3 + Math.random() * 3; ffPos[i * 3 + 2] = -1 - Math.random() * 8; ffSeed[i] = Math.random() * 100; }
  const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ color: 0xfff1b0, size: 0.07, map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(fireflies);

  // ── mist ──
  const smokeTex = (() => { const s = 256, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d");
    for (let i = 0; i < 26; i++) { const x = s / 2 + (Math.random() - 0.5) * s * 0.45, y = s / 2 + (Math.random() - 0.5) * s * 0.45, r = s * (0.12 + Math.random() * 0.22);
      const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, "rgba(255,255,255,0.18)"); grd.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = grd; g.fillRect(0, 0, s, s); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const PUFFS = mobile ? 26 : 55, puffs = [];
  for (let i = 0; i < PUFFS; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: i % 3 ? 0x9fc9c4 : 0xe8dcb4, transparent: true, opacity: 0, depthWrite: false }));
    const behind = i < PUFFS * 0.6;
    m.position.set((Math.random() - 0.5) * (behind ? 4 : 12), 0.3 + Math.random() * 1.1, behind ? -0.5 - Math.random() * 3 : 0.5 + Math.random() * 5);
    const sc = 2.2 + Math.random() * 3; m.scale.set(sc, sc * 0.6, 1);
    m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.02 + Math.random() * 0.03, 0.15 + Math.random() * 0.35), spin: (Math.random() - 0.5) * 0.15, base: 0.18 + Math.random() * 0.22, behind };
    scene.add(m); puffs.push(m);
  }

  // ── the walk ──
  let t0 = performance.now(), raf = 0, visible = true, opened = false, dead = false;
  const pointer = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const easeIO = (x) => (x < 0 ? 0 : x > 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 62 : 42; camera.updateProjectionMatrix();
    // wide screens: stand a little further back so the whole arch is in view
    camEnd.set(0, w / h > 1.2 ? 2.05 : 1.85, w / h > 1.2 ? 9.2 : 7.6); lookY = w / h > 1.2 ? 2.95 : 2.25;
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) tick(); }); io.observe(canvas);
  const onVis = () => !document.hidden && tick(); document.addEventListener("visibilitychange", onVis);
  const onMove = (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; };
  if (!mobile) addEventListener("pointermove", onMove);

  let last = performance.now();
  function frame(now) {
    raf = 0; if (dead || !visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const T = still ? 99 : (now - t0) / 1000;      // seconds since arrival
    const open = easeIO((T - 1.1) / 3.2);           // doors: hold a beat, then swing
    left.rotation.y = open * 1.25; right.rotation.y = -open * 1.25; // swing inward, into the garden
    const light = ease((T - 0.9) / 3.5);
    garden.intensity = 2 + light * 38; glow.material.opacity = 0.15 + light * 0.75;
    path.material.opacity = light * 0.35; fireflies.material.opacity = light * 0.9;
    if (open > 0.6 && !opened) { opened = true; onOpen && onOpen(); }
    // camera walks forward, then breathes
    const walk = easeIO(T / 5.6);
    camera.position.lerpVectors(camStart, camEnd, still ? 1 : walk);
    camera.position.y += Math.sin(T * 1.9) * 0.012 * (1 - walk); // footsteps
    look.x += (pointer.x - look.x) * 0.04; look.y += (pointer.y - look.y) * 0.04;
    camera.position.x += look.x * 0.6; camera.position.y += -look.y * 0.25;
    camera.lookAt(0, lookY, -1);
    // mist rolls out through the opening gate
    for (const m of puffs) {
      const u = m.userData, push = m.userData.behind ? open : 0.3;
      m.position.x += u.v.x * dt; m.position.y += u.v.y * dt * 0.3; m.position.z += u.v.z * dt * (0.4 + push * 1.6);
      m.material.rotation += u.spin * dt;
      if (m.position.z > 7 || m.position.y > 2.4) { m.position.set((Math.random() - 0.5) * 4, 0.3 + Math.random() * 0.6, -2.5 - Math.random() * 1.5); m.material.opacity = 0; }
      const fadeIn = Math.min(1, T / 1.5);
      m.material.opacity += ((u.base * fadeIn * (m.position.z > 5 ? (7 - m.position.z) / 2 : 1)) - m.material.opacity) * 0.05;
    }
    const p = ffGeo.attributes.position.array;
    for (let i = 0; i < FF; i++) { p[i * 3 + 1] += Math.sin(now / 900 + ffSeed[i]) * 0.002; p[i * 3] += Math.cos(now / 1300 + ffSeed[i]) * 0.0015; }
    ffGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    tick();
  }
  function tick() { if (!raf && !dead) raf = requestAnimationFrame(frame); }
  tick();

  return {
    replay() { t0 = performance.now(); opened = false; tick(); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); removeEventListener("pointermove", onMove); renderer.dispose(); pmrem.dispose(); },
  };
}
