const path = require("path");

const library = "OpenBCIUtilities";
const librarySnakeCase = "openbci-utilities";
const libraryExport = "default";

const config = {
  entry: {
    [librarySnakeCase]: "./src/index.js",
    utilities: "./src/utilities.js",
    constants: "./src/constants.js",
    debug: "./src/debug.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  devtool: "eval",
  devServer: {
    compress: true,
    port: 9000
  }
};

const exportLibraryTarget = (libraryTarget, name) =>
  Object.assign({}, config, {
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: `${name}.js`,
      library,
      libraryTarget,
      libraryExport
    }
  });

module.exports = [
  exportLibraryTarget("umd", "[name]"),
  exportLibraryTarget("var", "[name].var")
];
