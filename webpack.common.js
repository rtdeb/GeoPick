const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const path = require("path");
const version = require("./package.json").version;

module.exports = {
  entry: {
    index: "./src/map.js",
    util: "./src/api.js",
    ui: "./src/info.js",
  },
  output: {
    filename: "js/[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    assetModuleFilename: "assets/images/[name][ext]",
  },
  optimization: {
    runtimeChunk: "single",
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "src/index.html",
      templateParameters: {
        title: "Geopick",
        version: version,
      },
      favicon: "src/favicon.ico",
      inject: "body",
      hash: true,
    }),
    new HtmlWebpackPlugin({
      filename: "about.html",
      template: "src/about.html",
      templateParameters: {
        title: "About",
        version: version,
      },
      favicon: "src/favicon.ico",
      inject: "body",
    }),
    new HtmlWebpackPlugin({
      filename: "help.html",
      template: "src/help.html",
      templateParameters: {
        title: "Help",
        version: version,
      },
      favicon: "src/favicon.ico",
      inject: "body",
    }),
    new HtmlWebpackPlugin({
      filename: "changelog.html",
      template: "src/changelog.html",
      templateParameters: {
        title: "Changelog",
        version: version,
      },
      favicon: "src/favicon.ico",
      inject: "body",
    }),    
    new MiniCssExtractPlugin({
      filename: "css/mystyles.css",
    }),
    new CompressionPlugin({
      test: /\.(js|css)(\?.*)?$/i,
    }),
    new Dotenv(),
  ],
  module: {
    rules: [
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: "asset/resource" },
    ],
  },
};
