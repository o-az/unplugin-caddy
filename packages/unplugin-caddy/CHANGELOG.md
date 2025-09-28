# unplugin-caddy

## 0.0.5

### Patch Changes

- [#9](https://github.com/o-az/unplugin-caddy/pull/9) [`1c4bfcd`](https://github.com/o-az/unplugin-caddy/commit/1c4bfcd005be8a572917e39da12d2233f0ce94b8) Thanks [@o-az](https://github.com/o-az)! - Added support for webpack.js.org

## 0.0.4

### Patch Changes

- [#7](https://github.com/o-az/unplugin-caddy/pull/7) [`8eb3c55`](https://github.com/o-az/unplugin-caddy/commit/8eb3c55a277f7c7421f761e28aa114593402cb9c) Thanks [@o-az](https://github.com/o-az)! - Added support for <https://rspack.rs> ([PR#7](https://github.com/o-az/unplugin-caddy/pull/7#issue-3461889516))

## 0.0.3

### Patch Changes

- Fixed crashes when editing code. Fixed `https` not defaulting to true.

## 0.0.1

### Patch Changes

- [#2](https://github.com/o-az/unplugin-caddy/pull/2) [`fd88427`](https://github.com/o-az/unplugin-caddy/commit/fd884279140a39d0278797c7d73ba87ee97b9de1) Thanks [@o-az](https://github.com/o-az)! - Fix HMR causing full Caddy restarts

  - Prevent Caddy from restarting during Hot Module Replacement (HMR)
  - Add state tracking to prevent duplicate Caddy processes
  - Ensure HTTPS localhost remains accessible during development
