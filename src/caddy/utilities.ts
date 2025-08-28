import pc from 'picocolors'
import NodeOS from 'node:os'
import NodePath from 'node:path'
import NodeFS from 'node:fs/promises'
import NodeChildProcess from 'node:child_process'

export function isCaddyInstalled() {
  let caddyIsInstalled = false
  try {
    NodeChildProcess.execSync('caddy version')
    caddyIsInstalled = true
  } catch {
    caddyIsInstalled = false
    console.error(pc.yellow('Caddy is not installed'))
  }
  return caddyIsInstalled
}

export function writeTempFile(content: string) {
  const tempDir = NodeOS.tmpdir()

  const filename = `caddy-${Date.now()}.json`
  const filePath = NodePath.join(tempDir, filename)

  NodeFS.writeFile(filePath, content)

  return {
    fullPath: filePath,
    filename,
  }
}

export function generateCaddyConfig(
  domains: Array<string>,
  port: number = 69_69,
  targetPort: number = 51_73,
  _cors?: string,
) {
  const config = {
    apps: {
      http: {
        servers: {
          srv0: {
            listen: [`:${port}`],
            routes: domains.map(domain => ({
              match: [
                {
                  host: [domain],
                },
              ],
              handle: [
                {
                  handler: 'subroute',
                  routes: [
                    {
                      handle: [
                        {
                          handler: 'reverse_proxy',
                          upstreams: [
                            {
                              dial: `localhost:${targetPort}`,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
              terminal: true,
            })),
            logs: {
              logger_names: domains.reduce((loggerNames, domain) => {
                // @ts-expect-error
                loggerNames[domain] = 'stdout'
                return loggerNames
              }, {}),
            },
          },
        },
      },
      tls: {
        automation: {
          policies: [
            {
              subjects: domains,
              issuers: [
                {
                  module: 'internal',
                },
              ],
            },
          ],
        },
      },
    },
  }

  return config
}

export async function sleep(ms: number): Promise<void> {
  if (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof Atomics !== 'undefined'
  ) {
    const nil = new Int32Array(new SharedArrayBuffer(4))
    Atomics.wait(nil, 0, 0, Number(ms))
  } else {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

export type MaybePromise<T> = T | Promise<T>

/**
 * works for both sync and async functions
 */
export async function noThrow<T>(
  fn: () => MaybePromise<T>,
  onError?: (error: unknown) => void,
): Promise<Awaited<T>> {
  try {
    return await fn()
  } catch (error) {
    onError?.(error)
    return undefined as unknown as Awaited<T>
  }
}

export function getInstallCommand(): string {
  const os = NodeOS.platform()
  return (() => {
    if (os === 'darwin') return 'brew install caddy'
    if (os === 'win32') return 'scoop install caddy'
    return 'sudo apt install caddy'
  })()
}

export function formatCaddyError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('permission denied'))
    return 'Permission denied. Try running with sudo or choose a different port.'

  if (errorMessage.includes('address already in use'))
    return 'Port is already in use. Try a different port or stop the conflicting service.'

  if (errorMessage.includes('cannot find binary'))
    return 'Caddy binary not found. Make sure Caddy is installed and in your PATH.'

  return errorMessage
}

export function printBanner(params: {
  https: boolean
  viteUrl: string
  caddyUrl: string
  verbose?: boolean
  additionalDomains?: Array<string>
}): void {
  const url = new URL(params.caddyUrl)
  console.info(`\n${pc.cyan('  Unplugin Caddy is running!\n')}`)
  console.info(pc.dim('  Vite dev server:  ') + pc.dim(params.viteUrl))
  console.info(
    pc.green('  Caddy proxy:      ') +
      pc.green(params.caddyUrl) +
      pc.green(' (HTTPS)'),
  )
  if (params.additionalDomains) {
    const formattedDomains = params.additionalDomains
      .map(domain =>
        params.https
          ? `https://${domain}:${url.port}`
          : `http://${domain}:${url.port}`,
      )
      .join(', ')
    console.info(
      pc.green('  Additional domains: ') + pc.green(formattedDomains),
    )
  }
  console.info()
}
