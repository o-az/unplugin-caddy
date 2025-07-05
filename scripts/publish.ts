import * as Bun from 'bun'
import NodeUtil from 'node:util'
import NodeProcess from 'node:process'

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

if (!NPM_TOKEN) {
  console.warn('NPM_TOKEN is not set')
  NodeProcess.exit(1)
}

const { stderr, stdout, exitCode } =
  await Bun.$`bun publish --access="public" --verbose --no-git-checks --registry="${values.registry}" ${values['dry-run'] ? '--dry-run' : ''}`
    .env({
      ...Bun.env,
      NODE_ENV: 'production',
      NPM_CONFIG_TOKEN: NPM_TOKEN,
    })
    .nothrow()

if (exitCode !== 0) {
  console.error(`Non-zero exit code: ${exitCode}`, stderr.toString())
  NodeProcess.exit(1)
}

console.info(stdout.toString())
console.info('Published successfully')

NodeProcess.exit(0)
