<p align="center" style="margin-bottom: 2rem; background-color: #f7f7f7; padding: 10px 0;">
  <code title="unplugin-caddy" style="color: #000; font-size: 2.5rem; font-weight: 900; font-family: monospace;">
    unplugin-caddy
  </code>
  </br>
  <span><code>https</code> for local development</span>
</p>

[![NPM version](https://img.shields.io/npm/v/unplugin-caddy?color=a1b858&label=)](https://npm.im/unplugin-caddy)
[![pkg.pr.new](https://pkg.pr.new/badge/o-az/unplugin-caddy)](https://pkg.pr.new/~/o-az/unplugin-caddy)

```sh
npm add unplugin-caddy
```

```ts
import Caddy from 'unplugin-caddy/<bundler>'

export default defineConfig({
  /* .. */
  plugins: [
    Caddy({
      options: {
        port: 80_08,
        domains: ['app.localhost'],
      },
    }),
  ],
})
```



[Caddy](https://caddyserver.com) plugin for:

- [Vite](https://vite.dev),
- [Astro](https://astro.build),
- [Rspack](https://rspack.rs),
- [Webpack](https://webpack.js.org)
- [esbuild](https://esbuild.github.io) soon
- [Rollup](https://rollupjs.org) soon
- [Rolldown](https://rolldown.rs) soon
- [Farm](https://farmfe.org) soon

Easiest way to get `https` support for your local development.

Motivation:

Working more and more with Web APIs that only work in [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) which requires `https`.
[tailscale `funnel`](https://tailscale.com/kb/1311/tailscale-funnel) is great but limited to 1 service at a time,
so it's not suitable for monorepos with multiple services.

`ngrok` used to be a good option but now requires a subscription for anything beyond the trivial use case.
Even its first paid tier is heavily throttled.

Another options is creating certificates using `mkcert` with a tool like [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert).
Having tried that for over a year, I found that it's too much of an ask to expect contributors to install certificates with root credentials.

<strong>Caddy</strong> seems like the perfect solution.

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
