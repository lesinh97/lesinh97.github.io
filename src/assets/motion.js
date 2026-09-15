/* The small motions that are not parallax: reveal on scroll, the read-progress
   line in the nav, the nav's stuck state, and the cursor sheen on a card.

   Loaded on every page from base.njk. Each part looks for its own hook and
   does nothing if the page has none, so a page opts in purely by marking up
   for it: `data-reveal` on a thing that should arrive, `data-stagger="ms"` on
   a container whose children should arrive one after the next, `data-sheen`
   (or the homepage's .pcard) on something the cursor should light up. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------- reveal on scroll ---------- */

  // The hidden state is scoped to .reveal-ready in motion.css, and that class is
  // set here, before anything is observed. If this script never runs, or
  // throws on an old browser, the page is all visible rather than all blank.
  var targets = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (targets.length && !reduce.matches && "IntersectionObserver" in window) {
    root.classList.add("reveal-ready");

    targets.forEach(function (el) {
      var step = parseFloat(el.getAttribute("data-stagger"));
      if (!step) return;
      // The delay is per child and set once: the transition in CSS reads it
      // from --d, so the children arrive in order without a timer each.
      [].slice.call(el.children).forEach(function (kid, i) {
        kid.style.setProperty("--d", Math.round(i * step) + "ms");
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        // One way only. A thing that fades out again as you scroll back up
        // turns reading into a light show.
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- nav: progress line and stuck state ---------- */

  var nav = document.querySelector(".topnav");
  var bar = null;
  if (nav) {
    // Built here rather than in base.njk: it is pure chrome, it means nothing
    // without this script, and an empty div in the markup would be a lie.
    bar = document.createElement("span");
    bar.className = "navprog";
    nav.appendChild(bar);
  }

  var navTicking = false;

  function paintNav() {
    navTicking = false;
    var y = window.pageYOffset;
    if (nav) nav.classList.toggle("is-stuck", y > 8);
    if (!bar) return;
    var span = document.documentElement.scrollHeight - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0;
    bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }

  function onNavScroll() {
    if (navTicking) return;
    navTicking = true;
    window.requestAnimationFrame(paintNav);
  }

  if (nav) {
    window.addEventListener("scroll", onNavScroll, { passive: true });
    window.addEventListener("resize", onNavScroll, { passive: true });
    paintNav();
  }

  /* ---------- cursor glow ---------- */

  // Every clickable surface lights up under the cursor. Keep this in step with
  // the selector list in motion.css, which is where the glow itself lives.
  var SHEEN = "[data-sheen], .pcard, .links a, .tile, .chip, .row, .rgo, .btn, .modetoggle";

  // One delegated listener rather than one per element. Most of the ledger is
  // rendered from app.js on every keystroke and filter, so anything bound to
  // those nodes is stale a moment later; delegation finds whatever is under
  // the cursor now, however recently it was built.
  if (!reduce.matches && window.matchMedia("(pointer: fine)").matches) {
    var hit = null, px = 0, py = 0, sheenRaf = 0;

    // --cx / --cy are px against the element box and feed a radial gradient in
    // CSS. Deliberately not named --tilt-*: those inherit down from the root,
    // and a unitless number in a gradient position kills the declaration.
    function paintSheen() {
      sheenRaf = 0;
      if (!hit) return;
      var r = hit.getBoundingClientRect();
      hit.style.setProperty("--cx", (px - r.left).toFixed(1) + "px");
      hit.style.setProperty("--cy", (py - r.top).toFixed(1) + "px");
    }

    document.addEventListener("pointermove", function (e) {
      var t = e.target;
      // SVG elements have closest too, but a text node target would not.
      var el = t && t.closest ? t.closest(SHEEN) : null;
      if (!el) { hit = null; return; }
      hit = el; px = e.clientX; py = e.clientY;
      if (sheenRaf) return;
      sheenRaf = window.requestAnimationFrame(paintSheen);
    }, { passive: true });
  }
})();
