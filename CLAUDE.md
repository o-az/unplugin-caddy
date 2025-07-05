# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ** __EXTREMELY IMPORTANT__ **
- When you are asked to make changes to the code, you should first read the code and understand the context.
- You should then make the changes in a way that is consistent with the code and the context.
- You should then test the changes to ensure they work as expected.
- You should then update the documentation to reflect the changes.
- You should not create new files or directories unless explicitly asked to do so.

## Checking if Files/Directories Exist
Before creating any new file or directory, you MUST check if it already exists:
- For directories: Use `ls -la <parent-directory>` to see all files including hidden ones (those starting with.)
- Alternative: Use `du -sh <directory>` to check if a directory exists and its size
- The LS tool may not show hidden directories, so always use bash commands with proper flags
- If `ls` doesn't show a directory, it doesn't mean it doesn't exist. Use `du` to check if it exists.
- Never assume a directory doesn't exist just because the LS tool doesn't show it

## Project Overview

This is an unplugin plugin for integrating Caddy web server into build tools like Vite, webpack, and Rollup. The project uses the unplugin framework to create a single plugin that works across multiple bundlers.

## Key Commands

```bash
# Development
bun run dev         # Watch mode for continuous TypeScript compilation
bun run play        # Run the playground with Vite for testing changes

# Building and Testing
bun run build       # Build the project with tsdown
bun run test        # Run tests with Vitest
bun run lint        # Run ESLint

# Release
bun run release     # Bump version and publish to npm
```

## Architecture

### Unplugin Structure
- **Core Factory**: `src/index.ts` contains the `unpluginFactory` that defines plugin behavior
- **Bundler Exports**: Each bundler has its own export file (e.g., `src/vite.ts`, `src/webpack.ts`) that wraps the factory
- **Type Definitions**: `src/types.ts` contains shared TypeScript interfaces

### How Unplugin Works
1. The factory function in `index.ts` returns an object with plugin hooks (name, transform, etc.)
2. Each bundler file imports the factory and uses `createUnplugin` to generate bundler-specific plugins
3. Users import from bundler-specific paths like `unplugin-caddy/vite`

### Current Implementation Status
The Caddy integration has been implemented with the following features:
- Automatic HTTPS with locally-trusted certificates
- Reverse proxy to bundler's dev server with WebSocket support for HMR
- Support for multiple domains
- Platform-specific Caddy installation detection and guidance
- Vite and webpack integration (other bundlers pending)

## Development Workflow

1. Make changes to the core plugin logic in `src/index.ts`
2. For TypeScript types, prefer:
  - `Array<string>` over `string[]`
3. For console logs, prefer `console.info` over `console.log` and leverage `console.warn` for warnings where necessary
4. Run `bun run dev` to watch and compile changes
5. In another terminal, run `bun run play` to test in the playground
6. The playground uses nodemon to restart Vite when source files change
7. View transformations using vite-plugin-inspect at `http://localhost:5173/__inspect/`

## Testing Strategy

- The playground (`playground/`) directory is a Vite app for manual testing
- Unit tests go in `test/` directory using Vitest
- Test individual bundler integrations by creating examples in the playground

## Important Context for Caddy Integration

The goal is to create a plugin that:
1. Spawns a Caddy server process during development
2. Configures Caddy to proxy requests to the bundler's dev server
3. Provides HTTPS and other Caddy features transparently
4. Manages Caddy lifecycle (start/stop) with the bundler

Key integration points to consider:
- Vite: Hook into `configureServer` for dev server integration
- Webpack: Use compiler hooks for dev server setup
- Generate Caddyfile configurations dynamically
- Handle port management between Caddy and bundler dev servers
