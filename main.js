/* =========================================================================
   main.js: site behaviour, as small independent features.
   Each runs inside safely(), so one failing can never break the others.
   ========================================================================= */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  function safely(fn) { try { fn(); } catch (e) { if (window.console) console.warn("site:", e); } }
  function $(s, root) { return (root || document).querySelector(s); }
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }

  /* ---------- Basics: footer year, mobile menu ---------- */
  function basics() {
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
    var toggle = $(".nav-toggle"), links = $("#nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Starfield: twinkling stars, shooting stars, cursor constellations ---------- */
  function starfields() {
    $$("canvas.sky").forEach(function (canvas) {
      var host = canvas.parentElement, ctx = canvas.getContext("2d");
      if (!ctx) return;
      var faint = canvas.classList.contains("sky-faint");
      var interactive = canvas.hasAttribute("data-interactive") && finePointer && !reduceMotion;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var small = window.innerWidth < 768;
      var w, h, stars = [], shooters = [], nextShot = 0, mouse = null, par = { x: 0, y: 0 };
      var running = false, onScreen = true, raf = 0, lastW = window.innerWidth;

      function build() {
        var r = host.getBoundingClientRect();
        w = canvas.width = Math.round(r.width * dpr);
        h = canvas.height = Math.round(r.height * dpr);
        var n = Math.round((r.width * r.height) / (faint ? 9000 : small ? 5000 : 3600));
        n = Math.min(n, faint ? 90 : 240);
        stars = [];
        for (var i = 0; i < n; i++) {
          var z = Math.random();
          stars.push({ x: Math.random() * w, y: Math.random() * h, z: z,
            r: (0.5 + z * 1.3) * dpr, a: (faint ? 0.25 : 0.4) + z * 0.5,
            tw: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6,
            warm: Math.random() < 0.08 });
        }
        if (!running) draw(0);
      }

      function draw(t) {
        ctx.clearRect(0, 0, w, h);
        var px = par.x * dpr, py = par.y * dpr;
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          if (running) { s.x -= (0.03 + s.z * 0.08) * dpr; if (s.x < -5) s.x = w + 5; }
          var a = running ? s.a * (0.6 + 0.4 * Math.sin(t / 1000 * s.sp + s.tw)) : s.a * 0.8;
          var x = s.x + px * s.z * 24, y = s.y + py * s.z * 24;
          s.sx = x; s.sy = y;
          ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283);
          ctx.fillStyle = s.warm ? "rgba(255,150,100," + a + ")" : "rgba(220,232,255," + a + ")";
          ctx.fill();
        }
        // Constellation lines near the cursor
        if (mouse) {
          var near = [];
          for (var j = 0; j < stars.length; j++) {
            var dx = stars[j].sx - mouse.x, dy = stars[j].sy - mouse.y;
            if (dx * dx + dy * dy < Math.pow(150 * dpr, 2)) near.push(stars[j]);
          }
          ctx.lineWidth = 1 * dpr;
          for (var a1 = 0; a1 < near.length; a1++) for (var b1 = a1 + 1; b1 < near.length; b1++) {
            var ex = near[a1].sx - near[b1].sx, ey = near[a1].sy - near[b1].sy, d = Math.sqrt(ex * ex + ey * ey);
            if (d < 90 * dpr) {
              ctx.strokeStyle = "rgba(143,180,255," + (0.5 * (1 - d / (90 * dpr))) + ")";
              ctx.beginPath(); ctx.moveTo(near[a1].sx, near[a1].sy); ctx.lineTo(near[b1].sx, near[b1].sy); ctx.stroke();
            }
          }
        }
        // Shooting stars
        for (var k = shooters.length - 1; k >= 0; k--) {
          var m = shooters[k], p = (t - m.t0) / m.dur;
          if (p >= 1) { shooters.splice(k, 1); continue; }
          var e = 1 - Math.pow(1 - p, 2), fade = Math.sin(Math.PI * p);
          var hx = m.x + m.dx * m.dist * e, hy = m.y + m.dy * m.dist * e;
          var tx = hx - m.dx * m.len, ty = hy - m.dy * m.len;
          var g = ctx.createLinearGradient(hx, hy, tx, ty);
          g.addColorStop(0, "rgba(255,255,255," + 0.95 * fade + ")");
          g.addColorStop(0.3, "rgba(255,170,120," + 0.55 * fade + ")");
          g.addColorStop(1, "rgba(255,120,60,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 2 * dpr; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.beginPath(); ctx.arc(hx, hy, 1.8 * dpr, 0, 6.283); ctx.fillStyle = "rgba(255,255,255," + fade + ")"; ctx.fill();
        }
        if (!faint && running && t > nextShot) {
          var ang = (195 + Math.random() * 25) * Math.PI / 180;
          shooters.push({ x: w * (0.35 + Math.random() * 0.65), y: h * Math.random() * 0.45,
            dx: Math.cos(ang), dy: -Math.sin(ang), len: (140 + Math.random() * 140) * dpr,
            dist: (380 + Math.random() * 380) * dpr, dur: 900 + Math.random() * 700, t0: t });
          nextShot = t + (small ? 5000 : 2500) + Math.random() * (small ? 6000 : 4500);
        }
      }

      function loop(t) { if (!running) return; draw(t); raf = requestAnimationFrame(loop); }
      function update() {
        var go = !reduceMotion && onScreen && !document.hidden;
        if (go && !running) { running = true; nextShot = performance.now() + 1200; raf = requestAnimationFrame(loop); }
        else if (!go && running) { running = false; cancelAnimationFrame(raf); }
      }

      build();
      if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; update(); }).observe(host);
      document.addEventListener("visibilitychange", update);
      window.addEventListener("resize", function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; small = lastW < 768; build(); } });
      if (interactive) {
        host.addEventListener("pointermove", function (e) {
          var r = canvas.getBoundingClientRect();
          mouse = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
          par.x = (e.clientX - r.left) / r.width - 0.5; par.y = (e.clientY - r.top) / r.height - 0.5;
        });
        host.addEventListener("pointerleave", function () { mouse = null; });
      }
      update();
    });
  }

  /* ---------- Rotating role line in the hero ---------- */
  function roleRotator() {
    var box = $(".role-rotator"); if (!box) return;
    var items = $$("span", box), i = 0;
    items[0].classList.add("is-on");
    if (reduceMotion) return;
    setInterval(function () {
      var cur = items[i]; i = (i + 1) % items.length; var nxt = items[i];
      cur.classList.remove("is-on"); cur.classList.add("is-out");
      nxt.classList.remove("is-out"); nxt.classList.add("is-on");
      setTimeout(function () { cur.classList.remove("is-out"); }, 650);
    }, 2200);
  }

  /* ---------- Trust strip: duplicate each row for a seamless marquee ---------- */
  function marquees() {
    $$(".marquee").forEach(function (m) {
      var list = $(".trust-list", m); if (!list) return;
      var track = document.createElement("div"); track.className = "marquee-track";
      var clone = list.cloneNode(true); clone.setAttribute("aria-hidden", "true");
      m.insertBefore(track, list); track.appendChild(list); track.appendChild(clone);
    });
  }

  /* ---------- Reveal on scroll, with stagger across rows ---------- */
  function reveals() {
    var items = $$("[data-reveal], .reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible", "visible"); }); return;
    }
    // stagger siblings that share a row
    $$(".stats-grid, .services, .events, .articles, .facts, .extras, .rate-grid, .content-grid, .terms, .incl-grid").forEach(function (g) {
      var rowTop = null, col = 0;
      Array.prototype.forEach.call(g.children, function (c) {
        var top = c.offsetTop; col = (rowTop !== null && Math.abs(top - rowTop) < 6) ? col + 1 : 0;
        if (col === 0) rowTop = top;
        c.style.transitionDelay = Math.min(col, 4) * 110 + "ms";
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; el.classList.add("is-visible", "visible"); io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ""; }, 1400);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up numbers ---------- */
  function counters() {
    var els = $$("[data-count]"); if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min((now - t0) / 1600, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Card spotlight + gentle tilt (desktop only) ---------- */
  function cardFx() {
    if (!finePointer || reduceMotion) return;
    $$(".glow").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
        if (c.classList.contains("tilt")) {
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = "perspective(1000px) rotateX(" + (-y * 5) + "deg) rotateY(" + (x * 6) + "deg) translateY(-4px)";
        }
      });
      c.addEventListener("pointerleave", function () { if (c.classList.contains("tilt")) c.style.transform = ""; });
    });
  }

  /* ---------- Speaking: filter events by role ---------- */
  function eventFilters() {
    var buttons = $$(".filter"), events = $$(".event");
    if (!buttons.length || !events.length) return;
    buttons.forEach(function (b) {
      var f = b.dataset.filter;
      var n = f === "all" ? events.length : events.filter(function (e) { return e.dataset.roles.split(" ").indexOf(f) > -1; }).length;
      var c = document.createElement("span"); c.className = "count"; c.textContent = n; b.appendChild(c);
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
        events.forEach(function (e) {
          var show = f === "all" || e.dataset.roles.split(" ").indexOf(f) > -1;
          e.classList.toggle("is-hidden", !show);
          e.classList.remove("is-filtered-in");
          if (show) { void e.offsetWidth; e.classList.add("is-filtered-in", "is-visible"); }
        });
      });
    });
  }

  /* ---------- Experience: timeline line fills as you scroll ---------- */
  function timeline() {
    var list = $(".jobs"); if (!list) return;
    var jobs = $$(".job", list), ticking = false;
    function paint() {
      var r = list.getBoundingClientRect(), mark = window.innerHeight * 0.6;
      var p = Math.min(Math.max((mark - r.top) / r.height, 0), 1);
      list.style.setProperty("--progress", p.toFixed(3));
      jobs.forEach(function (j) { j.classList.toggle("is-reached", j.getBoundingClientRect().top + 30 < mark); });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* ---------- Careers: tap to open each role on phones ---------- */
  function careerAccordion() {
    var mq = window.matchMedia("(max-width: 760px)");
    var jobs = $$(".job"); if (!jobs.length) return;
    function setup() {
      jobs.forEach(function (job) {
        var card = $(".job-card", job), more = $(".job-more", job);
        if (!card || !more) return;
        if (mq.matches) {
          card.setAttribute("role", "button"); card.setAttribute("tabindex", "0");
          card.setAttribute("aria-expanded", job.classList.contains("is-open"));
          more.setAttribute("aria-hidden", !job.classList.contains("is-open"));
        } else {
          card.removeAttribute("role"); card.removeAttribute("tabindex"); card.removeAttribute("aria-expanded");
          more.removeAttribute("aria-hidden");
        }
      });
    }
    function toggle(job) {
      if (!mq.matches) return;
      var open = job.classList.toggle("is-open");
      $(".job-card", job).setAttribute("aria-expanded", open);
      $(".job-more", job).setAttribute("aria-hidden", !open);
    }
    jobs.forEach(function (job) {
      var card = $(".job-card", job); if (!card) return;
      card.addEventListener("click", function (e) { if (e.target.closest("a")) return; toggle(job); });
      card.addEventListener("keydown", function (e) { if (mq.matches && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(job); } });
    });
    if (mq.addEventListener) mq.addEventListener("change", setup);
    setup();
  }

  /* ---------- Copy email to clipboard ---------- */
  function copyEmail() {
    $$(".copy-email").forEach(function (b) {
      var label = $(".copy-label", b), original = label.textContent;
      b.addEventListener("click", function () {
        var done = function () { b.classList.add("is-done"); label.textContent = "Copied ✓"; setTimeout(function () { b.classList.remove("is-done"); label.textContent = original; }, 2200); };
        if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, function () { location.href = "mailto:" + b.dataset.copy; });
        else location.href = "mailto:" + b.dataset.copy;
      });
    });
  }

  /* ---------- Scroll progress, back-to-top, active nav ---------- */
  function scrolling() {
    var bar = $(".scroll-progress"), top = $(".to-top"), footer = $(".footer");
    var sections = $$("main section[id]"), navLinks = $$('#nav-links a[href^="#"]:not(.btn)'), ticking = false;
    function paint() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
      if (top) top.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.9 && !(footer && footer.getBoundingClientRect().top < window.innerHeight));
      var current = "";
      sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = s.id; });
      navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + current); });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener("resize", paint);
    if (top) top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var logo = $(".logo"); if (logo) logo.focus({ preventScroll: true });
    });
    paint();
  }

  /* ---------- Hero satellite: respect reduced motion ---------- */
  function svgMotion() {
    if (reduceMotion) $$(".hero-orbit").forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
  }

  [basics, marquees, starfields, roleRotator, reveals, counters, cardFx, eventFilters, timeline, careerAccordion, copyEmail, scrolling, svgMotion].forEach(safely);
})();
