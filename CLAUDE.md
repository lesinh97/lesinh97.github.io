# Personal site, working notes

Static Eleventy site published on GitHub Pages. A Cara-style personal homepage with a whisky
tasting journal and a blog behind it. The whisky notes are written in Obsidian.

## Routes

| URL | Built from | What it is |
| --- | --- | --- |
| `/` | `src/index.njk` | The Cara one-pager: intro, the things, about, contact |
| `/whisky/` | `src/whisky.njk` | The ledger. Search, filter, detail panel, printable cards |
| `/bottles/<slug>/` | `src/bottles/*.md` via `src/_includes/bottle.njk` | One bottle note |
| `/blog/` | `src/blog.njk` | Post index |
| `/blog/<slug>/` | `src/posts/*.md` via `src/_includes/post.njk` | One post |

## Shape

- `src/_includes/base.njk` is the shell every page runs through: head, nav, footer. Pages
  choose their stylesheets and scripts with the `extraCss` / `extraJs` front matter arrays,
  and set `navCurrent` to the nav URL that should read as current.
- `src/bottles/*.md` is the whisky data. Front matter is the schema, body prose is the
  "Behind it" text. `src/bottles/bottles.json` sets the layout and permalink.
- `src/posts/*.md` is the blog. `src/posts/posts.json` sets the layout and permalink.
- Both collections are built by glob in `eleventy.config.js`, not by a `tags` key. Eleventy
  reserves `tags`, so tasting words live under `flavours` and post topics under `topics`.
  Do not rename either back.
- `src/whisky.njk` serialises `collections.bottles` into
  `<script id="bottle-data" type="application/json">` with an explicit Nunjucks loop. Add a
  field to the notes and you must add it to that loop too.
- `src/assets/app.js` is plain vanilla JS, no build step, no dependencies. It re-renders
  `#body`, `#modal` and `#sheet` from a single `S` state object on every interaction. The
  search input lives outside the re-rendered region so it keeps focus.
- `src/assets/parallax.js` drives the homepage layers. One rAF loop, one passive scroll
  listener. Every `.px-layer[data-speed]` drifts against the scroll of its `.px-page`.
- Dates in front matter must be quoted, or YAML turns them into timezone-dependent
  timestamps. The `readableDate` filter parses the string, it does not construct a `Date`.

## Stylesheets

Load order is nocturne, theme, then the page's own sheet. Nothing below nocturne sets a raw
hex except the Cara gradients and the two JS bar ramps, which are noted where they appear.

- `src/assets/nocturne.css` is the generated design system and is natively dark. Take every
  colour, font, space and radius from its `--color-*` / `--font-*` / `--space-*` /
  `--radius-*` variables.
- `src/assets/theme.css` retunes those tokens to the Cara palette and holds the shared shell:
  nav, footer, `.prose`, scroll chrome. **This is the only place the tokens are set.** It used
  to be a `html:root` block copy-pasted into two templates, and the copies had already drifted.
  Do not reintroduce a per-page token block.
- `src/assets/cara.css`, `ledger.css`, `bottle.css`, `blog.css` are the per-page sheets.

## Design rules

- Dark ground, Cara's deep navy (`--color-bg`). Faithful to
  [gatsby-starter-portfolio-cara](https://github.com/LekoArts/gatsby-starter-portfolio-cara).
- Cara's four section gradients are tokens: `--grad-1` through `--grad-4`. They are
  atmosphere, not walls: `.px-divider.soft` at 18%, `.wash` at 10%, project cards at 13%
  rising to 28% on hover. Do not run one at full strength across a section.
- One interactive accent, `--color-accent`, as a line, a small fill, or a tonal tint.
- Buttons are outlined, not filled. Left-aligned, asymmetric layout.
- Rules fade to transparent at their ends. See `.rule` / `.softrule` in theme.css.
- Headings stay at weight 500. Hierarchy is size and space, not boldness.
- All decorative motion stops under `prefers-reduced-motion: reduce`, including the parallax.
- No em dashes or en dashes in user-facing copy. No decorative subtitles.

## Print

`@media print` hides `.screen` and shows `#sheet`, a grid of mm-sized cards. Three shapes:
shelf card 85x55mm, hang tag 40x88mm, classic tag 50x100mm. Sizes are in mm on purpose.

The cards set their own colours from the `INK` table in `app.js` and default to `light`, so
they stay black on white paper no matter how dark the screen theme gets. If you change a card,
check it in print preview at both Letter and A4, and confirm every card still satisfies
`scrollHeight == clientHeight`.

Card width is deliberately *not* a clean `scrollWidth == clientWidth`: the footer strips use
negative margins to bleed to the card edge. Height is the test that matters.

## Publishing

Lives at `lesinh97/lesinh97.github.io` on the custom domain **shin.technology**.

- `src/CNAME` holds the domain and is passthrough-copied to `_site/CNAME`. Pages reads it
  from the deployed artifact, so if it stops being emitted the domain stops resolving.
- The new site is on `main`. The repo default branch is still `master`, which holds an
  unrelated Jekyll site from 2021; `landing`, `pre-release`, `release` and `old-site` are
  that era too. Do not build from them.
- `.github/workflows/pages.yml` triggers on pushes to `main` and deploys `_site/`.
  A workflow runs from the branch it was pushed to, so the default branch being `master`
  does not stop it.

## Likely next jobs

- Flavour pages, or a similarity finder over the `fam` vectors.
- `@11ty/eleventy-img` over `src/assets/bottles/` so photos are resized at build time.
- A real avatar image on the homepage About section, replacing the initial.
