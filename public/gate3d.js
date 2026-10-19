// EDEN'S GATE — the 3D entrance.
// Iron gates swing open, mist rolls out, warm light pours through from the garden,
// and the camera walks you up to the threshold. Falls back to the flat SVG gate
// if WebGL isn't available.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const GOLD = 0xc2a24d, LAMP = 0xebd9a0, IVY = 0x3d7d7b, DUSK = 0x12302c;

export function startGate(canvas, { onOpen, onPick, mode = "night" } = {}) {
  const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DUSK, 0.085);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  let lookY = 2.25;
  const camStart = new THREE.Vector3(0, 1.5, 13.5), camEnd = new THREE.Vector3(0, 1.85, 7.6);
  camera.position.copy(still ? camEnd : camStart);

  // ── light ──
  const hemi = new THREE.HemisphereLight(0x6fa6a2, 0x0a1a17, 0.35); scene.add(hemi);
  const garden = new THREE.PointLight(LAMP, 0, 30, 1.4); garden.position.set(0, 2.2, -3.5); scene.add(garden);
  const rimL = new THREE.SpotLight(0xffe8b8, 30, 20, Math.PI / 7, 0.7, 1.5); rimL.position.set(-5, 7, 6); rimL.target.position.set(0, 1.5, 0); scene.add(rimL, rimL.target);
  const rimR = rimL.clone(); rimR.position.set(5, 7, 6); rimR.target = rimL.target; scene.add(rimR);

  // ── ground ──
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f2622, roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // a path of light through the gate
  const pathTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, "rgba(235,217,160,0.9)"); grd.addColorStop(1, "rgba(235,217,160,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 256); return new THREE.CanvasTexture(c); })();
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 9), new THREE.MeshBasicMaterial({ map: pathTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 1.5); scene.add(path);

  const standIn = new THREE.Group(); scene.add(standIn);   // simple gate shown until the Blender model arrives
  // ── stone pillars + arch ──
  const stone = new THREE.MeshStandardMaterial({ color: 0x2c4a45, roughness: 0.85, metalness: 0.05 });
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1d1a14, metalness: 0.85, roughness: 0.42 });
  const W = 1.55; // half the opening
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.6, 0.62), stone); p.position.set(s * (W + 0.31), 1.8, 0); standIn.add(p);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.8), stone); cap.position.set(s * (W + 0.31), 3.69, 0); standIn.add(cap);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), gold); ball.position.set(s * (W + 0.31), 3.98, 0); standIn.add(ball);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.66), gold); band.position.set(s * (W + 0.31), 3.2, 0); standIn.add(band);
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(W + 0.31, 0.12, 16, 80, Math.PI), iron); arch.position.set(0, 3.6, 0); standIn.add(arch);
  const archGold = new THREE.Mesh(new THREE.TorusGeometry(W + 0.12, 0.035, 10, 80, Math.PI), gold); archGold.position.set(0, 3.6, 0); standIn.add(archGold);

  // ── the Alec Penn Radio wave seal, in gold ──
  // outer ring, inner ring, the wave, and three dots (same shape as the APR logo)
  function waveSeal(R) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.13, 12, 48), gold));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, R * 0.045, 8, 48), gold));
    const r2 = R * 0.8, pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(-r2 + 2 * r2 * t, R * 0.34 * Math.sin(3 * Math.PI * t), 0)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, R * 0.065, 8, false), gold));
    for (const dx of [-1, 0, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(R * 0.075, 12, 8), gold); d.position.set(dx * R * 0.2, -R * 0.62, 0); g.add(d); }
    return g;
  }

  // ── the doors ──
  function makeDoor(side) {
    const hinge = new THREE.Group(); hinge.position.set(side * W, 0, 0); standIn.add(hinge);
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
    // Alec Penn Radio wave seals set into the gate, with small rings below
    for (let k = 0; k < 3; k++) {
      const seal = waveSeal(0.2); seal.position.set(-side * (0.3 + k * 0.48), 1.85, 0); door.add(seal);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.018, 10, 36), gold); ring2.position.set(-side * (0.3 + k * 0.48), 0.8, 0); door.add(ring2);
    }
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.0, 0.07), iron); stile.position.set(-side * (w - 0.02), 1.55, 0); door.add(stile);
    const latch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), gold); latch.position.set(-side * (w - 0.1), 1.3, 0.06); door.add(latch);
    return hinge;
  }
  let left = makeDoor(-1), right = makeDoor(1), swing = 0.92;

  // ── the real gate: mossy stone arch, gold doors with the Wave Seal split down the middle (modelled in Blender) ──
  const gl = new GLTFLoader(); gl.setMeshoptDecoder(MeshoptDecoder);
  gl.load("/gate.glb", (g) => {
    if (dead) return;
    const model = g.scene, S = 0.8;
    model.scale.setScalar(S); scene.add(model);
    const dl = model.getObjectByName("DoorL"), dr = model.getObjectByName("DoorR");
    if (!dl || !dr) { scene.remove(model); return; }
    model.traverse((o) => { if (o.isMesh) { o.material.envMapIntensity = 0.6; } });
    // the doors' long cross-bars point straight at you once the gate is open and read as a line across the
    // archway, so only the low bar stays (the bars are held by the arch and the medallion)
    model.updateMatrixWorld(true);
    for (const door of [dl, dr]) door.traverse((o) => {
      if (!o.isMesh) return;
      const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3());
      if (sz.x > 0.6 && sz.y < 0.12 && b.getCenter(new THREE.Vector3()).y > 0.6) o.visible = false;
    });
    scene.remove(standIn); left = dl; right = dr; swing = 1.42;
    tick();
  });

  // ── the garden glow behind the gate ──
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128); grd.addColorStop(0, "rgba(255,240,200,1)"); grd.addColorStop(0.35, "rgba(235,217,160,0.35)"); grd.addColorStop(1, "rgba(235,217,160,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: LAMP, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(9, 7, 1); glow.position.set(0, 1.8, -4); scene.add(glow);
  // tree silhouettes in the garden (stand-ins until the modelled garden loads)
  const oldTrees = new THREE.Group(); scene.add(oldTrees);
  const treeMat = new THREE.MeshBasicMaterial({ color: 0x0c201d });
  for (const [x, z, s] of [[-3.2, -6, 1.3], [2.8, -7, 1.6], [-1.2, -9, 1.9], [4.5, -5, 1.1], [-5, -8, 1.7], [0.9, -11, 2.2]]) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 3.2 * s, 7), treeMat); t.position.set(x, 1.6 * s, z); oldTrees.add(t);
  }

  // ── the garden behind the gate (modelled in Blender): cypress avenue, blossom trees, flowering hedges,
  //    a stepping-stone path with gold lanterns, and a little pond at the end ──
  const lanternMats = [];
  gl.load(mobile ? "/garden-lite.glb" : "/garden.glb", (g) => {   // phones get a lighter cut of the same garden
    if (dead) return;
    const garden = g.scene; garden.scale.setScalar(0.8); garden.position.z = -0.25;
    garden.traverse((o) => { if (o.isMesh) {
      const m = o.material; m.envMapIntensity = 0.5;
      if (m.name === "LanternGlow") lanternMats.push(m);
      if (/^Leaf|Cypress|Hedge|Canopy|Grass|Moss/.test(m.name) && !m.userData.base) { m.userData.base = seasonTint(m.name, m.color.clone()); leafMats.push(m); }
      if (o.isInstancedMesh && !m.userData.sway) { m.userData.sway = true; addSway(m, /^Leaf|Blossom|Rose|CypressLeaf|Grass|Sepal/.test(m.name)); }
    } });
    scene.add(garden); scene.remove(oldTrees);
    // the rose bushes that line the path become the library's beds, one collection each
    garden.updateMatrixWorld(true);
    const seen = new Set(), m4 = new THREE.Matrix4(), v = new THREE.Vector3();
    garden.traverse((o) => {
      if (!o.isInstancedMesh || !/^Rose/.test(o.material.name)) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld);
        const key = v.x.toFixed(2) + "," + v.z.toFixed(2);
        if (!seen.has(key) && Math.abs(v.x) < 1.9 && v.z < -0.5) { seen.add(key); bedSpots.push(v.clone()); }
      }
    });
    garden.traverse((o) => { if (o.isMesh && o.material && o.material.name === "Water" && !pondSpot) {
      const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
      pondSpot = new THREE.Vector3(c.x + (bb.max.x - bb.min.x) * 0.5 + 0.25, 0, c.z + (bb.max.z - bb.min.z) * 0.2); pondFace = c.clone(); } });
    bedSpots.sort((a, b) => b.z - a.z || a.x - b.x);
    if (bedSpots.length) PATH_END = bedSpots[Math.min(bedSpots.length, 18) - 1].z + 2.6;   // stop where you can still read the last bed
    placeBeds(); tick();
  });
  const leafMats = [], leafNight = new THREE.Color(0x163a30);

  // ══════════ THE LIVING GARDEN ══════════
  // the season follows the real calendar (try ?season=winter / spring / summer / autumn)
  const SEASON = (() => {
    const q = new URLSearchParams(location.search).get("season");
    if (/^(spring|summer|autumn|winter)$/.test(q || "")) return q;
    const m = new Date().getMonth();
    return m <= 1 || m === 11 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
  })();
  function seasonTint(name, c) {
    if (SEASON === "autumn") {
      if (name === "LeafA") return c.setRGB(0.78, 0.3, 0.06);        // copper
      if (name === "LeafB") return c.setRGB(0.95, 0.6, 0.12);        // gold
      if (name === "LeafD") return c.setRGB(0.85, 0.22, 0.08);       // red maple
      if (name === "LeafE") return c.setRGB(0.42, 0.24, 0.07);       // brown
      if (name === "Grass") return c.lerp(new THREE.Color(0.5, 0.45, 0.2), 0.4);
      if (name === "Canopy") return c.lerp(new THREE.Color(0.55, 0.28, 0.07), 0.6);
    }
    if (SEASON === "winter") {
      if (name === "Hedge" || name === "Cypress" || name === "CypressLeaf") return c.lerp(new THREE.Color(0.75, 0.82, 0.85), 0.25);
      return c.lerp(new THREE.Color(0.62, 0.68, 0.7), 0.45);       // frosted
    }
    if (SEASON === "spring" && (name === "LeafB" || name === "LeafD")) return c.setRGB(0.42, 0.72, 0.3);
    return c;
  }
  // wind: every tree, bush and leaf bends and flutters in the breeze (done on the graphics card, so it's free)
  const wind = { value: 0 };
  function addSway(mat, flutter) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uWind = wind;
      sh.vertexShader = "uniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix[3].xyz;
        #endif
        float ph = ip.x * 0.37 + ip.z * 0.21;
        float h = max(position.y, 0.0);
        float bend = (sin(uWind * 1.1 + ph) * 0.7 + sin(uWind * 2.3 + ph * 1.7) * 0.3) * 0.006 * h * h;
        transformed.x += bend; transformed.z += bend * 0.5;
        ${flutter ? "transformed += normal * sin(uWind * 7.0 + position.x * 23.0 + position.z * 17.0) * 0.012 * min(h, 2.0);" : ""}`);
    };
    mat.needsUpdate = true;
  }

  const sprite = (draw) => { const c = document.createElement("canvas"); c.width = c.height = 64; draw(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const leafTex = sprite((g) => { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(32, 32, 26, 13, 0.7, 0, Math.PI * 2); g.fill(); });
  const flakeTex = sprite((g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.5, "rgba(255,255,255,0.7)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });

  // falling things: autumn leaves, spring petals, summer petals, winter snow
  const FALL = still ? 0 : (SEASON === "winter" ? (mobile ? 260 : 600) : (mobile ? 90 : 190));
  const fallPos = new Float32Array(FALL * 3), fallCol = new Float32Array(FALL * 3), fallSeed = new Float32Array(FALL);
  const palette = { autumn: [0xc8501a, 0xe8a12a, 0x9e2f14, 0xd9772a], spring: [0xf6a6c1, 0xffd6e4, 0xf38fb3, 0xffffff], summer: [0xffffff, 0xf6a6c1, 0xfff0b0], winter: [0xffffff] }[SEASON];
  for (let i = 0; i < FALL; i++) {
    fallPos[i * 3] = (Math.random() - 0.5) * 18; fallPos[i * 3 + 1] = Math.random() * 9; fallPos[i * 3 + 2] = -14 + Math.random() * 20;
    new THREE.Color(palette[i % palette.length]).toArray(fallCol, i * 3); fallSeed[i] = Math.random() * 100;
  }
  const fallGeo = new THREE.BufferGeometry();
  fallGeo.setAttribute("position", new THREE.BufferAttribute(fallPos, 3)); fallGeo.setAttribute("color", new THREE.BufferAttribute(fallCol, 3));
  const falling = new THREE.Points(fallGeo, new THREE.PointsMaterial({ size: SEASON === "winter" ? 0.09 : 0.13, map: SEASON === "winter" ? flakeTex : leafTex, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.05 }));
  if (FALL) scene.add(falling);
  const fallSpeed = SEASON === "winter" ? 0.55 : SEASON === "autumn" ? 0.7 : 0.45;

  // butterflies, by day (not in winter)
  const butterflies = [];
  if (!still && SEASON !== "winter") {
    const wingCols = ["#f6a6c1", "#9ec8ff", "#ffd36b", "#c9a6ff", "#ffffff"];
    for (let i = 0; i < (mobile ? 6 : 11); i++) {
      const col = wingCols[i % wingCols.length];
      const tex = sprite((g) => { g.fillStyle = col; g.beginPath(); g.ellipse(22, 22, 20, 14, -0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(24, 46, 13, 10, 0.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(60,30,20,0.55)"; g.beginPath(); g.arc(20, 22, 5, 0, Math.PI * 2); g.fill(); });
      const wm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.1 });
      const b = new THREE.Group(), wl = new THREE.Group(), wr = new THREE.Group();
      const geo = new THREE.PlaneGeometry(0.16, 0.16); geo.translate(0.08, 0, 0);
      const ml = new THREE.Mesh(geo, wm), mr = new THREE.Mesh(geo, wm); mr.scale.x = -1;
      wl.add(ml); wr.add(mr); b.add(wl, wr); wl.rotation.x = wr.rotation.x = -Math.PI / 2;
      b.userData = { wl, wr, mat: wm, ax: 2 + Math.random() * 6, az: 1.5 + Math.random() * 5, cx: (Math.random() - 0.5) * 8, cz: -2 - Math.random() * 7, y: 0.5 + Math.random() * 1.6, sp: 0.15 + Math.random() * 0.2, ph: Math.random() * 10, flap: 14 + Math.random() * 8 };
      scene.add(b); butterflies.push(b);
    }
  }

  // shooting stars, at night
  const streakTex = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 8; const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 256, 0); grd.addColorStop(0, "rgba(255,255,255,0)"); grd.addColorStop(0.85, "rgba(255,248,220,0.9)"); grd.addColorStop(1, "rgba(255,255,255,1)");
    g.fillStyle = grd; g.fillRect(0, 2, 256, 4); return new THREE.CanvasTexture(c); })();
  const shooter = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.07), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const shooterHolder = new THREE.Group(); shooterHolder.add(shooter); scene.add(shooterHolder);
  let shootAt = 5 + Math.random() * 6, shootT = -1, shootDir = new THREE.Vector3(), shootFrom = new THREE.Vector3();

  function liveGarden(T, dt) {
    wind.value = T;
    const day = kk;
    if (FALL) {
      const a = fallGeo.attributes.position.array;
      for (let i = 0; i < FALL; i++) {
        const sd = fallSeed[i];
        a[i * 3 + 1] -= fallSpeed * dt * (0.6 + (sd % 1) * 0.8);
        a[i * 3] += (Math.sin(T * 1.3 + sd) * 0.35 + 0.15) * dt;            // drift and tumble in the breeze
        a[i * 3 + 2] += Math.cos(T * 0.9 + sd * 1.7) * 0.2 * dt;
        if (a[i * 3 + 1] < 0) { a[i * 3 + 1] = 7 + Math.random() * 2; a[i * 3] = (Math.random() - 0.5) * 18; }
        const dx = a[i * 3] - camera.position.x, dy = a[i * 3 + 1] - camera.position.y, dzz = a[i * 3 + 2] - camera.position.z;
        if (dx * dx + dy * dy + dzz * dzz < 1.2) a[i * 3 + 1] = 8;
      }
      fallGeo.attributes.position.needsUpdate = true;
      falling.material.opacity = SEASON === "winter" ? 0.95 : 0.9;
    }
    for (const b of butterflies) {
      const u = b.userData, t = T * u.sp + u.ph;
      const x = u.cx + Math.sin(t) * u.ax, z = u.cz + Math.sin(t * 1.7) * u.az, y = u.y + Math.sin(t * 2.3) * 0.4 + Math.sin(T * 5 + u.ph) * 0.05;
      const nx = u.cx + Math.sin(t + 0.05) * u.ax, nz = u.cz + Math.sin((t + 0.05) * 1.7) * u.az;
      b.position.set(x, y, z); b.rotation.y = Math.atan2(nx - x, nz - z) + Math.PI / 2;
      const f = Math.sin(T * u.flap) * 0.9; u.wl.rotation.y = f; u.wr.rotation.y = -f;
      u.mat.opacity = Math.max(0, (day - 0.3) / 0.7); b.visible = day > 0.3;
    }
    // shooting star
    if (day < 0.5 && T > shootAt && shootT < 0) {
      shootT = 0; shootFrom.set(-14 + Math.random() * 20, 12 + Math.random() * 6, -26);
      shootDir.set(0.8 + Math.random() * 0.6, -0.35 - Math.random() * 0.3, 0).normalize();
    }
    if (shootT >= 0) {
      shootT += dt; const k = shootT / 0.9;
      shooterHolder.position.copy(shootFrom).addScaledVector(shootDir, k * 16);
      shooterHolder.lookAt(camera.position); shooter.rotation.z = Math.atan2(-shootDir.y, shootDir.x) * -1;
      shooter.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * (1 - day);
      if (k >= 1) { shootT = -1; shooter.material.opacity = 0; shootAt = T + 6 + Math.random() * 10; }
    }
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

  // ══════════ DAY & NIGHT ══════════
  // sky dome
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.8)),1.0); }",
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), skyMat); scene.add(sky);
  const P = {
    night: { top: new THREE.Color(0x061412), horizon: new THREE.Color(0x12302c), fog: new THREE.Color(0x12302c), fogD: 0.085, ground: new THREE.Color(0x0f2622),
             hemiSky: new THREE.Color(0x6fa6a2), hemiGround: new THREE.Color(0x0a1a17), hemiI: 0.35, garden: new THREE.Color(0xebd9a0), exposure: 1.1, mist: new THREE.Color(0x9fc9c4) },
    day:   { top: new THREE.Color(0x6fa8c4), horizon: new THREE.Color(0xf3e3b8), fog: new THREE.Color(0xd9e4d6), fogD: 0.045, ground: new THREE.Color(0x4f7a4a),
             hemiSky: new THREE.Color(0xcfe6f2), hemiGround: new THREE.Color(0x3f5f39), hemiI: 1.25, garden: new THREE.Color(0xfff0c8), exposure: 1.0, mist: new THREE.Color(0xffffff) },
  };

  if (SEASON === "winter") { P.day.ground.setRGB(0.86, 0.9, 0.92); P.night.ground.setRGB(0.16, 0.22, 0.26); }   // snow on the ground
  if (SEASON === "autumn") { P.day.ground.lerp(new THREE.Color(0.55, 0.45, 0.22), 0.35); }                       // fallen leaves

  // sun: a blazing disc behind the garden, shafts of light that flicker through the gate
  const sunGroup = new THREE.Group(); sunGroup.position.set(0, 4.6, -16); scene.add(sunGroup);
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sunDisc.scale.set(5, 5, 1); sunGroup.add(sunDisc);
  const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd98a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sunHalo.scale.set(22, 22, 1); sunGroup.add(sunHalo);
  const rayTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 512; const g = c.getContext("2d");
    const v = g.createLinearGradient(0, 0, 0, 512); v.addColorStop(0, "rgba(255,244,214,0.95)"); v.addColorStop(1, "rgba(255,244,214,0)");
    g.fillStyle = v; g.fillRect(0, 0, 64, 512);
    const hgr = g.createLinearGradient(0, 0, 64, 0); hgr.addColorStop(0, "rgba(0,0,0,1)"); hgr.addColorStop(0.5, "rgba(0,0,0,0)"); hgr.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = hgr; g.fillRect(0, 0, 64, 512);
    return new THREE.CanvasTexture(c); })();
  const rays = [];
  for (let i = 0; i < (mobile ? 6 : 10); i++) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    const ang = (i / ((mobile ? 6 : 10) - 1) - 0.5) * 0.9;
    r.geometry.translate(0, -0.5, 0); r.scale.set(0.7 + Math.random() * 1.4, 22, 1);
    r.position.set(0, 4.6, -15); r.rotation.set(-1.15, 0, ang); // fan out from the sun toward the viewer
    r.userData = { phase: Math.random() * 10, speed: 0.6 + Math.random() * 1.4, base: 0.05 + Math.random() * 0.07 };
    scene.add(r); rays.push(r);
  }
  const sunLight = new THREE.DirectionalLight(0xfff0d0, 0); sunLight.position.set(0, 6, -12); sunLight.target.position.set(0, 0, 4); scene.add(sunLight, sunLight.target);

  // clouds drifting across the sky
  const clouds = [];
  for (let i = 0; i < (mobile ? 7 : 12); i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    const sc = 6 + Math.random() * 8; c.scale.set(sc * 1.8, sc * 0.7, 1);
    c.position.set(-26 + Math.random() * 52, 7 + Math.random() * 5, -24 + Math.random() * 8);
    c.userData = { v: 0.25 + Math.random() * 0.45, base: 0.55 + Math.random() * 0.35 };
    scene.add(c); clouds.push(c);
  }

  // crescent moon + stars
  const moonTex = (() => { const s = 256, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d");
    g.fillStyle = "#fbf3d6"; g.beginPath(); g.arc(s / 2, s / 2, s * 0.36, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(s / 2 + s * 0.17, s / 2 - s * 0.08, s * 0.33, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const moon = new THREE.Group(); moon.position.set(-3.4, 7.6, -18); scene.add(moon);
  const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false })); moonDisc.scale.set(3.2, 3.2, 1); moon.add(moonDisc);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xcfe3ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); moonGlow.scale.set(12, 12, 1); moon.add(moonGlow);
  const moonLight = new THREE.DirectionalLight(0xbfd8ff, 0); moonLight.position.set(-4, 8, -10); moonLight.target.position.set(0, 0, 2); scene.add(moonLight, moonLight.target);
  const STARS = mobile ? 300 : 650, sp = new Float32Array(STARS * 3), sPhase = new Float32Array(STARS), sSpeed = new Float32Array(STARS), sSize = new Float32Array(STARS);
  for (let i = 0; i < STARS; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2 + 0.15, r = 36;
    sp[i * 3] = Math.cos(th) * Math.cos(ph) * r; sp[i * 3 + 1] = Math.sin(ph) * r; sp[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r - 6;
    sPhase[i] = Math.random() * 6.283; sSpeed[i] = 0.6 + Math.random() * 2.6; sSize[i] = Math.random() < 0.08 ? 2.6 + Math.random() * 1.6 : 0.9 + Math.random() * 1.2; }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1)); starGeo.setAttribute("aSpeed", new THREE.BufferAttribute(sSpeed, 1)); starGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
  // each star twinkles on its own rhythm; a few bright ones flare now and then
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uMap: { value: glowTex }, uScale: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aPhase; attribute float aSpeed; attribute float aSize; uniform float uTime; uniform float uScale; varying float vTw;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
        float s = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
        float flare = pow(max(0.0, sin(uTime * 0.37 * aSpeed + aPhase * 3.0)), 24.0);
        vTw = 0.25 + 0.75 * s * s + flare * 0.8;
        gl_PointSize = aSize * uScale * (1.6 + 0.8 * s + flare * 2.5) * (60.0 / -mv.z);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; varying float vTw;
      void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * t.rgb, t.a * vTw * uOpacity); }`,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // the black cat, sitting in the gateway
  const cat = new THREE.Group(); cat.position.set(0.3, 0, -0.2); cat.rotation.y = -0.35; cat.scale.setScalar(1.35); scene.add(cat);
  const fur = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.75, metalness: 0, envMapIntensity: 0.15, transparent: true, opacity: 1 });
  const blob = (r, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), fur); m.scale.set(sx, sy, sz); m.position.set(x, y, z); cat.add(m); return m; };
  blob(0.3, 1, 1.15, 0.95, 0, 0.36, -0.05);      // haunches
  blob(0.2, 1, 1.25, 1, 0, 0.58, 0.1);           // chest
  const head = new THREE.Group(); head.position.set(0, 0.88, 0.14); cat.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), fur); skull.scale.set(1.08, 0.95, 1); head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), fur); muzzle.position.set(0, -0.04, 0.12); muzzle.scale.set(1.2, 0.8, 0.9); head.add(muzzle);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 4), fur); ear.position.set(sx * 0.085, 0.14, -0.01); ear.rotation.z = -sx * 0.25; head.add(ear);
    const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.38, 10), fur); paw.position.set(sx * 0.08, 0.2, 0.2); cat.add(paw);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd9ec7a, fog: false });
  const eyes = [];
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), eyeMat); e.position.set(sx * 0.055, 0.02, 0.135); e.scale.set(1, 0.75, 0.5); head.add(e); eyes.push(e); }
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.12, -0.28), new THREE.Vector3(0.25, 0.05, -0.18), new THREE.Vector3(0.34, 0.04, 0.08), new THREE.Vector3(0.22, 0.05, 0.3), new THREE.Vector3(0.05, 0.09, 0.34)]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 32, 0.035, 8, false), fur); cat.add(tail);
  const tailTip = new THREE.Group(); cat.add(tailTip);
  let blinkAt = 3, flickAt = 5;
  // Tommy (the real one: black cat, wizard hat, gold APR pendant) takes the cat's seat in the gateway
  let tommy = null, tommyLids = [], tommyRest = new Map(), tBlink = 4;
  gl.load("/tommy.glb", (g) => {
    if (dead) return;
    const t = g.scene, box = new THREE.Box3().setFromObject(t), sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const k = 1.55 / sz.y; t.scale.setScalar(k); t.position.set(-c.x * k, -box.min.y * k, -c.z * k);
    t.traverse((o) => { const m = o.material; if (m && "sheen" in m && m.sheen > 0) { m.sheen = 0.3; m.sheenRoughness = 0.5; } });
    tommy = new THREE.Group(); tommy.add(t); tommy.position.set(0.35, 0, -0.1); tommy.rotation.y = -0.3; scene.add(tommy);
    tommyLids = ["TLidL", "TLidR"].map((n) => t.getObjectByName(n)).filter(Boolean);
    tommyLids.forEach((l) => tommyRest.set(l, l.quaternion.clone()));
    cat.visible = false; tick();
  });
  const qx = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);

  let target = mode === "day" ? 1 : 0, kk = target; // 0 = night, 1 = day
  const tmp = new THREE.Color(), treeNight = new THREE.Color(0x0c201d), treeDay = new THREE.Color(0x2e5a3c);
  function applyMode(k, T, now) {
    const n = P.night, d = P.day, mix = (a, b) => tmp.copy(a).lerp(b, k);
    skyMat.uniforms.top.value.copy(n.top).lerp(d.top, k); skyMat.uniforms.horizon.value.copy(n.horizon).lerp(d.horizon, k);
    scene.fog.color.copy(mix(n.fog, d.fog)); scene.fog.density = n.fogD + (d.fogD - n.fogD) * k;
    groundMat.color.copy(mix(n.ground, d.ground)); treeMat.color.copy(mix(treeNight, treeDay));
    hemi.color.copy(mix(n.hemiSky, d.hemiSky)); hemi.groundColor.copy(mix(n.hemiGround, d.hemiGround)); hemi.intensity = n.hemiI + (d.hemiI - n.hemiI) * k;
    renderer.toneMappingExposure = n.exposure + (d.exposure - n.exposure) * k;
    garden.color.copy(mix(n.garden, d.garden));
    // sun: flicker like light through moving leaves
    const flick = 0.85 + 0.1 * Math.sin(T * 3.1) + 0.05 * Math.sin(T * 7.3 + 1.7);
    sunGroup.visible = k > 0.01; sunDisc.material.opacity = k * flick; sunHalo.material.opacity = k * 0.55 * flick;
    sunLight.intensity = k * 2.4 * flick;
    for (const r of rays) { const u = r.userData; r.material.opacity = k * u.base * (0.55 + 0.45 * Math.sin(T * u.speed + u.phase)) * Math.min(1, T / 2); }
    for (const c of clouds) { c.material.opacity = k * c.userData.base; }
    // night: moon, stars, cat
    moon.visible = k < 0.99; moonDisc.material.opacity = 1 - k; moonGlow.material.opacity = (1 - k) * 0.45;
    moonLight.intensity = (1 - k) * 0.9;
    starMat.uniforms.uOpacity.value = (1 - k); starMat.uniforms.uTime.value = T;
    cat.visible = !tommy && k < 0.98; fur.opacity = 1 - k; eyeMat.color.setRGB(0.85, 0.92, 0.48).multiplyScalar(1 - k);
    fireflies.visible = k < 0.95;
    for (const m of leafMats) m.color.copy(leafNight).lerp(m.userData.base, 0.35 + 0.65 * k);
    for (const m of lanternMats) m.emissiveIntensity = 1.2 + (1 - k) * 4;
  }

  // ══════════ WALK INTO THE GARDEN: the library as a place ══════════
  // Each rose bed along the path is one collection. Walk the path (scroll, swipe, arrows), tap a sign to play it.
  const bedSpots = [], beds = [];
  let pondSpot = null, pondFace = null;
  let bedList = [], gmode = "gate", gz = 4, gzTarget = 4, gk = 0, picked = null;
  const tags = document.createElement("div"); tags.className = "bed-tags"; canvas.parentElement.appendChild(tags);
  const pickLight = new THREE.PointLight(0xffe4a0, 0, 4, 1.6); scene.add(pickLight);
  function placeBeds() {
    tags.innerHTML = ""; beds.length = 0;
    bedList.forEach((b, i) => {
      const at = bedSpots[i]; if (!at) return;
      const el = document.createElement("button"); el.type = "button"; el.className = "bed-tag"; el.tabIndex = -1;
      el.innerHTML = `<b>${b.name.replace(/[&<>]/g, "")}</b><small>${b.n} songs</small>`;
      el.onclick = () => { picked = b.slug; beds.forEach((x) => x.el.classList.toggle("on", x.slug === picked)); onPick && onPick(b.slug); };
      tags.appendChild(el); beds.push({ ...b, at, el });
    });
  }
  const proj = new THREE.Vector3();
  function updateTags() {
    const w = canvas.clientWidth, h = canvas.clientHeight, show = gmode === "garden" || (gmode === "entering" && gk > 0.7);
    tags.classList.toggle("show", show);
    for (const b of beds) {
      const d = camera.position.distanceTo(b.at);
      proj.copy(b.at); proj.y += 0.95; proj.project(camera);
      const vis = show && proj.z < 1 && d < 10 && d > 0.9;
      b.el.style.display = vis ? "" : "none"; b.el.tabIndex = vis ? 0 : -1;
      if (!vis) continue;
      const k = Math.max(0.55, Math.min(1.15, 3.2 / d));
      const half = b.el.offsetWidth * k / 2 + 6, sx = Math.max(half, Math.min(w - half, (proj.x * 0.5 + 0.5) * w));   // keep signs on screen
      if (Math.abs(proj.x) > 1.25) { b.el.style.display = "none"; b.el.tabIndex = -1; continue; }
      b.el.style.transform = `translate(${sx}px, ${(-proj.y * 0.5 + 0.5) * h}px) translate(-50%, -100%) scale(${k})`;
      b.el.style.opacity = Math.min(1, (10 - d) / 3).toFixed(2);
      b.el.style.zIndex = String(100 - Math.round(d * 5));
    }
    const p = beds.find((b) => b.slug === picked);
    pickLight.intensity = p && gmode !== "gate" ? 6 + Math.sin(performance.now() / 300) * 1.5 : 0;
    if (p) pickLight.position.set(p.at.x, p.at.y + 0.8, p.at.z);
  }
  let PATH_END = -9; const GARDEN_START = 2.6;   // you start just inside the gate; forward is always the same way
  function walkBy(dz) { if (gmode === "garden" || gmode === "entering") { gzTarget = Math.max(PATH_END, Math.min(GARDEN_START, gzTarget - dz)); tick(); } }
  const onWheel = (e) => { if (gmode !== "garden" && gmode !== "entering") return; e.preventDefault(); walkBy(e.deltaY * 0.006); };
  let touchY = null;
  const onTouchStart = (e) => { if (gmode === "garden" || gmode === "entering") touchY = e.touches[0].clientY; };
  const onTouchMove = (e) => { if ((gmode !== "garden" && gmode !== "entering") || touchY === null) return; e.preventDefault(); const y = e.touches[0].clientY; walkBy((touchY - y) * 0.012); touchY = y; };
  const onKey = (e) => { if (gmode !== "garden" && gmode !== "entering") return; if (e.key === "ArrowUp" || e.key === "w") walkBy(1.2); if (e.key === "ArrowDown" || e.key === "s") walkBy(-1.2); };
  canvas.parentElement.addEventListener("wheel", onWheel, { passive: false });
  canvas.parentElement.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.parentElement.addEventListener("touchmove", onTouchMove, { passive: false });
  addEventListener("keydown", onKey);
  const gardenCam = new THREE.Vector3(), gardenLook = new THREE.Vector3(), fromPos = new THREE.Vector3(), fromLook = new THREE.Vector3(0, 2.6, -1);
  let gT = 0, gAmt = 0;
  function gardenCamera(dt) {
    // where you'd be standing on the path, and where you'd be looking (a little ahead, down the path)
    gz += (gzTarget - gz) * Math.min(1, dt * 3);
    const sway = Math.sin(gz * 0.6) * 0.12;
    const nearGate = Math.max(0, Math.min(1, (gz + 0.8) / 2.6));          // step around Tommy on the way through
    gardenCam.set(sway - nearGate * 0.75 + look.x * 0.5, 1.6 + nearGate * 0.25 + Math.sin(gz * 2.4) * 0.025, gz);
    gardenLook.set(sway * 0.5 + look.x * 2.2, 1.25 - look.y * 0.8, gz - 4);
    if (gmode === "entering" || gmode === "leaving") {
      gT += dt; gk = Math.min(1, gT / 2.6); const e = easeIO(gk), k = gmode === "entering" ? e : 1 - e;
      camera.position.lerpVectors(fromPos, gardenCam, k);
      const lk = new THREE.Vector3().lerpVectors(fromLook, gardenLook, k); camera.lookAt(lk);
      if (gk >= 1) { if (gmode === "entering") gmode = "garden"; else { gmode = "gate"; } }
    } else { camera.position.copy(gardenCam); camera.lookAt(gardenLook); }
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

  // ── Tommy in the garden: trots along ahead of you, sits by the bed that's playing, naps by the pond at night ──
  let tGarden = false, tHead = 0, tStride = 0, tNap = 0, tZ = null;
  const tGoal = new THREE.Vector3(), tTmp = new THREE.Vector3();
  function zzz() {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.font = "italic 700 64px Georgia, serif"; g.fillStyle = "#f6e7b8"; g.textAlign = "center"; g.fillText("z", 64, 84);
    const ms = []; for (let i = 0; i < 3; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false, fog: false })); scene.add(m); ms.push(m); }
    return ms;
  }
  function tommyInGarden(T, dt) { window._tdbg = () => ({ pos: tommy.position.toArray().map(v=>+v.toFixed(2)), goal: tGoal.toArray().map(v=>+v.toFixed(2)), cam: camera.position.toArray().map(v=>+v.toFixed(2)), scale: +tommy.scale.x.toFixed(2), picked, nap: +tNap.toFixed(2), pond: pondSpot && pondSpot.toArray().map(v=>+v.toFixed(2)) });
    const night = kk < 0.4, bed = beds.find((x) => x.slug === picked);
    let mode = "wander";
    if (night && pondSpot) { tGoal.copy(pondSpot); mode = "nap"; }
    else if (bed) { tGoal.set(Math.sign(bed.at.x) * 0.32, 0, Math.min(bed.at.z + 0.2, gz - 3.9)); mode = "sit"; }   // by the bed, but where you can see him
    else tGoal.set(0.22 + Math.sin(T * 0.23) * 0.15, 0, Math.min(1.2, gz - 3.5));
    tTmp.subVectors(tGoal, tommy.position); tTmp.y = 0; const d = tTmp.length();
    const moving = d > (mode === "wander" ? 0.6 : 0.08);
    tStride += ((moving ? 1 : 0) - tStride) * Math.min(1, dt * 5);
    if (moving) { tommy.position.addScaledVector(tTmp.normalize(), Math.min(d, dt * (tommy.position.z > gz - 2.4 ? 4.5 : d > 3 ? 2.4 : 1.3)));
      const want = Math.atan2(tTmp.x, tTmp.z); let dd = want - tHead; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; tHead += dd * Math.min(1, dt * 6); }
    else {   // settled: face you (or the water, if he's napping)
      const f = mode === "nap" && pondFace ? Math.atan2(pondFace.x - tommy.position.x, pondFace.z - tommy.position.z) + 1.2 : Math.atan2(camera.position.x - tommy.position.x, camera.position.z - tommy.position.z) + Math.sin(T * 0.4) * 0.15;
      let dd = f - tHead; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; tHead += dd * Math.min(1, dt * 2);
    }
    tNap += (((mode === "nap" && !moving) ? 1 : 0) - tNap) * Math.min(1, dt * 1.2);
    const w = T * 10, sc = 1 - 0.42 * gAmt;                       // smaller in the garden so the roses are taller than him
    tommy.scale.set(sc, sc * (1 - 0.32 * tNap + 0.012 * Math.sin(T * 1.6) * tNap), sc * (1 + 0.12 * tNap));
    tommy.position.y = Math.abs(Math.sin(w)) * 0.06 * tStride;
    tommy.rotation.set(-Math.cos(w) * 0.05 * tStride, tHead, 0);
    // little z's float up while he naps
    if (tNap > 0.3 && !tZ) tZ = zzz();
    if (tZ) tZ.forEach((z, i) => { const ph = ((T * 0.35 + i / 3) % 1); z.position.set(tommy.position.x + 0.15 + ph * 0.25, 0.55 * sc + ph * 0.6, tommy.position.z);
      z.scale.setScalar(0.12 + ph * 0.12); z.material.opacity = tNap * Math.sin(ph * Math.PI) * 0.9; });
  }

  let last = performance.now();
  function frame(now) {
    raf = 0; if (dead || !visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const T = still ? 99 : (now - t0) / 1000;      // seconds since arrival
    const open = easeIO((T - 1.1) / 3.2);           // doors: hold a beat, then swing
    left.rotation.y = open * swing; right.rotation.y = -open * swing; // swing inward, into the garden (wide open, folded back against the pillars)
    const light = ease((T - 0.9) / 3.5);
    garden.intensity = 2 + light * 38; glow.material.opacity = (0.15 + light * 0.75) * (1 - 0.55 * kk);   // softer by day so the garden shows through
    path.material.opacity = light * 0.35; fireflies.material.opacity = light * 0.9 * (1 - kk);
    kk += (target - kk) * Math.min(1, dt * 1.6); applyMode(kk, T, now);
    for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 30) c.position.x = -30; }
    // the cat blinks and flicks its tail now and then
    if (T > blinkAt) { const b = T - blinkAt; const sy = b < 0.15 ? 0.75 * (1 - b / 0.15) + 0.05 : b < 0.3 ? 0.05 + 0.7 * ((b - 0.15) / 0.15) : 0.75; eyes.forEach((e) => e.scale.y = sy); if (b > 0.3) blinkAt = T + 2.5 + Math.random() * 4; }
    if (T > flickAt) { const f = T - flickAt; tail.rotation.y = Math.sin(f * 9) * 0.12 * Math.max(0, 1 - f / 0.9); if (f > 0.9) { tail.rotation.y = 0; flickAt = T + 3 + Math.random() * 5; } }
    head.rotation.y = Math.sin(T * 0.4) * 0.12;
    if (tommy) {   // Tommy breathes, glances around, and slow-blinks now and then
      const b = T - tBlink; let lid = b > 0 && b < 0.8 ? Math.sin(b / 0.8 * Math.PI) : 0; if (b >= 0.8) tBlink = T + 3 + Math.random() * 4;
      if (gmode === "gate" && gAmt < 0.02) {          // at the gate: he sits in the gateway
        tGarden = false; tommy.position.set(0.35, 0, -0.1); tommy.rotation.set(0, -0.3 + Math.sin(T * 0.35) * 0.18, 0); tommy.scale.setScalar(1); tNap = 0;
      } else {
        if (!tGarden) { tGarden = true; tommy.position.set(1.3, 0, -0.45); tHead = -1.2; }
        tommyInGarden(T, dt); if (tNap > 0.5) lid = 1;
      }
      tommyLids.forEach((l) => l.quaternion.copy(tommyRest.get(l)).multiply(qx.setFromAxisAngle(X, lid * 0.75)));
    }
    if (open > 0.6 && !opened) { opened = true; onOpen && onOpen(); }
    // camera walks forward, then breathes
    const walk = easeIO(T / 5.6);
    look.x += (pointer.x - look.x) * 0.04; look.y += (pointer.y - look.y) * 0.04;
    if (gmode === "gate") {
      camera.position.lerpVectors(camStart, camEnd, still ? 1 : walk);
      camera.position.y += Math.sin(T * 1.9) * 0.012 * (1 - walk); // footsteps
      camera.position.x += look.x * 0.6; camera.position.y += -look.y * 0.25;
      camera.lookAt(0, lookY, -1);
    } else gardenCamera(dt);
    gAmt += ((gmode === "gate" ? 0 : 1) - gAmt) * Math.min(1, dt * 1.5);
    scene.fog.density *= 1 - 0.55 * gAmt;           // clearer air once you're inside the garden
    // inside the garden, tone the gateway glow down so the trees and roses keep their colour
    garden.intensity *= 1 - 0.85 * gAmt; glow.material.opacity *= 1 - 0.85 * gAmt;
    renderer.toneMappingExposure *= 1 - 0.22 * gAmt * kk; sunHalo.material.opacity *= 1 - 0.6 * gAmt; path.material.opacity *= 1 - gAmt;
    for (const r of rays) r.material.opacity *= 1 - 0.9 * gAmt;   // no sun-ray haze in your face
    hemi.intensity *= 1 - 0.4 * gAmt * kk; sunLight.intensity *= 1 - 0.35 * gAmt;
    updateTags();
    // mist rolls out through the opening gate
    for (const m of puffs) {
      const u = m.userData, push = m.userData.behind ? open : 0.3;
      m.position.x += u.v.x * dt; m.position.y += u.v.y * dt * 0.3; m.position.z += u.v.z * dt * (0.4 + push * 1.6);
      m.material.rotation += u.spin * dt; m.material.color.copy(P.night.mist).lerp(P.day.mist, kk);
      if (m.position.z > 7 || m.position.y > 2.4) { m.position.set((Math.random() - 0.5) * 4, 0.3 + Math.random() * 0.6, -2.5 - Math.random() * 1.5); m.material.opacity = 0; }
      const fadeIn = Math.min(1, T / 1.5);
      m.material.opacity += ((u.base * fadeIn * (1 - 0.85 * gAmt) * (m.position.z > 5 ? (7 - m.position.z) / 2 : 1)) - m.material.opacity) * 0.05;
    }
    liveGarden(T, dt);
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
    setBeds(list) { bedList = list; if (bedSpots.length) placeBeds(); },
    enterGarden() {
      if (gmode === "garden" || gmode === "entering") return;
      fromPos.copy(camera.position); fromLook.set(0, lookY, -1); gz = gzTarget = GARDEN_START; gT = still ? 9 : 0; gk = 0; gmode = "entering"; tick();
    },
    leaveGarden() {
      if (gmode === "gate" || gmode === "leaving") return;
      fromPos.copy(camEnd); fromLook.set(0, lookY, -1); gT = still ? 9 : 0; gmode = "leaving"; tick();
    },
    walk(steps) { walkBy(steps); },
    setPlaying(slug) { picked = slug; beds.forEach((x) => x.el.classList.toggle("on", x.slug === picked)); },
    setMode(m) { target = m === "day" ? 1 : 0; tick(); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); removeEventListener("pointermove", onMove); removeEventListener("keydown", onKey); tags.remove(); renderer.dispose(); pmrem.dispose(); },
  };
}
