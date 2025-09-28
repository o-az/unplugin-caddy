interface EnvironmentVariables {
  readonly NODE_ENV: 'development' | 'production'

  readonly CI: string

  readonly NPM_TOKEN: string
  readonly PROVENANCE: string
  readonly NODE_AUTH_TOKEN: string
  readonly NPM_CONFIG_TOKEN: string
}

declare namespace NodeJS {
  interface ProcessEnv extends EnvironmentVariables {}
}
