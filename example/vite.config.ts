import { defineConfig } from 'vite'
import Unplugin from '../src/vite'

export default defineConfig({
  plugins: [
    Unplugin({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
      verbose: true,
    }),
  ],
})
