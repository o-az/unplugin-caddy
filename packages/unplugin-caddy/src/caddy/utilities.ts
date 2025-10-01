import pc from 'picocolors'
import NodeOS from 'node:os'
import NodePath from 'node:path'
import NodeCrypto from 'node:crypto'
import NodeFS from 'node:fs/promises'
import NodeChildProcess from 'node:child_process'

import { logger } from '#utilities.ts'

type CaddyLogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

export interface GenerateCaddyConfigOptions {
  logFile?: {
    /**
     * Absolute or relative path for the Caddy request log.
     */
    path: string
    /**
     * Log level to persist to disk. Defaults to WARN.
     */
    level?: CaddyLogLevel
    /**
     * Format for the file encoder.
     */
    format?: 'json' | 'console'
    /**
     * Restrict file logging to these domains. If omitted, all configured domains log to the file.
     */
    domains?: Array<string>
  }
  /**
   * Override the stdout log level that Caddy should emit.
   */
  stdoutLevel?: CaddyLogLevel
}

export function isCaddyInstalled() {
  let caddyIsInstalled = false
  try {
    NodeChildProcess.execSync('caddy version')
    caddyIsInstalled = true
  } catch {
    caddyIsInstalled = false
    logger.error(pc.yellow('Caddy is not installed'))
  }
  return caddyIsInstalled
}

export async function writeTempFile(content: string) {
  const tempDir = NodeOS.tmpdir()

  // Use crypto random bytes for unpredictable filename
  const randomBytes = NodeCrypto.randomBytes(16).toString('hex')
  const filename = `caddy-${randomBytes}.json`
  const filePath = NodePath.join(tempDir, filename)

  try {
    // Write file with restricted permissions (owner read/write only)
    await NodeFS.writeFile(filePath, content, {
      mode: 0o600,
      flag: 'wx', // Fail if file exists
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('EEXIST')) {
      // Retry with new filename if collision occurs
      return writeTempFile(content)
    }
    throw error
  }

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
  options: GenerateCaddyConfigOptions = {},
) {
  const STDOUT_LOGGER_NAME = 'unplugin_caddy_stdout'
  const FILE_LOGGER_NAME = 'unplugin_caddy_file'

  const stdoutLevel = options.stdoutLevel ?? 'INFO'

  let logFilePath: string | undefined
  if (options.logFile?.path) {
    if (isValidPath(options.logFile.path)) {
      logFilePath = NodePath.resolve(options.logFile.path)
    } else {
      logger.warn(
        pc.yellow(
          `Invalid Caddy log file path provided: ${options.logFile.path}. Falling back to stdout logging only.`,
        ),
      )
    }
  }

  const fileLogLevel = options.logFile?.level ?? 'WARN'
  const fileLogFormat = options.logFile?.format ?? 'json'

  const filteredLogDomains = options.logFile?.domains
    ?.filter(Boolean)
    .filter(domain => {
      if (!isValidDomain(domain)) {
        logger.warn(
          pc.yellow(`Ignoring invalid domain in log filter: ${domain}`),
        )
        return false
      }
      return true
    })
    .map(domain => domain.toLowerCase())

  const hasDomainFilter = Boolean(filteredLogDomains?.length)
  const domainFilterSet = new Set(filteredLogDomains)

  const loggerNames = domains.reduce<Record<string, string>>((acc, domain) => {
    const normalizedDomain = domain.toLowerCase()
    const useFileLogger =
      Boolean(logFilePath) &&
      (!hasDomainFilter || domainFilterSet.has(normalizedDomain))

    acc[domain] = useFileLogger ? FILE_LOGGER_NAME : STDOUT_LOGGER_NAME
    return acc
  }, {})

  const loggingConfig: Record<
    string,
    {
      writer: Record<string, unknown>
      encoder: { format: string }
      level: CaddyLogLevel
    }
  > = {
    [STDOUT_LOGGER_NAME]: {
      writer: {
        output: 'stdout',
      },
      encoder: {
        format: 'console',
      },
      level: stdoutLevel,
    },
  }

  if (logFilePath) {
    loggingConfig[FILE_LOGGER_NAME] = {
      writer: {
        output: 'file',
        filename: logFilePath,
      },
      encoder: {
        format: fileLogFormat,
      },
      level: fileLogLevel,
    }
  }

  const config = {
    logging: {
      logs: loggingConfig,
    },
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
              default_logger_name:
                logFilePath && !hasDomainFilter
                  ? FILE_LOGGER_NAME
                  : STDOUT_LOGGER_NAME,
              logger_names: loggerNames,
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

/**
 * Validate domain name to prevent injection attacks
 */
export function isValidDomain(domain: string): boolean {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '')

  // Basic domain validation regex
  // Allows alphanumeric, dots, hyphens, and optional port
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(:[0-9]{1,5})?$/

  // Check for localhost variants
  const localhostRegex = /^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]{1,5})?$/

  return domainRegex.test(cleanDomain) || localhostRegex.test(cleanDomain)
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535
}

/**
 * Validate and sanitize file path to prevent traversal attacks
 */
export function isValidPath(path: string): boolean {
  // Reject paths with null bytes
  if (path.includes('\0')) return false

  // Reject paths attempting directory traversal
  const normalizedPath = NodePath.normalize(path)
  if (normalizedPath.includes('..')) return false

  // Reject paths with shell metacharacters
  const dangerousChars = /[;&|`$()<>\\\n\r]/
  if (dangerousChars.test(path)) return false

  return true
}

/**
 * Sanitize caddy executable path
 */
export function sanitizeCaddyPath(caddyPath: string): string {
  // Default to 'caddy' if invalid
  if (!caddyPath || !isValidPath(caddyPath)) {
    logger.warn('Invalid caddy path provided, using default: caddy')
    return 'caddy'
  }

  // If it's just a command name (no path separators), return as is
  if (!caddyPath.includes('/') && !caddyPath.includes('\\')) {
    return caddyPath
  }

  // For full paths, resolve and normalize
  return NodePath.resolve(caddyPath)
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
  targetUrl: string
  targetLabel?: string
  caddyUrl: string
  verbose?: boolean
  additionalDomains?: Array<string>
}): void {
  const url = new URL(params.caddyUrl)
  logger.info(`\n${pc.cyan('  Unplugin Caddy is running!\n')}`)

  const label = params.targetLabel ?? 'Dev server'
  logger.info(pc.dim(`  ${label}:  `) + pc.dim(params.targetUrl))

  logger.info(
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
    logger.info(pc.green('  Additional domains: ') + pc.green(formattedDomains))
  }
}
