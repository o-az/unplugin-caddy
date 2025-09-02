import NodeFS from 'node:fs'
import NodePath from 'node:path'
import NodeProcess from 'node:process'
import { execa, type ResultPromise } from 'execa'

let viteProcess: ResultPromise | null = null
let buildProcess: ResultPromise | null = null
let vitePort: number | null = null
let isBuilding = false

async function cleanupProcess() {
  if (!viteProcess) return

  console.log('Stopping Vite and all child processes...')

  try {
    if (viteProcess.pid) {
      NodeProcess.kill(-viteProcess.pid, 'SIGTERM')
    }

    viteProcess.kill('SIGTERM')

    await new Promise(resolve => setTimeout(resolve, 500))

    viteProcess.kill('SIGKILL')
  } catch (error) {
    console.log('Process cleanup error (this is usually fine):', error)
  }

  viteProcess = null
  vitePort = null
}

async function buildPlugin() {
  if (isBuilding) {
    console.log('Build already in progress, skipping...')
    return
  }

  isBuilding = true
  console.log('🔨 Building plugin...')

  try {
    buildProcess = execa('bun', ['run', 'build'], {
      stdio: 'pipe',
      shell: false,
    })

    buildProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      if (output.trim()) {
        console.log(`[build] ${output.trim()}`)
      }
    })

    buildProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      if (output.trim()) {
        console.error(`[build error] ${output.trim()}`)
      }
    })

    await buildProcess
    console.log('✅ Plugin build complete')
  } catch (error) {
    console.error('❌ Plugin build failed:', error)
  } finally {
    isBuilding = false
    buildProcess = null
  }
}

async function startVite() {
  // Build the plugin first
  await buildPlugin()

  console.log('Starting Vite...')

  viteProcess = execa('bun', ['x', 'vite'], {
    stdio: 'pipe',
    shell: false,
    detached: true,
    cwd: NodePath.join(NodeProcess.cwd(), 'example'),
  })

  viteProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString()
    NodeProcess.stdout.write(output)

    const portMatch = output.match(/Local:.*:(\d+)/)
    if (portMatch?.[1]) {
      vitePort = parseInt(portMatch[1], 10)
      console.log(`\n📌 Vite running on port ${vitePort}`)
    }
  })

  viteProcess.stderr?.on('data', (data: Buffer) => {
    NodeProcess.stderr.write(data)
  })

  viteProcess.catch((error: unknown) => {
    if (
      error instanceof Error &&
      !['SIGTERM', 'SIGKILL'].includes(error.message)
    ) {
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
    timeout = setTimeout(
      () => func(...(args as unknown as Parameters<typeof func>)),
      wait,
    )
  }
}

// Only rebuild the plugin, don't restart Vite
const debouncedBuild = debounce(buildPlugin, 300)

const watcher = NodeFS.watch(
  NodePath.join(NodeProcess.cwd(), 'src'),
  { recursive: true },
  (_, filename) => {
    if (filename?.endsWith('.ts')) {
      console.log(`\n🔄 Change detected: ${filename}`)
      // Only rebuild the plugin, Vite will pick up the changes
      debouncedBuild()
    }
  },
)

// Start Vite once and let it run
startVite()

NodeProcess.on('SIGINT', async () => {
  console.log('\nShutting down...')
  if (buildProcess) {
    buildProcess.kill('SIGTERM')
  }
  await cleanupProcess()
  watcher.close()
  NodeProcess.exit(0)
})

NodeProcess.on('SIGTERM', async () => {
  if (buildProcess) {
    buildProcess.kill('SIGTERM')
  }
  await cleanupProcess()
  watcher.close()
  NodeProcess.exit(0)
})

NodeProcess.on('uncaughtException', async error => {
  console.error('Uncaught exception:', error)
  if (buildProcess) {
    buildProcess.kill('SIGTERM')
  }
  await cleanupProcess()
  NodeProcess.exit(1)
})

NodeProcess.on('unhandledRejection', async reason => {
  console.error('Unhandled rejection:', reason)
  if (buildProcess) {
    buildProcess.kill('SIGTERM')
  }
  await cleanupProcess()
  NodeProcess.exit(1)
})
