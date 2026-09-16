/* The drifting icon field on the homepage.

   Cara's life comes from density: every section carries a dozen or so small
   icons, each floating on its own clock, so nothing ever lines up twice.
   Placing fifty of those by hand in index.njk would be unreadable, so the
   field is generated here from a fixed seed. Random looking, and identical on
   every build, which means no visual diff churn and no layout surprise after
   a deploy.

   Each section comes out as three groups, far to near. The group is the
   parallax layer: parallax.js reads `speed` from data-speed, and `pull` is
   how far the group leans toward the pointer. Depth decides size, opacity,
   float amplitude and speed together, so a far shape is big, faint and slow
   and a near one is small, crisp and quick. */

// mulberry32: tiny, fast, and deterministic, which is the entire point.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Symbol vocabulary. `fill` marks the ones that still read as a shape when
// solid: an arrow or a cross filled in is just a blob, so those stay line
// art. `spin` marks the ones worth rotating; an arrow that rotates stops
// pointing anywhere, and a plain circle rotating is invisible work.
const SYMS = [
  { id: "circle",   fill: true,  spin: false, pulse: true },
  { id: "ring",     fill: true,  spin: true,  pulse: true },
  { id: "triangle", fill: true,  spin: true,  pulse: false },
  { id: "box",      fill: true,  spin: true,  pulse: false },
  { id: "hexa",     fill: true,  spin: true,  pulse: false },
  { id: "diamond",  fill: true,  spin: true,  pulse: true },
  { id: "dots",     fill: true,  spin: true,  pulse: true },
  { id: "plus",     fill: false, spin: true,  pulse: false },
  { id: "cross",    fill: false, spin: true,  pulse: false },
  { id: "arrowup",  fill: false, spin: false, pulse: false },
  { id: "arrowur",  fill: false, spin: false, pulse: false },
  { id: "chevrons", fill: false, spin: false, pulse: false }
];

/* Straight off the --ic-* ramp in theme.css, which sets both of these per
   colour mode. The split is the whole point: the field stays navy, and a
   minority of shapes carry a muted hue. Run every shape through HUED and you
   get the old Gatsby site back, which read as an orange cast over the page. */
const COOL = ["mist", "ice", "steel", "azure", "sapphire", "slate"];
const HUED = ["clay", "rust", "plum", "moss", "rose"];

/* Depth 0 is furthest back. Size climbs as opacity falls, so the far shapes
   read as atmosphere and the near ones as detail. Float amplitude rises with
   depth as well: near things should visibly outrun far things. */
const DEPTH = [
  { speed: 0.12, pull: 6,  size: [64, 132], o: [0.13, 0.22], amp: [9, 17],  dur: [9.5, 16], spin: [46, 90] },
  { speed: 0.30, pull: 13, size: [30, 68],  o: [0.22, 0.36], amp: [14, 26], dur: [6.5, 11], spin: [28, 58] },
  { speed: 0.54, pull: 22, size: [11, 30],  o: [0.32, 0.52], amp: [18, 34], dur: [4.2, 8],  spin: [16, 36] }
];

/* Where a shape may land, as a percentage inset from one edge. The copy sits
   in the left half of the shell, so the side bands stay clear of it and the
   two middle bands only reach in above and below the text block. */
const ZONES = [
  { edge: "left",  x: [0.5, 5.5], y: [8, 90] },
  { edge: "left",  x: [0.5, 5.5], y: [8, 90] },
  { edge: "right", x: [1, 20],   y: [8, 90] },
  { edge: "right", x: [1, 20],   y: [8, 90] },
  { edge: "right", x: [1, 20],   y: [8, 90] },
  { edge: "right", x: [26, 44],  y: [10, 88] },
  { edge: "left",  x: [24, 44],  y: [2, 11] },
  { edge: "right", x: [30, 47],  y: [3, 12] },
  { edge: "left",  x: [26, 48],  y: [89, 97] },
  { edge: "right", x: [32, 50],  y: [87, 96] }
];

function build(seed, count, opts) {
  const o = opts || {};
  // A page header band is a fifth the height of a homepage section, so the
  // same field at full size would be all shape and no header. `scale` shrinks
  // the icons and how far they swim; `edgeOnly` drops the zones that reach
  // into the middle, which in a short band means straight across the title.
  const scale = o.scale || 1;
  const zones = o.edgeOnly ? ZONES.filter(function (z) { return z.x[1] <= 23; }) : ZONES;
  const r = rng(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const span = ([lo, hi], places) => {
    const v = lo + r() * (hi - lo);
    return places ? Number(v.toFixed(places)) : Math.round(v);
  };

  const groups = DEPTH.map((d) => ({ speed: d.speed, pull: d.pull, items: [] }));

  for (let i = 0; i < count; i++) {
    // Round-robin the depth so all three layers stay populated whatever the
    // count is; a random depth leaves one layer nearly empty often enough.
    const depth = i % 3;
    const d = DEPTH[depth];
    const sym = pick(SYMS);
    const zone = pick(zones);
    const size = Math.round(span(d.size) * scale);
    /* Depth decides how much a shape fades into the ground, which is right for
       a navy outline and wrong for a colour: faded, a hue goes to mud rather
       than receding. So a hued shape takes its opacity from its own band and
       ignores its depth, and only its size still comes from the layer. */
    const oDepth = span(d.o, 3);
    const oHue = span([0.3, 0.5], 3);
    // Solid shapes carry far more weight than outlines at the same opacity,
    // so the big far ones stay line art and the small near ones may fill.
    const mode = sym.fill && depth > 0 && r() < 0.45 ? "fill" : "line";
    /* A hue can land at any depth, including the large far shapes: in Cara the
       coloured ones are among the biggest on screen, and keeping colour to the
       small near layer made it read as specks rather than as accents. */
    const hued = r() < 0.28;
    const ink = hued ? pick(HUED) : pick(COOL);
    // Spin and pulse both drive the transform of the same <svg>, so a shape
    // gets at most one of them.
    const spin = sym.spin && r() < 0.5;

    groups[depth].items.push({
      sym: sym.id,
      mode: mode,
      ink: ink,
      edge: zone.edge,
      x: span(zone.x, 1),
      y: span(zone.y, 1),
      size: size,
      // Both are drawn either way, so the seed advances the same number of
      // steps whichever branch a shape takes and the field stays stable.
      o: hued ? oHue : oDepth,
      amp: Math.round(span(d.amp) * scale),
      dur: span(d.dur, 2),
      // Negative, so every shape starts part way through its float rather
      // than the whole field sitting still and then moving off together.
      delay: -span([0, d.dur[1]], 2),
      spin: spin,
      spinRev: r() < 0.5,
      spinDur: span(d.spin, 1),
      pulse: !spin && mode === "fill" && sym.pulse && r() < 0.75,
      // Stroke weight is optical, not fixed: 2.5 on a 120px shape looks like
      // hair, and on a 14px one it closes the shape up.
      sw: Number((size > 90 ? 1.7 : size > 48 ? 2.1 : size > 24 ? 2.6 : 3.2).toFixed(1)),
      // Only the shapes hugging an edge survive on a narrow screen; the rest
      // would sit under the copy once the text column reflows wide.
      edgy: zone.x[1] <= 23
    });
  }

  return groups;
}

module.exports = {
  // The homepage sections, full height and full field.
  intro: build(20250915, 15),
  things: build(74113, 13),
  about: build(918244, 13),
  contact: build(551907, 13),
  work: build(410238, 13),

  // The header band on every other page. Same vocabulary, same clocks, a
  // quieter version of the same idea: the inner pages have something to read,
  // so the field stays at the edges and out of the way.
  blog: build(330441, 9, { scale: 0.6, edgeOnly: true }),
  post: build(786012, 7, { scale: 0.52, edgeOnly: true }),
  ledger: build(144509, 9, { scale: 0.6, edgeOnly: true }),
  bottle: build(602877, 8, { scale: 0.56, edgeOnly: true })
};
