const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StrictCspHtmlWebpackPlugin = require(path.resolve(__dirname, '..'));

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: {
    library1: './src/library1.js',
    app: './src/app.js',
    library2: './src/library2.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/template.html',
    }),
    new StrictCspHtmlWebpackPlugin(HtmlWebpackPlugin),
  ],
};
