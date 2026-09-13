/* Parallax layers, the Cara idea without the React. Each [data-speed] layer
   drifts against the scroll of the section it sits in. One rAF loop, one
   passive scroll listener, no dependencies. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var layers = [].slice.call(document.querySelectorAll(".px-layer[data-speed]"));
  if (!layers.length) return;

  var items = [];
  var ticking = false;

  function measure() {
    var y = window.pageYOffset;
    items = layers.map(function (el) {
      var host = el.closest(".px-page") || el.parentElement;
      var r = host.getBoundingClientRect();
      return {
        el: el,
        speed: parseFloat(el.getAttribute("data-speed")) || 0,
        // Section centre in document space, so a layer sits neutral when its
        // section is centred in the viewport and drifts either side of that.
        mid: y + r.top + r.height / 2
      };
    });
  }

  function paint() {
    ticking = false;
    var mid = window.pageYOffset + window.innerHeight / 2;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      it.el.style.transform = "translate3d(0," + ((mid - it.mid) * it.speed).toFixed(2) + "px,0)";
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  }

  function start() {
    measure();
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function stop() {
    window.removeEventListener("scroll", onScroll);
    layers.forEach(function (el) { el.style.transform = ""; });
  }

  function apply() {
    stop();
    if (!reduce.matches) start();
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (!reduce.matches) { measure(); paint(); } }, 120);
  }, { passive: true });

  // Safari only got addEventListener on MediaQueryList in 14.
  if (reduce.addEventListener) reduce.addEventListener("change", apply);
  else if (reduce.addListener) reduce.addListener(apply);

  window.addEventListener("load", function () { if (!reduce.matches) { measure(); paint(); } });
  apply();
})();
