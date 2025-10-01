import NodeFS from 'node:fs'
import NodePath from 'node:path'
import { PassThrough } from 'node:stream'
import { createConsola } from 'consola'

const logDirectory = NodePath.resolve(process.cwd(), 'logs')
const logFilePath = NodePath.join(logDirectory, 'unplugin-caddy.log')

if (!NodeFS.existsSync(logDirectory))
  NodeFS.mkdirSync(logDirectory, { recursive: true, mode: 0o700 })

if (!NodeFS.existsSync(logFilePath)) NodeFS.writeFileSync(logFilePath, '')

NodeFS.chmodSync(logFilePath, 0o600)

const logStream = NodeFS.createWriteStream(logFilePath, {
  flags: 'a',
  mode: 0o600,
})

const ANSI_REGEX = /\u001B\[[0-9;]*m/g

type Channel = 'stdout' | 'stderr'

const pending: Record<Channel, string> = {
  stdout: '',
  stderr: '',
}

function writeToFile(channel: Channel, chunk: Buffer | string) {
  const data = typeof chunk === 'string' ? chunk : chunk.toString('utf8')
  const buffer = pending[channel] + data
  const lines = buffer.split(/\r?\n/)
  pending[channel] = lines.pop() ?? ''

  for (const line of lines) {
    const trimmed = line.replace(ANSI_REGEX, '').trim()
    if (!trimmed) continue
    const collapsed = trimmed.replace(/\s+/g, ' ')
    logStream.write(
      `${new Date().toISOString()} ${channel.toUpperCase()} ${collapsed}\n`,
    )
  }
}

let flushed = false

function flushPending() {
  if (flushed) return
  flushed = true
  ;(Object.keys(pending) as Array<Channel>).forEach((channel: Channel) => {
    const remaining = pending[channel].replace(ANSI_REGEX, '').trim()
    if (!remaining) return
    pending[channel] = ''
    const collapsed = remaining.replace(/\s+/g, ' ')
    logStream.write(
      `${new Date().toISOString()} ${channel.toUpperCase()} ${collapsed}\n`,
    )
  })
  logStream.end()
}

const stdoutStream = new PassThrough()
const stderrStream = new PassThrough()

stdoutStream.on('data', chunk => writeToFile('stdout', chunk))
stderrStream.on('data', chunk => writeToFile('stderr', chunk))

stdoutStream.pipe(process.stdout, { end: false })
stderrStream.pipe(process.stderr, { end: false })

process.once('exit', flushPending)

const logger = createConsola({
  level: 5,
  formatOptions: {
    colors: !!process.stdout.isTTY,
    columns:
      typeof (process.stdout as NodeJS.WriteStream & { columns?: number })
        .columns === 'number'
        ? (process.stdout as NodeJS.WriteStream & { columns?: number }).columns
        : undefined,
  },
  stdout: stdoutStream as unknown as NodeJS.WriteStream,
  stderr: stderrStream as unknown as NodeJS.WriteStream,
})

export { logger }
