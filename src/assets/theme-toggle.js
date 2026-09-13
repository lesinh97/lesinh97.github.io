/* Colour mode toggle. Stores an explicit choice, and stays on the operating
   system's preference until the visitor actually picks one. */
(function () {
  var KEY = "shinology-theme";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function current() {
    var s = stored();
    if (s === "light" || s === "dark") return s;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function apply(mode, remember) {
    root.setAttribute("data-theme", mode);
    if (remember) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
    var btn = document.querySelector(".modetoggle");
    if (btn) {
      btn.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
      btn.setAttribute("title", mode === "light" ? "Switch to dark" : "Switch to light");
      btn.setAttribute("aria-label", mode === "light" ? "Switch to dark" : "Switch to light");
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".modetoggle");
    if (!btn) return;
    apply(current() === "light" ? "dark" : "light", true);
  });

  // Follow the system until the visitor has chosen for themselves.
  var mq = window.matchMedia("(prefers-color-scheme: light)");
  function onSystem() { if (!stored()) apply(mq.matches ? "light" : "dark", false); }
  if (mq.addEventListener) mq.addEventListener("change", onSystem);
  else if (mq.addListener) mq.addListener(onSystem);

  apply(current(), false);
})();
