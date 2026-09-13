# Personal site

A Cara-style homepage, a whisky tasting journal, and a blog. One markdown file per bottle,
one per post. Built with [Eleventy](https://www.11ty.dev), published on GitHub Pages.

The homepage follows the concept of
[gatsby-starter-portfolio-cara](https://github.com/LekoArts/gatsby-starter-portfolio-cara):
full-viewport sections, layers that drift at their own speed, skewed gradient dividers and
floating shapes. Rebuilt here in Eleventy with about seventy lines of vanilla JavaScript
instead of React and react-spring.

## Routes

| URL | What it is |
| --- | --- |
| `/` | Intro, the things, about, contact |
| `/whisky/` | The ledger: search, filter, detail panel, printable cards |
| `/bottles/<slug>/` | One bottle note |
| `/blog/` | Post index |
| `/blog/<slug>/` | One post |

## How it works

- `src/_includes/base.njk` is the shell: head, nav, footer. A page picks its stylesheets and
  scripts with the `extraCss` / `extraJs` front matter arrays.
- `src/bottles/*.md` and `src/posts/*.md` are the content. Front matter is the schema.
- `src/whisky.njk` serialises every bottle note into a JSON block; `src/assets/app.js`
  renders search, filters, sorting, the detail panel and the printable cards from it.
- `src/assets/nocturne.css` holds the design tokens. `src/assets/theme.css` retunes them to
  the Cara palette and is the only place the tokens are set. Do not hand-edit colours elsewhere.
- Dark and light modes, switched by the button in the nav and remembered per browser. With
  no stored choice the site follows your operating system.

## Run it locally

```bash
npm install
npm start
```

Open http://localhost:8080. Eleventy watches the files and reloads.

`npm run build` writes the static site to `_site/`.

## Publish on GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main`. Enable it once:
Settings, Pages, Source: **GitHub Actions**. Nothing else to configure.

The workflow runs `npm ci`, so `package-lock.json` has to stay committed.

## Make it yours

Names, links and the homepage copy come from `src/_data/site.json`: `title`, `author`,
`tagline`, `email`, `nav` and `social`. The About paragraphs are prose in `src/index.njk`.

## Add a post

Create `src/posts/<slug>.md`:

```yaml
---
title: "Peat is a texture, not a flavour"
date: "2026-08-30"
summary: "One sentence for the index and the meta description."
topics: ["Whisky", "Tasting"]
---

Body prose here.
```

`topics`, not `tags`. `tags` is reserved by Eleventy for collections. Quote the `date`, or
YAML turns it into a timestamp in whatever timezone the build machine happens to use.

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
cardwords: "The one I pour when someone says they do not like sherry casks."
nose: "Mincemeat and cinnamon toast, a little orange marmalade."
palate: "Sweet sherry and baking spice, honeyed malt underneath."
finish: "Medium-long, ginger warmth."
---

Anything you write here shows up as the "Behind it" paragraph.
```

Field notes:

- `tasted` must be quoted, otherwise YAML turns it into a timestamp.
- `flavours`, not `tags`, for the same reason posts use `topics`.
- `cardwords` is one or two sentences printed on the bottle's card. Leave it out and the
  card falls back to the note's own prose. Long text is trimmed to fit the card.
- `fam` values are 0 to 5 and drive both the bar chart and the row sparkline.
- `price` is a plain integer in VND. Leave it out for a dash.
- `photo` is a site-relative path. Drop the image in `src/assets/bottles/`. Omit for a placeholder.

Add a new field and you must also add it to the Nunjucks loop in `src/whisky.njk`, or the
browser will never see it.

## Writing in Obsidian

Open the repo as a vault, or add `src/bottles/` to an existing vault as a folder.

1. Settings, Files and links, set "Default location for new attachments" to `src/assets/bottles`.
2. Install **Templater** (or QuickAdd) and point it at `templates/bottle.md`.
3. Install **Obsidian Git** and set auto-commit to, say, every 10 minutes. Every push rebuilds
   the published page.

Obsidian shows the front matter in its properties editor, so the fields appear as real form
fields rather than raw text.
