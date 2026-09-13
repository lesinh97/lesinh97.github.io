# Dram Ledger

A whisky tasting journal. One markdown note per bottle, one index page that reads them all.
Built with [Eleventy](https://www.11ty.dev), published on GitHub Pages.

## How it works

- `src/bottles/*.md` — one note per bottle. Front matter holds the structured fields, the body
  holds free prose (shown as "Behind it" on the index).
- `src/index.njk` — the ledger. Nunjucks serialises every note into a JSON block,
  `src/assets/app.js` renders search, filters, sorting, the detail panel and the printable cards.
- `src/assets/nocturne.css` — the design tokens and components. Do not hand-edit colours elsewhere.
- `src/bottles/bottles.json` gives every note its own page at `/bottles/<slug>/`, rendered by
  `src/_includes/bottle.njk`. The index links to them, so a note is both a row and a page.

## Run it locally

```bash
npm install
npm start
```

Open http://localhost:8080. Eleventy watches the notes and reloads.

`npm run build` writes the static site to `_site/`.

## Publish on GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main`. Enable it once:
Settings, Pages, Source: **GitHub Actions**. Nothing else to configure.

## Add a bottle

Create `src/bottles/<slug>.md`:

```yaml
---
name: "GlenAllachie 12 YO"
origin: "Speyside"
type: "Single malt"
age: "12 yo"
abv: "46%"
cask: "PX, oloroso, virgin oak"
tasted: "2025-05-08"
price: 1341000
score: 8.3
photo: /assets/bottles/glenallachie-12.jpg
fam:
  fruit: 3
  sweet: 4
  spice: 4
  oak: 3
  malt: 3
  peat: 0
flavours: ["Mincemeat", "Cinnamon", "Marmalade", "Ginger"]
nose: "Mincemeat and cinnamon toast, a little orange marmalade."
palate: "Sweet sherry and baking spice, honeyed malt underneath."
finish: "Medium-long, ginger warmth."
---

Anything you write here shows up as the "Behind it" paragraph.
```

Field notes:

- `tasted` must be quoted, otherwise YAML turns it into a timestamp.
- `flavours`, not `tags`. `tags` is reserved by Eleventy for collections.
- `fam` values are 0 to 5 and drive both the bar chart and the row sparkline.
- `price` is a plain integer in VND. Leave it out for a dash.
- `photo` is a site-relative path. Drop the image in `src/assets/bottles/`. Omit for a placeholder.

## Writing in Obsidian

Open the repo as a vault, or add `src/bottles/` to an existing vault as a folder.

1. Settings, Files and links, set "Default location for new attachments" to `src/assets/bottles`.
2. Install **Templater** (or QuickAdd) and point it at `templates/bottle.md`.
3. Install **Obsidian Git** and set auto-commit to, say, every 10 minutes. Every push rebuilds
   the published page.

Obsidian shows the front matter in its properties editor, so the fields appear as real form
fields rather than raw text.
