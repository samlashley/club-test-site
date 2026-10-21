export default function (eleventyConfig) {
  // Copied as-is (not processed as templates)
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");

  // "October 21, 2026"
  eleventyConfig.addFilter("readableDate", (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  );

  eleventyConfig.addFilter("isoDate", (date) =>
    new Date(date).toISOString().slice(0, 10)
  );

  // First n items of a list
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));

  // Newest first
  eleventyConfig.addCollection("newsSorted", (api) =>
    api.getFilteredByTag("news").sort((a, b) => b.date - a.date)
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // .html is left out so admin/index.html is copied untouched
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
  };
}
