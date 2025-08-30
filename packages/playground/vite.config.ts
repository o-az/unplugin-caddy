import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'

import Unplugin from '../src/vite'

export default defineConfig({
  server: {
    port: 69_68,
  },
  plugins: [
    Unplugin({
      options: {
        https: true,
        port: 69_68,
        verbose: true,
        host: 'localhost',
        caddyPath: 'caddy',
        caddyfile: 'Caddyfile',
        domains: ['localhost', 'play.localhost'],
      },
    }),
    Inspect(),
  ],
})
