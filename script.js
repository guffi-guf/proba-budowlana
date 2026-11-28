const CONTACT_EMAIL = "dominika@dmrenovations.net"; // Enquiry form opens a prefilled email to this address.

const tabs = Array.from(document.querySelectorAll('[role="tab"][data-view]'));
const panels = Array.from(document.querySelectorAll("[data-panel]"));

function activateView(view, focusPanel = false) {
  const selectedTab = tabs.find((tab) => tab.dataset.view === view);
  const selectedPanel = panels.find((panel) => panel.dataset.panel === view);
  if (!selectedTab || !selectedPanel) return;

  tabs.forEach((tab) => {
    const selected = tab === selectedTab;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    const selected = panel === selectedPanel;
    panel.hidden = !selected;
    panel.classList.toggle("is-active", selected);
  });

  const frame = document.querySelector(".site-frame");
  if (frame) frame.dataset.view = view;

  if (focusPanel) selectedPanel.focus({ preventScroll: true });
}

activateView("home");

document.querySelectorAll("[data-view]").forEach((control) => {
  control.addEventListener("click", () => activateView(control.dataset.view));
});

tabs.forEach((tab, index) => {
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    tabs[nextIndex].focus();
    activateView(tabs[nextIndex].dataset.view);
  });
});

const form = document.querySelector("#enquiry-form");
const formStatus = document.querySelector("#form-status");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.classList.remove("is-error", "is-success");

    if (!CONTACT_EMAIL) {
      formStatus.textContent = "The enquiry form is ready. Add your business email in script.js before publishing.";
      formStatus.classList.add("is-error");
      return;
    }

    const data = new FormData(form);
    const subject = encodeURIComponent("Website enquiry from " + data.get("name"));
    const body = encodeURIComponent(
      "Name: " + data.get("name") +
      "\nEmail: " + data.get("email") +
      "\nProject: " + (data.get("project-type") || "Not specified") +
      "\n\n" + data.get("message")
    );
    window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
    formStatus.textContent = "Your email app is opening with your enquiry.";
    formStatus.classList.add("is-success");
  });
}

const year = document.querySelector("#current-year");
if (year) year.textContent = String(new Date().getFullYear());

// Respect "reduce motion": show a still frame of the hero video instead of playing it.
const heroVideo = document.querySelector(".hero-video");
const HERO_VIDEO_SPEED = 1; // 1 = original speed; lower is slower.
if (heroVideo) {
  heroVideo.defaultPlaybackRate = HERO_VIDEO_SPEED;
  heroVideo.playbackRate = HERO_VIDEO_SPEED;
  heroVideo.addEventListener("loadedmetadata", () => { heroVideo.playbackRate = HERO_VIDEO_SPEED; });
  heroVideo.addEventListener("play", () => { heroVideo.playbackRate = HERO_VIDEO_SPEED; });
}
if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroVideo.removeAttribute("autoplay");
  heroVideo.pause();
}

// Gallery project dialog with photo carousel
(() => {
  const dialog = document.getElementById("project-dialog");
  if (!dialog) return;
  const $ = (id) => document.getElementById(id);
  const media = dialog.querySelector(".pd-media");
  let photos = [], index = 0;
  function show(i) {
    index = (i + photos.length) % photos.length;
    $("pd-track").style.transform = `translateX(${-index * 100}%)`;
    $("pd-count").textContent = `${index + 1} / ${photos.length}`;
    [...$("pd-thumbs").children].forEach((b, n) => b.setAttribute("aria-current", String(n === index)));
  }
  document.querySelectorAll(".glass-card").forEach((card) => {
    card.addEventListener("click", () => {
      const first = card.querySelector(".glass-src");
      photos = card.dataset.images ? card.dataset.images.split("|") : [first.getAttribute("src")];
      $("pd-track").innerHTML = photos.map((src) => `<img src="${src}" alt="${first.alt}" />`).join("");
      $("pd-thumbs").innerHTML = photos.length > 1 ? photos.map((src, n) => `<button type="button" style="background-image:url('${src}')" aria-label="Show photo ${n + 1}"></button>`).join("") : "";
      [...$("pd-thumbs").children].forEach((b, n) => b.addEventListener("click", () => show(n)));
      media.dataset.single = String(photos.length < 2);
      $("pd-title").textContent = card.querySelector(".glass-title").textContent;
      $("pd-desc").textContent = card.querySelector(".glass-desc").textContent;
      $("pd-tags").innerHTML = card.querySelector(".glass-tags").innerHTML;
      $("pd-track").style.transition = "none"; show(0); void $("pd-track").offsetWidth; $("pd-track").style.transition = "";
      dialog.showModal();
    });
  });
  $("pd-prev").addEventListener("click", () => show(index - 1));
  $("pd-next").addEventListener("click", () => show(index + 1));
  dialog.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(index - 1); if (e.key === "ArrowRight") show(index + 1); });
  let startX = null;
  media.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  media.addEventListener("pointerup", (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 40) show(index + (e.clientX < startX ? 1 : -1)); startX = null; });
  $("pd-close").addEventListener("click", () => dialog.close());
  $("pd-quote").addEventListener("click", () => { dialog.close(); activateView("contact"); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
})();

// Opening status (London time)
(() => {
  const el = document.getElementById("open-status");
  if (!el) return;
  const OPEN = 9 * 60, CLOSE = 17 * 60, DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function update() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const day = DAYS.indexOf(p.weekday), mins = +p.hour * 60 + +p.minute;
    const weekday = day >= 1 && day <= 5;
    let text, open = false;
    if (weekday && mins >= OPEN && mins < CLOSE) { open = true; text = "Open now"; }
    else if (weekday && mins < OPEN) text = "Closed now";
    else { const next = day === 5 || day === 6 || day === 0 ? "Monday" : "tomorrow"; text = "Closed now"; }
    document.querySelectorAll('.hours-list > div').forEach((r) => { r.dataset.today = String(+r.dataset.day === day); });
    el.textContent = text; el.dataset.open = open; el.hidden = false;
  }
  update(); setInterval(update, 60000);
})();

// Gallery carousel: the cursor position scrolls the row and the middle card stands out.
(() => {
  const row = document.querySelector(".glass-row");
  const track = row && row.querySelector(".glass-track");
  if (!row || !track) return;
  const cards = [...track.querySelectorAll(".glass-card")];
  const panel = document.getElementById("view-gallery");
  const mq = window.matchMedia("(min-width: 901px) and (hover: hover)");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inited = false, cw = 0, step = 0, rowW = 0, pad = 0, range = 0, cur = 0, target = 0, idle = null, running = false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function measure() {
    cw = cards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    step = cw + gap; rowW = row.clientWidth; pad = (rowW - cw) / 2; range = (cards.length - 1) * step;
    track.style.paddingLeft = pad + "px";
    track.style.width = pad + cards.length * step + pad + "px";
    if (!inited && cw > 0) { inited = true; target = cur = 2 * step; }
  }
  function paint() {
    cards.forEach((card, i) => {
      const d = (pad + i * step + cw / 2 - cur - rowW / 2) / step;
      const ad = Math.min(Math.abs(d), 3);
      const c = Math.max(0, 1 - ad);
      const scale = 1.14 - Math.min(ad, 2) * 0.1;
      const ty = -26 * c;
      const ry = clamp(-d * 10, -22, 22);
      card.style.transform = `translateX(${-cur}px) translateY(${ty}px) rotateY(${ry}deg) scale(${scale})`;
      card.style.setProperty("--c", c.toFixed(3));
      card.style.zIndex = String(10 - Math.round(ad * 3));
      card.style.opacity = String(ad > 2.4 ? 0.6 : 1);
    });
  }
  function loop() {
    if (!row.classList.contains("is-carousel")) { running = false; return; }
    cur += (target - cur) * (still.matches ? 1 : 0.09);
    if (Math.abs(target - cur) < 0.2) cur = target;
    paint();
    requestAnimationFrame(loop);
  }
  function snap() { target = clamp(Math.round(target / step) * step, 0, range); }
  function enable() {
    row.classList.add("is-carousel"); measure();
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function disable() {
    row.classList.remove("is-carousel"); running = false;
    track.style.paddingLeft = track.style.width = "";
    cards.forEach((c) => { c.style.transform = c.style.opacity = c.style.zIndex = ""; c.style.removeProperty("--c"); });
  }
  function sync() { if (mq.matches) enable(); else disable(); }
  row.addEventListener("pointermove", (e) => {
    if (!row.classList.contains("is-carousel") || e.pointerType === "touch") return;
    const r = row.getBoundingClientRect();
    const t = clamp((e.clientX - r.left - r.width * 0.1) / (r.width * 0.8), 0, 1);
    target = t * range;
    clearTimeout(idle); idle = setTimeout(snap, 650);
  });
  row.addEventListener("pointerleave", () => { clearTimeout(idle); snap(); });
  cards.forEach((card, i) => card.addEventListener("focus", () => { if (row.classList.contains("is-carousel")) target = i * step; }));
  window.addEventListener("resize", () => { if (row.classList.contains("is-carousel")) { measure(); target = clamp(Math.round(target / step) * step, 0, range); cur = target; paint(); } });
  mq.addEventListener("change", sync);
  // Measure when the gallery tab opens (it is hidden at load).
  new MutationObserver(() => { if (panel && !panel.hidden) { sync(); if (row.classList.contains("is-carousel")) { measure(); paint(); } } }).observe(panel || document.body, { attributes: true, attributeFilter: ["hidden"] });
  sync();
})();

// Gallery on touch screens: native swipe with snap; the centre card is enlarged.
(() => {
  const row = document.querySelector(".glass-row");
  if (!row) return;
  const cards = [...row.querySelectorAll(".glass-card")];
  const touchMode = () => !row.classList.contains("is-carousel");
  function paint() {
    if (!touchMode()) return;
    const rr = row.getBoundingClientRect(), mid = rr.left + rr.width / 2;
    cards.forEach((card) => {
      const r = card.getBoundingClientRect();
      if (!r.width) return;
      const d = Math.min(1.5, Math.abs((r.left + r.width / 2 - mid) / r.width));
      const c = Math.max(0, 1 - d);
      card.style.transform = `translateY(${(-10 * c).toFixed(1)}px) scale(${(0.92 + 0.16 * c).toFixed(3)})`;
      card.style.setProperty("--c", c.toFixed(3));
    });
  }
  let ticking = false;
  row.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; paint(); }); } }, { passive: true });
  window.addEventListener("resize", paint);
  const panel = document.getElementById("view-gallery");
  if (panel) {
    new MutationObserver(() => { if (!panel.hidden) { const cw = cards[1]; if (touchMode() && cw && !row.dataset.centred) { row.dataset.centred = "1"; row.scrollLeft = cards[2].offsetLeft - (row.clientWidth - cards[2].offsetWidth) / 2; } setTimeout(paint, 50); } }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  }
  setTimeout(paint, 300);
})();
