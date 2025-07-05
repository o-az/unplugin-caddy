import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'

import Unplugin from '../src/vite'

export default defineConfig({
  plugins: [
    Unplugin({
      options: {
        caddyPath: 'caddy',
        caddyfile: 'Caddyfile',
        host: 'localhost',
        https: true,
        domains: ['play.localhost'],
        port: 69_68,
        verbose: true,
      },
    }),
    Inspect(),
  ],
})
