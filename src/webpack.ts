/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Webpack plugin
 *
 * @example
 * ```js
 * // webpack.config.js
 * import Caddy from 'unplugin-caddy/webpack'
 *
 * default export {
 *  plugins: [Caddy()],
 * }
 * ```
 */
const webpack = Caddy.webpack as typeof Caddy.webpack
export default webpack
export { webpack as 'module.exports' }
