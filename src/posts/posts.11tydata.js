// One flag controls a draft: `draft: true` in the front matter both keeps the
// post out of the collection and stops a page being written for it. Run
// `DRAFTS=1 npm start` to see drafts locally without publishing them.
const showDrafts = process.env.DRAFTS === "1";

module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) =>
      data.draft && !showDrafts ? false : `/blog/${data.page.fileSlug}/`
  }
};
