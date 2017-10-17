var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = function(env) {
  var production = env === "production";

  return {
    entry: "./src/app.ts",
    output: {
      path: path.resolve("build"),
      filename: "bundle.js"
    },
    devtool: production ? "source-map" : "inline-source-map",
    stats: {
      chunks: false,
      children: false
    },
    plugins: [
      new ExtractTextPlugin({
        filename: "bundle.css"
      })
    ],
    resolve: {
      modules: [path.resolve("node_modules")],
      extensions: [".ts", ".js"]
    },
    module: {
      loaders: [
        {
          test: /\.ts$/,
          include: path.resolve("src"),
          loader: "ts-loader"
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            use: "css-loader"
          })
        },
        {
          test: /\.png$/,
          loader: "file-loader"
        }
      ]
    }
  };
};
