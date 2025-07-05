import type { ResultPromise } from 'execa'
import NodeFS from 'node:fs'
import NodePath from 'node:path'
import NodeProcess from 'node:process'
import { execa } from 'execa'

let viteProcess: ResultPromise | null = null

async function startVite() {
  if (viteProcess) {
    console.log('Stopping Vite...')
    viteProcess.kill('SIGTERM')
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('Starting Vite...')

  viteProcess = execa('bun', ['x', 'vite'], {
    stdio: 'inherit',
    shell: true,
    cwd: NodePath.join(NodeProcess.cwd(), 'example'),
  })

  viteProcess.catch((error: unknown) => {
    if (error instanceof Error && error.name !== 'SIGTERM') {
      console.error('Vite process error:', error)
    }
  })
}

function debounce(func: () => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null
  return (...args: unknown[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args as unknown as Parameters<typeof func>), wait)
  }
}

const debouncedRestart = debounce(startVite, 300)

const watcher = NodeFS.watch(
  NodePath.join(NodeProcess.cwd(), 'src'),
  { recursive: true },
  (_, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`Change detected: ${filename}`)
      debouncedRestart()
    }
  },
)

startVite()

NodeProcess.on('SIGINT', () => {
  console.log('\nShutting down...')
  if (viteProcess)
    viteProcess.kill('SIGTERM')

  watcher.close()
  NodeProcess.exit()
})

NodeProcess.on('SIGTERM', () => {
  if (viteProcess)
    viteProcess.kill('SIGTERM')

  watcher.close()
  NodeProcess.exit()
})
