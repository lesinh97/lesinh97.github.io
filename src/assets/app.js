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
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var BAR = ["#e4e7f5", "#cdc6ee", "#b3a9e5", "#9789d6", "#7b6dc4", "#5d5294"];
  var PBAR = ["#796cbf", "#6f62b1", "#655aa3", "#5d5294", "#544a85", "#423a6a"];
  var SORTS = [["recent", "Most recent"], ["score", "Highest score"], ["price", "Most spent"]];
  var INK = {
    light: { bg: "#ffffff", fg: "#292b31", muted: "#5f6373", ink: "#5d5294", onInk: "#ffffff", edge: "#9296ab", rule: "#c9ccdc", soft: "#f2f0fc", track: "#e4e7f5" },
    dark: { bg: "#1b1d2c", fg: "#e9e9ed", muted: "#9397ab", ink: "#b5abfc", onInk: "#1b1d2c", edge: "#565a70", rule: "#3c3f52", soft: "#262838", track: "#33364a" }
  };

  var raw = JSON.parse(document.getElementById("bottle-data").textContent || "[]");
  var list = raw.map(function (b) {
    b.id = (b.path || b.name).replace(/^.*\//, "").replace(/\.md$/, "");
    b.fam = b.fam || {};
    b.tags = b.tags || [];
    return b;
  });

  var S = {
    selId: list.length ? sortBy(list.slice(), "recent")[0].id : null,
    query: "", origin: "All", sort: "recent",
    shape: "card", ink: "light", showPrint: false,
    picked: list.map(function (b) { return b.id; })
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    if (!n) return "";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0\u20ab";
  }
  function dShort(iso) { var d = new Date(iso); return MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(2); }
  function dLong(iso) { var d = new Date(iso); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
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
      return mode === "score" ? b.score - a.score : mode === "price" ? b.price - a.price : String(b.date).localeCompare(String(a.date));
    });
  }
  function filtered() {
    var q = S.query.trim().toLowerCase();
    var rows = list.filter(function (w) {
      if (S.origin !== "All" && w.origin !== S.origin) return false;
      if (!q) return true;
      return (w.name + " " + w.origin + " " + w.tags.join(" ") + " " + w.nose + " " + w.palate).toLowerCase().indexOf(q) > -1;
    });
    return sortBy(rows, S.sort);
  }
  function selected() {
    return list.filter(function (w) { return w.id === S.selId; })[0] || filtered()[0] || list[0];
  }

  /* ---------- index column ---------- */

  function shelfHtml(sel) {
    var items = sortBy(list.slice(), "recent").map(function (w) {
      var on = sel && w.id === sel.id;
      var shot = w.photo
        ? '<img src="' + esc(w.photo) + '" alt="' + esc(w.name) + '">'
        : '<i class="ph ph-wine"></i>';
      return '<div class="tile' + (on ? " on" : "") + '">' +
        '<div class="shot">' + shot + "</div>" +
        '<button data-act="pick" data-id="' + esc(w.id) + '">' + esc(w.name) + "</button></div>";
    }).join("");
    return '<div style="display:flex;align-items:baseline;gap:10px"><span class="lbl">Bottle shots</span>' +
      '<span style="font-size:11px;color:var(--color-neutral-600)">Add a photo path to a note, click a name to open it</span></div>' +
      '<div class="shelf">' + items + "</div>";
  }

  function chipsHtml() {
    var origins = ["All"], seen = {};
    list.forEach(function (w) { if (!seen[w.origin]) { seen[w.origin] = 1; origins.push(w.origin); } });
    var chips = origins.map(function (o) {
      return '<button class="chip' + (o === S.origin ? " on" : "") + '" data-act="origin" data-v="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("");
    var label = (SORTS.filter(function (x) { return x[0] === S.sort; })[0] || SORTS[0])[1];
    return '<div class="chiprow">' + chips +
      '<button class="chip" data-act="sort" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">' +
      '<i class="ph ph-arrows-down-up"></i>' + label + "</button></div>";
  }

  function rowHtml(w, sel) {
    var on = sel && w.id === sel.id;
    var sub = [dShort(w.date), w.origin, w.age, money(w.price)].filter(Boolean).join("  \u00b7  ");
    var bars = FAMS.map(function (f, i) {
      return '<i style="height:' + (3 + (w.fam[f[0]] || 0) * 3.8) + "px;background:" + BAR[w.fam[f[0]] || 0] + '"></i>';
    }).join("");
    return '<div class="row' + (on ? " on" : "") + '" data-act="pick" data-id="' + esc(w.id) + '">' +
      '<span class="init">' + esc(initials(w.name)) + "</span>" +
      '<span style="flex:1;min-width:0"><span class="rname">' + esc(w.name) + "</span>" +
      '<span class="rsub">' + esc(sub) + "</span></span>" +
      '<span class="spark">' + bars + "</span>" +
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
        var y = String(w.date).slice(0, 4);
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
    var shot = sel.photo ? '<img src="' + esc(sel.photo) + '" alt="' + esc(sel.name) + '">' : '<i class="ph ph-wine"></i>';
    var facts = [
      ["Tasted", dLong(sel.date)], ["Strength", sel.abv || "\u2013"],
      ["Age", sel.age || "NAS"], ["Paid", money(sel.price)]
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
      '<div style="flex:none;text-align:right">' +
      '<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--color-accent-300)">' +
      esc([sel.origin, sel.type].filter(Boolean).join(" \u00b7 ")) + "</div>" +
      '<div style="font-family:var(--font-heading);font-size:38px;line-height:1;color:var(--color-accent-300);margin-top:12px">' +
      score(sel.score) + "</div>" +
      '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-500);margin-top:4px">of 10</div>' +
      "</div></div>" +
      "<h2>" + esc(sel.name) + "</h2>" +
      '<div style="font-size:12.5px;color:var(--color-neutral-400);margin-top:6px">' +
      esc([sel.age, sel.abv, sel.cask].filter(Boolean).join("  \u00b7  ")) + "</div></div>" +
      '<div class="facts">' + facts + "</div>" +
      '<div class="pbody"><div class="lbl" style="margin-bottom:14px">Flavour signature</div>' +
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
    var lightBars = ["#e4e7f5", "#d6d1f4", "#b9b0ea", "#9c90dc", "#7b6dc4", "#5d5294"];
    var darkBars = ["#33364a", "#4a4275", "#655aa3", "#8579c9", "#a79cf0", "#b5abfc"];
    return {
      c: c,
      name: w.name,
      origin: w.origin || "Unlisted",
      kicker: [w.origin, w.type].filter(Boolean).join("  \u00b7  "),
      line: [w.age, w.abv, w.cask].filter(Boolean).join("  \u00b7  "),
      stack: [[w.age, w.abv].filter(Boolean).join("  \u00b7  "), w.cask].filter(Boolean).join("\n"),
      dateLine: "Tasted " + dLong(w.date),
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

  function shelfCard(d) {
    return '<div style="width:85mm;height:55mm;overflow:hidden;break-inside:avoid;position:relative;display:flex;' +
      "flex-direction:column;justify-content:space-between;padding:4.4mm 5mm 0 6.4mm;background:" + d.c.bg +
      ";border:.25mm solid " + d.c.edge + ";outline:.4mm solid " + d.c.bg + ";color:" + d.c.fg +
      ';font-family:var(--font-body)">' +
      '<div style="position:absolute;top:0;bottom:0;left:0;width:1.4mm;background:' + d.c.ink + '"></div>' +
      '<div style="flex:none;display:flex;align-items:flex-start;gap:4mm">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:4.6pt;font-weight:500;letter-spacing:.18em;text-transform:uppercase;line-height:1;color:' +
      d.c.ink + '">' + esc(d.kicker) + "</div>" +
      '<div style="font-family:var(--font-heading);font-weight:500;font-size:11pt;line-height:1.1;letter-spacing:-.014em;margin-top:1.8mm">' +
      esc(d.name) + "</div>" +
      '<div style="font-size:5.2pt;letter-spacing:.06em;line-height:1.35;margin-top:1.4mm;color:' + d.c.muted + '">' +
      esc(d.line) + "</div></div>" +
      '<div style="flex:none;width:15.5mm;padding:1.6mm 0 1.7mm;text-align:center;border-radius:1mm;background:' +
      d.c.ink + ";color:" + d.c.onInk + '">' +
      '<div style="font-family:var(--font-heading);font-size:14pt;line-height:.95;font-variant-numeric:tabular-nums">' +
      d.score + "</div>" +
      '<div style="font-size:3.8pt;letter-spacing:.14em;text-indent:.14em;text-transform:uppercase;margin-top:1.1mm;opacity:.85">' +
      d.unit + "</div></div></div>" +
      '<div style="flex:none;display:flex;flex-direction:column;gap:1.1mm;padding:1.9mm 0;border-top:.25mm solid ' +
      d.c.rule + ";border-bottom:.25mm solid " + d.c.rule + ';margin-top:1.8mm">' +
      notesHtml(d, "9.5mm", "4.2pt", "5.2pt") + "</div>" +
      '<div style="flex:none;display:grid;grid-template-columns:repeat(2,1fr);gap:1mm 5mm;margin-top:1.8mm">' +
      d.bars.map(function (b) {
        return '<div style="display:flex;align-items:center;gap:1.6mm">' +
          '<span style="width:8.5mm;flex:none;font-size:3.8pt;letter-spacing:.1em;text-transform:uppercase;color:' +
          d.c.muted + '">' + esc(b.short) + "</span>" +
          '<span style="flex:1;height:1mm;border-radius:.5mm;background:' + d.c.track + '">' +
          '<span style="display:block;height:100%;border-radius:.5mm;background:' + b.fill + ";width:" + b.pct + '%"></span>' +
          "</span></div>";
      }).join("") + "</div>" +
      '<div style="flex:none;display:flex;justify-content:space-between;align-items:baseline;gap:3mm;width:85mm;' +
      "margin:1.8mm 0 0 -6.4mm;padding:1.8mm 5mm 1.6mm 6.4mm;background:" + d.c.soft +
      ";border-top:.25mm solid " + d.c.rule + ";font-size:4pt;letter-spacing:.16em;text-transform:uppercase;color:" +
      d.c.muted + '">' +
      "<span>" + esc(d.dateLine) + '</span><span style="color:' + d.c.ink + '">' + esc(d.taglineShort) + "</span></div></div>";
  }

  function hangTag(d) {
    return '<div style="width:40mm;height:88mm;overflow:hidden;break-inside:avoid;position:relative;display:flex;' +
      "flex-direction:column;align-items:center;justify-content:space-between;padding:9.6mm 4.4mm 0;background:" + d.c.bg +
      ";border:.25mm solid " + d.c.edge + ";color:" + d.c.fg + ';font-family:var(--font-body);text-align:center">' +
      '<span style="position:absolute;top:0;left:0;right:0;height:1.4mm;background:' + d.c.ink + '"></span>' +
      '<span style="position:absolute;top:5mm;left:50%;width:2.6mm;height:2.6mm;margin-left:-1.3mm;border-radius:50%;border:.3mm solid ' +
      d.c.edge + '"></span>' +
      '<span style="position:relative;flex:none;display:flex;flex-direction:column;align-items:center">' +
      '<span style="font-size:4.4pt;font-weight:500;letter-spacing:.2em;text-indent:.2em;text-transform:uppercase;line-height:1;color:' +
      d.c.ink + '">' + esc(d.origin) + "</span>" +
      '<span style="font-family:var(--font-heading);font-size:8.5pt;font-weight:500;line-height:1.14;letter-spacing:-.01em;margin-top:2.4mm;text-wrap:balance">' +
      esc(d.name) + "</span>" +
      '<span style="width:7mm;height:.5mm;background:' + d.c.ink + ';margin:2.4mm 0"></span>' +
      '<span style="white-space:pre-line;font-size:4.6pt;letter-spacing:.14em;text-transform:uppercase;line-height:1.5;color:' +
      d.c.muted + '">' + esc(d.stack) + "</span></span>" +
      '<span style="position:relative;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      "width:20mm;height:20mm;border-radius:50%;background:" + d.c.ink + ";color:" + d.c.onInk + '">' +
      '<span style="font-family:var(--font-heading);font-size:15pt;line-height:1;font-variant-numeric:tabular-nums">' + d.score + "</span>" +
      '<span style="font-size:3.6pt;letter-spacing:.18em;text-indent:.18em;text-transform:uppercase;margin-top:1.2mm;opacity:.85">' +
      d.unit + "</span></span>" +
      '<span style="position:relative;flex:none;display:flex;flex-direction:column;gap:1.1mm;width:28mm">' +
      barsHtml(d, "8.5mm", "3.8pt") + "</span>" +
      '<span style="position:relative;flex:none;width:40mm;margin:0 -4.4mm;padding:2.4mm 3.6mm 2.2mm;background:' +
      d.c.soft + ";border-top:.25mm solid " + d.c.rule + '">' +
      '<span style="display:block;font-size:4.8pt;line-height:1.5;letter-spacing:.02em;color:' + d.c.fg + '">' +
      esc(d.taglineShort) + "</span>" +
      '<span style="display:block;font-size:3.8pt;letter-spacing:.16em;text-indent:.16em;text-transform:uppercase;line-height:1.2;margin-top:1.6mm;color:' +
      d.c.muted + '">' + esc(d.dateLine) + "</span></span></div>";
  }

  function classicTag(d) {
    var specs = d.specs.map(function (s) {
      return '<span style="display:flex;align-items:baseline;gap:1.6mm;width:100%">' +
        '<span style="flex:none;font-size:4.2pt;letter-spacing:.16em;text-transform:uppercase;color:' + d.c.muted + '">' +
        esc(s.k) + "</span>" +
        '<span style="flex:1;height:.2mm;background:' + d.c.rule + ';align-self:center"></span>' +
        '<span style="flex:none;max-width:26mm;text-align:right;font-size:5.2pt;line-height:1.3;letter-spacing:.02em">' +
        esc(s.v) + "</span></span>";
    }).join("");
    var notes = d.notes.map(function (n) {
      return '<span style="display:block;text-align:left">' +
        '<span style="display:block;font-size:4pt;letter-spacing:.18em;text-transform:uppercase;color:' + d.c.ink + '">' +
        esc(n.label) + "</span>" +
        '<span style="display:block;font-size:5pt;line-height:1.4;margin-top:.6mm">' + esc(n.text) + "</span></span>";
    }).join("");
    return '<div style="width:50mm;height:100mm;overflow:hidden;break-inside:avoid;position:relative;display:flex;' +
      "flex-direction:column;align-items:center;justify-content:space-between;padding:6.4mm 5mm 0;background:" + d.c.bg +
      ";border:.25mm solid " + d.c.edge + ";color:" + d.c.fg + ';font-family:var(--font-body);text-align:center">' +
      '<span style="position:absolute;top:0;left:0;right:0;height:1.6mm;background:' + d.c.ink + '"></span>' +
      '<span style="flex:none;display:flex;flex-direction:column;align-items:center;width:100%">' +
      '<span style="font-size:4.6pt;font-weight:500;letter-spacing:.2em;text-indent:.2em;text-transform:uppercase;line-height:1;color:' +
      d.c.ink + '">' + esc(d.kicker) + "</span>" +
      '<span style="font-family:var(--font-heading);font-size:10pt;font-weight:500;line-height:1.14;letter-spacing:-.01em;margin-top:2.6mm;text-wrap:balance">' +
      esc(d.name) + "</span>" +
      '<span style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:16mm;height:16mm;margin-top:3mm;border-radius:50%;background:' +
      d.c.ink + ";color:" + d.c.onInk + '">' +
      '<span style="font-family:var(--font-heading);font-size:13pt;line-height:1;font-variant-numeric:tabular-nums">' + d.score + "</span>" +
      '<span style="font-size:3.6pt;letter-spacing:.18em;text-indent:.18em;text-transform:uppercase;margin-top:1.2mm;opacity:.85">' +
      d.unit + "</span></span></span>" +
      '<span style="flex:none;display:flex;flex-direction:column;gap:1.3mm;width:100%">' + specs + "</span>" +
      '<span style="flex:none;display:grid;grid-template-columns:repeat(2,1fr);gap:1.1mm 3mm;width:100%">' + barsHtml(d, "7.5mm", "3.6pt") + "</span>" +
      '<span style="flex:none;display:flex;flex-direction:column;gap:1.2mm;width:100%">' + notes + "</span>" +
      '<span style="flex:none;width:50mm;margin:0 -5mm;padding:2.4mm 4mm 2.2mm;background:' + d.c.soft +
      ";border-top:.25mm solid " + d.c.rule +
      ";font-size:4pt;letter-spacing:.16em;text-indent:.16em;text-transform:uppercase;color:" + d.c.muted + '">' +
      esc(d.dateLine) + "</span></div>";
  }

  function sheetHtml() {
    var draw = S.shape === "card" ? shelfCard : S.shape === "tag2" ? hangTag : classicTag;
    var cols = S.shape === "card" ? "repeat(auto-fill, 85mm)" : S.shape === "tag2" ? "repeat(auto-fill, 40mm)" : "repeat(auto-fill, 50mm)";
    var el = document.getElementById("sheet");
    el.style.gridTemplateColumns = cols;
    el.style.gap = "4mm";
    el.style.justifyContent = "center";
    el.innerHTML = list.filter(function (w) { return S.picked.indexOf(w.id) > -1; })
      .map(function (w) { return draw(cardData(w)); }).join("");
  }

  /* ---------- print dialog ---------- */

  function modalHtml() {
    if (!S.showPrint) return "";
    var shapes = [["card", "Shelf card"], ["tag2", "Hang tag"], ["tag", "Hang tag, classic"]].map(function (k) {
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

  function render() {
    var rows = filtered(), sel = selected();
    var avg = list.length ? list.reduce(function (t, w) { return t + (w.score || 0); }, 0) / list.length : 0;
    var counts = {};
    list.forEach(function (w) { counts[w.origin] = (counts[w.origin] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || "\u2013";
    var spend = rows.reduce(function (t, w) { return t + (w.price || 0); }, 0);

    document.getElementById("body").innerHTML =
      '<div class="hero"><div style="flex:1 1 320px;min-width:0"><h1>Aqua Vitae</h1>' +
      "<p>Pick one to read its note.</p></div>" +
      '<div class="stats">' +
      '<div><div class="stat-n">' + list.length + '</div><div class="stat-l">Bottles logged</div></div>' +
      '<div><div class="stat-n" style="color:var(--color-accent-300)">' + score(avg) + '</div><div class="stat-l">Average score</div></div>' +
      '<div><div class="stat-n">' + esc(top) + '</div><div class="stat-l">Favourite origin</div></div>' +
      "</div></div>" +
      '<div class="cols"><div class="col">' + shelfHtml(sel) + chipsHtml() +
      '<div class="lhead"><span style="width:30px;flex:none"></span><span style="flex:1">Bottle</span>' +
      '<span style="width:72px;flex:none">Signature</span><span style="width:36px;flex:none;text-align:right">Score</span></div>' +
      '<div class="list">' + listHtml(rows, sel) + "</div>" +
      '<div class="foot"><span>' +
      (rows.length === list.length ? list.length + " bottles in the ledger" : "Showing " + rows.length + " of " + list.length) +
      "</span><span>Total " + money(spend) + "</span></div></div>" +
      '<div class="col">' + panelHtml(sel) + "</div></div>";

    document.getElementById("modal").innerHTML = modalHtml();
    sheetHtml();
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var a = el.getAttribute("data-act"), v = el.getAttribute("data-v"), id = el.getAttribute("data-id");
    if (a === "noop") return;
    if (a === "pick") S.selId = id;
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

  document.getElementById("q").addEventListener("input", function (e) {
    S.query = e.target.value;
    render();
  });

  render();
})();
