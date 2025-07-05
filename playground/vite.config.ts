import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Unplugin from '../src/vite'

export default defineConfig({
  plugins: [
    Unplugin({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
      verbose: true,
    }),
    Inspect(),
  ],
})
