export interface CaddyServer {
  start: () => Promise<void>
  stop: () => Promise<void>
  restart: () => Promise<void>
  getUrl: () => string
  getProxyUrl: () => string
}

export interface CaddyOptions {
  /**
   * Get the URL of the Caddy server
   */
  getUrl?: () => string
  /**
   * Enable HTTPS with automatic certificate generation
   *
   * @default true
   */
  https?: boolean | undefined

  /**
   * The host to bind Caddy to
   *
   * @default 'localhost'
   */
  host?: string | undefined

  /**
   * The port for Caddy to listen on
   * If not specified, will find an available port
   */
  port?: number

  /**
   * Custom Caddyfile content or path to a Caddyfile
   * If not provided, will generate one automatically
   *
   * @default 'Caddyfile'
   */
  caddyfile?: string | undefined

  /**
   * Path to the Caddy executable
   * If not provided, expects 'caddy' to be in PATH
   *
   * @default 'caddy'
   */
  caddyPath?: string | undefined

  /**
   * Additional domains for HTTPS certificates
   * @default []
   */
  domains: Array<string>

  /**
   * Enable verbose logging
   *
   * @default false
   */
  verbose?: boolean | undefined

  /**
   * Custom environment variables for Caddy process
   */
  env?: Record<string, string>
}
