var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',

  entry: [
    './src/index'
  ],

  output: {
    path: __dirname,
    filename: 'app.js',
    publicPath: '/js/',
    library: 'Stormpath'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        retainLines: true,
        cacheDirectory: true
      }
    },
    {
      test: /\.svg/,
      loader: 'svg-url-loader'
    }]
  },

  plugins: [
    new webpack.DefinePlugin({
      'pkg.version': JSON.stringify(require('./package.json').version),
      'pkg.name': JSON.stringify(require('./package.json').name)
    })
  ]
};
