const CONTACT_EMAIL = ""; // Add the business email here to activate the enquiry handoff.

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

// Gallery project dialog
(() => {
  const dialog = document.getElementById("project-dialog");
  if (!dialog) return;
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll(".glass-card").forEach((card) => {
    card.addEventListener("click", () => {
      const img = card.querySelector(".glass-src");
      $("pd-image").style.backgroundImage = `url("${img.getAttribute("src")}")`;
      $("pd-image").setAttribute("aria-label", img.alt);
      $("pd-title").textContent = card.querySelector(".glass-title").textContent;
      $("pd-price").textContent = card.querySelector(".glass-price").textContent;
      $("pd-desc").textContent = card.querySelector(".glass-desc").textContent;
      $("pd-tags").innerHTML = card.querySelector(".glass-tags").innerHTML;
      dialog.showModal();
    });
  });
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

// Interactive map: custom pin and a car driving round the block
(() => {
  const el = document.getElementById("loc-map");
  if (!el || typeof L === "undefined") return;
  const PIN = [51.61081, -0.14972]; // Kirkby Close, N11
  const LOOP = [
    [51.610326,-0.149658],[51.610332,-0.149588],[51.610354,-0.149477],[51.610376,-0.149419],[51.610417,-0.14937],[51.610708,-0.149159],[51.610756,-0.149109],[51.610789,-0.149051],[51.611077,-0.148473],
    [51.610936,-0.148281],[51.610595,-0.147777],[51.610535,-0.147681],[51.61041,-0.147506],[51.610371,-0.147484],[51.610327,-0.147511],[51.609959,-0.148256],
    [51.609639,-0.148903],[51.609621,-0.148969],[51.609615,-0.149052],[51.609688,-0.149271],[51.609813,-0.149284],[51.609855,-0.149301],[51.610105,-0.14961],[51.610214,-0.149662],[51.610246,-0.149661],[51.610326,-0.149658]
  ];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pinSvg = '<svg viewBox="0 0 44 56" aria-hidden="true"><path d="M22 55C22 55 3 33 3 20.5A19 19 0 0 1 41 20.5C41 33 22 55 22 55Z" fill="#26342e" stroke="#fff" stroke-width="3"/><circle cx="22" cy="20" r="7.5" fill="#d7e86b"/></svg>';
  const carSvg = '<svg viewBox="0 0 16 30" aria-hidden="true"><rect x="1" y="1" width="14" height="28" rx="6" fill="#b6d95a" stroke="#26342e" stroke-width="1.6"/><rect x="3.4" y="6.5" width="9.2" height="5.5" rx="1.8" fill="#26342e"/><rect x="3.4" y="19" width="9.2" height="4.5" rx="1.6" fill="#26342e"/><rect x="2.4" y="2.6" width="3" height="1.6" rx=".8" fill="#fffbe0"/><rect x="10.6" y="2.6" width="3" height="1.6" rx=".8" fill="#fffbe0"/></svg>';
  let map = null, car = null, carEl = null;
  // route geometry in metres
  const k = Math.cos((51.61 * Math.PI) / 180), M = 111320;
  const segs = []; let total = 0;
  for (let i = 0; i < LOOP.length - 1; i++) {
    const [a, b] = [LOOP[i], LOOP[i + 1]];
    const dx = (b[1] - a[1]) * k * M, dy = (b[0] - a[0]) * M, len = Math.hypot(dx, dy);
    segs.push({ a, b, len, start: total, heading: (Math.atan2(dx, dy) * 180) / Math.PI });
    total += len;
  }
  function at(d) {
    d = ((d % total) + total) % total;
    const s = segs.find((x) => d >= x.start && d < x.start + x.len) || segs[segs.length - 1];
    const t = (d - s.start) / s.len;
    return { pos: [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t], heading: s.heading };
  }
  function fit() {
    const wrap = el.getBoundingClientRect();
    const rect = (sel) => { const n = document.querySelector(sel); return n ? n.getBoundingClientRect() : null; };
    const panel = rect(".locations-copy"), cap = rect(".map-caption");
    const wide = window.innerWidth >= 1200;
    const tl = wide ? [Math.max(0, panel.right - wrap.left) + 24, 96] : [16, Math.max(0, panel.bottom - wrap.top) + 14];
    const br = wide ? [(cap ? cap.width : 0) + 44, 64] : window.innerWidth > 640 ? [(cap ? cap.width : 0) + 24, 62] : [16, (cap ? cap.height : 0) + 62];
    map.fitBounds(L.latLngBounds(LOOP.concat([PIN])), { paddingTopLeft: tl, paddingBottomRight: br, maxZoom: 19, animate: false });
  }
  function init() {
    map = L.map(el, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.25 });
    map.setView(PIN, 18);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 20, attribution: "&copy; OpenStreetMap contributors &copy; CARTO" }).addTo(map);
    L.marker(PIN, { keyboard: false, zIndexOffset: 500, icon: L.divIcon({ className: "", iconSize: [44, 56], iconAnchor: [22, 55], html: '<div class="dm-pin"><span class="dm-pin-pulse"></span>' + pinSvg + '<span class="dm-pin-label">D&amp;M Renovation</span></div>' }) }).addTo(map);
    car = L.marker(at(0).pos, { keyboard: false, interactive: false, icon: L.divIcon({ className: "", iconSize: [16, 30], iconAnchor: [8, 15], html: '<div class="dm-car">' + carSvg + "</div>" }) }).addTo(map);
    carEl = car.getElement().firstChild;
    fit();
    if (!reduce) {
      let d = 0, last = performance.now(), hd = at(0).heading;
      const SPEED = 13; // metres per second
      (function tick(now) {
        const dt = Math.min((now - last) / 1000, 0.1); last = now;
        if (!document.hidden && el.offsetWidth > 0) {
          d += SPEED * dt;
          const p = at(d);
          let diff = ((p.heading - hd + 540) % 360) - 180; hd += diff * Math.min(1, dt * 7);
          car.setLatLng(p.pos); carEl.style.transform = "rotate(" + hd + "deg)";
        }
        requestAnimationFrame(tick);
      })(last);
    } else carEl.style.transform = "rotate(" + at(0).heading + "deg)";
  }
  let timer;
  new ResizeObserver(() => {
    if (!el.offsetWidth) return;
    if (!map) { init(); return; }
    map.invalidateSize(); clearTimeout(timer); timer = setTimeout(fit, 150);
  }).observe(el);
})();
