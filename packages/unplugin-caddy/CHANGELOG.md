# unplugin-caddy

## 0.0.1

### Patch Changes

- [#2](https://github.com/o-az/unplugin-caddy/pull/2) [`fd88427`](https://github.com/o-az/unplugin-caddy/commit/fd884279140a39d0278797c7d73ba87ee97b9de1) Thanks [@o-az](https://github.com/o-az)! - Fix HMR causing full Caddy restarts

  - Prevent Caddy from restarting during Hot Module Replacement (HMR)
  - Add state tracking to prevent duplicate Caddy processes
  - Ensure HTTPS localhost remains accessible during development
