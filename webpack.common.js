const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack")
const Dotenv = require("dotenv-webpack");
const path = require("path");
const version = require("./package.json").version;

module.exports = {
  entry: {
    index: "./src/map.js",
    util: "./src/api.js",
    ui: "./src/info.js",
    swagger: "./src/swagger.js",    
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
      chunks:['index','util','ui']
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
      filename: "api_docs.html",
      template: "src/api_docs.html",
      templateParameters: {
        title: "Swagger GeoPick docs",
        version: version,
      },
      favicon: "src/favicon.ico",
      inject: "body",
      chunks:['swagger']
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
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
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
        test: /\.yaml$/,
        use: [
          { loader: 'json-loader' },
          { loader: 'yaml-loader', options:{ asJSON: true } }
        ]
      },
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
