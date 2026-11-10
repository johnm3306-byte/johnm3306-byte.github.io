const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Respect reduced-motion for the orbiting satellite (SVG animation)
if (reduceMotion) document.querySelectorAll(".hero-orbit").forEach((svg) => svg.pauseAnimations && svg.pauseAnimations());

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

/* ---------- Fade in on scroll, count up numbers ---------- */
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const start = performance.now(), dur = 1200;
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    if (entry.target.dataset.count) countUp(entry.target);
    observer.unobserve(entry.target);
  }),
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal, [data-count]").forEach((el) => observer.observe(el));

/* ---------- Nav: border when scrolled, highlight current section ---------- */
const nav = document.querySelector(".nav");
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll('#nav-links a[href^="#"]:not(.btn)')];

function onScroll() {
  nav.classList.toggle("scrolled", window.scrollY > 8);
  let current = "";
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.35) current = s.id;
  navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();
