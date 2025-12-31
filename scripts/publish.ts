#!/usr/bin/env bun

import * as Bun from 'bun'
import NodeUtil from 'node:util'
import NodeProcess from 'node:process'
import pkgJson from '#package.json' with { type: 'json' }

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
    registry: {
      type: 'string',
      multiple: true,
      default: ['https://registry.npmjs.org'],
    },
  },
})

async function build() {
  const { stderr, stdout, exitCode } = await Bun.$ /* sh */`bun run build`.env({
    ...Bun.env,
    NODE_ENV: 'production',
  })

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Build completed')
}

async function pack() {
  const { stderr, stdout, exitCode } = await Bun.$ /* sh */`bun pm pack`.env({
    ...Bun.env,
    NODE_ENV: 'production',
  })

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Pack completed')
}

async function publish(registry: string) {
  console.info(`\n\nPublishing to registry: ${registry}\n\n`)

  const packedFile = `./${pkgJson.name}-${pkgJson.version}.tgz`

  const isPrerelease =
    pkgJson.version.includes('alpha') ||
    pkgJson.version.includes('beta') ||
    pkgJson.version.includes('rc')

  const { stderr, stdout, exitCode } = await Bun.$ /* sh */`
    npm publish ${packedFile} \
      --access="public" \
      --verbose \
      --no-git-checks \
      --registry="${registry}" \
      ${values['dry-run'] ? '--dry-run' : ''} \
      ${isPrerelease ? '--tag=next' : ''}`
    .env({
      ...Bun.env,
      NODE_ENV: 'production',
    })
    .nothrow()

  if (exitCode !== 0) {
    console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
    NodeProcess.exit(1)
  }

  console.info(stdout.toString())
  console.info('Published successfully')
}

async function preChecks() {
  const npmVersion = (
    await Bun.$ /* sh */`npm --version`
      .env({ ...Bun.env, NODE_ENV: 'production' })
      .text()
  ).trim()

  const order = Bun.semver.order(npmVersion, '11.5.1')
  if (order !== -1) return

  console.error('GH Publisher requires npm version 11.5.1 or higher')
  console.info('See https://docs.npmjs.com/trusted-publishers')
  NodeProcess.exit(1)
}

preChecks().then(() =>
  build()
    .then(() => pack())
    .then(async () => {
      for (const registry of values.registry) await publish(registry)
    })
    .catch(error => {
      console.error(error)
      if (error instanceof Error) {
        console.info(error.name)
        console.info(error.stack)
        console.info(error.cause)
        console.info(error.message)
      }

      NodeProcess.exit(1)
    }),
)
