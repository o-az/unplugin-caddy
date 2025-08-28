/**
 * This entry file is for Farm plugin.
 *
 * @module
 */

import Caddy from '#index.ts'

/**
 * Farm plugin
 *
 * @example
 * ```ts
 * // farm.config.js
 * import Caddy from 'unplugin-caddy/farm'
 *
 * export default {
 *   plugins: [Caddy()],
 * }
 * ```
 */
const farm = Caddy.farm as typeof Caddy.farm
export default farm
export { farm as 'module.exports' }
