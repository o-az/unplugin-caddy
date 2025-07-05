import NodeProcess from 'node:process'
import { createUnplugin, type UnpluginFactory } from 'unplugin'

import { printBanner } from '#caddy/utilities.ts'
import { CaddyServerManager } from '#caddy/index.ts'
import { type Options, resolveOptions } from '#caddy/options.ts'

const PLUGIN_NAME = 'unplugin-caddy'

let caddyServer: CaddyServerManager | null = null

export const unpluginFactory: UnpluginFactory<Options, false> = rawOptions => {
  const { options: caddyOptions, ...options } = resolveOptions(rawOptions)
  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    vite: {
      configureServer(server) {
        const targetPort = server.config.server.port || 51_73

        caddyServer = new CaddyServerManager({
          server,
          targetPort,
          caddyProcess: null as any, // Will be set when started
          caddyPath: caddyOptions.caddyPath ?? 'caddy',
          options: caddyOptions,
        })

        server.httpServer?.once('listening', async () => {
          try {
            if (!caddyServer) return
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
          }
        })

        const cleanup = async (): Promise<void> => {
          if (caddyServer) {
            await caddyServer.stop()
            caddyServer = null
          }
        }

        NodeProcess.on('SIGINT', cleanup)
        NodeProcess.on('SIGTERM', cleanup)
        server.httpServer?.on('close', cleanup)
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
