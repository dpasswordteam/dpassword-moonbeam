const webpack = require('webpack');
const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');

module.exports = {
    webpack: override(
        addWebpackAlias({
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          crypto: require.resolve('crypto-browserify'),
          buffer: require.resolve('buffer'),
          zlib: require.resolve('browserify-zlib')
        }),
        addWebpackPlugin(
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
          })
        )
    ),
    // Extend/override the dev server configuration used by CRA
    // See: https://github.com/timarney/react-app-rewired#extended-configuration-options
    devServer: function(configFunction) {
        return function(proxy, allowedHost) {
        // Create the default config by calling configFunction with the proxy/allowedHost parameters
        // Default config: https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpackDevServer.config.js
        const config = configFunction(proxy, allowedHost);

        // Set loose allow origin header to prevent CORS issues
        config.headers = {'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        }

        return config;
        };
    },
};

