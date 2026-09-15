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
- `src/assets/brand/mark.png` is the wordmark, シン in katakana as hollow brush strokes. It
  appears twice, in the nav and on the homepage About disc, and both carry `.brandmark`:
  that is the class theme.css inverts for the dark ground, and it is the only place the
  inversion is decided. Size the copies with a second class, never with a second filter.
  `filter` does not stack across rules, so a `drop-shadow` on the avatar copy would be
  silently thrown away in whichever mode also sets `invert(1)`.
- `src/_data/shapes.js` generates the drifting icon fields from a fixed seed: random
  looking, identical on every build. Each field is three groups, far to near, and depth sets
  size, opacity, float amplitude and speed together. `src/_includes/field.njk` renders one
  with `{% import "field.njk" as px %}` then `{{ px.field(shapes.blog) }}`; `px.band(n)` is
  the skewed band behind a page header. The symbols live in `src/_includes/sprite.njk`,
  which base.njk renders once per page, so any page can use shapes.
- `src/assets/app.js` is plain vanilla JS, no build step, no dependencies. It re-renders
  `#body`, `#modal` and `#sheet` from a single `S` state object on every interaction. The
  search input lives outside the re-rendered region so it keeps focus.
- `src/assets/parallax.js` drives every `[data-speed]` element on any page, not just the
  homepage. It writes CSS custom properties, never `transform`: `--py` in px from the scroll
  on each element, `--tilt-x` / `--tilt-y` as numbers in -1..1 on `<html>` from the pointer.
  The composition is in motion.css. This matters: a divider band also carries its skew and a
  shape layer also carries the pointer lean, so assigning `transform` from script wipes
  whichever half CSS owns. One passive scroll listener plus a short-lived rAF that eases the
  pointer and then stops; nothing runs while the page sits still.
- `src/assets/motion.js` is the rest of it, also on every page: reveal on scroll, the
  progress line and stuck state in the nav, the cursor sheen. Each part looks for its own
  hook and does nothing without one. Both scripts are loaded from base.njk rather than per
  page, because both bail out cleanly on a page with no hooks.
- Dates in front matter must be quoted, or YAML turns them into timezone-dependent
  timestamps. The `readableDate` filter parses the string, it does not construct a `Date`.

## Stylesheets

Load order is nocturne, theme, motion, then the page's own sheet. Nothing below nocturne
sets a raw hex except the Cara gradients and the two JS bar ramps, which are noted where
they appear.

- `src/assets/nocturne.css` is the generated design system and is natively dark. Take every
  colour, font, space and radius from its `--color-*` / `--font-*` / `--space-*` /
  `--radius-*` variables.
- `src/assets/theme.css` retunes those tokens to the Cara palette and holds the shared shell:
  nav, footer, `.prose`, scroll chrome. **This is the only place the tokens are set.** It used
  to be a `html:root` block copy-pasted into two templates, and the copies had already drifted.
  Do not reintroduce a per-page token block.
- `src/assets/motion.css` is the shared motion layer: the gradient bands, the drifting
  field, the arrivals, `.pagehead`, the cursor sheen. It is on every page. This used to live
  inside cara.css as homepage decoration, and the result was that the blog had one kind of
  header, the ledger had none, and the homepage had all the movement. Anything a second page
  would want belongs here, not in a page sheet.
- `src/assets/cara.css`, `ledger.css`, `bottle.css`, `blog.css` are the per-page sheets.
  cara.css is now only what is unique to the one-pager: the hero, the cards, about, contact.

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

The four section gradients flip with it. `--grad-1` to `--grad-4` are **set inside each mode
block**, dark navy on the dark ground and pale navy on the light one. They used to be one
dark set defined once, with light mode dimming them through a `--grad-strength` multiplier,
and that cannot work: a dark band faded to 70% over a near-white page is still a dark band,
so every diagonal on the site landed as a hard line and light mode read as a stack of
separated slabs while dark mode read as one page. A band's strength is its colour. Do not
reintroduce an opacity knob and try to make one palette serve both modes with it.

What is left as opacity is per mode too, because a wash has to carry further on paper-white
before it reads as a tint at all: `--band-wash` (`.wide`), `--band-faint` (`.faint`),
`--band-head` (`.hb`), and `--card-tint` / `--card-tint-hover` for the homepage cards. The
crisp bands carry no opacity at all. 0.13 of the light gradient over a white card is nothing,
which is why the card tint is a token and not a number in cara.css.

Flavour bars are `var(--bar-0..5)` / `var(--pbar-0..5)`, referenced straight from inline
styles so they follow the mode with no re-render. Do not put raw hexes back in `BAR`/`PBAR`.

## Comments

giscus on the blog posts only, backed by GitHub Discussions in the site repo. No backend.

- Ids live in `src/_data/site.json` under `comments`. `src/_includes/comments.njk` renders
  nothing while `repoId` still holds the `REPLACE_` placeholder, so a half-configured build
  has no comment section rather than a broken one. A post opts out with `comments: false`.
- `src/assets/comments.js` injects the giscus script so it can read the current mode, and
  `theme-toggle.js` fires a `themechange` event that it answers with a `postMessage` to the
  iframe. The toggle does not know giscus exists; keep it that way.
- `themeDark` / `themeLight` are giscus theme *names*. A custom URL there must be the whole
  giscus stylesheet, not a few variable overrides: it is the only CSS the iframe loads, so a
  partial one leaves the widget unstyled. That is why this uses the stock presets and styles
  only the frame around them, in `blog.css`.

## Design rules

- Faithful to [gatsby-starter-portfolio-cara](https://github.com/LekoArts/gatsby-starter-portfolio-cara).
- Cara's four section gradients are tokens, `--grad-1` to `--grad-4`, set per colour mode
  (see Colour modes), and they are **bands, not washes**. A gradient stretched over a whole section at low opacity is what made this
  look muddy. Use `.b1` / `.b2` / `.b3` bands at full strength on a homepage section and
  `.hb` / `.hs` in a page header; only `.wide` and `.hb` may pass behind copy, and both are
  masked so they fade rather than cut. Section skew is 6deg, header skew 3.5deg; see
  Responsive for why the two differ.
- Everything stays in one cool family. The shapes use `--ic-mist` through `--ic-deep`, which
  vary by depth and temperature rather than hue, and the four section gradients are all navy.
  No warm hue anywhere: the check suite fails the build if any painted colour has blue as its
  weakest channel.
- One interactive accent, `--color-accent`, as a line, a small fill, or a tonal tint.
- Buttons are outlined, not filled. Left-aligned, asymmetric layout.
- Rules fade to transparent at their ends. See `.rule` / `.softrule` in theme.css, and the
  masks on `.wide` / `.hb` / `.pxback`, which apply the same idea to a band.
- Headings stay at weight 500. Hierarchy is size and space, not boldness.
- All decorative motion stops under `prefers-reduced-motion: reduce`, including the parallax.
  Anything waiting on a reveal is shown outright rather than left hidden. See Motion.
- No em dashes or en dashes in user-facing copy. No decorative subtitles.

## Motion

Every page moves the same way. The vocabulary is small and it is all in motion.css.

- **Arrival above the fold** is `.rise` on a container: its children stand up one at a time
  as the page loads, no script involved. `backwards` fill holds the from-state through the
  delay, or each line flashes in place first.
- **Arrival below the fold** is `data-reveal` on a thing, plus `data-stagger="ms"` on a
  container whose children should arrive in turn. motion.js sets `--d` per child and stamps
  `.reveal-ready` on `<html>` *before* it observes anything, so if the script never runs the
  page is all visible rather than all blank. Reveals fire once and unobserve.
- The reveal rise uses the `translate` property, **not** `transform`, and it has to stay that
  way. A card both rises into view and lifts on hover; with both on `transform` the revealed
  state wins on specificity and the hover lift stops moving for good. The two properties
  compose.
- The ledger is the exception: nothing below its toolbar is marked for a reveal, because
  app.js re-renders `#body` on every keystroke and a one-shot observer would fire on elements
  that are about to be thrown away.
- A shape floats on the element and spins or pulses on the `<svg>` inside it, so the two
  never fight over `transform`. shapes.js gives a shape one of spin or pulse, never both.
- Delays in the generated field are **negative**. A positive delay leaves the whole field
  sitting still and then moving off together; a negative one starts each shape part way
  through its own float.
- Every clickable surface glows under the cursor. The rule is a **box, not a link**:
  anything with a card, row, pill, chip, tile or button shape lights up; bare text links keep
  the underline and colour change they already have, because a radial tint behind a run of
  inline text reads as a smudge. The selector list is in motion.css and mirrored by `SHEEN`
  in motion.js; keep the two in step. `data-sheen` still works for opting a one-off in.
- motion.js writes `--cx` / `--cy` in px from **one delegated listener**, not one per
  element: most of the ledger is rebuilt by app.js on every keystroke, and anything bound to
  those nodes is stale a moment later. Those names are deliberately not `--tilt-*`: the tilt
  inherits all the way down from the root, and a unitless number in a gradient position kills
  the declaration silently.
- Size the glow with `--sheen-r` and `--sheen-a`, not with a second gradient. A 260px pool
  inside a 30px chip is a flat wash: the falloff has to happen inside the element or the
  cursor is invisible in it.
- Shapes are hidden below 1024px except the ones pinned to an edge, and all of them below
  720px. Below 1024 the text column reflows wide enough to run under the middle of the field.

## Responsive

`minmax(Npx, 1fr)` in a grid track cannot shrink below N, so on a narrower phone it forces
the whole page wider than the viewport. Every auto-fit grid here uses
`minmax(min(Npx, 100%), 1fr)`. If a page starts scrolling sideways on mobile, look there first.

Band geometry is width dependent and that is the trap, twice over. A full-width band skewed
N degrees sweeps vertically by `width * tan(N)`. Over a 100vh homepage section, 6 degrees is a clean
diagonal. Over a `.pagehead`, which is barely 270px tall, the same 6 degrees drags the crisp
slice straight across the kicker, so header bands are skewed 3.5 degrees instead and the
reduced-motion reset has to repeat that number. Bands themselves never widen the document:
they are `left: -18%; right: -18%` inside an `overflow: hidden` parent.

The second half of the trap is that the sweep grows with the viewport while a fixed header
does not, so on a wide screen the band outgrows `.pagehead` and the overflow clips the
diagonal off square: one flat line across the page, which is the exact thing the diagonal is
there to avoid. `.pagehead` therefore scales its padding with `clamp(…, 7vw, …)` and `.hb` is
only 49% tall. Measured clear from 1070px to 3410px. Change either and re-measure both.

The washes are masked rather than clipped. `.wide` and `.hb` pass behind body copy, and a
hard edge under a paragraph reads as a grey panel rather than as a band, so both fade out
with a `mask-image` the way `.rule` fades at its ends. `.pxback`, the backdrop on pages that
have a header of their own, fades at the bottom for the same reason: without it the page
carries a horizontal cut straight across it that undoes every diagonal above.

## Print

`@media print` hides `.screen` and shows `#sheet`, a grid of mm-sized cards. Two shapes:
shelf card 95x62mm and hang tag 46x102mm. Sizes are in mm on purpose. The
shelf card is deliberately a little over a business card (85x55mm) to carry the keynote.

The cards mirror the bottle page: a radial `wash` behind the header, the score in a filled
`scoreBlock`, and the tasting notes on their own tinted `notesPanel`. No card carries the
bottle photo; they are tags, and the photo is a screen-only thing.

Card ink is navy and lives in the `INK` table in `app.js`. It is print pigment, not a screen
token, so it does **not** follow the colour mode and is the one place raw hexes are correct.

A note's `keynote` is the only prose that prints. The markdown body is **not** a fallback:
truncating it mid-sentence read as broken, so a bottle with no keynote simply shows no line.

`clamp()` caps the keynote at **180 characters** on every shape. That number was measured,
not guessed: with a keynote on all thirteen bottles, 187 characters still fits every shape
and 196 overflows the shelf card, the tightest of the three for text because its name and
score share a row. Change the clamp and you must re-measure.

The date row is `signedRow()`: tasted date left, the katakana signature right.

Two traps live in that one line. `SIG_FONT` is quoted with **single** quotes because it is
interpolated into a `style="..."` attribute: double quotes there close the attribute early
and silently drop the font-family and every declaration after it. And `#sheet` is
`display:none` until print, so the browser never downloads a webfont for it; `app.js` calls
`document.fonts.load` for the signature glyphs at startup, or the printed page falls back to
a brush-style system face.

Card footers bleed to the edge with negative margins and no explicit width. Giving one the
card's full width overhangs the border, because `box-sizing` is `border-box` and the content
box is narrower than the card by the border on each side.

The cards set their own colours from the `INK` table in `app.js` and default to `light`, so
they stay black on white paper no matter how dark the screen theme gets. If you change a card,
check it in print preview at both Letter and A4, and confirm every card still satisfies
`scrollHeight == clientHeight`.

`color-scheme: dark` on the root gives it a real UA background, which stops `body`'s white
propagating to the page canvas. The sheet then prints inside a black frame the size of the
paper. The print block forces `html { color-scheme: light; background: #fff }` for that
reason: do not remove it.

The page margin is 8mm, about as tight as consumer printers manage, and the sheet packs
from the top left rather than centring, so a sheet holds as many cards as it can. Each card
carries a 0.3mm `cut` hairline and there is a 4mm alley between them, which is the room you
need to get scissors down both sides.

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

## The old service worker

`src/sw.js` is a self-destroying service worker copied to the site root, and it is load
bearing. The 2021 Gatsby site used `gatsby-plugin-offline`, which registered a Workbox
worker at `/sw.js` with scope `/`. That worker is still installed in every browser that
visited before the switch, and it serves the old cached shell: a normal reload showed the
2021 site, a hard reload showed the real one.

It cannot expire by itself. If `/sw.js` 404s, the browser's update check fails and it keeps
the worker it already has, forever. So the path must keep returning 200 with a worker that
removes itself. There is a matching cleanup script at the end of `base.njk`.

Do not delete either until you are sure no browser still holds the old registration.

## Likely next jobs

- Flavour pages, or a similarity finder over the `fam` vectors.
- `@11ty/eleventy-img` over `src/assets/bottles/` so photos are resized at build time.
