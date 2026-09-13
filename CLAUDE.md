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
- `src/posts/*.md` is the blog. `src/posts/posts.11tydata.js` sets the layout and builds the
  permalink. `draft: true` in a post's front matter is the single switch that both keeps it
  out of the collection and stops a page being written; `DRAFTS=1 npm start` previews drafts
  locally. Do not add a separate `permalink: false`, and note a templated permalink can only
  produce the *string* "false", which Eleventy treats as a real output path.
- Posts may set `image:`, used as a hero on the post and a thumbnail on the index.
- The 2017-2018 posts and the 2020 Vietnamese drafts were imported from the Jekyll site on
  the `master` branch (`_posts/` and `draft_article/`). Their images live in
  `src/assets/posts/`. Two imports needed judgement, recorded in an HTML comment at the top
  of each: `flowers.md` had front matter copy-pasted from `be-the-bird`, and
  `be-the-bird-fragment.md` had no front matter at all.
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

## Colour modes

Two modes, dark first. Navy throughout. The old Gatsby site's warm accent and multicoloured
shapes are deliberately **not** carried over: they put an orange cast over the whole page. `src/assets/theme-toggle.js` owns the switch; an inline
script in `base.njk` sets `data-theme` before first paint so light-mode visitors get no dark
flash. With no stored choice the page follows `prefers-color-scheme`.

| | dark | light |
| --- | --- | --- |
| ground | `#0f1626` | `#f6f8fc` |
| text | `#dde5f2` | `#1f2a3d` |
| accent | `#7fb2e5` | `#2b5f9e` |

The neutral ramp **flips** between modes so each step keeps its meaning: 100 is always the
most contrast against the ground, 900 always a barely-there surface. Anything that needs a
colour per mode belongs in `theme.css`, never in a template.

Flavour bars are `var(--bar-0..5)` / `var(--pbar-0..5)`, referenced straight from inline
styles so they follow the mode with no re-render. Do not put raw hexes back in `BAR`/`PBAR`.

## Design rules

- Faithful to [gatsby-starter-portfolio-cara](https://github.com/LekoArts/gatsby-starter-portfolio-cara).
- Cara's four section gradients are tokens, `--grad-1` to `--grad-4`, and they are **bands,
  not washes**. A gradient stretched over a whole section at low opacity is what made this
  look muddy. Use `.b1` / `.b2` / `.b3` bands at full strength; only `.wide` may pass behind
  copy, and it stays faint. Band skew is 6deg: a full-width band sweeps vertically by
  `width * tan(angle)`, so a steeper angle drags it across the text column.
- Everything stays in one cool family. The shapes use `--ic-mist` through `--ic-deep`, which
  vary by depth and temperature rather than hue, and the four section gradients are all navy.
  No warm hue anywhere: the check suite fails the build if any painted colour has blue as its
  weakest channel.
- One interactive accent, `--color-accent`, as a line, a small fill, or a tonal tint.
- Buttons are outlined, not filled. Left-aligned, asymmetric layout.
- Rules fade to transparent at their ends. See `.rule` / `.softrule` in theme.css.
- Headings stay at weight 500. Hierarchy is size and space, not boldness.
- All decorative motion stops under `prefers-reduced-motion: reduce`, including the parallax.
- No em dashes or en dashes in user-facing copy. No decorative subtitles.

## Responsive

`minmax(Npx, 1fr)` in a grid track cannot shrink below N, so on a narrower phone it forces
the whole page wider than the viewport. Every auto-fit grid here uses
`minmax(min(Npx, 100%), 1fr)`. If a page starts scrolling sideways on mobile, look there first.

## Print

`@media print` hides `.screen` and shows `#sheet`, a grid of mm-sized cards. Three shapes:
shelf card 95x62mm, hang tag 46x96mm, classic tag 56x110mm. Sizes are in mm on purpose. The
shelf card is deliberately a little over a business card (85x55mm) to carry the keynote.

Card ink is navy and lives in the `INK` table in `app.js`. It is print pigment, not a screen
token, so it does **not** follow the colour mode and is the one place raw hexes are correct.

A note's `keynote`, the owner's one-liner, prints on its card; without it the card falls back
to the note's own prose. Card text is clamped by `clamp()` to fit the fixed millimetre shape, per card type.
Change a clamp and you must re-check overflow.

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
