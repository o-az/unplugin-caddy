import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Unplugin from '../src/vite'

export default defineConfig({
  plugins: [
    Inspect(),
    Unplugin({
      https: true,
      host: 'localhost',
      domains: ['local.dev', 'app.local'],
      verbose: true,
    }),
  ],
})
