import NodeProcess from 'node:process'
import { createUnplugin, type UnpluginFactory } from 'unplugin'

import { printBanner } from './utilities/index.ts'
import type { CaddyServer, Options } from './types.ts'
import { CaddyServerManager } from './caddy-server.ts'

let caddyServer: CaddyServer | null = null

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options = {},
) => {
  return {
    name: 'unplugin-caddy',

    vite: {
      configureServer(server) {
        const targetPort = server.config.server.port || 51_73

        // Create Caddy server instance
        caddyServer = new CaddyServerManager(options, targetPort)

        // Start Caddy when Vite server is ready
        server.httpServer?.once('listening', async () => {
          try {
            if (!caddyServer) return
            await caddyServer.start()

            printBanner(caddyServer.getUrl(), `http://localhost:${targetPort}`)
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

    webpack(compiler) {
      // For webpack-dev-server integration
      compiler.hooks.afterEnvironment.tap('unplugin-caddy', () => {
        const devServer = compiler.options.devServer
        if (!devServer) return

        const targetPort = devServer.port || 80_80
        caddyServer = new CaddyServerManager(options, targetPort)

        // Hook into webpack-dev-server lifecycle
        const originalOnListening = devServer.onListening
        devServer.onListening = function (server: any) {
          if (originalOnListening) originalOnListening.call(this, server)

          // Start Caddy after webpack-dev-server is ready
          caddyServer!
            .start()
            .then(() => {
              console.log(`Caddy proxy available at: ${caddyServer!.getUrl()}`)
            })
            .catch(console.error)
        }
      })

      // Cleanup on compiler close
      compiler.hooks.shutdown.tapPromise('unplugin-caddy', async () => {
        if (caddyServer) {
          await caddyServer.stop()
          caddyServer = null
        }
      })
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
