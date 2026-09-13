module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // Collected by glob, not by a `tags` key: the notes use `flavours` for their
  // tasting words so Eleventy's tag system stays out of the way.
  eleventyConfig.addCollection("bottles", (api) =>
    api.getFilteredByGlob("src/bottles/*.md")
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
