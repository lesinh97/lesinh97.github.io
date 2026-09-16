module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // The custom domain. Pages reads _site/CNAME from the deployed artifact, so
  // this has to land at the site root, not under assets. Drop it and
  // shin.technology stops resolving on the next deploy.
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  // Must sit at the site root: it has to answer on the exact path the old
  // Gatsby service worker was registered at, or it cannot replace it.
  eleventyConfig.addPassthroughCopy({ "src/sw.js": "sw.js" });

  // Collected by glob, not by a `tags` key: the notes use `flavours` for their
  // tasting words so Eleventy's tag system stays out of the way.
  eleventyConfig.addCollection("bottles", (api) =>
    api.getFilteredByGlob("src/bottles/*.md")
  );

  /* Distillery and bottler histories, one file each, referenced from a note by
     its `brand:` slug. They never become pages of their own (brands.json sets
     `permalink: false`), they exist so the same paragraph about Cumbria in 2014
     is not written into five Lakes notes and then edited in only one of them. */
  eleventyConfig.addCollection("brands", (api) =>
    api.getFilteredByGlob("src/brands/*.md")
  );

  /* Dong, grouped with dots and a non-breaking space before the sign. Kept
     byte-identical to `money()` in app.js: the same amount is rendered by the
     template on a note page and by the script in the ledger panel, and two
     spellings of it side by side would look like a bug. */
  eleventyConfig.addFilter("money", (n) =>
    !n ? "" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
  );

  // One decimal always, matching score() in app.js so 8 and 8.0 never both appear.
  eleventyConfig.addFilter("score1", (n) =>
    n == null || n === "" ? "" : (Math.round(n * 10) / 10).toFixed(1)
  );

  /* Nunjucks `set` inside a `for` does not survive the loop, so looking a brand
     up by slug in the template is a filter rather than a search. */
  eleventyConfig.addFilter("brandBySlug", (brands, slug) =>
    slug ? (brands || []).find((b) => b.page.fileSlug === slug) : undefined
  );

  // Same reason posts use `topics` rather than `tags`. Newest first.
  // `draft: true` in the front matter keeps a post out of the build. Run
  // DRAFTS=1 npm start to see them locally without publishing them.
  const showDrafts = process.env.DRAFTS === "1";
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/posts/*.md")
      .filter((p) => showDrafts || !p.data.draft)
      .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date)))
  );

  // Dates are quoted strings in the front matter, so they stay plain strings
  // rather than becoming timestamps in whatever the build machine's zone is.
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  eleventyConfig.addFilter("readableDate", (value) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
    if (!m) return value || "";
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
