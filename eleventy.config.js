module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // The custom domain. Pages reads _site/CNAME from the deployed artifact, so
  // this has to land at the site root, not under assets. Drop it and
  // shin.technology stops resolving on the next deploy.
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });

  // Collected by glob, not by a `tags` key: the notes use `flavours` for their
  // tasting words so Eleventy's tag system stays out of the way.
  eleventyConfig.addCollection("bottles", (api) =>
    api.getFilteredByGlob("src/bottles/*.md")
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
