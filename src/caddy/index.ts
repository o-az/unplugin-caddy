import pc from 'picocolors'
import NodeProcess from 'node:process'
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
import type { CaddyOptions, DevServer, Framework } from '#caddy/types.ts'

type FrameworkBindings = {
  [F in Framework]: {
    framework: F
    server: DevServer<F>
  }
}

type CaddyServerManagerOptions<T extends Framework> = FrameworkBindings[T] & {
  options: CaddyOptions
  targetPort?: number
}

type NormalizedCaddyOptions = CaddyOptions & {
  host: string
  port: number
  https: boolean
  verbose: boolean
  caddyPath: string
  caddyfile: string
}

function normalizeCaddyOptions(options: CaddyOptions): NormalizedCaddyOptions {
  const port = options.port ?? 69_69
  if (!isValidPort(port)) {
    throw new Error(
      `Invalid port number: ${port}. Port must be between 1 and 65535.`,
    )
  }

  const host = options.host ?? 'localhost'
  if (!isValidDomain(host)) {
    throw new Error(`Invalid host domain: ${host}`)
  }

  const caddyPath = sanitizeCaddyPath(options.caddyPath ?? 'caddy')

  return {
    ...options,
    host,
    port,
    https: options.https ?? true,
    verbose: options.verbose ?? false,
    caddyPath,
    caddyfile: options.caddyfile ?? 'Caddyfile',
  }
}

export class CaddyServerManager<T extends Framework> {
  #framework: T
  #options: NormalizedCaddyOptions
  #targetPort: number | null
  #process: NodeChildProcess.ChildProcess | null = null
  #isRunning = false
  #viteServer: DevServer<'vite'> | null = null

  constructor(options: CaddyServerManagerOptions<T>) {
    this.#framework = options.framework
    this.#targetPort = options.targetPort ?? null
    this.#options = normalizeCaddyOptions(options.options)

    if (options.framework === 'vite') {
      this.#viteServer = options.server as DevServer<'vite'>
    }
  }

  get framework(): T {
    return this.#framework
  }

  setTargetPort(port: number): void {
    if (!isValidPort(port))
      throw new Error(
        `Invalid target port: ${port}. Port must be between 1 and 65535.`,
      )

    this.#targetPort = port
  }

  getUrl = (): string => {
    const protocol = this.#options.https ? 'https' : 'http'
    return `${protocol}://${this.#options.host}:${this.#options.port}`
  }

  get domains() {
    const domains = Array.isArray(this.#options.domains)
      ? this.#options.domains
      : [this.#options.domains]

    const validatedDomains = domains.filter(domain => {
      if (!domain) return false
      if (!isValidDomain(domain)) {
        console.warn(pc.yellow(`Invalid domain ignored: ${domain}`))
        return false
      }
      return true
    })

    return [this.#options.host, ...validatedDomains]
  }

  async start(targetPortOverride?: number) {
    if (this.#isRunning && this.#process?.pid) {
      console.info(pc.cyan('🤠 Caddy is already running'))
      return this.#process
    }

    if (!isCaddyInstalled()) {
      console.warn(pc.yellow('Caddy is not installed'))
      console.warn(pc.yellow(getInstallCommand()))
      return
    }

    if (typeof targetPortOverride === 'number')
      this.setTargetPort(targetPortOverride)

    if (this.#targetPort == null)
      throw new Error(
        'Target port is not set. Please provide a valid dev server port.',
      )

    const config = generateCaddyConfig(
      this.domains.filter(Boolean),
      this.#options.port,
      this.#targetPort,
    )

    const caddyConfig = await writeTempFile(
      JSON.stringify(config, undefined, 2),
    )

    const caddyProcess = NodeChildProcess.spawn(
      this.#options.caddyPath,
      ['run', '--config', caddyConfig.fullPath],
      {
        shell: false,
      },
    )

    this.#process = caddyProcess
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

        if (!this.#options.verbose && log.level === 'info') return

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
        if (this.#options.verbose) console.log(`📝 ${pc.gray(message)}`)
      }
    })

    caddyProcess.on('close', code => {
      this.#isRunning = false
      this.#process = null
      if (code === 0) return
      console.error(pc.red(`Caddy process exited with code ${code}`))
    })

    console.info(pc.green(`🤠 Caddy has got your back. It's on cranking¬…`))

    if (this.#isViteContext()) {
      this.#viteServer?.httpServer?.on('close', () => {
        console.info(pc.yellow('Caddy is shutting down…'))
        const pid = this.#process?.pid
        if (!pid) return
        try {
          NodeProcess.kill(pid, 'SIGTERM')
          setTimeout(() => {
            try {
              if (this.#process?.pid) {
                NodeProcess.kill(this.#process.pid, 'SIGKILL')
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
            pc.red(`Failed to kill Caddy process ${pid}: ${errorMessage}`),
          )
        }
      })
    }

    return caddyProcess
  }

  async stop() {
    const pid = this.#process?.pid
    if (!pid || !this.#isRunning) return

    try {
      NodeProcess.kill(pid, 'SIGTERM')

      await new Promise(resolve => setTimeout(resolve, 500))

      try {
        NodeProcess.kill(pid, 'SIGKILL')
      } catch {
        // Process already terminated
      }

      this.#isRunning = false
      this.#process = null
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Caddy process is not running or not found'
      console.error(
        pc.red(`Failed to kill Caddy process ${pid}: ${errorMessage}`),
      )
      this.#isRunning = false
      this.#process = null
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

  #isViteContext(): this is CaddyServerManager<'vite'> {
    return this.#framework === 'vite'
  }
}
