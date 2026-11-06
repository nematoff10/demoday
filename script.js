/* =========================================================
   Yo'ldosh — asosiy JavaScript
   1. Yordamchilar, tema, toast      5. Reveal va sanagichlar
   2. Navbar                         6. Scroll hikoyasi (yuk ortish → yo'l → tushirish)
   3. Ma'lumotlar, buyurtma formasi  7. Sahifa almashish (router)
   4. Jadval, kalkulyator, aloqa     8. Login / Signup (demo)
   ========================================================= */

/* ---------- 1. YORDAMCHILAR ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

$("#themeToggle").addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ---------- 2. NAVBAR ---------- */
const nav = $("#nav");
const burger = $("#burger");
const navLinks = $("#navLinks");
$("#year").textContent = new Date().getFullYear();

burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
function closeMenu() {
  burger.classList.remove("open");
  navLinks.classList.remove("open");
}

/* ---------- 3. MA'LUMOTLAR VA BUYURTMA FORMASI ---------- */
const CITY = {
  "Toshkent": [41.30, 69.24], "Samarqand": [39.65, 66.96], "Buxoro": [39.77, 64.42],
  "Namangan": [41.00, 71.67], "Andijon": [40.78, 72.34], "Farg'ona": [40.38, 71.78],
  "Qarshi": [38.86, 65.79], "Navoiy": [40.10, 65.37], "Nukus": [42.46, 59.60],
  "Urganch": [41.55, 60.63], "Termiz": [37.22, 67.28], "Jizzax": [40.12, 67.84],
  "Guliston": [40.49, 68.78],
};
const CITY_NAMES = Object.keys(CITY);

function distance(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const [la1, lo1] = CITY[a], [la2, lo2] = CITY[b];
  const dLa = (la2 - la1) * rad, dLo = (lo2 - lo1) * rad;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(dLo / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h)) * 1.22; // yo'l egriligi uchun koeffitsiyent
  return Math.round(km / 5) * 5;
}
const roundPrice = (n) => Math.round(n / 5000) * 5000;

const fromSel = $("#from"), toSel = $("#to"), extraSel = $("#extra");
CITY_NAMES.forEach((c) => { fromSel.add(new Option(c, c)); toSel.add(new Option(c, c)); });
fromSel.value = "Toshkent";
toSel.value = "Samarqand";

const tomorrow = new Date(Date.now() + 864e5);
$("#date").value = tomorrow.toISOString().slice(0, 10);
$("#date").min = new Date().toISOString().slice(0, 10);

const EXTRA = {
  cargo: { label: "Yuk hajmi", opts: ["Kichik (100 kg gacha)", "O'rta (100–500 kg)", "Katta (500–1500 kg)", "Og'ir (1,5 t dan ko'p)"], mult: [1, 1.4, 2, 3] },
  pax: { label: "O'rinlar soni", opts: ["1 o'rin", "2 o'rin", "3 o'rin", "4 o'rin"], mult: [1, 2, 3, 4] },
};
let bookType = "cargo";

function setBookType(type) {
  bookType = type;
  $$(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.type === type));
  $("#extraLabel").textContent = EXTRA[type].label;
  extraSel.innerHTML = "";
  EXTRA[type].opts.forEach((o, i) => extraSel.add(new Option(o, i)));
  $("#results").innerHTML = "";
}
$("#bookTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".seg-btn");
  if (b) setBookType(b.dataset.type);
});
setBookType("cargo");

$("#swapBtn").addEventListener("click", () => {
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
});

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const NAMES = ["Jasur A.", "Dilshod R.", "Bekzod T.", "Aziz M.", "Otabek S.", "Sardor K.", "Rustam N.", "Nodir Y.", "Sherzod B.", "Anvar H."];
const CARS = { cargo: ["Labo", "Isuzu", "Gazel", "Damas", "Hyundai Porter"], pax: ["Cobalt", "Gentra", "Lacetti", "Malibu", "Onix"] };

$("#bookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const out = $("#results");
  const a = fromSel.value, b = toSel.value;
  if (a === b) { out.innerHTML = `<div class="res-head">Iltimos, turli shaharlarni tanlang.</div>`; return; }

  const km = distance(a, b);
  const base = roundPrice(km * (bookType === "pax" ? 400 : 700)) * EXTRA[bookType].mult[+extraSel.value];
  const rnd = mulberry32([...(a + b + bookType + extraSel.value)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7));

  const items = Array.from({ length: 3 }, (_, i) => {
    const name = NAMES[Math.floor(rnd() * NAMES.length)];
    const car = CARS[bookType][Math.floor(rnd() * CARS[bookType].length)];
    const rating = (4.6 + rnd() * 0.4).toFixed(1);
    const trips = 40 + Math.floor(rnd() * 380);
    const price = roundPrice(base * (0.92 + rnd() * 0.2));
    return `
      <div class="res-item" style="animation-delay:${i * 0.08}s">
        <div class="avatar">${name.charAt(0)}</div>
        <div><b>${name}</b><small><svg class="ico"><use href="#i-star"/></svg>${rating} · ${trips} ta safar · ${car}</small></div>
        <div class="res-price">≈ ${fmt(price)} so'm<br><button class="btn btn-outline" data-contact type="button">Bog'lanish</button></div>
      </div>`;
  }).join("");

  out.innerHTML = `<div class="res-head"><span>${a} → ${b} · ${km} km</span><span>Namunaviy natija</span></div>${items}`;
});

$("#results").addEventListener("click", (e) => {
  if (!e.target.closest("[data-contact]")) return;
  if (!getUser()) { openAuth("signup"); return; }
  toast("So'rov yuborildi (demo)");
});

/* ---------- 4. JADVAL, KALKULYATOR, ALOQA ---------- */
const POPULAR = [
  ["Toshkent", "Samarqand"], ["Toshkent", "Buxoro"], ["Toshkent", "Namangan"], ["Toshkent", "Andijon"],
  ["Toshkent", "Farg'ona"], ["Samarqand", "Buxoro"], ["Toshkent", "Qarshi"], ["Toshkent", "Jizzax"],
  ["Samarqand", "Qarshi"], ["Buxoro", "Urganch"], ["Toshkent", "Termiz"], ["Toshkent", "Nukus"],
];

function renderRoutes(filter = "") {
  const q = filter.trim().toLowerCase();
  const rows = POPULAR.filter(([a, b]) => !q || (a + " " + b).toLowerCase().includes(q)).map(([a, b]) => {
    const km = distance(a, b);
    const hours = Math.max(1, Math.round(km / 65));
    return `
      <div class="rrow">
        <div class="r-name"><svg class="ico"><use href="#i-pin"/></svg>${a} → ${b}</div>
        <div>${km} km</div>
        <div class="r-hide">~${hours} soat</div>
        <div class="r-hide r-hide2">≈ ${fmt(roundPrice(km * 400))} so'm</div>
        <div class="r-hide r-hide2">≈ ${fmt(roundPrice(km * 700))} so'm</div>
        <button class="btn btn-outline" data-route="${a}|${b}" type="button">Buyurtma</button>
      </div>`;
  });
  $("#routeTable").innerHTML =
    `<div class="rrow head"><div>Yo'nalish</div><div>Masofa</div><div class="r-hide">Vaqt</div><div class="r-hide r-hide2">Yo'lovchi (o'rin)</div><div class="r-hide r-hide2">Yuk (dan)</div><div></div></div>` +
    (rows.length ? rows.join("") : `<div class="empty">Hech narsa topilmadi.</div>`);
}
renderRoutes();
$("#routeFilter").addEventListener("input", (e) => renderRoutes(e.target.value));
$("#routeTable").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-route]");
  if (!btn) return;
  const [a, b] = btn.dataset.route.split("|");
  fromSel.value = a;
  toSel.value = b;
  goScroll("booking");
  toast(`${a} → ${b} tanlandi`);
});

const calcTrips = $("#calcTrips"), calcPrice = $("#calcPrice");
function updateCalc() {
  $("#calcTripsVal").textContent = calcTrips.value;
  $("#calcOut").textContent = fmt(calcTrips.value * calcPrice.value) + " so'm";
}
calcTrips.addEventListener("input", updateCalc);
calcPrice.addEventListener("change", updateCalc);
updateCalc();

$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const m = $(".form-msg", f);
  if (!f.name.value.trim() || !f.phone.value.trim() || !f.msg.value.trim()) {
    m.classList.remove("ok");
    m.textContent = "Iltimos, barcha maydonlarni to'ldiring.";
    return;
  }
  m.textContent = "";
  f.reset();
  toast("Xabaringiz yuborildi (demo)");
});

/* ---------- 5. REVEAL VA SANAGICHLAR ---------- */
function countUp(el) {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || "";
  const dv = +el.dataset.div || 1;
  const dur = 1500;
  const start = performance.now();
  (function tick(now) {
    const p = clamp((now - start) / dur);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = (dv > 1 ? (v / dv).toFixed(1) : fmt(v)) + (p === 1 ? suffix : "");
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    $$("[data-count]", en.target).forEach(countUp);
    io.unobserve(en.target);
  });
}, { threshold: 0.12 });

/* ---------- 6. SCROLL HIKOYASI ---------- */
const story = $("#story");
const stage = $("#stage");
const world = $("#world");
const roadEl = $("#road");
const truck = $("#truck");
const boxes = $$(".cargo-box");
const wheels = $$(".wheel", truck);
const smoke = $("#smoke");
const orb = $("#orb");
const crane = $("#crane"), beam = $("#beam"), trolley = $("#trolley"), cable = $("#cable");
const pat = { cloud: $("#pCloud"), far: $("#pFar"), mid: $("#pMid"), tree: $("#pTree") };
const stepEls = $$(".step");
const hudCopy = $("#hudCopy"), hudEye = $("#hudEye"), hudTitle = $("#hudTitle"), hudText = $("#hudText"), hudMeter = $("#hudMeter");
const rbFill = $("#rbFill"), rbDot = $("#rbDot"), delivered = $("#delivered");

const PHASES = [
  { eye: "1-qadam", t: "Yuk ortilmoqda", d: "Haydovchi yukni ombordan qabul qilib, xavfsiz joylashtiradi. Buyurtma holati yangilanadi." },
  { eye: "2-qadam", t: "Yo'lda", d: "Yuk mashinasi belgilangan yo'nalish bo'ylab ketmoqda. Yo'l davomida holatni kuzatib borasiz." },
  { eye: "3-qadam", t: "Yuk topshirilmoqda", d: "Haydovchi manzilga yetib keldi. Yuk mijozning omboriga tushirilmoqda." },
  { eye: "Yakun", t: "Yuk yetkazildi", d: "Mijoz yukni qabul qildi. Endi haydovchiga baho qoldirishingiz mumkin." },
];

// Barcha o'lchamlar "birlik" (u) da: mashina kengligi 460 birlik.
const SLOT = [[208, 94], [144, 94], [80, 94], [16, 94], [112, 38], [48, 38]];     // mashina ichidagi joylar [x, tepa y]
const DOCK = (i) => [-70 - (i < 3 ? i : i - 3) * 62, i < 3 ? 38 : 94];             // ombor platformasidagi boshlang'ich joy
const DEST = (k) => [496 + (2 - (k % 3)) * 66, k < 3 ? 94 : 38];                  // mijoz platformasidagi yakuniy joy
const LIFT = -40;

const LOAD_END = 0.28, DRIVE_A = 0.32, DRIVE_B = 0.68, UNL_A = 0.72, KM = 300;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Kran harakati: ko'tarish → ko'ndalang surish → tushirish
function craneMove(a, b, e) {
  const e1 = clamp(e / 0.3), e2 = clamp((e - 0.3) / 0.45), e3 = clamp((e - 0.75) / 0.25);
  const x = a[0] + (b[0] - a[0]) * ease(e2);
  let y;
  if (e < 0.3) y = a[1] + (LIFT - a[1]) * ease(e1);
  else if (e < 0.75) y = LIFT;
  else y = LIFT + (b[1] - LIFT) * ease(e3);
  return { x, y };
}

const L = { u: 0, tx: 0, D: 0, wb: 0, rh: 0, truckTop: 0 };
function layoutStory() {
  const W = stage.clientWidth, H = stage.clientHeight;
  if (!W || !H) return false;
  const u = Math.min(W / 880, 1.2, H / 520);
  const wb = H * 0.15;
  const rh = wb + H * 0.025;
  const tx = 205 * u + Math.max(0, W - 880 * u) * 0.3;
  const D = Math.max(W * 1.6, 900);
  Object.assign(L, { u, tx, D, wb, rh, truckTop: H - (wb - 22 * u) - 220 * u });
  stage.style.setProperty("--u", u + "px");
  stage.style.setProperty("--tx", tx + "px");
  stage.style.setProperty("--D", D + "px");
  stage.style.setProperty("--wb", wb + "px");
  stage.style.setProperty("--rh", rh + "px");
  return true;
}

let lastPhase = -1;
function updateStory() {
  if (!L.u && !layoutStory()) return;
  const total = story.offsetHeight - stage.clientHeight;
  if (total <= 0) return;
  const p = clamp(-story.getBoundingClientRect().top / total);
  const drive = ease(clamp((p - DRIVE_A) / (DRIVE_B - DRIVE_A)));
  const off = drive * L.D;

  // Dunyo va parallaks
  world.style.transform = `translate3d(${-off}px,0,0)`;
  roadEl.style.backgroundPositionX = `${-off}px`;
  pat.cloud.setAttribute("patternTransform", `translate(${-off * 0.04} 0)`);
  pat.far.setAttribute("patternTransform", `translate(${-off * 0.1} 0)`);
  pat.mid.setAttribute("patternTransform", `translate(${-off * 0.22} 0)`);
  pat.tree.setAttribute("patternTransform", `translate(${-off * 0.6} 0)`);

  // G'ildirak, silkinish, tutun
  const rot = (off / (26 * L.u)) * 57.2958;
  wheels.forEach((w) => (w.style.transform = `rotate(${rot}deg)`));
  const moving = clamp(Math.sin(drive * Math.PI) * 5);
  truck.style.transform = `translate3d(0,${Math.sin(off / 14) * 1.4 * L.u * moving}px,0)`;
  smoke.classList.toggle("on", moving > 0.2);

  // Quyosh / oy
  orb.style.left = `${8 + 84 * p}%`;
  orb.style.top = `${24 - 14 * Math.sin(Math.PI * p)}vh`;

  // Qutilar
  let active = null, loaded = 0, unloaded = 0;
  boxes.forEach((b, i) => {
    const le = clamp((clamp(p / LOAD_END) - i * 0.12) / 0.4);
    const ue = clamp((clamp((p - UNL_A) / (1 - UNL_A)) - (5 - i) * 0.12) / 0.4);
    let pos, e;
    if (ue > 0) { pos = craneMove(SLOT[i], DEST(5 - i), ue); e = ue; if (ue >= 1) unloaded++; }
    else { pos = craneMove(DOCK(i), SLOT[i], le); e = le; }
    if (le >= 1) loaded++;
    if (e > 0 && e < 1 && !active) active = pos;
    b.style.transform = `translate3d(${pos.x * L.u}px,${pos.y * L.u}px,0)`;
  });

  // Kran
  crane.classList.toggle("on", p < LOAD_END + 0.03 || p > UNL_A - 0.03);
  const beamY = L.truckTop - 95 * L.u;
  beam.style.top = beamY + "px";
  trolley.style.top = beamY - 1 + "px";
  if (active) {
    const cx = L.tx + (active.x + 28) * L.u;
    const topY = L.truckTop + active.y * L.u;
    trolley.style.left = cx + "px";
    cable.style.display = "block";
    cable.style.left = cx + "px";
    cable.style.top = beamY + 14 + "px";
    cable.style.height = Math.max(0, topY - (beamY + 14)) + "px";
  } else {
    cable.style.display = "none";
  }

  // HUD
  const phase = p >= 0.985 ? 3 : p < 0.3 ? 0 : p < 0.7 ? 1 : 2;
  if (phase !== lastPhase) {
    lastPhase = phase;
    hudEye.textContent = PHASES[phase].eye;
    hudTitle.textContent = PHASES[phase].t;
    hudText.textContent = PHASES[phase].d;
    hudCopy.classList.remove("flip");
    void hudCopy.offsetWidth;
    hudCopy.classList.add("flip");
    stepEls.forEach((s, i) => {
      s.classList.toggle("active", phase < 3 && i === phase);
      s.classList.toggle("done", i < phase);
    });
    delivered.classList.toggle("on", phase === 3);
  }
  hudMeter.textContent =
    phase === 0 ? `Ortildi: ${loaded} / 6` :
    phase === 1 ? `${Math.round(drive * KM)} / ${KM} km` :
    phase === 2 ? `Tushirildi: ${unloaded} / 6` : "6 / 6 topshirildi";
  rbFill.style.width = drive * 100 + "%";
  rbDot.style.left = drive * 100 + "%";
}

/* ---------- Umumiy scroll ---------- */
const bar = $("#progress");
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  nav.classList.toggle("scrolled", y > 16);
  if (active === "home") updateStory();
  ticking = false;
}
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
window.addEventListener("resize", () => {
  if (active === "home") { layoutStory(); }
  onScroll();
});

/* ---------- 7. SAHIFA ALMASHISH (ROUTER) ---------- */
const pages = $$(".page");
const curtain = $("#curtain");
const PAGE_IDS = pages.map((p) => p.dataset.page);
let active = null, busy = false, pendingScroll = null;
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const currentRoute = () => {
  const h = location.hash.replace(/^#\/?/, "");
  return PAGE_IDS.includes(h) ? h : "home";
};

function swapPage(name) {
  pages.forEach((p) => p.classList.toggle("active", p.dataset.page === name));
  active = name;
  $$("[data-link]", navLinks).forEach((a) => {
    const on = a.dataset.link === name;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const pg = pages.find((p) => p.dataset.page === name);
  document.title = `${pg.dataset.title} — Yo'ldosh`;
  $$(".reveal", pg).forEach((el) => { el.classList.remove("in"); io.observe(el); });
  $$("[data-count]", pg).forEach((el) => { el.textContent = "0"; });
  if (name === "home") { lastPhase = -1; layoutStory(); }
}

function scrollToId(id, instant) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - (id === "story" ? 0 : 96);
  window.scrollTo({ top: Math.max(0, y), behavior: instant ? "instant" : "smooth" });
}

function afterSwap() {
  if (pendingScroll) { const id = pendingScroll; pendingScroll = null; scrollToId(id, true); }
  onScroll();
}

async function navigate(name) {
  if (busy) return;
  if (name === active) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  busy = true;
  if (active === null) {
    swapPage(name); afterSwap(); busy = false; return;
  }
  const target = pages.find((p) => p.dataset.page === name);
  $("#curtainLabel").textContent = target.dataset.title;
  curtain.className = "curtain in";
  await wait(540);
  swapPage(name);
  window.scrollTo({ top: 0, behavior: "instant" });
  afterSwap();
  curtain.className = "curtain out";
  await wait(600);
  curtain.className = "curtain";
  busy = false;
  const want = currentRoute();
  if (want !== active) navigate(want);
}

function goScroll(id) {
  if (active === "home") { scrollToId(id); return; }
  pendingScroll = id;
  if (location.hash !== "#/home") location.hash = "#/home"; else navigate("home");
}

window.addEventListener("hashchange", () => navigate(currentRoute()));

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (link) {
    closeMenu();
    if (link.dataset.link === active) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  const sc = e.target.closest("[data-scroll]");
  if (sc) { e.preventDefault(); goScroll(sc.dataset.scroll); }
});

/* ---------- 8. LOGIN / SIGNUP (DEMO) ----------
   DIQQAT: bu faqat demo. Haqiqiy loyihada autentifikatsiya serverda
   (parol hash, SMS OTP, JWT) bo'lishi shart. */
const modal = $("#authModal");
const loginForm = $("#loginForm");
const signupForm = $("#signupForm");

const getUsers = () => { try { return JSON.parse(localStorage.getItem("users") || "[]"); } catch (e) { return []; } };
const saveUsers = (u) => localStorage.setItem("users", JSON.stringify(u));
function getUser() { try { return JSON.parse(localStorage.getItem("session") || "null"); } catch (e) { return null; } }
const normPhone = (p) => p.replace(/[^\d+]/g, "");

function switchTab(name) {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  loginForm.classList.toggle("hidden", name !== "login");
  signupForm.classList.toggle("hidden", name !== "signup");
  $("#authTitle").textContent = name === "login" ? "Qaytganingizdan xursandmiz" : "Yangi akkaunt yarating";
  $$(".form-msg", modal).forEach((m) => (m.textContent = ""));
}
function openAuth(tab = "login", role) {
  switchTab(tab);
  if (role) { const r = $(`input[name="role"][value="${role}"]`, signupForm); if (r) r.checked = true; }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("input:not([type=radio])", tab === "login" ? loginForm : signupForm).focus(), 250);
}
function closeAuth() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open-auth]");
  if (open) { e.preventDefault(); closeMenu(); openAuth(open.dataset.openAuth, open.dataset.role); }
  if (e.target.closest("[data-close-auth]")) closeAuth();
  const tl = e.target.closest("[data-tab-link]");
  if (tl) { e.preventDefault(); switchTab(tl.dataset.tabLink); }
});
$$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAuth(); });

$$(".pw-toggle").forEach((b) =>
  b.addEventListener("click", () => {
    const inp = b.previousElementSibling;
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    b.textContent = show ? "Yashir" : "Ko'rsat";
  })
);

function msg(form, text, ok = false) {
  const m = $(".form-msg", form);
  m.textContent = text;
  m.classList.toggle("ok", ok);
}

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(signupForm));
  const phone = normPhone(d.phone || "");
  if (!d.name.trim()) return msg(signupForm, "Ismingizni kiriting.");
  if (!/^\+?998\d{9}$|^\d{9}$/.test(phone)) return msg(signupForm, "Telefon raqam noto'g'ri (masalan: +998901234567).");
  if ((d.password || "").length < 6) return msg(signupForm, "Parol kamida 6 ta belgidan iborat bo'lsin.");
  const users = getUsers();
  if (users.some((u) => u.phone === phone)) return msg(signupForm, "Bu raqam allaqachon ro'yxatdan o'tgan.");
  const user = { name: d.name.trim(), phone, password: d.password, role: d.role };
  users.push(user);
  saveUsers(users);
  startSession(user);
  msg(signupForm, "Muvaffaqiyatli!", true);
  setTimeout(() => { closeAuth(); signupForm.reset(); toast(`Xush kelibsiz, ${user.name.split(" ")[0]}!`); }, 450);
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(loginForm));
  const phone = normPhone(d.phone || "");
  const user = getUsers().find((u) => u.phone === phone && u.password === d.password);
  if (!user) return msg(loginForm, "Telefon yoki parol noto'g'ri.");
  startSession(user);
  msg(loginForm, "Kirildi!", true);
  setTimeout(() => { closeAuth(); loginForm.reset(); toast(`Qaytganingizdan xursandmiz, ${user.name.split(" ")[0]}!`); }, 350);
});

function startSession(user) {
  localStorage.setItem("session", JSON.stringify({ name: user.name, phone: user.phone, role: user.role }));
  renderAuth();
}
function logout() {
  localStorage.removeItem("session");
  renderAuth();
  toast("Tizimdan chiqdingiz");
}
function renderAuth() {
  const area = $("#authArea");
  const u = getUser();
  if (!u) {
    area.innerHTML = `
      <button class="btn btn-ghost" data-open-auth="login" type="button">Kirish</button>
      <button class="btn btn-primary" data-open-auth="signup" type="button">Ro'yxatdan o'tish</button>`;
    return;
  }
  const role = u.role === "driver" ? "Haydovchi" : "Mijoz";
  area.innerHTML = `
    <div class="user-chip">
      <div class="avatar">${u.name.charAt(0).toUpperCase()}</div>
      <span class="uname">${u.name.split(" ")[0]} · ${role}</span>
      <button class="btn btn-ghost" id="logoutBtn" type="button">Chiqish</button>
    </div>`;
  $("#logoutBtn").addEventListener("click", logout);
}
renderAuth();

/* ---------- Ishga tushirish ---------- */
navigate(currentRoute());