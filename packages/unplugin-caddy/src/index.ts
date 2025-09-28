const PLUGIN_NAME = 'unplugin-caddy'
import NodeProcess from 'node:process'
import { createFilter } from 'unplugin-utils'
import { createUnplugin, type UnpluginFactory } from 'unplugin'

import type { Framework } from '#caddy/types.ts'
import { printBanner } from '#caddy/utilities.ts'
import { CaddyServerManager } from '#caddy/index.ts'
import { type Options, resolveOptions } from '#caddy/options.ts'

// Use a singleton pattern to persist Caddy across rebuilds
let caddyServer: CaddyServerManager<Framework> | null = null
let caddyInitialized = false
let processCleanupRegistered = false

function cleanup() {
  if (caddyServer) caddyServer.stop().then(() => (caddyServer = null))

  caddyInitialized = false
  processCleanupRegistered = false
}

const registerProcessCleanup = () => {
  if (processCleanupRegistered) return
  NodeProcess.once('SIGINT', cleanup)
  NodeProcess.once('SIGTERM', cleanup)
  processCleanupRegistered = true
}

const attachServerCleanup = (
  server?: { once: (event: 'close', listener: () => void) => unknown } | null,
) => {
  server?.once('close', cleanup)
}

const normalizeHostForDisplay = (host?: string): string => {
  if (!host || host === '0.0.0.0' || host === '::') return 'localhost'
  return host
}

export const unpluginFactory: UnpluginFactory<Options, false> = (
  rawOptions,
  _meta,
) => {
  const options = resolveOptions(rawOptions)
  const filter = createFilter(options.include, options.exclude)

  return {
    name: PLUGIN_NAME,
    enforce: options.enforce,
    transform: {
      // an additional hook is needed for better perf on webpack and rolldown
      filter: {
        id: {
          include: options.include,
          exclude: options.exclude,
        },
        code: {
          include: options.include,
          exclude: options.exclude,
        },
      },
      handler: (code, id) =>
        filter(id)
          ? code.replace(/<template>/, '<template><div>Injected</div>')
          : code,
    },
    vite: {
      configureServer: server => {
        const targetPort = server.config.server.port || 51_73

        if (!caddyServer || caddyServer.framework !== 'vite') {
          caddyServer = new CaddyServerManager({
            framework: 'vite',
            server,
            targetPort,
            options: options.options,
          })
        } else caddyServer.setTargetPort(targetPort)

        if (!caddyInitialized) {
          server.httpServer?.once('listening', async () => {
            try {
              if (!caddyServer || caddyInitialized) return
              caddyInitialized = true
              await caddyServer.start()

              printBanner({
                verbose: options.options.verbose,
                caddyUrl: caddyServer.getUrl(),
                https: options.options.https ?? true,
                additionalDomains: options.options.domains,
                targetLabel: 'Vite dev server',
                targetUrl: `http://localhost:${targetPort}`,
              })
            } catch (error) {
              console.error('Failed to start Caddy:', error)
              caddyInitialized = false
            }
          })
        }

        registerProcessCleanup()
        attachServerCleanup(server.httpServer)
      },
    },
    rspack: compiler => {
      if (compiler.options.mode !== 'development') return

      compiler.hooks.initialize.tap(PLUGIN_NAME, () => {
        const devServerOptions = compiler.options.devServer
        if (!devServerOptions) return

        const userOnListening = devServerOptions.onListening

        devServerOptions.onListening = devServer => {
          const resolveProtocol = (): 'http' | 'https' => {
            const serverOption = devServerOptions.server

            const toStringType = (value: unknown): string | undefined => {
              if (typeof value === 'string') return value
              if (
                value &&
                typeof value === 'object' &&
                'type' in value &&
                typeof (value as { type?: unknown }).type === 'string'
              ) {
                return (value as { type?: string }).type
              }
              return undefined
            }

            const type = toStringType(serverOption)?.toLowerCase()
            if (!type) return 'http'
            if (type === 'https' || type === 'http2' || type === 'spdy')
              return 'https'
            return 'http'
          }

          const resolvePort = (): number | null => {
            const address = devServer.server?.address()
            if (typeof address === 'number') return address
            if (
              address &&
              typeof address === 'object' &&
              'port' in address &&
              typeof (address as { port?: unknown }).port === 'number'
            ) {
              return (address as { port: number }).port
            }

            if (devServerOptions.port != null) {
              const parsed = Number(devServerOptions.port)
              if (!Number.isNaN(parsed) && parsed > 0) return parsed
            }

            return null
          }

          const ensureCaddyServer = () => {
            const effectivePort = resolvePort()

            if (!caddyServer || caddyServer.framework !== 'rspack') {
              caddyServer = new CaddyServerManager({
                framework: 'rspack',
                server: devServer,
                targetPort: effectivePort ?? undefined,
                options: options.options,
              })
            } else if (effectivePort != null) {
              try {
                caddyServer.setTargetPort(effectivePort)
              } catch (error) {
                console.warn(
                  'unplugin-caddy: failed to update target port',
                  error,
                )
              }
            }

            return effectivePort
          }

          const startCaddy = async () => {
            if (caddyInitialized) return
            const effectivePort = ensureCaddyServer()

            if (!caddyServer) return
            if (effectivePort == null) {
              console.warn(
                'unplugin-caddy: unable to determine Rspack dev server port, skipping Caddy startup',
              )
              return
            }

            try {
              caddyInitialized = true
              await caddyServer.start(effectivePort)

              const host = normalizeHostForDisplay(
                devServer.options?.host ?? devServerOptions.host,
              )
              const protocol = resolveProtocol()
              const targetUrl = `${protocol}://${host}:${effectivePort}`

              printBanner({
                verbose: options.options.verbose,
                caddyUrl: caddyServer.getUrl(),
                https: options.options.https ?? true,
                additionalDomains: options.options.domains,
                targetLabel: 'Rspack dev server',
                targetUrl,
              })
            } catch (error) {
              console.error('Failed to start Caddy:', error)
              caddyInitialized = false
            }
          }

          registerProcessCleanup()
          attachServerCleanup(devServer.server)
          void startCaddy()

          if (typeof userOnListening === 'function')
            userOnListening.call(devServerOptions, devServer)
        }
      })
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
