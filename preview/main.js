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

  /* ---------- Lively layer ---------- */
  // Process line draws across when the steps come into view
  function processLine() {
    var steps = $(".process-steps"); if (!steps) return;
    if (!("IntersectionObserver" in window) || reduceMotion) { steps.classList.add("is-drawn"); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { setTimeout(function () { steps.classList.add("is-drawn"); }, 300); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(steps);
  }

  // Speaking: a soft stage light follows the cursor
  function spotlight() {
    var stage = $("#stage"), light = $(".spotlight", stage || document);
    if (!stage || !light || !finePointer || reduceMotion) return;
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      light.style.setProperty("--sx", (e.clientX - r.left) + "px");
      light.style.setProperty("--sy", (e.clientY - r.top) + "px");
    });
  }

  // Hero photo drifts gently against the cursor (uses the `translate` property,
  // so it never fights the entrance animation on `transform`)
  function heroParallax() {
    var hero = $(".hero"), photo = $(".hero-photo");
    if (!hero || !photo || !finePointer || reduceMotion) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function tick() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      photo.style.translate = cx.toFixed(2) + "px " + cy.toFixed(2) + "px";
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(tick) : 0;
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * -18;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -12;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  }

  // Main call-to-action buttons lean toward the cursor
  function magneticButtons() {
    if (!finePointer || reduceMotion) return;
    $$(".hero-actions .btn, .contact-actions .btn-accent").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px " + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  // Back-to-top arrow "launches" before the page scrolls up
  function launchToTop() {
    var btn = $(".to-top"); if (!btn || reduceMotion) return;
    btn.addEventListener("click", function () {
      btn.classList.add("is-launching");
      setTimeout(function () { btn.classList.remove("is-launching"); }, 900);
    });
  }

  [processLine, spotlight, heroParallax, magneticButtons, launchToTop].forEach(safely);

  /* ---------- Services: tabbed switcher on desktop ---------- */
  function serviceSwitcher() {
    var grid = $(".services"); if (!grid) return;
    var cards = $$(".service", grid); if (cards.length < 2) return;
    var mq = window.matchMedia("(min-width: 1001px)");
    var wrap = document.createElement("div"); wrap.className = "svc-switch";
    var tabs = document.createElement("div"); tabs.className = "svc-tabs";
    tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Services");
    grid.parentNode.insertBefore(wrap, grid); wrap.appendChild(tabs); wrap.appendChild(grid);
    var buttons = cards.map(function (card, i) {
      card.classList.remove("tilt"); card.style.transform = "";
      card.id = card.id || "service-" + (i + 1);
      var icon = $(".service-icon", card), num = $(".service-num", card), title = $("h3", card);
      var b = document.createElement("button");
      b.type = "button"; b.className = "svc-tab"; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", card.id);
      b.innerHTML = (icon ? icon.outerHTML : "") + '<span>' + title.innerHTML + '</span><span class="svc-num">' + (num ? num.textContent : "") + '</span>';
      b.addEventListener("click", function () { select(i, true); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); var n = (i + (e.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length; select(n, true); buttons[n].focus(); }
      });
      tabs.appendChild(b); return b;
    });
    var current = 0;
    function select(i, animate) {
      current = i;
      cards.forEach(function (card, k) {
        var on = k === i;
        if (mq.matches) {
          card.hidden = !on; card.setAttribute("role", "tabpanel");
          if (on) { card.classList.add("is-visible", "visible"); if (animate) { card.classList.remove("is-entering"); void card.offsetWidth; card.classList.add("is-entering"); } }
        } else { card.hidden = false; card.removeAttribute("role"); }
        buttons[k].setAttribute("aria-selected", on); buttons[k].tabIndex = on ? 0 : -1;
      });
    }
    if (mq.addEventListener) mq.addEventListener("change", function () { select(current, false); });
    select(0, false);
  }

  /* ---------- Career: trajectory bar, one role at a time on desktop ---------- */
  function careerTrajectory() {
    var box = $(".trajectory"), list = $(".jobs");
    if (!box || !list) return;
    var jobs = $$(".job[data-start]", list); if (!jobs.length) return;
    var mq = window.matchMedia("(min-width: 761px)");
    var now = new Date();
    function m(v) { if (v === "now") return now.getFullYear() * 12 + now.getMonth() + 1; var p = v.split("-"); return +p[0] * 12 + (+p[1] - 1); }
    var data = jobs.map(function (el) { return { el: el, a: m(el.dataset.start), b: m(el.dataset.end), short: el.dataset.short, current: el.dataset.end === "now" }; });
    var min = Math.min.apply(null, data.map(function (d) { return d.a; }));
    var max = Math.max.apply(null, data.map(function (d) { return d.b; })) + 1;
    var span = max - min;
    var track = document.createElement("div"); track.className = "traj-track";
    var ticks = document.createElement("div"); ticks.className = "traj-ticks"; ticks.setAttribute("aria-hidden", "true");
    for (var y = Math.ceil(min / 12); y * 12 <= max; y++) {
      var t = document.createElement("span"); t.textContent = y; t.style.left = ((y * 12 - min) / span * 100) + "%"; ticks.appendChild(t);
    }
    var segs = data.map(function (d, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "traj-seg" + (d.current ? " is-current" : "");
      b.style.left = "calc(" + ((d.a - min) / span * 100) + "% + 3px)";
      b.style.width = "calc(" + ((d.b - d.a) / span * 100) + "% - 6px)";
      var years = Math.floor(d.a / 12) + (Math.floor((d.b - 1) / 12) !== Math.floor(d.a / 12) ? "–" + (d.current ? "now" : Math.floor((d.b - 1) / 12)) : (d.current ? "–now" : ""));
      b.innerHTML = "<b>" + d.short + "</b><small>" + years + "</small>";
      b.setAttribute("aria-label", d.short + ", " + $(".job-date", d.el).textContent + ": show role");
      b.addEventListener("click", function () { select(i, true); });
      track.appendChild(b); return b;
    });
    var hint = document.createElement("p"); hint.className = "traj-hint"; hint.textContent = "Select a role on the timeline to see what I did there.";
    box.appendChild(track); box.appendChild(ticks); box.appendChild(hint);
    var current = 0;
    function select(i, animate) {
      current = i;
      data.forEach(function (d, k) {
        var on = k === i;
        segs[k].setAttribute("aria-pressed", on);
        d.el.classList.toggle("is-active", on);
        if (on) d.el.classList.add("is-visible", "visible");
      });
    }
    function mode() {
      box.hidden = !mq.matches;
      list.classList.toggle("is-single", mq.matches);
      if (!mq.matches) jobs.forEach(function (el) { el.classList.remove("is-active"); });
      else select(current, false);
    }
    if (mq.addEventListener) mq.addEventListener("change", mode);
    mode();
  }

  [serviceSwitcher, careerTrajectory].forEach(safely);

  [basics, marquees, starfields, roleRotator, reveals, counters, cardFx, eventFilters, timeline, careerAccordion, copyEmail, scrolling, svgMotion].forEach(safely);
})();
