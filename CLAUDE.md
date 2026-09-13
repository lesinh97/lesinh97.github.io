# Dram Ledger, working notes

Static Eleventy site published on GitHub Pages. A whisky tasting journal written in Obsidian.

## Shape

- `src/bottles/*.md` is the data. Front matter is the schema, body prose is the "Behind it" text.
  `src/bottles/bottles.json` sets `layout: bottle.njk` and `permalink: /bottles/{{ page.fileSlug }}/`:
  every note is both a row on the index and its own page.
- The collection is built by glob in `eleventy.config.js`, not by a `tags` key. Tasting words live
  under `flavours` so Eleventy's tag system stays out of the way. Do not rename that back.
- `src/index.njk` serialises `collections.bottles` into
  `<script id="bottle-data" type="application/json">` with an explicit Nunjucks loop. Add a field
  to the notes and you must add it to that loop too.
- `src/assets/app.js` is plain vanilla JS, no build step, no dependencies. It re-renders `#body`,
  `#modal` and `#sheet` from a single `S` state object on every interaction. The search input
  lives outside the re-rendered region so it keeps focus.
- `src/assets/nocturne.css` is a generated design system. Take every colour, font, space and
  radius from its `--color-*` / `--font-*` / `--space-*` / `--radius-*` variables. Never hard-code
  a hex.

## Design rules, non-negotiable

- Light ground. The Nocturne tokens are remapped in a `html:root` block at the top of
  `src/index.njk` and `src/_includes/bottle.njk`: same palette, ramps inverted. Keep the two
  blocks identical, and take colours from the tokens, never a raw hex.
- One accent (#6a5cb0) as a line, a fill on small blocks, or a tonal tint. Never a flood.
- Buttons are outlined, not filled. Left-aligned, asymmetric layout.
- Rules fade to transparent at their ends. See `.rule` and `.softrule`.
- Headings stay at weight 500. Hierarchy is size and space, not boldness.
- No em dashes or en dashes in user-facing copy. No decorative subtitles.

## Print

`@media print` hides `.screen` and shows `#sheet`, a grid of mm-sized cards. Three shapes:
shelf card 85x55mm, hang tag 40x88mm, classic tag 50x100mm. Sizes are in mm on purpose. If you
change a card, check it in the browser's print preview at both Letter and A4.

## Likely next jobs

- Flavour pages, or a similarity finder over the `fam` vectors.
- `@11ty/eleventy-img` over `src/assets/bottles/` so photos are resized at build time.
