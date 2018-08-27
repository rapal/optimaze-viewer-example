const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const TSLintPlugin = require("tslint-webpack-plugin");

module.exports = {
  entry: "./src/app.ts",
  output: {
    path: path.resolve("build"),
    filename: "[name].js"
  },
  stats: "minimal",
  plugins: [
    new CleanWebpackPlugin(["build"]),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      hash: true
    }),
    new TSLintPlugin({
      files: ["./src/**/*.ts"]
    })
  ],
  resolve: {
    modules: [path.resolve("node_modules")],
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve("src"),
        use: "ts-loader"
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.png$/,
        use: "file-loader"
      }
    ]
  }
};
