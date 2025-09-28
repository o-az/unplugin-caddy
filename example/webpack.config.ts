import 'webpack-dev-server'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import Caddy from '../packages/unplugin-caddy/src/webpack.ts'

const caddyPort = 69_61

export default {
  name: 'unplugin-caddy Webpack example',
  devServer: {
    port: 88_11,
  },
  entry: './main.ts',
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new webpack.DefinePlugin({
      'import.meta.env.__CUSTOM_DOMAIN': JSON.stringify(
        `webpack-example.localhost:${caddyPort}`,
      ),
    }),
    Caddy({
      options: {
        port: caddyPort,
        host: 'localhost',
        domains: ['webpack-example.localhost'],
      },
    }),
  ],
} satisfies webpack.Configuration
