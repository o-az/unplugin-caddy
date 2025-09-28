import { defineConfig } from 'vite'

import Caddy from '#unplugin-caddy/vite.ts'

const caddyPort = 69_62

export default defineConfig({
  define: {
    'import.meta.env.__CUSTOM_DOMAIN': JSON.stringify(
      `vite-example.localhost:${caddyPort}`,
    ),
  },
  server: {
    port: 77_33,
  },
  plugins: [
    Caddy({
      options: {
        verbose: true,
        port: caddyPort,
        domains: ['vite-example.localhost'],
      },
    }),
  ],
})
