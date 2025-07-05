import esbuild from 'esbuild'
import Caddy from 'unplugin-caddy/esbuild'

async function watch() {
  const context = await esbuild.context({
    bundle: true,
    format: 'esm',
    minify: false,
    target: 'esnext',
    loader: { '.ts': 'ts' },
    outfile: 'dist/main.js',
    entryPoints: ['main.ts'],
    plugins: [
      {
        setup: _build => {},
      },
      Caddy({
        https: true,
        port: 69_68,
        verbose: true,
        host: 'localhost',
        domains: ['play.localhost'],
      }),
    ],
  })

  await context.watch()
  console.info('Watching...')
}

watch()
