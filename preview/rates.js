// Quote estimator: event services + content work in one quote.
// Edit prices here, and also on the rate cards in rates.html.

const EVENT_PRICES = {
  mc:    { half: 20000, full: 35000, name: "MC" },
  mod:   { half: 20000, full: 45000, name: "Panel moderator" },
  combo: { half: 35000, full: 60000, name: "MC + moderator" },
  talk:  { half: 25000, full: 25000, name: "Talk or keynote" }
};
const EVENT_ADDONS = {
  script:    { price: 10000, name: "Script writing" },
  rehearsal: { price: 7500,  name: "Rehearsal / walk-through" },
  panel:     { price: 5000,  name: "Extra panel research" },
  recap:     { price: 15000, name: "Recap content" },
  travel:    { price: 0,     name: "Travel outside Nairobi (at cost)" }
};
const MULTI_DAY_DISCOUNT = 0.10;

// Content work: starting prices, quantity chosen by the visitor.
const CONTENT = [
  { group: "Writing", id: "article", name: "Article or blog post (up to 1,000 words)", price: 8000,  unit: "article" },
  { group: "Writing", id: "oped",    name: "Thought leadership or op-ed",              price: 15000, unit: "piece" },
  { group: "Writing", id: "case",    name: "Case study",                               price: 15000, unit: "case study" },
  { group: "Writing", id: "news",    name: "Newsletter edition",                       price: 10000, unit: "edition" },
  { group: "Writing", id: "report",  name: "Report writing or editing",                price: 40000, unit: "report" },
  { group: "PR & media", id: "press", name: "Press release or media statement",        price: 10000, unit: "release" },
  { group: "PR & media", id: "brief", name: "Media brief and talking points",          price: 10000, unit: "brief" },
  { group: "PR & media", id: "mlist", name: "Media list and outlet research",          price: 12000, unit: "list" },
  { group: "PR & media", id: "pub",   name: "Event publicity and media coordination",  price: 25000, unit: "event" },
  { group: "Social & design", id: "smm",   name: "Social media management",            price: 40000, unit: "month" },
  { group: "Social & design", id: "live",  name: "Live social media coverage",         price: 15000, unit: "event day" },
  { group: "Social & design", id: "gfx",   name: "Set of 5 social media graphics",     price: 7500,  unit: "set" },
  { group: "Social & design", id: "deck",  name: "Presentation deck (up to 15 slides)", price: 15000, unit: "deck" },
  { group: "Social & design", id: "broch", name: "Brochure or flyer design",           price: 12000, unit: "design" },
  { group: "Social & design", id: "video", name: "Video script and storyboard",        price: 10000, unit: "script" },
  { group: "Strategy", id: "strat", name: "Communication strategy with action plan",   price: 80000, unit: "strategy" },
  { group: "Strategy", id: "cal",   name: "Three-month content calendar",              price: 25000, unit: "calendar" },
  { group: "Strategy", id: "audit", name: "Communication audit and recommendations",   price: 40000, unit: "audit" },
  { group: "Strategy", id: "adv",   name: "Advisory session (2 hours)",                price: 7500,  unit: "session" }
];

const EMAIL = "jhnmrkochieng@gmail.com";
const fmt = (n) => Math.round(n).toLocaleString("en-KE");
const $ = (id) => document.getElementById(id);

const form = $("estimator");
const qty = Object.fromEntries(CONTENT.map((c) => [c.id, 0]));
let days = 1, shown = 0, activeGroup = CONTENT[0].group;

/* ---------- Tabs ---------- */
const tabs = { event: $("tab-event"), content: $("tab-content") };
const panels = { event: form, content: $("panel-content") };
function showTab(name) {
  for (const key of Object.keys(tabs)) {
    const on = key === name;
    tabs[key].setAttribute("aria-selected", on);
    panels[key].hidden = !on;
  }
}
tabs.event.addEventListener("click", () => showTab("event"));
tabs.content.addEventListener("click", () => showTab("content"));
function openContentQuote(e) {
  if (e) e.preventDefault();
  showTab("content");
  document.getElementById("quote").scrollIntoView({ behavior: "smooth" });
}
document.querySelectorAll('a[href="#content-quote"]').forEach((a) => a.addEventListener("click", openContentQuote));
if (location.hash === "#content-quote") { showTab("content"); setTimeout(() => document.getElementById("quote").scrollIntoView(), 50); }

/* ---------- Content panel ---------- */
const groups = [...new Set(CONTENT.map((c) => c.group))];
const groupBar = $("content-groups");
const itemList = $("content-items");

function renderGroups() {
  groupBar.innerHTML = groups.map((g) => {
    const n = CONTENT.filter((c) => c.group === g).reduce((s, c) => s + qty[c.id], 0);
    return `<label><input type="radio" name="cgroup" value="${g}" ${g === activeGroup ? "checked" : ""}><span>${g}${n ? ` <b>${n}</b>` : ""}</span></label>`;
  }).join("");
}
function renderItems() {
  itemList.innerHTML = CONTENT.filter((c) => c.group === activeGroup).map((c) => `
    <li class="${qty[c.id] ? "picked" : ""}">
      <div><span class="ci-name">${c.name}</span><span class="ci-price">from ${fmt(c.price)} per ${c.unit}</span></div>
      <div class="stepper stepper-sm">
        <button type="button" data-id="${c.id}" data-step="-1" aria-label="Fewer: ${c.name}">−</button>
        <output>${qty[c.id]}</output>
        <button type="button" data-id="${c.id}" data-step="1" aria-label="More: ${c.name}">+</button>
      </div>
    </li>`).join("");
}
groupBar.addEventListener("change", (e) => { activeGroup = e.target.value; renderItems(); });
itemList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.dataset.id;
  qty[id] = Math.max(0, Math.min(24, qty[id] + Number(btn.dataset.step)));
  renderGroups(); renderItems(); update();
});

/* ---------- Event panel ---------- */
$("minus").addEventListener("click", () => { days = Math.max(1, days - 1); $("days").textContent = days; update(); });
$("plus").addEventListener("click", () => { days = Math.min(10, days + 1); $("days").textContent = days; update(); });
form.addEventListener("change", update);

function eventLines() {
  const service = form.service.value;
  const format = form.format.value;
  const isNone = service === "none";
  $("half-label").textContent = service === "mod" ? "Single panel" : "Half day";
  $("format-field").hidden = isNone || service === "talk";
  $("days-field").hidden = isNone;
  $("addons-field").hidden = isNone;
  if (isNone) return [];

  const p = EVENT_PRICES[service];
  const perPanel = service === "mod" && format === "half";
  $("days-legend").textContent = service === "talk" ? "Number of talks" : perPanel ? "Number of panels" : "Number of days";
  const unit = service === "talk" ? p.full : p[format];
  const discount = service === "talk" || perPanel ? 0 : MULTI_DAY_DISCOUNT;
  const base = unit + (days - 1) * unit * (1 - discount);
  const unitName = service === "talk" ? "talk" : perPanel ? "panel" : format === "half" ? "half day" : "day";

  const lines = [[`${p.name} · ${days} ${unitName}${days > 1 ? "s" : ""}`, base]];
  if (days > 1 && discount) lines.push([`Includes 10% off ${days - 1} extra day${days > 2 ? "s" : ""}`, null]);
  form.querySelectorAll(".addons input:checked").forEach((box) => {
    const a = EVENT_ADDONS[box.value];
    lines.push([a.name, a.price || null]);
  });
  return lines;
}

function contentLines() {
  return CONTENT.filter((c) => qty[c.id] > 0)
    .map((c) => [`${c.name} × ${qty[c.id]}`, c.price * qty[c.id]]);
}

/* ---------- Summary ---------- */
function animateTo(target) {
  const start = shown, t0 = performance.now(), dur = 450;
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    shown = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
    $("total").textContent = fmt(shown);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

function update() {
  const ev = eventLines();
  const ct = contentLines();
  const sum = (ls) => ls.reduce((s, [, a]) => s + (a || 0), 0);
  const total = sum(ev) + sum(ct);
  const count = Object.values(qty).reduce((s, n) => s + n, 0);

  const countEl = $("content-count");
  countEl.hidden = !count;
  countEl.textContent = count;

  const block = (title, ls, action) => ls.length
    ? `<li class="est-head"><span>${title}</span>${action}</li>` +
      ls.map(([l, a]) => `<li><span>${l}</span><span>${a == null ? "" : fmt(a)}</span></li>`).join("")
    : "";
  let html = block("Event", ev, `<button type="button" class="est-link" data-act="no-event">Remove</button>`) +
             block("Content", ct, `<button type="button" class="est-link" data-act="edit-content">Edit</button>`);
  if (!ev.length && !ct.length) html = `<li class="est-empty">Pick an event service or add content items to see an estimate.</li>`;
  if (!ev.length && ct.length) html += `<li class="est-head est-add"><button type="button" class="est-link" data-act="add-event">+ Add event services</button></li>`;
  if (ev.length && !ct.length) html += `<li class="est-head est-add"><button type="button" class="est-link" data-act="add-content">+ Add content work</button></li>`;
  $("lines").innerHTML = html;
  $("est-label").textContent = ct.length ? "Estimated total (from)" : "Estimated fee";
  animateTo(total);

  const body = [
    "Hi Johnmark,", "",
    "I'd like a quote. Here's the estimate from your site:", "",
    ...(ev.length ? ["Event:", ...ev.map(([l, a]) => `- ${l}${a ? ": KES " + fmt(a) : ""}`), ""] : []),
    ...(ct.length ? ["Content:", ...ct.map(([l, a]) => `- ${l}: from KES ${fmt(a)}`), ""] : []),
    `Estimated total: KES ${fmt(total)}`, "",
    "Organisation:", "Date(s) or deadline:", "Venue / city (for events):", "Anything else I should know:", "", "Thanks,"
  ].join("\n");
  const subject = ev.length && ct.length ? "Quote request: event and content" : ct.length ? "Quote request: content" : "Booking enquiry";
  $("send").href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

$("lines").addEventListener("click", (e) => {
  const act = e.target.dataset && e.target.dataset.act;
  if (!act) return;
  if (act === "no-event") { form.querySelector('input[value="none"]').checked = true; update(); }
  if (act === "add-event") { form.querySelector('input[value="mc"]').checked = true; showTab("event"); update(); }
  if (act === "add-content" || act === "edit-content") showTab("content");
});

renderGroups();
renderItems();
update();
