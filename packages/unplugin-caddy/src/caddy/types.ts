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
   * @default true
   */
  https: boolean

  /**
   * The host to bind Caddy to
   * @default 'localhost'
   */
  host: string

  /**
   * The port for Caddy to listen on
   * If not specified, will find an available port
   */
  port?: number

  /**
   * Custom Caddyfile content or path to a Caddyfile
   * If not provided, will generate one automatically
   */
  caddyfile: string

  /**
   * Path to the Caddy executable
   * If not provided, expects 'caddy' to be in PATH
   */
  caddyPath: string

  /**
   * Additional domains for HTTPS certificates
   * @default []
   */
  domains: Array<string>

  /**
   * Enable verbose logging
   * @default false
   */
  verbose: boolean

  /**
   * Custom environment variables for Caddy process
   */
  env?: Record<string, string>
}
