// Quote estimator. Edit prices here (and on the rate cards in rates.html).
const PRICES = {
  mc:    { half: 20000, full: 35000, name: "MC" },
  mod:   { half: 20000, full: 45000, name: "Panel moderator" },
  combo: { half: 35000, full: 60000, name: "MC + moderator" },
  talk:  { half: 25000, full: 25000, name: "Talk or keynote" }
};
const ADDONS = {
  script:    { price: 10000, name: "Script writing" },
  rehearsal: { price: 7500,  name: "Rehearsal / walk-through" },
  panel:     { price: 5000,  name: "Extra panel research" },
  recap:     { price: 15000, name: "Recap content" },
  travel:    { price: 0,     name: "Travel outside Nairobi (at cost)" }
};
const MULTI_DAY_DISCOUNT = 0.10;
const EMAIL = "jhnmrkochieng@gmail.com";

const form = document.getElementById("estimator");
const daysOut = document.getElementById("days");
const totalOut = document.getElementById("total");
const linesOut = document.getElementById("lines");
const send = document.getElementById("send");
const halfLabel = document.getElementById("half-label");
const formatField = document.getElementById("format-field");
const daysLegend = document.getElementById("days-legend");
let days = 1, shown = 35000;

const fmt = (n) => n.toLocaleString("en-KE");

function animateTo(target) {
  const start = shown, t0 = performance.now(), dur = 450;
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    shown = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
    totalOut.textContent = fmt(shown);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

function update() {
  const service = form.service.value;
  const format = form.format.value;
  const p = PRICES[service];

  // Labels change with the service
  halfLabel.textContent = service === "mod" ? "Single panel" : "Half day";
  formatField.hidden = service === "talk";
  daysLegend.textContent = service === "talk" ? "Number of talks" :
    service === "mod" && format === "half" ? "Number of panels" : "Number of days";

  const unit = service === "talk" ? p.full : p[format];
  const perUnitDiscount = service === "talk" || (service === "mod" && format === "half") ? 0 : MULTI_DAY_DISCOUNT;
  const base = unit + (days - 1) * unit * (1 - perUnitDiscount);
  const lines = [];
  const unitName = service === "talk" ? "talk" : service === "mod" && format === "half" ? "panel" : format === "half" ? "half day" : "day";
  lines.push([`${p.name} · ${days} ${unitName}${days > 1 ? "s" : ""}`, base]);
  if (days > 1 && perUnitDiscount) lines.push([`Includes 10% off ${days - 1} extra day${days > 2 ? "s" : ""}`, null]);

  let total = Math.round(base);
  form.querySelectorAll(".addons input:checked").forEach((box) => {
    const a = ADDONS[box.value];
    total += a.price;
    lines.push([a.name, a.price || null]);
  });

  linesOut.innerHTML = lines.map(([label, amt]) =>
    `<li><span>${label}</span><span>${amt == null ? "" : fmt(Math.round(amt))}</span></li>`).join("");
  animateTo(total);

  const body = [
    "Hi Johnmark,", "",
    "I'd like to book you for an event. Here's the estimate from your site:", "",
    ...lines.map(([l, a]) => `- ${l}${a ? ": KES " + fmt(Math.round(a)) : ""}`),
    `Estimated total: KES ${fmt(total)}`, "",
    "Event name:", "Date(s):", "Venue / city:", "Audience size:", "", "Thanks,"
  ].join("\n");
  send.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Booking enquiry: " + p.name)}&body=${encodeURIComponent(body)}`;
}

document.getElementById("minus").addEventListener("click", () => { days = Math.max(1, days - 1); daysOut.textContent = days; update(); });
document.getElementById("plus").addEventListener("click", () => { days = Math.min(10, days + 1); daysOut.textContent = days; update(); });
form.addEventListener("change", update);
update();
