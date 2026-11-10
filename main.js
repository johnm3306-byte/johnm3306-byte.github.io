const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Mobile menu ---------- */
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- Live starfield ---------- */
(() => {
  const canvas = document.getElementById("space");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, stars = [], shooters = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mouseX = 0, mouseY = 0, parX = 0, parY = 0, scrollY = 0;

  function resize() {
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.min(260, Math.floor((innerWidth * innerHeight) / 5500));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.9 + 0.1,            // depth: 0.1 far, 1 near
      tw: Math.random() * Math.PI * 2,          // twinkle phase
      hue: Math.random() < 0.12 ? (Math.random() < 0.5 ? 20 : 250) : 0
    }));
    if (reduceMotion) draw(0);
  }

  function spawnShooter() {
    shooters.push({
      x: Math.random() * w * 0.7 + w * 0.3,
      y: Math.random() * h * 0.4,
      vx: -(6 + Math.random() * 6) * dpr,
      vy: (2.5 + Math.random() * 2) * dpr,
      life: 1
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    parX += (mouseX - parX) * 0.04;
    parY += (mouseY - parY) * 0.04;
    for (const s of stars) {
      if (!reduceMotion) {
        s.x -= s.z * 0.12 * dpr;                // slow drift
        if (s.x < -10) s.x = w + 10;
      }
      const ox = parX * s.z * 30 * dpr;
      const oy = parY * s.z * 30 * dpr - (scrollY * s.z * 0.15 * dpr) % h;
      let y = (s.y + oy) % h; if (y < 0) y += h;
      const tw = reduceMotion ? 0.8 : 0.55 + Math.sin(t * 0.002 + s.tw) * 0.45;
      const r = s.z * 1.6 * dpr;
      ctx.beginPath();
      ctx.arc(s.x + ox, y, r, 0, Math.PI * 2);
      ctx.fillStyle = s.hue
        ? `hsla(${s.hue}, 100%, 75%, ${tw * s.z})`
        : `rgba(255,255,255,${tw * s.z})`;
      ctx.fill();
    }
    for (const sh of shooters) {
      const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 12, sh.y - sh.vy * 12);
      grad.addColorStop(0, `rgba(255,220,190,${sh.life})`);
      grad.addColorStop(1, "rgba(255,220,190,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 12, sh.y - sh.vy * 12);
      ctx.stroke();
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
    }
    shooters = shooters.filter((s) => s.life > 0);
  }

  function loop(t) {
    if (!document.hidden) draw(t);
    if (Math.random() < 0.004) spawnShooter();
    requestAnimationFrame(loop);
  }

  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => {
    mouseX = e.clientX / innerWidth - 0.5;
    mouseY = e.clientY / innerHeight - 0.5;
  });
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  resize();
  if (!reduceMotion) requestAnimationFrame(loop);
})();

/* ---------- Hero: words rise in, roles type out ---------- */
document.querySelectorAll(".split").forEach((el) => {
  let i = 0;
  const wrap = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement("span");
          outer.className = "word";
          const inner = document.createElement("span");
          inner.textContent = part;
          inner.style.transitionDelay = `${0.08 * i++ + 0.1}s`;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        wrap(child);
      }
    });
  };
  wrap(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
});

(() => {
  const el = document.querySelector(".typed");
  if (!el) return;
  const words = el.dataset.words.split("|");
  if (reduceMotion) { el.textContent = words[0]; return; }
  let wi = 0, ci = 0, deleting = false;
  (function tick() {
    const word = words[wi];
    el.textContent = word.slice(0, ci);
    let delay = deleting ? 40 : 85;
    if (!deleting && ci === word.length) { deleting = true; delay = 1600; }
    else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 300; }
    else ci += deleting ? -1 : 1;
    setTimeout(tick, delay);
  })();
})();

/* ---------- Reveal on scroll (with stagger) + count-up ---------- */
document.querySelectorAll(".stagger").forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.classList.add("reveal-child");
    child.style.transitionDelay = `${Math.min(i * 0.08, 0.6)}s`;
  });
});

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const start = performance.now(), dur = 1400;
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("visible");
    if (el.dataset.count) countUp(el);
    // Once revealed, drop the stagger delay so hover effects respond instantly
    if (el.classList.contains("stagger")) {
      setTimeout(() => [...el.children].forEach((c) => { c.style.transitionDelay = ""; }), 1400);
    }
    observer.unobserve(el);
  }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal, .stagger, [data-count]").forEach((el) => observer.observe(el));

/* ---------- Scroll: progress bar, active nav, timeline draw, hero drift ---------- */
const progress = document.querySelector(".progress");
const timeline = document.querySelector(".timeline");
const heroInner = document.querySelector(".hero-inner");
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll('#nav-links a[href^="#"]')];

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.75 - r.top) / r.height, 0), 1);
    timeline.style.setProperty("--draw", p);
  }

  if (heroInner && !reduceMotion && scrollY < innerHeight) {
    heroInner.style.transform = `translateY(${scrollY * 0.25}px)`;
    heroInner.style.opacity = 1 - scrollY / (innerHeight * 0.9);
  }

  let current = "";
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id;
  navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Pointer effects (desktop only) ---------- */
if (finePointer && !reduceMotion) {
  // Soft glow that trails the cursor
  const glow = document.querySelector(".cursor-glow");
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; });
  document.addEventListener("pointerleave", () => { glow.style.opacity = 0; });
  (function follow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(follow);
  })();

  // Cards tilt toward the cursor, with a spotlight
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // Buttons lean toward the cursor
  document.querySelectorAll(".btn, .socials a").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });
}
