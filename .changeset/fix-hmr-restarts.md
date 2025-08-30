---
"unplugin-caddy": patch
---

Fix HMR causing full Caddy restarts

- Prevent Caddy from restarting during Hot Module Replacement (HMR)
- Implement singleton pattern to maintain Caddy instance across HMR updates
- Update play script to only rebuild plugin without restarting Vite
- Add state tracking to prevent duplicate Caddy processes
- Ensure HTTPS localhost remains accessible during development