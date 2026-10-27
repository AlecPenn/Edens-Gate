// Eden's Gate — a free music library. Songs live on the Internet Archive;
// this page just lists them, plays them and hands them over.
const IA = "https://archive.org/download";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const PAGE = 120;

let collections = [], all = [], current = "all", query = "", shown = PAGE, playing = null;

const songUrl = (t) => `${IA}/${t.ia}/${encodeURIComponent(t.f)}`;
const zipUrl = (c) => `https://archive.org/compress/${c.ia}/formats=VBR%20MP3&file=/${encodeURIComponent(c.ia)}.zip`;

function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
let gate = null;
function currentMode() { return document.documentElement.dataset.theme === "day" ? "day" : "night"; }
function showMode() {
  const m = currentMode(), b = $("mode");
  b.textContent = m === "day" ? "☀ Day" : "☾ Night";
  b.setAttribute("aria-label", m === "day" ? "Switch to night" : "Switch to day");
  document.querySelector('meta[name="theme-color"]').content = m === "day" ? "#e3ece2" : "#12302c";
}
$("mode").onclick = () => {
  const m = currentMode() === "day" ? "night" : "day";
  document.documentElement.dataset.theme = m;
  try { localStorage.setItem("egMode", m); } catch (e) {}
  gate?.setMode(m); showMode();
};
showMode();

async function startEntrance() {
  const stage = $("stage");
  if (webgl()) {
    try {
      const { startGate } = await import("/gate3d.js");
      stage.classList.add("has3d");
      gate = startGate($("gate3d"), { mode: currentMode(), onOpen: () => stage.classList.add("is-open"), onPick: pickBed });
      await Promise.race([gate.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("3D models timed out")), 20000))]);
      stage.classList.remove("is-open");
      gate.replay();
      stage.classList.remove("loading");
      if (collections.length) gate.setBeds(bedsFor3d());
      // walk through the gate into the garden: every rose bed along the path is a collection
      $("enter").onclick = () => { stage.classList.add("in-garden"); document.body.classList.add("garden-lock"); gate.enterGarden(); $("leave").focus(); };
      $("leave").onclick = leaveGarden;
      $("walk-fwd").onclick = () => gate.walk(2); $("walk-back").onclick = () => gate.walk(-2);
      addEventListener("keydown", (e) => { if (e.key === "Escape" && stage.classList.contains("in-garden")) leaveGarden(); });
      return;
    } catch (e) { console.warn("3D gate unavailable, using the drawn gate", e); gate?.dispose(); gate = null; stage.classList.remove("has3d", "is-open"); }
  }
  stage.classList.remove("loading");
  requestAnimationFrame(() => document.querySelector(".gate-wrap").classList.add("open"));
}

function leaveGarden() { $("stage").classList.remove("in-garden"); document.body.classList.remove("garden-lock"); gate?.leaveGarden(); $("enter").focus(); }
const bedsFor3d = () => collections.map((c) => ({ slug: c.slug, name: c.name, n: c.tracks.length }));
// tapping a rose bed in the garden: open that collection and play a song from it
function pickBed(slug) {
  current = slug; query = ""; $("q").value = ""; shown = PAGE;
  history.replaceState(null, "", "#" + slug);
  renderBeds(); renderShelf();
  const songs = list(); if (songs.length) play(songs[Math.floor(Math.random() * songs.length)]);
  gate?.setPlaying(slug);
}

async function init() {
  startEntrance();
  const data = await (await fetch("/library.json")).json();
  collections = data.channels.filter((c) => !c.hidden).map((c) => ({   // hidden = still uploading
    ...c,
    tracks: c.tracks.map((t, i) => ({ ...t, ia: c.ia, coll: c.name, slug: c.slug, cover: `/covers/${c.slug}/${t.c ?? i}.webp` })),
  }));
  all = collections.flatMap((c) => c.tracks).sort((a, b) => a.t.localeCompare(b.t));
  $("count").textContent = `Every one of its ${all.length.toLocaleString()} songs`;
  const h = decodeURIComponent(location.hash.slice(1));
  if (collections.some((c) => c.slug === h)) current = h;
  // links from Alec Penn Radio arrive as ?q=<song title> to show that song straight away
  const q = new URLSearchParams(location.search).get("q");
  if (q) { query = q.trim(); $("q").value = query; requestAnimationFrame(() => $("library").scrollIntoView({ behavior: "smooth" })); }
  renderBeds(); renderShelf();
  gate?.setBeds(bedsFor3d());
}

function renderBeds() {
  const genres = collections.filter((c) => !c.separate), series = collections.filter((c) => c.separate);
  const item = (slug, name, n) =>
    `<li><button data-slug="${slug}" aria-current="${current === slug && !query}"><span>${esc(name)}</span> <small>${n}</small></button></li>`;
  $("beds").innerHTML =
    item("all", "All songs", all.length) +
    genres.map((c) => item(c.slug, c.name, c.tracks.length)).join("") +
    (series.length ? `<li class="sep">Series</li>` + series.map((c) => item(c.slug, c.name, c.tracks.length)).join("") : "");
  $("beds").querySelectorAll("button").forEach((b) => b.onclick = () => {
    current = b.dataset.slug; query = ""; $("q").value = ""; shown = PAGE;
    history.replaceState(null, "", current === "all" ? location.pathname : "#" + current);
    renderBeds(); renderShelf();
    if (matchMedia("(max-width: 760px)").matches) $("shelf-head").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function list() {
  if (query) {
    const q = query.toLowerCase();
    return all.filter((t) => t.t.toLowerCase().includes(q));
  }
  if (current === "all") return all;
  return collections.find((c) => c.slug === current).tracks;
}

function renderShelf() {
  const songs = list();
  const c = collections.find((x) => x.slug === current);
  if (query) {
    $("shelf-head").innerHTML = `<div></div><div><h2>Search</h2><p>${songs.length ? `${songs.length} song${songs.length === 1 ? "" : "s"} match “${esc(query)}”` : ""}</p></div>`;
    $("shelf-head").style.gridTemplateColumns = "0 1fr";
  } else if (current === "all") {
    $("shelf-head").style.gridTemplateColumns = "0 1fr";
    $("shelf-head").innerHTML = `<div></div><div><h2>All songs</h2>
      <p>${all.length.toLocaleString()} songs across ${collections.length} collections, A to Z. Pick a collection to download it in one go.</p></div>`;
  } else {
    $("shelf-head").style.gridTemplateColumns = "";
    const mins = Math.round(c.tracks.reduce((a, t) => a + t.s, 0) / 60);
    $("shelf-head").innerHTML = `<img src="/genres/${c.slug}.webp" alt="" onerror="this.style.visibility='hidden'"><div><h2>${esc(c.name)}</h2>
      <p>${c.tracks.length} songs, about ${mins >= 90 ? Math.round(mins / 60) + " hours" : mins + " minutes"} of music.</p>
      <a class="zip" href="${zipUrl(c)}">Download all ${c.tracks.length} as a zip</a></div>`;
  }
  const page = songs.slice(0, shown);
  $("songs").innerHTML = songs.length ? page.map((t, i) => `
    <li class="song${playing === t ? " playing" : ""}" data-i="${i}">
      <img src="${t.cover}" alt="" loading="lazy" width="44" height="44">
      <div><div class="t">${esc(t.t)}</div>${current === "all" || query ? `<div class="c">${esc(t.coll)}</div>` : ""}</div>
      <span class="d">${fmt(t.s)}</span>
      <span class="acts"><button data-act="play" data-on="${playing === t && !audio.paused}" aria-label="${playing === t && !audio.paused ? "Pause" : "Play"} ${esc(t.t)}">${playing === t && !audio.paused ? "Pause" : "Play"}</button><button data-act="dl" aria-label="Download ${esc(t.t)}">Download</button></span>
    </li>`).join("") + (songs.length > shown ? `<li class="more"><button class="zip" id="more">Show ${Math.min(PAGE, songs.length - shown)} more</button></li>` : "")
    : `<li class="empty">No songs called that yet. Try a shorter word, or browse a collection.</li>`;
  $("songs").querySelectorAll(".song").forEach((li) => {
    const t = page[+li.dataset.i];
    li.querySelector('[data-act="play"]').onclick = () => play(t);
    li.querySelector('[data-act="dl"]').onclick = (e) => download(t, e.currentTarget);
  });
  const more = $("more"); if (more) more.onclick = () => { shown += PAGE; renderShelf(); };
}

/* ── player ── */
const audio = $("audio");
function play(t) {
  if (playing === t) { audio.paused ? audio.play() : audio.pause(); return; }
  playing = t;
  audio.src = songUrl(t); audio.play().catch(() => {});
  $("player").hidden = false;
  $("p-cover").src = t.cover; $("p-title").textContent = t.t; $("p-coll").textContent = t.coll;
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.t, artist: "Alec Penn Radio", album: t.coll, artwork: [{ src: t.cover, sizes: "320x320", type: "image/webp" }] });
  renderShelf();
}
audio.addEventListener("play", () => { $("p-toggle").textContent = "❚❚"; $("p-toggle").setAttribute("aria-label", "Pause"); renderShelf(); });
audio.addEventListener("pause", () => { $("p-toggle").textContent = "▶"; $("p-toggle").setAttribute("aria-label", "Play"); renderShelf(); });
audio.addEventListener("timeupdate", () => {
  if (audio.duration) $("p-seek").value = audio.currentTime / audio.duration * 1000;
  $("p-time").textContent = `${fmt(audio.currentTime)} / ${fmt(playing?.s)}`;
});
audio.addEventListener("ended", () => { // carry on with the next song in the list
  const songs = list(), i = songs.indexOf(playing);
  if (i >= 0 && i + 1 < songs.length) play(songs[i + 1]);
});
$("p-toggle").onclick = () => playing && (audio.paused ? audio.play() : audio.pause());
$("p-seek").oninput = (e) => { if (audio.duration) audio.currentTime = e.target.value / 1000 * audio.duration; };
$("p-dl").onclick = (e) => playing && download(playing, e.currentTarget);

/* ── download: save the file directly; fall back to opening it ── */
async function download(t, btn) {
  const label = btn.textContent; btn.disabled = true; btn.textContent = "Saving…";
  try {
    const r = await fetch(songUrl(t)); if (!r.ok) throw new Error(r.status);
    const blob = await r.blob(), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = t.f; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    btn.textContent = "Saved";
  } catch (e) {
    window.open(songUrl(t), "_blank", "noopener");
    btn.textContent = label;
  }
  setTimeout(() => { btn.disabled = false; btn.textContent = label; }, 2500);
}

/* ── search ── */
let st;
$("q").addEventListener("input", (e) => {
  clearTimeout(st);
  st = setTimeout(() => { query = e.target.value.trim(); shown = PAGE; renderBeds(); renderShelf(); }, 120);
});

init();
