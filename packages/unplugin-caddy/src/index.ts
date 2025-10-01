import NodeProcess from 'node:process'
import { createFilter } from 'unplugin-utils'
import { createUnplugin, type UnpluginFactory } from 'unplugin'

import { printBanner } from '#caddy/utilities.ts'
import { CaddyServerManager } from '#caddy/index.ts'
import type { DevServer, Framework } from '#caddy/types.ts'
import { type Options, resolveOptions } from '#caddy/options.ts'
import type { DevServer as RspackDevServerOptions } from '@rspack/core'
import type { Configuration as WebpackDevServerOptions } from 'webpack-dev-server'

const PLUGIN_NAME = 'unplugin-caddy'

// Use a singleton pattern to persist Caddy across rebuilds
let caddyServer: CaddyServerManager<Framework> | null = null
let caddyInitialized = false
let processCleanupRegistered = false

async function cleanup() {
  const server = caddyServer
  caddyServer = null
  caddyInitialized = false
  processCleanupRegistered = false

  if (!server) return

  try {
    await server.stop()
  } catch (error) {
    console.error('unplugin-caddy: failed to stop Caddy during cleanup', error)
  }
}

function registerProcessCleanup() {
  if (processCleanupRegistered) return
  NodeProcess.once('SIGINT', () => {
    void cleanup()
  })
  NodeProcess.once('SIGTERM', () => {
    void cleanup()
  })
  processCleanupRegistered = true
}

const attachServerCleanup = (
  server?: { once: (event: 'close', listener: () => void) => unknown } | null,
) => {
  server?.once('close', () => {
    void cleanup()
  })
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

  type RsWebpackFramework = Extract<Framework, 'rspack' | 'webpack'>
  type RsWebpackOptions<F extends RsWebpackFramework> = F extends 'rspack'
    ? RspackDevServerOptions
    : WebpackDevServerOptions

  function hasServer(value: unknown): value is {
    server: {
      address?: () => unknown
      once: (event: 'close', listener: () => void) => unknown
    }
  } {
    if (typeof value !== 'object' || value === null || !('server' in value))
      return false
    const server = (value as { server?: unknown }).server
    if (typeof server !== 'object' || server === null) return false
    const once = (server as { once?: unknown }).once
    return typeof once === 'function'
  }

  function hasHostOption(
    value: unknown,
  ): value is { options: { host?: string } } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'options' in value &&
      typeof (value as { options?: unknown }).options === 'object' &&
      (value as { options?: unknown }).options !== null
    )
  }

  function getAddressPort(address: unknown): number | null {
    if (typeof address === 'number') return address
    if (
      address &&
      typeof address === 'object' &&
      'port' in address &&
      typeof (address as { port?: unknown }).port === 'number'
    ) {
      return (address as { port: number }).port
    }
    return null
  }

  function normalizePort(port: unknown): number | null {
    if (port == null) return null
    const parsed = Number(port)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  function createRsWebpackOnListeningHandler<
    F extends RsWebpackFramework,
  >(parameters: {
    framework: F
    devServerOptions: RsWebpackOptions<F>
    userOnListening?: (devServer: DevServer<F>) => void
  }): (devServer: DevServer<F>) => void {
    const { framework, devServerOptions, userOnListening } = parameters
    const targetLabel =
      framework === 'rspack' ? 'Rspack dev server' : 'Webpack dev server'

    return (devServer: DevServer<F>) => {
      const resolveProtocol = (): 'http' | 'https' => {
        const serverOption = devServerOptions.server
        const type =
          typeof serverOption === 'string'
            ? serverOption
            : (serverOption as { type?: string } | undefined)?.type

        const normalizedType = type?.toLowerCase()
        if (!normalizedType) return 'http'
        return normalizedType === 'https' ||
          normalizedType === 'http2' ||
          normalizedType === 'spdy'
          ? 'https'
          : 'http'
      }

      function resolvePort() {
        const serverPort = hasServer(devServer)
          ? getAddressPort(devServer.server?.address?.())
          : null
        if (serverPort != null) return serverPort

        return normalizePort(devServerOptions.port)
      }

      const ensureCaddyServer = async () => {
        const effectivePort = resolvePort()

        if (!caddyServer || caddyServer.framework !== framework) {
          if (caddyServer) {
            try {
              await caddyServer.stop()
            } catch (error) {
              console.warn(
                'unplugin-caddy: failed to stop existing Caddy instance',
                error,
              )
            }
          }

          if (framework === 'rspack') {
            caddyServer = new CaddyServerManager({
              framework,
              server: devServer as DevServer<'rspack'>,
              targetPort: effectivePort ?? undefined,
              options: options.options,
            })
          } else {
            caddyServer = new CaddyServerManager({
              framework,
              server: devServer as DevServer<'webpack'>,
              targetPort: effectivePort ?? undefined,
              options: options.options,
            })
          }
        } else if (effectivePort != null) {
          try {
            caddyServer.setTargetPort(effectivePort)
          } catch (error) {
            console.warn('unplugin-caddy: failed to update target port', error)
          }
        }

        return effectivePort
      }

      const startCaddy = async () => {
        if (caddyInitialized) return
        const effectivePort = await ensureCaddyServer()

        if (!caddyServer) return
        if (effectivePort == null) {
          console.warn(
            `unplugin-caddy: unable to determine ${targetLabel} port, skipping Caddy startup`,
          )
          return
        }

        try {
          caddyInitialized = true
          await caddyServer.start(effectivePort)

          const host = normalizeHostForDisplay(
            (hasHostOption(devServer) ? devServer.options.host : undefined) ??
              devServerOptions.host,
          )
          const protocol = resolveProtocol()
          const targetUrl = `${protocol}://${host}:${effectivePort}`

          // so that the server url shows up last
          await new Promise(resolve => setTimeout(resolve, 100))

          printBanner({
            verbose: options.options.verbose,
            caddyUrl: caddyServer.getUrl(),
            https: options.options.https ?? true,
            additionalDomains: options.options.domains,
            targetLabel,
            targetUrl,
          })
        } catch (error) {
          console.error('Failed to start Caddy:', error)
          caddyInitialized = false
        }
      }

      registerProcessCleanup()
      const serverInstance = hasServer(devServer) ? devServer.server : null
      attachServerCleanup(serverInstance ?? null)
      void startCaddy()

      userOnListening?.call(devServerOptions, devServer)
    }
  }

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
          if (caddyServer) void caddyServer.stop()
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

              // so that the server url shows up last
              await new Promise(resolve => setTimeout(resolve, 100))

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
    farm: {
      configureDevServer(server) {
        if (!server) return

        const targetPort = server.config?.port || 88_33

        if (!caddyServer || caddyServer.framework !== 'farm') {
          if (caddyServer) void caddyServer.stop()
          caddyServer = new CaddyServerManager({
            framework: 'farm',
            server: server as any,
            targetPort,
            options: options.options,
          })
        } else caddyServer.setTargetPort(targetPort)

        if (!caddyInitialized) {
          server.server?.on('listening', async () => {
            try {
              if (!caddyServer || caddyInitialized) return
              caddyInitialized = true
              await caddyServer.start()

              await new Promise(resolve => setTimeout(resolve, 200))

              printBanner({
                verbose: options.options.verbose,
                caddyUrl: caddyServer.getUrl(),
                https: options.options.https ?? true,
                additionalDomains: options.options.domains,
                targetLabel: 'Farm dev server',
                targetUrl: `http://localhost:${targetPort}`,
              })
            } catch (error) {
              console.error('Failed to start Caddy:', error)
              caddyInitialized = false
            }
          })
        }

        registerProcessCleanup()
        attachServerCleanup(server.server)
      },
    },
    rollup: {},
    esbuild: {},
    rolldown: {},
    rspack: compiler => {
      if (compiler.options.mode !== 'development') return

      compiler.hooks.initialize.tap(PLUGIN_NAME, () => {
        const devServerOptions = compiler.options.devServer
        if (!devServerOptions) return

        devServerOptions.onListening = createRsWebpackOnListeningHandler({
          framework: 'rspack',
          devServerOptions,
          userOnListening: devServerOptions.onListening,
        })
      })
    },
    webpack: compiler => {
      if (compiler.options.mode !== 'development') return

      compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
        const devServerOptions = compiler.options.devServer
        if (!devServerOptions) return

        devServerOptions.onListening = createRsWebpackOnListeningHandler({
          framework: 'webpack',
          devServerOptions,
          userOnListening: devServerOptions.onListening,
        })
      })
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
