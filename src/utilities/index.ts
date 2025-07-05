import { platform } from 'node:os'
import pc from 'picocolors'

export function getGitCommitHash() {
  const {stdout} = Bun.spawnSync({
    cmd: ["git", "rev-parse", "HEAD"],
    stdout: "pipe",
  });

  return stdout.toString();
}

export type MaybePromise<T> = T | Promise<T>

/**
 * works for both sync and async functions
 */
export async function noThrow<T>(
  fn: () => MaybePromise<T>,
  onError?: (error: unknown) => void,
): MaybePromise<T> {
  try {
    return await fn()
  }
  catch (error) {
    onError?.(error)
    return undefined as unknown as MaybePromise<T>
  }
}

export function getInstallCommand(): string {
  const os = platform()
  switch (os) {
    case 'darwin':
      return 'brew install caddy'
    case 'win32':
      return 'scoop install caddy'
    default:
      return 'sudo apt install caddy'
  }
}

export function formatCaddyError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  if (errorMessage.includes('permission denied')) {
    return 'Permission denied. Try running with sudo or choose a different port.'
  }
  
  if (errorMessage.includes('address already in use')) {
    return 'Port is already in use. Try a different port or stop the conflicting service.'
  }
  
  if (errorMessage.includes('cannot find binary')) {
    return 'Caddy binary not found. Make sure Caddy is installed and in your PATH.'
  }
  
  return errorMessage
}

export function printBanner(caddyUrl: string, viteUrl: string): void {
  console.info('\n' + pc.cyan('  Unplugin Caddy is running!\n'))
  console.info(pc.dim('  Vite dev server:  ') + pc.dim(viteUrl))
  console.info(pc.green('  Caddy proxy:      ') + pc.green(caddyUrl) + pc.green(' (HTTPS)'))
  console.info()
}
