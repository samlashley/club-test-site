const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");

module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/fonts");

  // Build-time image optimization: rewrites every <img src="..."> pointing at
  // a local file in the rendered HTML into a <picture> with webp + jpeg
  // sources at two widths, with lazy loading. Protects against officers
  // uploading full-size phone photos through the CMS — the originals in
  // src/images/uploads/ are untouched; only the rendered output changes.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [400, 800],
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
      },
    },
  });

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    const date = new Date(dateObj);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    const date = new Date(dateObj);
    return date.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("head", (arr, n) => {
    if (!Array.isArray(arr)) return [];
    return n < 0 ? arr.slice(n) : arr.slice(0, n);
  });

  // Collections
  eleventyConfig.addCollection("newsSorted", (collectionApi) => {
    return collectionApi.getFilteredByTag("news").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("roster", (collectionApi) => {
    return collectionApi.getFilteredByTag("roster").sort((a, b) => a.data.number - b.data.number);
  });

  eleventyConfig.addCollection("rosterMen", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("roster")
      .filter((item) => item.data.team === "Men's")
      .sort((a, b) => a.data.number - b.data.number);
  });

  eleventyConfig.addCollection("rosterWomen", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("roster")
      .filter((item) => item.data.team === "Women's")
      .sort((a, b) => a.data.number - b.data.number);
  });

  eleventyConfig.addCollection("aboutPages", (collectionApi) => {
    return collectionApi.getFilteredByTag("about").sort((a, b) => {
      const orderA = a.data.order ?? 10;
      const orderB = b.data.order ?? 10;
      return orderA - orderB || a.data.title.localeCompare(b.data.title);
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
