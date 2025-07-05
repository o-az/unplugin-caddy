/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import Caddy from 'unplugin-caddy/vite'
 *
 * export default defineConfig({
 *   plugins: [Caddy()],
 * })
 * ```
 */
const vite = Caddy.vite as typeof Caddy.vite
export default vite
export { vite as 'module.exports' }
