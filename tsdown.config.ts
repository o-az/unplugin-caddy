import { defineConfig } from 'tsdown'
import pkg from '#package.json' with { type: 'json' }

export default defineConfig({
  dts: true,
  clean: true,
  publint: true,
  outDir: 'dist',
  format: ['esm'],
  target: 'esnext',
  entry: ['./src/*.ts'],
  exports: {
    all: true,
    packageJson: true,
  },
  tsconfig: './tsconfig.json',
  attw: {
    enabled: true,
    profile: 'esm-only',
    ignoreRules: ['false-cjs', 'cjs-resolves-to-esm'],
  },
  unused: {
    ignore: {
      peerDependencies: Object.keys(pkg.peerDependencies ?? {}),
    },
  },
})
