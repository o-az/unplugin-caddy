---
"unplugin-caddy": patch
---

Fix HMR causing full Caddy restarts

- Prevent Caddy from restarting during Hot Module Replacement (HMR)
- Add state tracking to prevent duplicate Caddy processes
- Ensure HTTPS localhost remains accessible during development
