/* giscus, wired to the colour toggle.

   The widget renders in an iframe on giscus.app, so it cannot see this page's
   CSS variables and cannot read `data-theme` off the root. Its theme is set
   once when the script is injected, then pushed across with postMessage every
   time the visitor flips the mode. theme-toggle.js fires `themechange` for
   that; it does not know giscus exists.

   data-theme-dark / -light in the markup are giscus's own theme names, or a
   full https URL to a stylesheet. Note a custom URL must be the *whole* giscus
   stylesheet, not a handful of variable overrides: the theme file is the only
   CSS the iframe loads, so a partial one leaves the widget unstyled. */
(function () {
  var host = document.getElementById("comments");
  if (!host) return;

  var ORIGIN = "https://giscus.app";

  function theme() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? host.dataset.themeLight
      : host.dataset.themeDark;
  }

  var s = document.createElement("script");
  s.src = ORIGIN + "/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";

  var attrs = {
    "data-repo": host.dataset.repo,
    "data-repo-id": host.dataset.repoId,
    "data-category": host.dataset.category,
    "data-category-id": host.dataset.categoryId,
    // Match a thread to a page by its path, and refuse a loose match: without
    // strict, a discussion whose title merely contains the path can be picked
    // up by the wrong post.
    "data-mapping": "pathname",
    "data-strict": "1",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "top",
    "data-theme": theme(),
    "data-lang": "en",
    // Always below the fold, so nothing loads until the reader scrolls to it.
    "data-loading": "lazy"
  };
  Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });

  host.appendChild(s);

  document.addEventListener("themechange", function () {
    var frame = host.querySelector("iframe.giscus-frame");
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme() } } }, ORIGIN);
  });
})();
