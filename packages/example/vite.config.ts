import { defineConfig } from 'vite'
import Caddy from 'unplugin-caddy/vite'

const caddyPort = 69_67

export default defineConfig({
  define: {
    'import.meta.env.VITE_CUSTOM_DOMAIN': JSON.stringify(
      `example.localhost:${caddyPort}`,
    ),
  },
  server: {
    port: 77_33,
  },
  plugins: [
    Caddy({
      enforce: 'pre',
      options: {
        verbose: true,
        port: caddyPort,
        domains: ['example.localhost'],
      },
    }),
  ],
})
