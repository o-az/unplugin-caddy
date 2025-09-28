import rspack from '@rspack/core'
import { defineConfig } from '@rspack/cli'

import Caddy from '../packages/unplugin-caddy/src/rspack.ts'

const caddyPort = 69_60

export default defineConfig({
  name: 'unplugin-caddy Rspack example',
  devServer: {
    port: 88_22,
  },
  entry: './main.ts',
  mode: 'development',
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
    new rspack.DefinePlugin({
      'import.meta.env.__CUSTOM_DOMAIN': JSON.stringify(
        `rspack-example.localhost:${caddyPort}`,
      ),
    }),
    Caddy({
      options: {
        port: caddyPort,
        host: 'localhost',
        domains: ['rspack-example.localhost'],
      },
    }),
  ],
})
