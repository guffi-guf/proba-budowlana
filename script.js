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
const HERO_VIDEO_SPEED = 0.65; // 1 = original speed; lower is slower.
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
