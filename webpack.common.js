const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const Dotenv = require('dotenv-webpack');
const path = require('path');

 module.exports = {   
   entry: {
        index: './src/index.js',                    
        util: './src/util.js',
        ui: './src/ui.js',
   },
   output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
   },   
   optimization: {
    runtimeChunk: 'single',
   },
   performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
   },
   plugins: [
        new HtmlWebpackPlugin({ 
            filename: 'index.html',
            template: 'src/index.html',
            templateParameters: {
                title: 'Geopick'
            },
            favicon: 'src/favicon.ico',
            inject: 'body',
            hash: true
        }),
        new HtmlWebpackPlugin({ 
            filename: 'about.html',
            template: 'src/about.html',            
            templateParameters: {
              title: 'About'
            },
            favicon: 'src/favicon.ico'
        }),     
        new MiniCssExtractPlugin({
            filename: 'css/mystyles.css'
        }),
        new CompressionPlugin({
          test: /\.(js|css)(\?.*)?$/i,
        }),
        new Dotenv(),
    ],
   module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'], },
      {
        test: /\.scss$/,
        use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,                
              }
            }
          ]
      },
      { test: /\.(png|svg|jpg|jpeg|gif)$/i, type: 'asset/resource', },
    ],    
  },
 };