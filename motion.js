/* =========================================================================
   motion.js: small, independent motion features. Each one checks for the
   elements it needs and quietly does nothing if they are missing, so one
   failing feature can never break the others or the page.
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Run each feature on its own, so an error in one is contained. */
  function safely(fn) {
    try { fn(); } catch (err) { if (window.console) console.warn("motion:", err); }
  }

  /* Read a CSS colour variable (hex) and return "r,g,b". */
  function cssRgb(name, fallback) {
    var hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    var m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(",") : "91,100,114";
  }

  /* ---------- Hero sky: faint starfield + occasional shooting star ---------- */
  function heroSky() {
    var canvas = document.querySelector(".hero-sky");
    var hero = canvas && canvas.closest(".hero");
    if (!canvas || !hero || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var SLATE = cssRgb("--muted", "#5b6472");   // existing muted text colour
    var ACCENT = cssRgb("--accent", "#d9481c");  // existing brand accent
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var small = window.matchMedia("(max-width: 767px)");

    var w = 0, h = 0, stars = [], shooter = null, nextShot = 0;
    var running = false, onScreen = true, rafId = 0, last = 0;

    function animated() { return !reduceMotion && !small.matches; }

    function makeStars() {
      var count = reduceMotion ? 24 : small.matches ? 22 : 60;
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (0.5 + Math.random() * 0.5) * dpr,          // 1 to 2px dots
          a: reduceMotion ? 0.14 : 0.2 + Math.random() * 0.3,
          tint: Math.random() < 0.15 ? ACCENT : SLATE,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0006,         // twinkle speed
          drift: (0.004 + Math.random() * 0.006) * dpr    // px per frame, very slow
        });
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      w = canvas.width = Math.round(rect.width * dpr);
      h = canvas.height = Math.round(rect.height * dpr);
      makeStars();
      if (!animated()) drawStatic();
    }

    function drawStars(t, move) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (move) { s.x -= s.drift; if (s.x < -4) s.x = w + 4; }
        var alpha = move ? s.a * (0.65 + 0.35 * Math.sin(t * s.speed + s.phase)) : s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + s.tint + "," + alpha.toFixed(3) + ")";
        ctx.fill();
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      drawStars(0, false);
    }

    /* One shooting star at a time, long random gaps, smooth fade in and out. */
    function scheduleShot(now) { nextShot = now + 5000 + Math.random() * 7000; }

    function launch() {
      var angle = (200 + Math.random() * 14) * Math.PI / 180;  // shallow diagonal, down-left
      shooter = {
        x: w * (0.3 + Math.random() * 0.28),          // open space over and above the text,
        y: h * (0.03 + Math.random() * 0.27),         // clear of the photo

        dx: Math.cos(angle), dy: -Math.sin(angle),
        len: (120 + Math.random() * 100) * dpr,
        dist: (260 + Math.random() * 220) * dpr,
        dur: 1100 + Math.random() * 700,
        start: performance.now()
      };
      canvas.dataset.shooting = "1";
    }

    function drawShooter(now) {
      var p = (now - shooter.start) / shooter.dur;
      if (p >= 1) { shooter = null; delete canvas.dataset.shooting; scheduleShot(now); return; }
      var ease = 1 - Math.pow(1 - p, 2);
      var fade = Math.sin(Math.PI * p);              // fade in, then out
      var hx = shooter.x + shooter.dx * shooter.dist * ease;
      var hy = shooter.y + shooter.dy * shooter.dist * ease;
      var tx = hx - shooter.dx * shooter.len, ty = hy - shooter.dy * shooter.len;
      var g = ctx.createLinearGradient(hx, hy, tx, ty);
      g.addColorStop(0, "rgba(" + ACCENT + "," + (0.5 * fade).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + ACCENT + ",0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5 * dpr;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    }

    function frame(now) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      drawStars(now, true);
      if (shooter) drawShooter(now);
      else if (now >= nextShot) launch();
      last = now;
      rafId = requestAnimationFrame(frame);
    }

    function update() {
      var should = animated() && onScreen && !document.hidden;
      if (should && !running) {
        running = true;
        var now = performance.now();
        if (!nextShot || now - last > 1000) scheduleShot(now);   // fresh gap after a pause
        rafId = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(rafId);
        shooter = null; delete canvas.dataset.shooting;
        if (!animated()) drawStatic();
      }
    }

    resize();
    canvas.classList.add("is-ready");

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting; update();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", update);
    var resizeTimer, lastWidth = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastWidth) return;   // ignore mobile address-bar height changes
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); update(); }, 200);
    });
    if (small.addEventListener) small.addEventListener("change", function () { resize(); update(); });
    update();
  }

  safely(heroSky);
})();
