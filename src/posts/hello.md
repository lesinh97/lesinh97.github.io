---
title: "Starting a site that is mostly files"
date: "2026-09-13"
summary: "Why this place is flat markdown and a static site generator, and nothing else."
topics: ["Meta", "Eleventy"]
---

Every personal site I have abandoned died the same way. Not because I ran out of
things to say, but because publishing became a chore: a database to migrate, a
framework to upgrade, a build that broke while I was not looking.

So this one is files.

## What that means

A bottle is a markdown file. A post is a markdown file. The whisky ledger reads
every bottle note at build time and turns them into one page you can search,
filter and print. There is no database, no CMS, and no client-side framework.

The only moving parts are Eleventy, which turns the files into HTML, and about
five hundred lines of plain JavaScript that make the ledger interactive. Both
are things I can read in an afternoon.

## The cost

Flat files are worse than a database at exactly one thing: relationships. If I
ever want "show me every bottle that shares three flavour notes with this one",
I will have to compute it at build time rather than query it. That is a fair
trade for never having to log in to publish.

Write the file. Commit it. It is live.
