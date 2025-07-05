import type { CaddyOptions } from './types.ts'
import type { FilterPattern } from 'unplugin'

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
  return {
    include: options.include ?? ['**/*.ts', /\.m?js$/, /\.m?ts$/, 'Caddyfile'],
    exclude: options.exclude ?? [],
    enforce: 'enforce' in options ? options.enforce : 'pre',
    options: {
      port: 69_69,
      https: true,
      verbose: false,
      host: 'localhost',
      caddyPath: 'caddy',
      caddyfile: 'Caddyfile',
      domains:
        options.options?.domains?.map(domain =>
          domain.replace(/^https?:\/\//, ''),
        ) ?? [],
      ...options.options,
    },
  }
}
