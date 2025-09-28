#!/usr/bin/env bun

import * as Bun from 'bun'
import NodeUtil from 'node:util'
import NodeProcess from 'node:process'
import pkgJson from '#unplugin-caddy/package.json' with { type: 'json' }

const { values, positionals: _ } = NodeUtil.parseArgs({
  args: Bun.argv.slice(2),
  tokens: true,
  strict: true,
  allowNegative: true,
  allowPositionals: true,
  options: {
    'dry-run': {
      type: 'boolean',
      default: false,
      multiple: false,
    },
    'registry': {
      type: 'string',
      multiple: true,
      default: ['https://registry.npmjs.org'],
    },
    'npm-token': {
      type: 'string',
      multiple: false,
    },
  },
})

const NPM_TOKEN =
  values['npm-token'] ||
  Bun.env.NPM_TOKEN ||
  Bun.env.NODE_AUTH_TOKEN ||
  Bun.env.NPM_CONFIG_TOKEN

console.info(NPM_TOKEN)

if (!NPM_TOKEN) {
  console.warn('NPM_TOKEN is not set')
  NodeProcess.exit(1)
}

async function build() {
  const { stderr, stdout, exitCode } =
    await Bun.$ /* sh */`bun --filter unplugin-caddy build`.env({
      ...Bun.env,
      NODE_ENV: 'production',
      NODE_AUTH_TOKEN: NPM_TOKEN,
      NPM_CONFIG_TOKEN: NPM_TOKEN,
    })

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Build completed')
}

async function pack() {
  const { stderr, stdout, exitCode } = await Bun.$ /* sh */`bun pm pack`
    .env({
      ...Bun.env,
      NODE_ENV: 'production',
      NODE_AUTH_TOKEN: NPM_TOKEN,
      NPM_CONFIG_TOKEN: NPM_TOKEN,
    })
    .cwd('packages/unplugin-caddy')

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Pack completed')
}

async function publish(registry: string) {
  console.info(`\n\nPublishing to registry: ${registry}\n\n`)

  const packedFile = `./packages/unplugin-caddy/${pkgJson.name}-${pkgJson.version}.tgz`

  const { stderr, stdout, exitCode } = await Bun.$ /* sh */`
    bun publish ${packedFile} \
      --access="public" \
      --verbose \
      --no-git-checks \
      --auth-type="legacy" \
      --registry="${registry}" \
      ${Bun.env.CI ? '--provenance' : ''} \
      ${values['dry-run'] ? '--dry-run' : ''}`
    .env({
      ...Bun.env,
      NODE_ENV: 'production',
      NPM_TOKEN,
      NODE_AUTH_TOKEN: NPM_TOKEN,
      NPM_CONFIG_TOKEN: NPM_TOKEN,
    })
    .cwd('packages/unplugin-caddy')
    .nothrow()

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Published successfully')
}

build()
  .then(() => pack())
  .then(async () => {
    for (const registry of values.registry) publish(registry)
  })
  .catch(error => {
    console.error(error)
    NodeProcess.exit(1)
  })
