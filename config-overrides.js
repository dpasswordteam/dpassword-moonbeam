const webpack = require('webpack');
const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer')
  }),
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  )
);
