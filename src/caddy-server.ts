import type { ExecaChildProcess } from 'execa'
import type { CaddyServer, Options } from './types'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import NodeProcess from 'node:process'
import { execa } from 'execa'
import getPort from 'get-port'
import pc from 'picocolors'
import { getInstallCommand } from './utilities'

async function checkCaddyInstalled(caddyPath: string): Promise<boolean> {
  try {
    const result = await execa(caddyPath, ['version'])
    return result.exitCode === 0
  }
  catch {
    return false
  }
}

export class CaddyServerManager implements CaddyServer {
  private process: ExecaChildProcess | null = null
  private caddyfilePath: string
  private port: number = 0
  private targetPort: number = 0
  private options: Required<Options>

  constructor(options: Options, targetPort: number) {
    this.targetPort = targetPort
    this.options = {
      https: true,
      host: 'localhost',
      port: 0,
      caddyfile: '',
      caddyPath: 'caddy',
      domains: [],
      verbose: false,
      env: {},
      ...options,
    }
    this.caddyfilePath = join(tmpdir(), `caddyfile-${Date.now()}`)
  }

  async start(): Promise<void> {
    if (this.process) {
      console.warn(pc.yellow('Caddy server is already running'))
      return
    }

    // Check if Caddy is installed
    const caddyInstalled = await checkCaddyInstalled(this.options.caddyPath)
    if (!caddyInstalled) {
      console.error(pc.red('❌ Caddy is not installed or not found in PATH'))
      console.error(pc.yellow('\nTo install Caddy:'))
      console.error(pc.gray(`  • ${getInstallCommand()}`))
      console.error(pc.gray('  • Or download from: https://caddyserver.com/download\n'))
      throw new Error('Caddy is not installed')
    }

    // Get available port if not specified
    this.port = this.options.port || await getPort({ port: 4443 })

    // Generate Caddyfile
    await this.generateCaddyfile()

    // Start Caddy process
    try {
      this.process = execa(this.options.caddyPath, ['run', '--config', this.caddyfilePath], {
        env: {
          ...NodeProcess.env,
          ...this.options.env,
        },
        stdio: this.options.verbose ? 'inherit' : 'pipe',
      })

      // Wait a bit for Caddy to start
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log(pc.green(`✓ Caddy server started at ${this.getUrl()}`))
      if (this.options.domains.length > 0) {
        console.log(pc.green(`  Additional domains: ${this.options.domains.join(', ')}`))
      }
    }
    catch (error) {
      console.error(pc.red('Failed to start Caddy server:'), error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return
    }

    try {
      this.process.kill('SIGTERM')
      await this.process
    }
    catch (error) {
      console.error(pc.red('Failed to stop Caddy server:'), error)

      // Ignore errors from killing the process
    }

    this.process = null

    // Clean up Caddyfile
    try {
      await unlink(this.caddyfilePath)
    }
    catch {
      // Ignore cleanup errors
    }

    console.log(pc.yellow('✓ Caddy server stopped'))
  }

  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }

  getUrl(): string {
    const protocol = this.options.https ? 'https' : 'http'
    return `${protocol}://${this.options.host}:${this.port}`
  }

  getProxyUrl(): string {
    return `http://localhost:${this.targetPort}`
  }

  private async generateCaddyfile(): Promise<void> {
    if (this.options.caddyfile && !this.options.caddyfile.includes('\n')) {
      // If caddyfile is a path, use it directly
      this.caddyfilePath = this.options.caddyfile
      return
    }

    const hosts = [this.options.host, ...this.options.domains].join(', ')
    const protocol = this.options.https ? 'https://' : 'http://'

    const caddyfileContent = this.options.caddyfile || `
{
  auto_https ${this.options.https ? 'on' : 'off'}
  ${this.options.https ? 'local_certs' : ''}
}

${protocol}${hosts}:${this.port} {
  reverse_proxy localhost:${this.targetPort}
  
  # Enable compression
  encode zstd gzip
  
  # CORS headers for development
  header {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods *
    Access-Control-Allow-Headers *
  }
  
  # WebSocket support for HMR
  @websockets {
    header Connection *Upgrade*
    header Upgrade websocket
  }
  reverse_proxy @websockets localhost:${this.targetPort}
}
`.trim()

    await writeFile(this.caddyfilePath, caddyfileContent, 'utf-8')
  }
}
