import type { FilterPattern } from 'unplugin'

import type { CaddyOptions } from '#caddy/types.ts'
import { isValidDomain, isValidPort, sanitizeCaddyPath } from '#caddy/utilities.ts'

export type Options = {
  include?: FilterPattern
  exclude?: FilterPattern
  enforce?: 'pre' | 'post' | undefined
  options?: CaddyOptions | undefined
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OptionsResolved = Overwrite<
  Required<Options>,
  Pick<Options, 'enforce'>
>

/**
 * Resolve the options for the Caddy server and default values.
 * @param options - The options to resolve.
 * @returns The resolved options.
 */
export function resolveOptions(options: Options): OptionsResolved {
  // Validate port if provided
  const port = options.options?.port ?? 69_69
  if (!isValidPort(port)) {
    throw new Error(`Invalid port number: ${port}. Port must be between 1 and 65535.`)
  }
  
  // Validate host if provided
  const host = options.options?.host ?? 'localhost'
  if (!isValidDomain(host)) {
    throw new Error(`Invalid host domain: ${host}`)
  }
  
  // Sanitize caddy path
  const caddyPath = sanitizeCaddyPath(options.options?.caddyPath ?? 'caddy')
  
  // Validate and clean domains
  const domains = options.options?.domains?.map(domain => {
    const cleanDomain = domain.replace(/^https?:\/\//, '')
    if (!isValidDomain(cleanDomain)) {
      console.warn(`Warning: Invalid domain '${domain}' will be ignored`)
      return null
    }
    return cleanDomain
  }).filter(Boolean) ?? []
  
  return {
    include: options.include ?? ['**/*.ts', /\.m?js$/, /\.m?ts$/, 'Caddyfile'],
    exclude: options.exclude ?? [],
    enforce: 'enforce' in options ? options.enforce : 'pre',
    options: {
      ...options.options,
      port,
      https: options.options?.https ?? true,
      verbose: options.options?.verbose ?? false,
      host,
      caddyPath,
      caddyfile: options.options?.caddyfile ?? 'Caddyfile',
      domains,
    },
  }
}
