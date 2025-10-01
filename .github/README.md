# unplugin-caddy

[![NPM version](https://img.shields.io/npm/v/unplugin-caddy?color=a1b858&label=)](https://npm.im/unplugin-caddy)
[![pkg.pr.new](https://pkg.pr.new/badge/o-az/unplugin-caddy)](https://pkg.pr.new/~/o-az/unplugin-caddy)

[Caddy](https://caddyserver.com) plugin for:

- [Vite](https://vite.dev),
- [Astro](https://astro.build),
- [Rspack](https://rspack.rs),
- [Webpack](https://webpack.js.org)
- [esbuild](https://esbuild.github.io) <sup>soon</sup>
- [Rollup](https://rollupjs.org) <sup>soon</sup>
- [Rolldown](https://rolldown.rs) <sup>soon</sup>
- [Farm](https://farmfe.org) <sup>soon</sup>

Easiest way to get `https` support for your local development.

> [!NOTE]
> This is under active development.
> If you have any suggestions, I'm all ears, please open an issue.

## Prerequisites

- [Caddy](https://caddyserver.com/docs/install)

Install on macOS:

```bash
brew install caddy
```

↳ [Install on other platforms](https://caddyserver.com/docs/install).

## Install

unplugin-caddy

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
      options: {
        host: 'localhost',
        domains: ['vite-example.localhost'],
      }
    }),
  ],
})
```

Example in [./example/vite.config.ts](./example/vite.config.ts): `bun --filter example dev:vite`

<br></details>

<details>
<summary>Astro</summary><br>

```ts
// astro.config.ts
import Caddy from 'unplugin-caddy/astro'

export default defineConfig({
  integrations: [
    Caddy({
      options: {
        host: 'localhost',
        domains: ['astro-example.localhost'],
      }
    }),
  ],
})
```

<br></details>

<details>
<summary>Rspack</summary><br>

```ts
// rspack.config.mjs
import Caddy from 'unplugin-caddy/rspack'

export default {
  /* ... */
  plugins: [
    Caddy({
      options: {
        host: 'localhost',
        domains: ['rspack-example.localhost'],
      }
    })
  ]
}
```

Example in [./example/rspack.config.ts](./example/rspack.config.ts): `bun --filter example dev:rspack`

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-caddy/webpack')({
      options: {
        host: 'localhost',
        domains: ['webpack-example.localhost'],
      }
    })
  ]
}
```

Example in [./example/webpack.config.ts](./example/webpack.config.ts): `bun --filter example dev:webpack`

<br></details>

<details>
<summary>Rolldown</summary><br>

```ts
// rolldown.config.ts
import Caddy from 'unplugin-caddy/rolldown'

export default defineConfig({
  plugins: [
    Caddy({
      options: {
        host: 'localhost',
        domains: ['rolldown-example.localhost'],
      }
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
      options: {
        host: 'localhost',
        domains: ['rollup-example.localhost'],
      }
    }),
  ],
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
    options: {
      host: 'localhost',
      domains: ['esbuild-example.localhost'],
    }
  })]
})
```

<br></details>

<details>
<summary>Farm</summary><br>

```ts
// farm.config.ts
import { defineConfig } from '@farmfe/core'
import Caddy from 'unplugin-caddy/farm'

export default defineConfig({
  plugins: [
    Caddy({
      options: {
        host: 'localhost',
        domains: ['farm-example.localhost'],
      }
    })
  ]
})
```

<br></details>

### Motivation

From personal experience:

tailscale `funnel` is great but limited to 1 service at a time,
so it's not suitable for monorepos with multiple services.

`ngrok` used to be a good option but now requires a subscription for anything beyond the trivial use case.

Another options creating certificates using `mkcert` with a tool like `vite-plugin-mkcert`.
Having tried that for a few months, I found that it's too much of an ask to expect contributors to install certificates.

Caddy seems like the perfect solution.
