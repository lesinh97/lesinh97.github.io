/* Dram Ledger — renders the index from the bottle notes in _bottles/. */
(function () {
  var FAMS = [
    ["fruit", "Fruit & floral"],
    ["sweet", "Sweet & creamy"],
    ["spice", "Spice & dried fruit"],
    ["oak", "Oak & nut"],
    ["malt", "Malt & grain"],
    ["peat", "Smoke & peat"]
  ];
  /* Signed in katakana, two characters, echoing the mark in the nav. */
  var SIG = "\u30b7\u30f3";
  /* Single quotes on purpose: this goes inside a style="..." attribute, so
     double quotes here close the attribute early and silently drop the
     font-family and every declaration after it. */
  var SIG_FONT = "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var BAR = ["var(--bar-0)", "var(--bar-1)", "var(--bar-2)", "var(--bar-3)", "var(--bar-4)", "var(--bar-5)"];
  var PBAR = ["var(--pbar-0)", "var(--pbar-1)", "var(--pbar-2)", "var(--pbar-3)", "var(--pbar-4)", "var(--pbar-5)"];
  var SORTS = [["recent", "Most recent"], ["score", "Highest score"], ["spend", "Most spent"], ["left", "Most left"]];
  /* Card ink. These are print colours, not screen tokens: the light set has
     to hold up as real pigment on white paper, so the navy is a deep one. */
  var INK = {
    light: { bg: "#ffffff", fg: "#111b2b", muted: "#4e6280", ink: "#1a365d", onInk: "#ffffff", edge: "#93a8c4", rule: "#c6d5e6", soft: "#eef3fa", track: "#dde7f3", wash: "rgba(26,54,93,.18)", cut: "#8fa1b8" },
    dark: { bg: "#0e1726", fg: "#e4ecf8", muted: "#8ba1c0", ink: "#8fc0ec", onInk: "#0e1726", edge: "#3f5472", rule: "#26374f", soft: "#152439", track: "#1f3049", wash: "rgba(143,192,236,.26)", cut: "#6b7f99" }
  };

  /* The cards live in #sheet, which is display:none until print. Browsers do
     not download webfonts for hidden text, so the signature would fall back
     to a brush-style system face on the printed page. Ask for the two glyphs
     up front. */
  if (document.fonts && document.fonts.load) {
    document.fonts.load('500 12px "Noto Sans JP"', SIG).catch(function () {});
  }

  var raw = JSON.parse(document.getElementById("bottle-data").textContent || "[]");
  var brandEl = document.getElementById("brand-data");
  var brands = brandEl ? JSON.parse(brandEl.textContent || "[]") : [];
  var list = raw.map(function (b) {
    b.id = (b.path || b.name).replace(/^.*\//, "").replace(/\.md$/, "");
    b.fam = b.fam || {};
    b.tags = b.tags || [];
    return b;
  });

  /* /whisky/#the-lakes-resfeber opens on that bottle. Without it a link you
     send always lands on whatever you tasted last. */
  function fromHash() {
    var id = decodeURIComponent(String(location.hash || "").replace(/^#/, ""));
    return list.some(function (w) { return w.id === id; }) ? id : null;
  }

  var S = {
    selId: fromHash() || (list.length ? sortBy(list.slice(), "recent")[0].id : null),
    query: "", origin: "All", sort: "recent", openOnly: false,
    shape: "card", ink: "light", showPrint: false,
    picked: list.map(function (b) { return b.id; })
  };

  /* Cards are fixed millimetre shapes, so card text is clamped rather than
     allowed to overflow. Cuts on a word boundary and adds an ellipsis. */
  function clamp(text, max) {
    var t = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    var cut = t.slice(0, max);
    var sp = cut.lastIndexOf(" ");
    if (sp > max * 0.6) cut = cut.slice(0, sp);
    return cut.replace(/[,;:.–-]+$/, "") + "…";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    if (!n) return "";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0\u20ab";
  }
  /* Both guard the empty date a bottle carries while it is owned but not yet
     opened. `new Date("")` is an Invalid Date, and reading a month off one
     gives NaN, which these used to print straight into the row as
     "undefined N". */
  function dShort(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d)) return "Not tasted";
    return MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
  }
  function dLong(iso) {
    var d = new Date(iso);
    if (!iso || isNaN(d)) return "Not tasted yet";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function score(v) { return v == null || v === "" ? "\u2013" : (Math.round(v * 10) / 10).toFixed(1); }
  function initials(n) {
    return n.replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join("").toUpperCase();
  }
  function shortStory(s) {
    if (!s) return "";
    var t = s.split(". ")[0];
    if (t.length > 78) t = t.slice(0, 78).replace(/[\s,]+\S*$/, "");
    return t + ".";
  }
  function sortBy(rows, mode) {
    return rows.sort(function (a, b) {
      return mode === "score" ? b.score - a.score : mode === "spend" ? b.spend - a.spend : mode === "left" ? (b.left || 0) - (a.left || 0) : String(b.date).localeCompare(String(a.date));
    });
  }
  function filtered() {
    var q = S.query.trim().toLowerCase();
    var rows = list.filter(function (w) {
      if (S.origin !== "All" && w.origin !== S.origin) return false;
      if (S.openOnly && !(w.left > 0)) return false;
      if (!q) return true;
      return (w.name + " " + w.origin + " " + w.tags.join(" ") + " " + w.nose + " " + w.palate).toLowerCase().indexOf(q) > -1;
    });
    return sortBy(rows, S.sort);
  }
  function selected() {
    return list.filter(function (w) { return w.id === S.selId; })[0] || filtered()[0] || list[0];
  }

  /* ---------- index column ---------- */

  /* The houses, as monograms in the same disc the bottle shots use. They are
     set in the display face rather than in a fetched logo: seven distillery
     logos are seven different colour schemes, and on a navy page they would
     fight each other and the palette. */
  function housesHtml() {
    if (!brands.length) return "";
    var counts = {};
    list.forEach(function (w) { if (w.brand) counts[w.brand] = (counts[w.brand] || 0) + 1; });
    var items = brands.map(function (b) {
      var n = counts[b.name] || 0;
      var ab = b.abbr || initials(b.name);
      return '<a class="house-t" href="' + esc(b.url) + '" title="' + esc(b.name) +
        (n ? " · " + n + (n === 1 ? " bottle" : " bottles") : "") + '">' +
        '<span class="house-d"><b' + (ab.length > 2 ? ' class="long"' : "") + ">" + esc(ab) + "</b></span>" +
        '<span class="house-n">' + esc(b.name) + "</span></a>";
    }).join("");
    return '<div class="shelfhead"><span class="lbl">Distilleries &amp; bottlers</span></div>' +
      '<div class="houses">' + items + "</div>";
  }

  function shelfHtml(sel) {
    var items = sortBy(list.slice(), "recent").map(function (w) {
      var on = sel && w.id === sel.id;
      var shot = w.photo
        ? '<img src="' + esc(w.photo) + '" alt="' + esc(w.name) + '" loading="lazy" decoding="async">'
        : '<i class="ph ph-wine"></i>';
      // The whole tile is the button: the photo is the obvious thing to aim at.
      // title as well as the label: the label is clamped to three lines, and a
      // couple of these names run longer than that.
      return '<button class="tile' + (on ? " on" : "") + '" data-act="pick" data-id="' + esc(w.id) +
        '" title="' + esc(w.name) + '"' + (on ? ' aria-current="true"' : "") + ">" +
        '<span class="shot">' + shot + "</span>" +
        '<span class="tname">' + esc(w.name) + "</span></button>";
    }).join("");
    return '<div class="shelfhead"><span class="lbl">Bottles</span>' +
      "</div>" +
      '<div class="shelf">' + items + "</div>";
  }

  function chipsHtml() {
    var origins = ["All"], seen = {};
    list.forEach(function (w) { if (!seen[w.origin]) { seen[w.origin] = 1; origins.push(w.origin); } });
    var chips = origins.map(function (o) {
      return '<button class="chip' + (o === S.origin ? " on" : "") + '" data-act="origin" data-v="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("");
    var label = (SORTS.filter(function (x) { return x[0] === S.sort; })[0] || SORTS[0])[1];
    var open = list.filter(function (w) { return w.left > 0; }).length;
    var openChip = open
      ? '<button class="chip' + (S.openOnly ? " on" : "") + '" data-act="openOnly">Open now ' + open + "</button>"
      : "";
    return '<div class="chiprow">' + chips + openChip +
      '<button class="chip" data-act="sort" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">' +
      '<i class="ph ph-arrows-down-up"></i>' + label + "</button></div>";
  }

  /* The track shows on every row so the columns line up. A null level draws
     no bar inside it, which is different from a bar at zero. */
  function fillCell(w) {
    var known = w.left != null;
    return '<span class="rfill' + (known ? "" : " unknown") + '" title="' +
      (known ? w.left + "% left" : "level not recorded") + '">' +
      (known ? '<i style="width:' + w.left + '%"></i>' : "") + "</span>";
  }

  /* Score in the middle, how much is left as the arc around it. Same markup as
     the note page; the styles are shared in motion.css. */
  function scoreRing(w) {
    var dash = (339.292 * (1 - (w.left || 0) / 100)).toFixed(2);
    return '<div class="sr-wrap"><div class="sring" style="--dash:' + dash + '">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="sr-track" cx="60" cy="60" r="54"/>' +
      '<circle class="sr-arc" cx="60" cy="60" r="54"/></svg>' +
      '<div class="sr-mid"><b>' + score(w.score) + "</b><span>" +
      (w.score == null ? "unscored" : "of 10") + "</span></div></div>" +
      '<div class="sr-note">' +
      (w.left == null ? "level not recorded" : w.left === 0 ? "finished" : w.left + "% left") +
      "</div></div>";
  }

  function fillBar(w) {
    if (w.left == null) return "";
    var note = w.left === 0 ? "finished" : w.ml ? "about " + w.ml + " ml left" : "left";
    return '<div class="lbl" style="margin-bottom:10px">Aqua vitae level</div>' +
      '<div class="pfill"><span class="pfilltrack"><i style="width:' + w.left + '%"></i></span>' +
      "<b>" + w.left + "%</b><span>" + note + "</span></div>" +
      '<div class="softrule"></div>';
  }

  function rowHtml(w, sel) {
    var on = sel && w.id === sel.id;
    var sub = [dShort(w.date), w.origin, w.age, money(w.spend)].filter(Boolean).join("  \u00b7  ");
    var bars = FAMS.map(function (f, i) {
      return '<i style="height:' + (3 + (w.fam[f[0]] || 0) * 3.8) + "px;background:" + BAR[w.fam[f[0]] || 0] + '"></i>';
    }).join("");
    return '<div class="row' + (on ? " on" : "") + '" data-act="pick" data-id="' + esc(w.id) + '">' +
      '<span class="init">' + esc(initials(w.name)) + "</span>" +
      '<span style="flex:1;min-width:0"><span class="rname">' + esc(w.name) +
      (w.bottles > 1 ? '<span class="rtimes" title="' + w.bottles + ' bottles bought">x' + w.bottles + "</span>" : "") +
      "</span>" +
      '<span class="rsub">' + esc(sub) + "</span></span>" +
      '<span class="spark">' + bars + "</span>" +
      fillCell(w) +
      '<span class="rscore">' + score(w.score) + "</span>" +
      // data-act="noop" so the delegated handler bows out and the link navigates,
      // leaving the rest of the row selecting the bottle in the panel as before.
      '<a class="rgo" data-act="noop" href="' + esc(w.url || "/bottles/" + w.id + "/") +
      '" title="Open bottle page" aria-label="Open the page for ' + esc(w.name) + '">' +
      '<i class="ph ph-arrow-up-right"></i></a></div>';
  }

  function listHtml(rows, sel) {
    if (!rows.length) {
      return '<div style="padding:40px 4px;font-size:13px;color:var(--color-neutral-500)">Nothing matches that. Clear the search.</div>';
    }
    var groups = [];
    if (S.sort !== "recent") {
      groups = [{ label: S.sort === "score" ? "Ranked by score" : "Ranked by spend", items: rows }];
    } else {
      rows.forEach(function (w) {
        // An undated bottle is one that is owned but not yet opened, so it
        // gets a group of its own rather than an empty year heading.
        var y = String(w.date).slice(0, 4) || "Not tasted yet";
        if (!groups.length || groups[groups.length - 1].label !== y) groups.push({ label: y, items: [] });
        groups[groups.length - 1].items.push(w);
      });
    }
    return groups.map(function (g) {
      return "<div>" + '<div class="ghead"><b>' + esc(g.label) + "</b><span>" +
        g.items.length + (g.items.length === 1 ? " bottle" : " bottles") + "</span></div>" +
        g.items.map(function (w) { return rowHtml(w, sel); }).join("") + "</div>";
    }).join("");
  }

  /* ---------- detail panel ---------- */

  function panelHtml(sel) {
    if (!sel) return "";
    var shot = sel.photo ? '<img src="' + esc(sel.photo) + '" alt="' + esc(sel.name) + '" decoding="async">' : '<i class="ph ph-wine"></i>';
    var facts = [
      [sel.tastings > 1 ? "First tasted" : "Tasted", dLong(sel.date)],
      ["Strength", sel.abv || "\u2013"],
      ["Age", sel.age || "NAS"],
      [sel.bottles > 1 ? "Paid, " + sel.bottles + " bottles" : "Paid", money(sel.spend)]
    ].map(function (f) {
      return '<div class="fact"><span>' + esc(f[0]) + "</span><b>" + esc(f[1]) + "</b></div>";
    }).join("");
    var bars = FAMS.map(function (f, i) {
      var v = sel.fam[f[0]] || 0;
      return '<div class="fbar"><span>' + esc(f[1]) + '</span><span class="track"><i style="width:' +
        v * 20 + "%;background:" + BAR[v] + '"></i></span><span class="fval">' + v + "</span></div>";
    }).join("");
    var notes = [["Nose", sel.nose], ["Palate", sel.palate], ["Finish", sel.finish]].filter(function (n) { return n[1]; })
      .map(function (n) {
        return '<div class="note"><span>' + n[0] + "</span><p>" + esc(n[1]) + "</p></div>";
      }).join("");
    var story = sel.story
      ? '<div class="note dim" style="margin-top:18px"><span>Behind it</span><p>' + esc(sel.story) + "</p></div>" : "";
    var tags = sel.tags.map(function (t) { return '<span class="tag tag-accent">' + esc(t) + "</span>"; }).join("");
    return '<div class="panel"><div class="phead">' +
      '<div style="display:flex;gap:16px;align-items:flex-start;justify-content:space-between">' +
      '<div class="pshot">' + shot + "</div>" +
      '<div style="flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:12px">' +
      '<span class="proppill">' + esc([sel.origin, sel.type].filter(Boolean).join(" \u00b7 ")) + "</span>" +
      "</div>" + scoreRing(sel) + "</div>" +
      "<h2>" + esc(sel.name) + "</h2>" +
      '<div style="font-size:12.5px;color:var(--color-neutral-400);margin-top:6px">' +
      esc([sel.age, sel.abv, sel.cask].filter(Boolean).join("  \u00b7  ")) + "</div></div>" +
      '<div class="facts">' + facts + "</div>" +
      '<div class="pbody">' + fillBar(sel) +
      '<div class="lbl" style="margin-bottom:14px">Flavour signature</div>' +
      '<div style="display:flex;flex-direction:column;gap:11px">' + bars + "</div>" +
      '<div class="softrule"></div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' + notes + "</div>" + story +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:22px">' + tags + "</div>" +
      '<div style="display:flex;gap:8px;margin-top:24px">' +
      '<button class="btn btn-secondary" data-act="printSel"><i class="ph ph-printer"></i>Print card</button>' +
      (sel.url ? '<a class="btn btn-ghost" href="' + esc(sel.url) + '">Open the note page</a>' : "") +
      "</div></div></div>";
  }

  /* ---------- print sheet ---------- */

  function cardData(w) {
    var c = INK[S.ink];
    var lightBars = ["#dde7f3", "#bcd2ea", "#8fb2da", "#5c8cc4", "#2f5f9e", "#1a365d"];
    var darkBars = ["#1f3049", "#2b4770", "#376094", "#4a83bd", "#6fa5d9", "#8fc0ec"];
    return {
      c: c,
      name: w.name,
      origin: w.origin || "Unlisted",
      kicker: [w.origin, w.type].filter(Boolean).join("  \u00b7  "),
      line: [w.age, w.abv, w.cask].filter(Boolean).join("  \u00b7  "),
      stack: [[w.age, w.abv].filter(Boolean).join("  \u00b7  "), w.cask].filter(Boolean).join("\n"),
      /* "Tasted Not tasted yet" would be both redundant and the longest date
         line on the card. This is 14 characters against the 18 of "Tasted
         15 Nov 2025", so the signed row stays narrower than its existing worst
         case and needs no re-measuring. */
      dateLine: w.date ? "Tasted " + dLong(w.date) : "Not tasted yet",
      sig: SIG,
      // The card prints `keynote` and nothing else. The note's markdown body
      // is prose for the page, not a caption: truncating it mid-sentence read
      // as broken, so a bottle with no keynote simply shows no line.
      words: (w.keynote || "").trim(),
      score: score(w.score),
      unit: "out of ten",
      taglineShort: w.tags.slice(0, 3).join("  \u00b7  "),
      notes: [["Nose", w.nose], ["Palate", w.palate], ["Finish", w.finish]]
        .filter(function (n) { return n[1]; })
        .map(function (n) { return { label: n[0], text: n[1] }; }),
      specs: [
        { k: "Age", v: w.age || "NAS" },
        { k: "Strength", v: w.abv || "Not listed" },
        { k: "Cask", v: w.cask || "Not listed" }
      ],
      bars: FAMS.map(function (f) {
        var v = w.fam[f[0]] || 0;
        return { short: f[1].split(" ")[0], pct: v * 20, fill: (S.ink === "dark" ? darkBars : lightBars)[v] };
      })
    };
  }

  function barsHtml(d, labelW, labelFs) {
    return d.bars.map(function (b) {
      return '<span style="display:flex;align-items:center;gap:1.6mm">' +
        '<span style="width:' + labelW + ";flex:none;text-align:left;font-size:" + labelFs +
        ";letter-spacing:.1em;text-transform:uppercase;color:" + d.c.muted + '">' + esc(b.short) + "</span>" +
        '<span style="flex:1;height:1mm;border-radius:.5mm;background:' + d.c.track + '">' +
        '<span style="display:block;height:100%;border-radius:.5mm;background:' + b.fill + ";width:" + b.pct + '%"></span>' +
        "</span></span>";
    }).join("");
  }

  function notesHtml(d, labelW, labelFs, textFs) {
    return d.notes.map(function (n) {
      return '<div style="display:flex;gap:2.2mm;align-items:baseline">' +
        '<span style="width:' + labelW + ";flex:none;font-size:" + labelFs +
        ";font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:" + d.c.ink + '">' + esc(n.label) + "</span>" +
        '<span style="flex:1;min-width:0;font-size:' + textFs + ';line-height:1.32">' + esc(n.text) + "</span></div>";
    }).join("");
  }

  /* The owner's own words, from `keynote` in the note or its prose. Nothing
     renders at all when a note has neither, so the card just closes up. */
  function wordsHtml(d, max, fs, mt) {
    if (!d.words) return "";
    return '<div style="flex:none;margin-top:' + mt + ";padding-left:2mm;border-left:.5mm solid " + d.c.ink +
      ";font-size:" + fs + ";line-height:1.4;text-align:left;color:" + d.c.fg + '">' +
      esc(clamp(d.words, max)) + "</div>";
  }

  /* The cards follow the bottle page: a gradient wash behind the header, the
     score in a filled block, and the tasting notes on their own tinted panel.
     No photo on any of them, they are tags. */

  /* Tasted date on the left, signature on the right, on one baseline. */
  function signedRow(d, fs, sigFs) {
    return '<span style="display:flex;align-items:baseline;justify-content:space-between;gap:3mm;width:100%">' +
      '<span style="font-size:' + fs + ';letter-spacing:.16em;text-transform:uppercase;color:' + d.c.muted + '">' +
      esc(d.dateLine) + "</span>" +
      '<span style="flex:none;font-family:' + SIG_FONT + ";font-size:" + sigFs +
      ";font-weight:500;letter-spacing:.22em;text-indent:.22em;line-height:1;color:" + d.c.ink + '">' +
      esc(d.sig) + "</span></span>";
  }

  function wash(d, size) {
    return "radial-gradient(" + size + " at 100% 0%, " + d.c.wash + " 0%, transparent 72%)";
  }

  function scoreBlock(d, w, pad, numFs, unitFs, radius, centred) {
    return '<div style="flex:none;' + (centred ? "margin:0 auto;" : "") + "width:" + w + ";padding:" + pad +
      ";text-align:center;border-radius:" + radius + ";background:" + d.c.ink + ";color:" + d.c.onInk + '">' +
      '<div style="font-family:var(--font-heading);font-weight:500;font-size:' + numFs +
      ';line-height:.95;font-variant-numeric:tabular-nums">' + d.score + "</div>" +
      '<div style="font-size:' + unitFs + ';letter-spacing:.14em;text-indent:.14em;text-transform:uppercase;margin-top:1.1mm;opacity:.85">' +
      d.unit + "</div></div>";
  }

  /* Notes on a tinted panel with the label in the ink colour, laid out the
     way the bottle page sets them. */
  function notesPanel(d, labelW, labelFs, textFs, pad) {
    if (!d.notes.length) return "";
    return '<div style="flex:none;display:flex;flex-direction:column;gap:1.3mm;padding:' + pad +
      ";border-radius:1.2mm;background:" + d.c.soft + '">' +
      d.notes.map(function (n) {
        return '<div style="display:flex;gap:2.4mm;align-items:baseline">' +
          '<span style="width:' + labelW + ";flex:none;font-size:" + labelFs +
          ";font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:" + d.c.ink + '">' +
          esc(n.label) + "</span>" +
          '<span style="flex:1;min-width:0;font-size:' + textFs + ";line-height:1.34;color:" + d.c.fg + '">' +
          esc(n.text) + "</span></div>";
      }).join("") + "</div>";
  }

  function shelfCard(d) {
    return '<div style="width:95mm;min-height:62mm;break-inside:avoid;position:relative;display:flex;' +
      "flex-direction:column;justify-content:space-between;padding:4.6mm 5.4mm 0 7mm;background:" + d.c.bg +
      ";border:.3mm solid " + d.c.cut + ";color:" + d.c.fg +
      ';font-family:var(--font-body)">' +
      '<div style="position:absolute;inset:0;background:' + wash(d, "70% 62%") + '"></div>' +
      '<div style="position:absolute;top:0;bottom:0;left:0;width:1.4mm;background:' + d.c.ink + '"></div>' +

      '<div style="position:relative;flex:none;display:flex;align-items:flex-start;gap:4mm">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:4.6pt;font-weight:500;letter-spacing:.18em;text-transform:uppercase;line-height:1;color:' +
      d.c.ink + '">' + esc(d.kicker) + "</div>" +
      '<div style="font-family:var(--font-heading);font-weight:500;font-size:13pt;line-height:1.08;letter-spacing:-.016em;margin-top:1.9mm">' +
      esc(d.name) + "</div>" +
      '<div style="font-size:5.2pt;letter-spacing:.06em;line-height:1.35;margin-top:1.4mm;color:' + d.c.muted + '">' +
      esc(d.line) + "</div></div>" +
      scoreBlock(d, "17.5mm", "1.9mm 0 2mm", "16pt", "3.8pt", "1.4mm", false) + "</div>" +

      '<div style="position:relative;flex:none;margin-top:1.8mm">' +
      notesPanel(d, "9.5mm", "4.2pt", "5.2pt", "2mm 2.4mm") + "</div>" +

      '<div style="position:relative;flex:none;display:grid;grid-template-columns:repeat(2,1fr);gap:1mm 5mm;margin-top:1.6mm">' +
      d.bars.map(function (bar) {
        return '<div style="display:flex;align-items:center;gap:1.6mm">' +
          '<span style="width:8.5mm;flex:none;font-size:3.8pt;letter-spacing:.1em;text-transform:uppercase;color:' +
          d.c.muted + '">' + esc(bar.short) + "</span>" +
          '<span style="flex:1;height:1mm;border-radius:.5mm;background:' + d.c.track + '">' +
          '<span style="display:block;height:100%;border-radius:.5mm;background:' + bar.fill + ";width:" + bar.pct + '%"></span>' +
          "</span></div>";
      }).join("") + "</div>" +

      wordsHtml(d, 260, "5pt", "1.5mm") +

      '<div style="position:relative;flex:none;display:flex;justify-content:space-between;align-items:baseline;gap:3mm;' +
      "margin:1.5mm -5.4mm 0 -7mm;padding:1.7mm 5.4mm 1.5mm 7mm;background:" + d.c.soft +
      ";border-top:.25mm solid " + d.c.rule + ";font-size:4.6pt;letter-spacing:.14em;text-transform:uppercase;color:" +
      d.c.muted + '">' +
      '<span style="flex:1;min-width:0">' + esc(d.dateLine) + "</span>" +
      '<span style="flex:none">' + esc(d.taglineShort) + "</span>" +
      '<span style="flex:none;font-family:' + SIG_FONT +
      ';font-size:5.2pt;font-weight:500;letter-spacing:.2em;text-indent:.2em;line-height:1;color:' +
      d.c.ink + '">' + esc(d.sig) + "</span></div></div>";
  }

  function hangTag(d) {
    return '<div style="width:46mm;min-height:102mm;break-inside:avoid;position:relative;display:flex;' +
      "flex-direction:column;align-items:center;justify-content:space-between;padding:9.4mm 4.8mm 0;background:" + d.c.bg +
      ";border:.3mm solid " + d.c.cut + ";color:" + d.c.fg + ';font-family:var(--font-body);text-align:center">' +
      '<span style="position:absolute;inset:0;background:' + wash(d, "110% 32%") + '"></span>' +
      '<span style="position:absolute;top:0;left:0;right:0;height:1.4mm;background:' + d.c.ink + '"></span>' +
      '<span style="position:absolute;top:4.6mm;left:50%;width:2.6mm;height:2.6mm;margin-left:-1.3mm;border-radius:50%;border:.3mm solid ' +
      d.c.edge + '"></span>' +

      '<span style="position:relative;flex:none;display:flex;flex-direction:column;align-items:center;width:100%">' +
      '<span style="font-size:4.4pt;font-weight:500;letter-spacing:.2em;text-indent:.2em;text-transform:uppercase;line-height:1;color:' +
      d.c.ink + '">' + esc(d.origin) + "</span>" +
      '<span style="font-family:var(--font-heading);font-size:9.5pt;font-weight:500;line-height:1.12;letter-spacing:-.012em;margin-top:2mm;text-wrap:balance">' +
      esc(d.name) + "</span>" +
      '<span style="white-space:pre-line;font-size:4.2pt;letter-spacing:.12em;text-transform:uppercase;line-height:1.42;margin-top:1.6mm;color:' +
      d.c.muted + '">' + esc(d.stack) + "</span>" +
      '<span style="display:block;width:100%;margin-top:2.2mm">' +
      scoreBlock(d, "21mm", "1.9mm 0 2mm", "15pt", "3.4pt", "1.6mm", true) +
      "</span></span>" +

      '<span style="position:relative;flex:none;display:block;width:100%;text-align:left;margin-top:2mm">' +
      notesPanel(d, "6.6mm", "3.3pt", "4pt", "1.5mm 1.8mm") + "</span>" +

      '<span style="position:relative;flex:none;display:flex;flex-direction:column;gap:.9mm;width:34mm;margin-top:1.3mm">' +
      barsHtml(d, "8.5mm", "3.5pt") + "</span>" +

      wordsHtml(d, 260, "4pt", "1.3mm") +

      '<span style="position:relative;flex:none;align-self:stretch;margin:1.5mm -4.8mm 0;padding:2mm 4mm 1.9mm;background:' +
      d.c.soft + ";border-top:.25mm solid " + d.c.rule + '">' +
      signedRow(d, "4.4pt", "5pt") + "</span></div>";
  }

  function sheetHtml() {
    var draw = S.shape === "tag2" ? hangTag : shelfCard;
    var el = document.getElementById("sheet");
    // A 4mm alley between cards leaves room for scissors on both cuts.
    el.style.columnWidth = S.shape === "tag2" ? "46mm" : "95mm";
    el.style.columnGap = "4mm";
    el.innerHTML = list.filter(function (w) { return S.picked.indexOf(w.id) > -1; })
      .map(function (w) { return draw(cardData(w)); }).join("");
  }

  /* ---------- print dialog ---------- */

  function modalHtml() {
    if (!S.showPrint) return "";
    var shapes = [["card", "Shelf card"], ["tag2", "Hang tag"]].map(function (k) {
      return '<button class="chip' + (S.shape === k[0] ? " on" : "") + '" data-act="shape" data-v="' + k[0] + '">' + k[1] + "</button>";
    }).join("");
    var inks = [["light", "Light paper"], ["dark", "Dark card"]].map(function (k) {
      return '<button class="chip' + (S.ink === k[0] ? " on" : "") + '" data-act="ink" data-v="' + k[0] + '">' + k[1] + "</button>";
    }).join("");
    var picks = list.map(function (w) {
      return '<button class="chip plain' + (S.picked.indexOf(w.id) > -1 ? " on" : "") + '" data-act="toggle" data-id="' +
        esc(w.id) + '">' + esc(w.name) + "</button>";
    }).join("");
    var n = S.picked.length + (S.picked.length === 1 ? " card" : " cards");
    return '<div class="screen dialog-backdrop" style="z-index:100;background:rgba(29,31,39,.42);overflow:auto;padding:32px 20px;align-items:start">' +
      '<div class="dialog" style="width:min(560px,100%)">' +
      '<div style="display:flex;align-items:flex-start;gap:12px"><div style="flex:1">' +
      '<div class="dialog-title">Print shelf cards</div>' +
      '<div style="font-size:12.5px;color:var(--color-neutral-400);margin-top:4px">Shelf card 85 x 55 mm, hang tag 40 x 88 mm, classic tag 50 x 100 mm. Cut along the outline.</div></div>' +
      '<button class="btn btn-icon btn-secondary" data-act="closePrint"><i class="ph ph-x"></i></button></div>' +
      '<div style="display:flex;gap:8px;margin-top:4px;align-items:center">' + shapes +
      '<span style="width:1px;height:20px;background:var(--color-divider)"></span>' + inks + "</div>" +
      '<div style="display:flex;gap:8px;margin-top:4px">' +
      '<button class="btn btn-secondary" data-act="pickAll">Select all</button>' +
      '<button class="btn btn-secondary" data-act="pickNone">Clear</button>' +
      '<span style="margin-left:auto;align-self:center;font-size:12px;color:var(--color-neutral-500)">' + n + "</span></div>" +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:42vh;overflow-y:auto;padding:2px">' + picks + "</div>" +
      '<div class="dialog-actions"><button class="btn btn-secondary" data-act="closePrint">Cancel</button>' +
      '<button class="btn btn-primary" data-act="doPrint"><i class="ph ph-printer"></i>Print ' + n + "</button></div></div></div>";
  }

  /* ---------- render ---------- */

  // #body is rewritten whole on every interaction, which would throw away the
  // shelf's horizontal scroll and the list's vertical one. Carry both across.
  function scrollState() {
    var shelf = document.querySelector(".shelf"), lst = document.querySelector(".list");
    return { shelf: shelf ? shelf.scrollLeft : 0, list: lst ? lst.scrollTop : 0 };
  }
  function restoreScroll(was) {
    var shelf = document.querySelector(".shelf"), lst = document.querySelector(".list");
    if (lst) {
      document.documentElement.style.setProperty(
        "--listsb", (lst.offsetWidth - lst.clientWidth) + "px");
    }
    if (lst) lst.scrollTop = was.list;
    if (!shelf) return;
    shelf.scrollLeft = was.shelf;
    /* A pick from the list can select a bottle that is off screen in the strip.
       Measured with rects, not offsetLeft: .shelf is not a positioned element,
       so offsetLeft was reported against some ancestor further up and compared
       against shelf.scrollLeft, which sent the strip somewhere arbitrary on
       every click. Rect deltas are in the scroller's own space whatever the
       offsetParent turns out to be. */
    var on = shelf.querySelector(".tile.on");
    if (!on) return;
    var sr = shelf.getBoundingClientRect(), tr = on.getBoundingClientRect();
    if (tr.left < sr.left) shelf.scrollLeft += tr.left - sr.left - 10;
    else if (tr.right > sr.right) shelf.scrollLeft += tr.right - sr.right + 10;
  }

  function render() {
    var rows = filtered(), sel = selected(), was = scrollState();
    /* Averaged over the bottles that have actually been scored. A bottle on the
       shelf but not yet tasted carries no score, and counting it as a zero over
       the full list dragged the headline average down by most of a point. */
    var scored = list.filter(function (w) { return w.score != null && w.score !== ""; });
    var avg = scored.length
      ? scored.reduce(function (t, w) { return t + w.score; }, 0) / scored.length
      : 0;
    var counts = {};
    list.forEach(function (w) { counts[w.origin] = (counts[w.origin] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || "\u2013";
    var spend = rows.reduce(function (t, w) { return t + (w.spend || 0); }, 0);

    document.getElementById("body").innerHTML =
      '<div class="hero"><div style="flex:1 1 320px;min-width:0"><h1>Aqua Vitae</h1>' +
      "<p>It's the water of life, the old name for distilled spirit. " +
      "Gaelic turned it into uisge beatha, and that became whisky.</p></div>" +
      '<div class="stats">' +
      '<div><div class="stat-n">' + list.length + '</div><div class="stat-l">Bottles logged</div></div>' +
      '<div><div class="stat-n" style="color:var(--color-accent)">' + score(avg) + '</div><div class="stat-l">Average score</div></div>' +
      '<div><div class="stat-n">' + esc(top) + '</div><div class="stat-l">Favourite origin</div></div>' +
      "</div></div>" +
      '<div class="cols"><div class="col">' + housesHtml() + shelfHtml(sel) + chipsHtml() +
      '<div class="lhead"><span style="width:30px;flex:none"></span><span style="flex:1">Bottle</span>' +
      '<span class="lh-sig">Flavour</span><span class="lh-left">Level</span>' +
      '<span class="lh-score">Score</span><span class="lh-go"></span></div>' +
      '<div class="list">' + listHtml(rows, sel) + "</div>" +
      '<div class="foot"><span>' +
      (rows.length === list.length ? list.length + " bottles in the ledger" : "Showing " + rows.length + " of " + list.length) +
      "</span><span>Total " + money(spend) + "</span></div></div>" +
      '<div class="col">' + panelHtml(sel) + "</div></div>";

    restoreScroll(was);
    document.getElementById("modal").innerHTML = modalHtml();
    sheetHtml();
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var a = el.getAttribute("data-act"), v = el.getAttribute("data-v"), id = el.getAttribute("data-id");
    if (a === "noop") return;
    if (a === "pick") {
      S.selId = id;
      // replaceState, not a hash assignment: no jump, no history entry per click.
      if (window.history && history.replaceState) history.replaceState(null, "", "#" + id);
    }
    else if (a === "openOnly") S.openOnly = !S.openOnly;
    else if (a === "origin") S.origin = v;
    else if (a === "sort") {
      var i = SORTS.map(function (x) { return x[0]; }).indexOf(S.sort);
      S.sort = SORTS[(i + 1) % SORTS.length][0];
    } else if (a === "openPrint") S.showPrint = true;
    else if (a === "closePrint") S.showPrint = false;
    else if (a === "shape") S.shape = v;
    else if (a === "ink") S.ink = v;
    else if (a === "pickAll") S.picked = list.map(function (w) { return w.id; });
    else if (a === "pickNone") S.picked = [];
    else if (a === "toggle") {
      S.picked = S.picked.indexOf(id) > -1 ? S.picked.filter(function (x) { return x !== id; }) : S.picked.concat([id]);
    } else if (a === "doPrint") { S.showPrint = false; render(); setTimeout(function () { window.print(); }, 60); return; }
    else if (a === "printSel") { S.picked = [selected().id]; render(); setTimeout(function () { window.print(); }, 60); return; }
    render();
  });

  window.addEventListener("hashchange", function () {
    var id = fromHash();
    if (id && id !== S.selId) { S.selId = id; render(); }
  });

  document.getElementById("q").addEventListener("input", function (e) {
    S.query = e.target.value;
    render();
  });

  render();
})();
