import pc from 'picocolors'
import NodeProcess from 'node:process'
import type { ViteDevServer } from 'vite'
import NodeChildProcess from 'node:child_process'

import {
  isValidPort,
  writeTempFile,
  isValidDomain,
  isCaddyInstalled,
  getInstallCommand,
  sanitizeCaddyPath,
  generateCaddyConfig,
} from '#caddy/utilities.ts'
import type { CaddyOptions } from '#caddy/types.ts'

type CaddyServerManagerOptions = {
  options: CaddyOptions
  targetPort: number
  caddyPath: string
  server: ViteDevServer
  caddyProcess: NodeChildProcess.ChildProcess
}

export class CaddyServerManager {
  #options: CaddyServerManagerOptions
  #isRunning = false

  constructor(options: CaddyServerManagerOptions) {
    this.#options = options

    // Validate and sanitize inputs
    const port = this.#options.options.port ?? 51_73
    if (!isValidPort(port)) {
      throw new Error(
        `Invalid port number: ${port}. Port must be between 1 and 65535.`,
      )
    }

    const host = this.#options.options.host ?? 'localhost'
    if (!isValidDomain(host)) {
      throw new Error(`Invalid host domain: ${host}`)
    }

    // Sanitize caddy path to prevent command injection
    const caddyPath = sanitizeCaddyPath(
      this.#options.options.caddyPath ?? 'caddy',
    )

    this.#options.options = {
      ...this.#options.options,
      host,
      port,
      https: this.#options.options.https ?? true,
      verbose: this.#options.options.verbose ?? false,
      caddyPath,
      caddyfile: this.#options.options.caddyfile ?? 'Caddyfile',
    }
  }

  getUrl = (): string => {
    const protocol = this.#options.options.https ? 'https' : 'http'
    return `${protocol}://${this.#options.options.host}:${this.#options.options.port}`
  }

  get domains() {
    const domains = Array.isArray(this.#options.options.domains)
      ? this.#options.options.domains
      : [this.#options.options.domains]

    // Validate all domains
    const validatedDomains = domains.filter(domain => {
      if (!domain) return false
      if (!isValidDomain(domain)) {
        console.warn(pc.yellow(`Invalid domain ignored: ${domain}`))
        return false
      }
      return true
    })

    return [this.#options.options.host, ...validatedDomains]
  }

  async start() {
    // Don't start if already running
    if (this.#isRunning && this.#options.caddyProcess?.pid) {
      console.info(pc.cyan('🤠 Caddy is already running'))
      return this.#options.caddyProcess
    }

    if (!isCaddyInstalled()) {
      console.warn(pc.yellow('Caddy is not installed'))
      console.warn(pc.yellow(getInstallCommand()))
      return
    }

    const { port } = this.#options.server.config.server
    const config = generateCaddyConfig(
      this.domains.filter(Boolean),
      this.#options.options.port,
      port || this.#options.targetPort,
    )

    const caddyConfig = await writeTempFile(
      JSON.stringify(config, undefined, 2),
    )

    // Use array-based spawn to prevent command injection
    // Use sanitized caddy path
    const caddyProcess = NodeChildProcess.spawn(
      this.#options.options.caddyPath!,
      ['run', '--config', caddyConfig.fullPath],
      {
        shell: false,
      },
    )

    this.#options.caddyProcess = caddyProcess
    this.#isRunning = true

    caddyProcess.stdout?.on('data', data => {
      console.info('^^', pc.green(data.toString()))
    })

    caddyProcess.stderr?.on('data', data => {
      const message = data.toString().trim()
      if (!message) return

      try {
        const log = JSON.parse(message) as {
          level: string
          msg?: string
          ts?: number
          [key: string]: unknown
        }

        if (!this.#options.options.verbose && log.level === 'info') return

        const prefix =
          log.level === 'error'
            ? '❌'
            : log.level === 'warn'
              ? '⚠️'
              : log.level === 'info'
                ? '📘'
                : '📝'

        const color =
          log.level === 'error'
            ? pc.red
            : log.level === 'warn'
              ? pc.yellow
              : pc.blue

        console.log(`${prefix} ${color(log.msg || message)}`)
      } catch {
        if (this.#options.options.verbose) console.log(`📝 ${pc.gray(message)}`)
      }
    })

    caddyProcess.on('close', code => {
      this.#isRunning = false
      if (code === 0) return
      console.error(pc.red(`Caddy process exited with code ${code}`))
    })

    console.info(pc.green(`🤠 Caddy has got your back. It's on cranking¬…`))

    this.#options.server.httpServer?.on('close', () => {
      console.info(pc.yellow('Caddy is shutting down…'))
      if (!this.#options.caddyProcess.pid) return
      try {
        // Use NodeProcess.kill directly to avoid shell injection
        NodeProcess.kill(this.#options.caddyProcess.pid, 'SIGTERM')
        // Give process time to terminate gracefully
        setTimeout(() => {
          try {
            if (this.#options.caddyProcess.pid) {
              NodeProcess.kill(this.#options.caddyProcess.pid, 'SIGKILL')
            }
          } catch {
            // Process already terminated
          }
        }, 1000)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Caddy process is not running or not found'
        console.error(
          pc.red(
            `Failed to kill Caddy process ${this.#options.caddyProcess.pid}: ${errorMessage}`,
          ),
        )
      }
    })

    return caddyProcess
  }

  async stop() {
    if (!this.#options.caddyProcess?.pid || !this.#isRunning) return
    try {
      // Send SIGTERM first for graceful shutdown
      NodeProcess.kill(this.#options.caddyProcess.pid, 'SIGTERM')

      // Wait briefly for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 500))

      // Force kill if still running
      try {
        NodeProcess.kill(this.#options.caddyProcess.pid, 'SIGKILL')
      } catch {
        // Process already terminated
      }
      this.#isRunning = false
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Caddy process is not running or not found'
      console.error(
        pc.red(
          `Failed to kill Caddy process ${this.#options.caddyProcess.pid}: ${errorMessage}`,
        ),
      )
      this.#isRunning = false
    }
  }

  restart = async () => {
    try {
      await this.stop()
      await this.start()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error(pc.red(`Failed to restart Caddy: ${errorMessage}`))
      throw error
    }
  }
}
