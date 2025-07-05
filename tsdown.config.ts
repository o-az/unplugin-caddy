import { defineConfig } from 'tsdown'
import pkg from '#package.json' with { type: 'json' }

export default defineConfig({
  dts: true,
  publint: true,
  format: ['esm'],
  nodeProtocol: true,
  entry: ['src/*.ts'],
  tsconfig: 'tsconfig.json',
  unused: {
    'ignore': {
      'peerDependencies': Object.keys(pkg.peerDependencies || {}),
    },
  },
})
