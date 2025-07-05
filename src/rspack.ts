/**
 * This entry file is for Rspack plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Rspack plugin
 *
 * @example
 * ```js
 * // rspack.config.js
 * import Caddy from 'unplugin-caddy/rspack'
 *
 * default export {
 *  plugins: [Caddy()],
 * }
 * ```
 */
const rspack = Caddy.rspack as typeof Caddy.rspack
export default rspack
export { rspack as 'module.exports' }
