module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // only add extra plugins if you really need them
      ["@babel/plugin-transform-private-methods", { loose: true }],
    ],
  };
};
