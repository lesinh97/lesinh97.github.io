/* Parallax, the Cara idea without the React.

   Two inputs, one output each:

     scroll  -> --py on every [data-speed] element, in px
     pointer -> --tilt-x / --tilt-y on <html>, as numbers in -1..1

   The tilt goes on the root so it inherits to every field on the page, not
   just the homepage's; a page with no [data-speed] at all gets nothing done
   to it and no listeners bound.

   Both are written as custom properties rather than as `transform`, because
   more than one thing drives most of these elements: a divider band also
   carries its skew, a shape layer also carries the pointer lean. Setting
   `transform` from here would wipe whichever one CSS owns. The composition
   lives in motion.css.

   One passive scroll listener, one rAF for the scroll, and a second short-
   lived rAF that eases the pointer to its target and then stops. No
   dependencies, and nothing running while the page sits still. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var host = document.documentElement;
  var nodes = [].slice.call(document.querySelectorAll("[data-speed]"));
  if (!nodes.length) return;

  var items = [];
  var ticking = false;

  function measure() {
    var y = window.pageYOffset;
    items = nodes.map(function (el) {
      // The block the element drifts against: a homepage section, a page
      // header, or failing both whatever it happens to sit in.
      var page = el.closest(".px-page, .pagehead, .pxback") || el.parentElement;
      var r = page.getBoundingClientRect();
      return {
        el: el,
        speed: parseFloat(el.getAttribute("data-speed")) || 0,
        // Half the block's height, so paint() can tell whether it is anywhere
        // near the viewport before doing any work for it.
        half: r.height / 2,
        last: null,
        // Section centre in document space, so an element sits neutral when
        // its section is centred in the viewport and drifts either side of
        // that. A negative speed simply drifts the other way.
        mid: y + r.top + r.height / 2
      };
    });
  }

  function paint() {
    ticking = false;
    var vh = window.innerHeight;
    var mid = window.pageYOffset + vh / 2;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var gap = mid - it.mid;
      // A section a full screen away cannot show its drift, and writing a
      // custom property costs a style recalc of that subtree either way. On
      // the homepage this is about thirty writes a frame down to the few that
      // are actually on screen.
      if (Math.abs(gap) > vh + it.half) continue;
      var v = (gap * it.speed).toFixed(2);
      if (v === it.last) continue;
      it.last = v;
      it.el.style.setProperty("--py", v + "px");
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paint);
  }

  /* ---------- pointer lean ---------- */

  // The cursor target, and where the page has eased to so far. Jumping
  // straight to the target makes the field twitch with every mouse event;
  // easing 12% of the remaining distance per frame gives it weight.
  var tx = 0, ty = 0, cx = 0, cy = 0, easing = false;
  // Fine pointer only. A touch screen reports coarse and fires this once per
  // tap, which would leave the field parked off centre.
  var fine = window.matchMedia("(pointer: fine)");

  function ease() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    host.style.setProperty("--tilt-x", cx.toFixed(4));
    host.style.setProperty("--tilt-y", cy.toFixed(4));
    // Settled: stop the loop rather than burn a frame forever.
    if (Math.abs(tx - cx) < 0.0015 && Math.abs(ty - cy) < 0.0015) {
      easing = false;
      host.style.setProperty("--tilt-x", tx.toFixed(4));
      host.style.setProperty("--tilt-y", ty.toFixed(4));
      return;
    }
    window.requestAnimationFrame(ease);
  }

  function onPointer(e) {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
    if (easing) return;
    easing = true;
    window.requestAnimationFrame(ease);
  }

  function onLeave() {
    tx = 0; ty = 0;
    if (easing) return;
    easing = true;
    window.requestAnimationFrame(ease);
  }

  function start() {
    measure();
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine.matches) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
  }

  function stop() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("pointerleave", onLeave);
    nodes.forEach(function (el) { el.style.removeProperty("--py"); });
    host.style.removeProperty("--tilt-x");
    host.style.removeProperty("--tilt-y");
    tx = ty = cx = cy = 0;
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

  // Section heights settle once the webfont and any images land, so the
  // midpoints measured on first paint are worth taking again.
  window.addEventListener("load", function () { if (!reduce.matches) { measure(); paint(); } });
  apply();
})();
