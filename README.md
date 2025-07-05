# unplugin-caddy

[![NPM version](https://img.shields.io/npm/v/unplugin-caddy?color=a1b858&label=)](https://npm.im/unplugin-caddy)

[Caddy](https://caddyserver.com) plugin for [Vite](https://vite.dev),
[Rspack](https://rspack.rs), [esbuild](https://esbuild.github.io),
[Rollup](https://rollupjs.org), [Rolldown](https://rolldown.rs),
[Webpack](https://webpack.js.org), and [Farm](https://farmfe.org).

Easiest way to get `https` support for your local development.

> [!NOTE]
> This is under active development. Nothing is guaranteed to work.

## Install

```bash
npm add unplugin-caddy
```

## Usage

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Caddy from 'unplugin-caddy/vite'

export default defineConfig({
  plugins: [
    Caddy({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
    }),
  ],
})
```

Example: [`./example/vite.config.ts`](./example/vite.config.ts)

<br></details>

<details>
<summary>Rolldown</summary><br>

```ts
// rolldown.config.ts
import Caddy from 'unplugin-caddy/rolldown'

export default defineConfig({
  plugins: [
    Caddy({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
    }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Caddy from 'unplugin-caddy/rollup'

export default {
  plugins: [
    Caddy({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
    }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-caddy/webpack')({
      https: true,
      host: 'localhost',
      domains: ['play.localhost'],
    })
  ]
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import Caddy from 'unplugin-caddy/esbuild'

build({
  plugins: [Caddy({
    https: true,
    host: 'localhost',
    domains: ['play.localhost'],
  })]
})
```
