const { environment } = require('@rails/webpacker');

const sassLoaderIndex = environment.loaders
  .get("sass")
  .use.findIndex(el => el.loader === "sass-loader");

let sassLoader = environment.loaders.get("sass").use[sassLoaderIndex];
sassLoader.options.includePaths = ["./node_modules"];

environment.loaders.get("sass").use[sassLoaderIndex] = sassLoader;

module.exports = environment;
