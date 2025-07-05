import { defineConfig } from 'vite'
import Caddy from 'unplugin-caddy/vite'

export default defineConfig({
  define: {
    'import.meta.env.VITE_CUSTOM_DOMAIN': JSON.stringify('play.localhost:6968'),
  },
  plugins: [
    Caddy({
      enforce: 'pre',
      options: {
        https: true,
        port: 69_68,
        verbose: true,
        host: 'localhost',
        caddyPath: 'caddy',
        caddyfile: 'Caddyfile',
        domains: ['play.localhost'],
      },
    }),
  ],
})
