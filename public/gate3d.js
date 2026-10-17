// EDEN'S GATE — the 3D entrance.
// Iron gates swing open, mist rolls out, warm light pours through from the garden,
// and the camera walks you up to the threshold. Falls back to the flat SVG gate
// if WebGL isn't available.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const GOLD = 0xc2a24d, LAMP = 0xebd9a0, IVY = 0x3d7d7b, DUSK = 0x12302c;

export function startGate(canvas, { onOpen, mode = "night" } = {}) {
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
    // Alec Penn Radio wave seals set into the gate, with small rings below
    for (let k = 0; k < 3; k++) {
      const seal = waveSeal(0.2); seal.position.set(-side * (0.3 + k * 0.48), 1.85, 0); door.add(seal);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.018, 10, 36), gold); ring2.position.set(-side * (0.3 + k * 0.48), 0.8, 0); door.add(ring2);
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
    cat.visible = k < 0.98; fur.opacity = 1 - k; eyeMat.color.setRGB(0.85, 0.92, 0.48).multiplyScalar(1 - k);
    fireflies.visible = k < 0.95;
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
    left.rotation.y = open * 0.92; right.rotation.y = -open * 0.92; // swing inward, into the garden
    const light = ease((T - 0.9) / 3.5);
    garden.intensity = 2 + light * 38; glow.material.opacity = 0.15 + light * 0.75;
    path.material.opacity = light * 0.35; fireflies.material.opacity = light * 0.9 * (1 - kk);
    kk += (target - kk) * Math.min(1, dt * 1.6); applyMode(kk, T, now);
    for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 30) c.position.x = -30; }
    // the cat blinks and flicks its tail now and then
    if (T > blinkAt) { const b = T - blinkAt; const sy = b < 0.15 ? 0.75 * (1 - b / 0.15) + 0.05 : b < 0.3 ? 0.05 + 0.7 * ((b - 0.15) / 0.15) : 0.75; eyes.forEach((e) => e.scale.y = sy); if (b > 0.3) blinkAt = T + 2.5 + Math.random() * 4; }
    if (T > flickAt) { const f = T - flickAt; tail.rotation.y = Math.sin(f * 9) * 0.12 * Math.max(0, 1 - f / 0.9); if (f > 0.9) { tail.rotation.y = 0; flickAt = T + 3 + Math.random() * 5; } }
    head.rotation.y = Math.sin(T * 0.4) * 0.12;
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
      m.material.rotation += u.spin * dt; m.material.color.copy(P.night.mist).lerp(P.day.mist, kk);
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
    setMode(m) { target = m === "day" ? 1 : 0; tick(); },
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); removeEventListener("pointermove", onMove); renderer.dispose(); pmrem.dispose(); },
  };
}
