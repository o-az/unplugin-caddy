/**
 * This entry file is for Rolldown plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Rolldown plugin
 *
 * @example
 * ```ts
 * // rolldown.config.js
 * import Caddy from 'unplugin-caddy/rolldown'
 *
 * export default {
 *   plugins: [Caddy()],
 * }
 * ```
 */
const rolldown = Caddy.rolldown as typeof Caddy.rolldown
export default rolldown
export { rolldown as 'module.exports' }
