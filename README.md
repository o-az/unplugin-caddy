# unplugin-caddy

[![NPM version](https://img.shields.io/npm/v/unplugin-caddy?color=a1b858&label=)](https://npm.im/unplugin-caddy)

[Caddy](https://caddyserver.com) plugin for [Vite](https://vite.dev),
[Rspack](https://rspack.rs), [esbuild](https://esbuild.github.io),
[Rollup](https://rollupjs.org), [Rolldown](https://rolldown.rs),
[Webpack](https://webpack.js.org), and [Farm](https://farmfe.org).

Easiest way to get `https` support for your local development.

> [!NOTE]
> This is under active development. API is expected to change.
> If you have any suggestions, I'm all ears, please open an issue.

## Install

### Caddy

[Install on other platforms](https://caddyserver.com/docs/install)

```bash
brew install caddy
```

### unplugin-caddy

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

## Motivation

I use tailscale `funnel` whenever I need to expose a local service to the internet.
However, it's only limited to 1 service at a time, so it's not suitable for monorepos with multiple services.

Alternatively, I could use `ngrok`, but the free tier is too limited and I don't need another subscription.

Another options creating certificates using `mkcert` with a tool like `vite-plugin-mkcert`.
Having tried that for a few months, I found that it's too much of an ask to expect contributors
to enter root passwords to install certificates.

Caddy seems like the perfect solution.
