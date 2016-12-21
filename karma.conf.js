module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    files: ['./test/**/*.js', './node_modules/promise-polyfill/promise.js'],
    webpack: require('./webpack.config'),
    reporters: ['progress', 'mocha'],
    preprocessors: {
      './test/**/*.js': ['webpack', 'sourcemap']
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true,
    plugins: [
      require('karma-webpack'),
      'karma-mocha',
      'karma-phantomjs-launcher',
      'karma-sourcemap-loader',
      'karma-mocha-reporter'
    ],
    webpackMiddleware: {
      noInfo: true
    }
  });
};
