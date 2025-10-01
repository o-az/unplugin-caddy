import { defineConfig } from '@farmfe/core'
// must first build the package
// `bun --filter unplugin-caddy build`
import Caddy from 'unplugin-caddy/farm'

const caddyPort = 69_65

export default defineConfig({
  server: {
    port: 88_33,
  },
  compilation: {
    input: {
      index: './main.ts',
    },
  },
  plugins: [
    Caddy({
      options: {
        verbose: true,
        port: caddyPort,
        host: 'localhost',
        domains: ['farm-example.localhost'],
      },
    }),
  ],
})
