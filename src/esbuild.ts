/**
 * This entry file is for esbuild plugin.
 *
 * @module
 */

import Caddy from './index'

/**
 * Esbuild plugin
 *
 * @example
 * ```ts
 * import { build } from 'esbuild'
 * import Caddy from 'unplugin-caddy/esbuild'
 * 
 * build({ plugins: [Caddy()] })
```
 */
const esbuild = Caddy.esbuild as typeof Caddy.esbuild
export default esbuild
export { esbuild as 'module.exports' }
