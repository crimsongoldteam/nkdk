import { spawn } from "node:child_process"
import { realpathSync, unwatchFile, watchFile } from "node:fs"
import { resolve } from "path"
import { pathToFileURL } from "url"
import { McpServer } from "@modelcontextprotocol/server"
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio"
import { registerNkdkCapabilities } from "./tools/registerTools"
import { metadataRuntimeHandle } from "./metadataRuntimeHandle"
import { closePlatformSessionManager } from "./services/platformSessionHandle"
import { createMcpWatchHost } from "./watchHost"

declare const __NKDK_MCP_VERSION__: string | undefined

const MCP_SERVER_VERSION =
  typeof __NKDK_MCP_VERSION__ === "string" && __NKDK_MCP_VERSION__.length > 0 ? __NKDK_MCP_VERSION__ : "0.0.0-dev"

export function createNkdkMcpServer(): McpServer {
  const server = new McpServer({
    name: "nkdk-mcp",
    version: MCP_SERVER_VERSION,
  })
  registerNkdkCapabilities(server)
  return server
}

export async function runStdioServer(): Promise<void> {
  const server = createNkdkMcpServer()
  const transport = new StdioServerTransport()
  await runServerUntilTransportCloses(server, transport)
}

export function runWatchServer(entrypoint: string): void {
  const host = createMcpWatchHost({
    createWorker() {
      const child = spawn(process.execPath, [entrypoint, "--worker"], {
        stdio: ["pipe", "pipe", "inherit"],
      })
      return {
        stdout: child.stdout,
        write(message) {
          child.stdin.write(message)
        },
        kill() {
          child.kill()
        },
      }
    },
    writeOutput(message) {
      process.stdout.write(`${message}\n`)
    },
  })
  host.start()

  let input = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk: string) => {
    input += chunk
    const lines = input.split(/\r?\n/)
    input = lines.pop() ?? ""
    for (const line of lines) {
      if (line.length > 0) host.receive(line)
    }
  })

  const onBuild = (current: { size: number; mtimeMs: number }, previous: { mtimeMs: number }) => {
    if (current.size > 0 && current.mtimeMs !== previous.mtimeMs) host.reload()
  }
  watchFile(entrypoint, { interval: 500 }, onBuild)
  process.stdin.once("end", () => unwatchFile(entrypoint, onBuild))
}

export async function runServerUntilTransportCloses(
  server: { connect(transport: { onclose?: () => void }): Promise<void> },
  transport: { onclose?: () => void }
): Promise<void> {
  let resolveClosed!: () => void
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve
  })
  transport.onclose = resolveClosed
  try {
    await server.connect(transport)
    await closed
  } finally {
    await shutdownNkdkMcpServer()
  }
}

export async function shutdownNkdkMcpServer(): Promise<void> {
  const results = await Promise.allSettled([
    metadataRuntimeHandle.close(),
    closePlatformSessionManager(),
  ])
  const rejected = results.find((result) => result.status === "rejected")
  if (rejected?.status === "rejected") throw rejected.reason
}

function isMainEntrypoint(): boolean {
  const entrypoint = process.argv[1]
  if (entrypoint === undefined) return false

  const entrypointUrl = pathToFileURL(resolve(entrypoint)).href
  if (import.meta.url === entrypointUrl) return true

  try {
    return import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
  } catch {
    return false
  }
}

if (isMainEntrypoint()) {
  installShutdownHooks()
  if (process.argv.includes("--watch")) {
    runWatchServer(process.argv[1]!)
  } else {
    runStdioServer().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      process.stderr.write(`${message}\n`)
      process.exitCode = 1
    })
  }
}

function installShutdownHooks(): void {
  const shutdown = async () => {
    try {
      await shutdownNkdkMcpServer()
    } finally {
      process.exit()
    }
  }

  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
}
