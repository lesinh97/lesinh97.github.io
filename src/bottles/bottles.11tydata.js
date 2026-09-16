/* Layout and permalink for the notes, plus the shape the rest of the site reads
   them through.

   A note describes an EXPRESSION. An expression belongs to a brand, is owned as
   one or more `fills` (physical bottles you bought), and is met in one or more
   `tastings` (sittings). All three arrays are optional: a note that predates
   them carries the flat `price` / `tasted` / `score` / `nose` / `palate` /
   `finish` / `photo` fields instead, and the normalisers below turn those into
   a one-entry array so everything downstream has exactly one shape to handle.
   That is what lets the arrays be adopted a note at a time rather than in a
   single migration of the whole shelf.

   Two rules keep this working with Eleventy's computed data, and breaking
   either one fails the build:

   1. A computed key never reads another computed key. Eleventy discovers what
      a computed function depends on by running it once against a proxy, and
      that proxy is not an array, so `data.tastingList.filter(...)` throws
      "filter is not a function" before any page renders. Every key below calls
      the plain helpers instead, which read only real front matter.
   2. A computed key is never named after the front matter key it derives from.
      `tastingList` from `tastings`, not over it, or the read is circular. */

// Only entries with something in them. A half-written YAML row should not
// count as a bottle bought or a sitting had.
const real = (v) => v != null && v !== "";

/* ---------- normalisers, from raw front matter only ---------- */

function tastingsOf(data) {
  if (Array.isArray(data.tastings) && data.tastings.length) {
    // Oldest first, so "latest" is always the last entry. filter(Boolean)
    // because Eleventy's computed-data proxy can present the array with
    // undefined members during its dependency pass.
    return data.tastings
      .filter(Boolean)
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  }
  if (!real(data.tasted) && !real(data.score) && !real(data.nose)) return [];
  return [{
    date: data.tasted || "",
    score: real(data.score) ? data.score : null,
    nose: data.nose || "",
    palate: data.palate || "",
    finish: data.finish || "",
    note: ""
  }];
}

function fillsOf(data) {
  if (Array.isArray(data.fills) && data.fills.length) {
    return data.fills
      .filter(Boolean)
      .sort((a, b) => String(a.bought || "").localeCompare(String(b.bought || "")));
  }
  if (!real(data.price) && !real(data.tasted)) return [];
  // A legacy note records one purchase and says nothing about what is left,
  // which is different from saying the bottle is empty.
  return [{
    bought: data.tasted || "",
    price: real(data.price) ? data.price : 0,
    size: null,
    opened: data.tasted || "",
    left: null
  }];
}

function photosOf(data) {
  if (Array.isArray(data.photos) && data.photos.length) return data.photos.filter(real);
  return real(data.photo) ? [data.photo] : [];
}

/* The open bottle is the most recent one with anything left in it. Null `left`
   means unrecorded, which is not the same as empty, so a note that has never
   declared a level reports null and the UI shows no bar at all rather than an
   empty one. */
function openFillOf(data) {
  const open = fillsOf(data).filter((f) => Number(f.left) > 0);
  return open.length ? open[open.length - 1] : null;
}

// The most recent sitting, or an empty stand-in so callers never branch.
function latest(data) {
  const t = tastingsOf(data);
  return (t.length && t[t.length - 1]) || {};
}

module.exports = {
  layout: "bottle.njk",
  permalink: "/bottles/{{ page.fileSlug }}/",

  eleventyComputed: {
    tastingList: (data) => tastingsOf(data),
    // Newest first for display. Done here because Nunjucks `reverse` on this
    // array hands the template undefined entries.
    tastingsDesc: (data) => tastingsOf(data).slice().reverse(),
    fillList: (data) => fillsOf(data),
    photoList: (data) => photosOf(data),
    openFill: (data) => openFillOf(data),

    // The note's current verdict is the most recent sitting, not the first.
    scoreNow(data) {
      const t = tastingsOf(data).filter((x) => real(x.score));
      return t.length ? t[t.length - 1].score : null;
    },
    firstTasted(data) {
      const t = tastingsOf(data).filter((x) => real(x.date));
      return t.length ? t[0].date : "";
    },
    lastTasted(data) {
      const t = tastingsOf(data).filter((x) => real(x.date));
      return t.length ? t[t.length - 1].date : "";
    },

    /* The notes the ledger shows are the ones from the most recent sitting, so
       a revised opinion reaches the panel and the print card without the old
       one lingering beside it. */
    noseNow: (data) => latest(data).nose || "",
    palateNow: (data) => latest(data).palate || "",
    finishNow: (data) => latest(data).finish || "",

    // What the shelf has cost, across every bottle of it bought. The ledger's
    // "Most spent" sort has always claimed to mean this.
    spend: (data) => fillsOf(data).reduce((t, f) => t + (Number(f.price) || 0), 0),
    bottleCount: (data) => fillsOf(data).length,

    left(data) {
      const f = openFillOf(data);
      if (f) return Number(f.left);
      return fillsOf(data).some((x) => real(x.left)) ? 0 : null;
    },
    ml(data) {
      const f = openFillOf(data);
      if (!f || !Number(f.size)) return null;
      return Math.round((Number(f.size) * Number(f.left)) / 100);
    }
  }
};
