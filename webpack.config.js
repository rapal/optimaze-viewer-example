var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  devtool: "inline-source-map",
  entry: "./src/app.ts",
  output: {
    path: path.resolve("build"),
    filename: "bundle.js"
  },
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
