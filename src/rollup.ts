/**
 * This entry file is for Rollup plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Rollup plugin
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import Caddy from 'unplugin-caddy/rollup'
 *
 * export default {
 *   plugins: [Caddy()],
 * }
 * ```
 */
const rollup = Caddy.rollup as typeof Caddy.rollup
export default rollup
export { rollup as 'module.exports' }
