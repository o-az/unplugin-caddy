import { platform } from 'node:os'
import pc from 'picocolors'

export async function sleep(ms: number): Promise<void> {
  if (typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined') {
    const nil = new Int32Array(new SharedArrayBuffer(4))
    Atomics.wait(nil, 0, 0, Number(ms))
  }
  else {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

export type MaybePromise<T> = T | Promise<T>

/**
 * works for both sync and async functions
 */
export async function noThrow<T>(
  fn: () => MaybePromise<T>,
  onError?: (error: unknown) => void,
): Promise<Awaited<T>> {
  try {
    return await fn()
  }
  catch (error) {
    onError?.(error)
    return undefined as unknown as Awaited<T>
  }
}

export function getInstallCommand(): string {
  const os = platform()
  return (() => {
    if (os === 'darwin')
      return 'brew install caddy'
    if (os === 'win32')
      return 'scoop install caddy'
    return 'sudo apt install caddy'
  })()
}

export function formatCaddyError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('permission denied'))
    return 'Permission denied. Try running with sudo or choose a different port.'

  if (errorMessage.includes('address already in use'))
    return 'Port is already in use. Try a different port or stop the conflicting service.'

  if (errorMessage.includes('cannot find binary'))
    return 'Caddy binary not found. Make sure Caddy is installed and in your PATH.'

  return errorMessage
}

export function printBanner(caddyUrl: string, viteUrl: string): void {
  console.info(`\n${pc.cyan('  Unplugin Caddy is running!\n')}`)
  console.info(pc.dim('  Vite dev server:  ') + pc.dim(viteUrl))
  console.info(pc.green('  Caddy proxy:      ') + pc.green(caddyUrl) + pc.green(' (HTTPS)'))
  console.info()
}
