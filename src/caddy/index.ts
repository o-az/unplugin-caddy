import pc from 'picocolors'
import NodeProcess from 'node:process'
import type { ViteDevServer } from 'vite'
import NodeChildProcess from 'node:child_process'

import {
  isCaddyInstalled,
  writeTempFile,
  getInstallCommand,
  generateCaddyConfig,
} from './utilities.ts'
import type { CaddyOptions } from './types.ts'

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
  }

  getUrl = (): string => {
    const protocol = this.#options.options.https ? 'https' : 'http'
    return `${protocol}://${this.#options.options.host}:${this.#options.options.port}`
  }

  get domains() {
    const domains = Array.isArray(this.#options.options.domains)
      ? this.#options.options.domains
      : [this.#options.options.domains]

    return [this.#options.options.host, ...domains]
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
      this.domains,
      this.#options.options.port,
      port || this.#options.targetPort,
    )

    const caddyConfig = writeTempFile(JSON.stringify(config, undefined, 2))

    const caddyCommand = `${this.#options.caddyPath} run --config ${caddyConfig.fullPath}`
    const caddyProcess = NodeChildProcess.spawn(caddyCommand, {
      shell: true,
    })

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
        NodeChildProcess.execSync(`kill -9 ${this.#options.caddyProcess.pid}`)
        NodeProcess.kill(this.#options.caddyProcess.pid)
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
      NodeChildProcess.execSync(`kill -9 ${this.#options.caddyProcess.pid}`)
      NodeProcess.kill(this.#options.caddyProcess.pid, 'SIGKILL')
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

  restart = async () =>
    this.stop()
      .then(() => this.start())
      .catch(_error => {}) // TODO: handle errors
}
