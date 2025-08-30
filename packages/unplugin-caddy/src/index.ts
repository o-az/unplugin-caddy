import NodeProcess from 'node:process'
import { createUnplugin, type UnpluginFactory } from 'unplugin'

import { printBanner } from '#caddy/utilities.ts'
import { CaddyServerManager } from '#caddy/index.ts'
import { type Options, resolveOptions } from '#caddy/options.ts'

const PLUGIN_NAME = 'unplugin-caddy'

// Use a singleton pattern to persist Caddy across HMR
let caddyServer: CaddyServerManager | null = null
let caddyInitialized = false

export const unpluginFactory: UnpluginFactory<Options, false> = rawOptions => {
  const { options: caddyOptions, ...options } = resolveOptions(rawOptions)
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    vite: {
      configureServer(server) {
        const targetPort = server.config.server.port || 51_73

        // Only create a new CaddyServerManager if one doesn't exist
        // This prevents recreating it during HMR
        if (!caddyServer) {
          caddyServer = new CaddyServerManager({
            server,
            targetPort,
            caddyProcess: null as any, // Will be set when started
            caddyPath: caddyOptions.caddyPath ?? 'caddy',
            options: caddyOptions,
          })
        }

        // Only start Caddy once, not on every HMR update
        if (!caddyInitialized) {
          server.httpServer?.once('listening', async () => {
            try {
              if (!caddyServer || caddyInitialized) return
              caddyInitialized = true
              await caddyServer.start()

              printBanner({
                https: caddyOptions.https,
                verbose: caddyOptions.verbose,
                caddyUrl: caddyServer.getUrl(),
                additionalDomains: caddyOptions.domains,
                viteUrl: `http://localhost:${targetPort}`,
              })
            } catch (error) {
              console.error('Failed to start Caddy:', error)
              caddyInitialized = false
            }
          })
        }

        const cleanup = async (): Promise<void> => {
          if (caddyServer) {
            await caddyServer.stop()
            caddyServer = null
            caddyInitialized = false
          }
        }

        // Only register cleanup handlers once
        if (!caddyInitialized) {
          NodeProcess.once('SIGINT', cleanup)
          NodeProcess.once('SIGTERM', cleanup)
          server.httpServer?.once('close', cleanup)
        }
      },
    },
    transform: (code, _id) => ({
      code: code.replace(/<template>/, '<template><div>Injected</div>'),
      filter: {
        id: {
          include: options.include,
          exclude: options.exclude,
        },
      },
    }),
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
