import { spawn } from "node:child_process"
import { realpathSync, unwatchFile, watchFile } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { serveStdio, type StdioServerHandle } from "@modelcontextprotocol/server/stdio"
import { McpCliUsageError, parseMcpCli } from "./cli"
import { runHttpServer } from "./httpServer"
import { createNkdkMcpServer } from "./mcpServer"
import { metadataRuntimeHandle } from "./metadataRuntimeHandle"
import { backgroundOperationHandle } from "./backgroundOperationHandle"
import { closePlatformSessionManager } from "./services/platformSessionHandle"
import { createShutdownCoordinator, type ShutdownCloser } from "./shutdown"
import { createMcpWatchHost } from "./watchHost"

export { createNkdkMcpServer } from "./mcpServer"

export function runStdioServer(onerror?: (error: Error) => void): StdioServerHandle {
  return serveStdio(createNkdkMcpServer, { legacy: "serve", onerror })
}

export function runWatchServer(
  entrypoint: string,
  onFatal: (message: string) => void,
): { close(): Promise<void> } {
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
        onExit(listener) {
          child.once("exit", listener)
        },
        kill() {
          child.kill()
        },
      }
    },
    writeOutput(message) {
      process.stdout.write(`${message}\n`)
    },
    onFatal,
  })
  host.start()

  let input = ""
  process.stdin.setEncoding("utf8")
  const onData = (chunk: string) => {
    input += chunk
    const lines = input.split(/\r?\n/u)
    input = lines.pop() ?? ""
    for (const line of lines) {
      if (line.length > 0) host.receive(line)
    }
  }

  const onBuild = (current: { size: number; mtimeMs: number }, previous: { mtimeMs: number }) => {
    if (current.size > 0 && current.mtimeMs !== previous.mtimeMs) host.reload()
  }
  process.stdin.on("data", onData)
  watchFile(entrypoint, { interval: 500 }, onBuild)

  let closing: Promise<void> | undefined
  return {
    close() {
      closing ??= Promise.resolve().then(() => {
        process.stdin.off("data", onData)
        unwatchFile(entrypoint, onBuild)
        host.close()
      })
      return closing
    },
  }
}

export async function main(
  argv: readonly string[] = process.argv.slice(2),
  entrypoint: string = process.argv[1] ?? "",
): Promise<void> {
  let closeTransport: ShutdownCloser = () => undefined
  const shutdownCoordinator = createShutdownCoordinator([
    () => closeTransport(),
    () => backgroundOperationHandle.close(),
    () => metadataRuntimeHandle.close(),
    async () => {
      await closePlatformSessionManager()
    },
  ])
  const shutdown = () => shutdownCoordinator.shutdown().catch((error: unknown) => {
    reportError(error)
    process.exitCode = 1
  })
  const onSignal = () => {
    void shutdown()
  }
  process.once("SIGINT", onSignal)
  process.once("SIGTERM", onSignal)

  try {
    const options = parseMcpCli(argv)
    if (options.mode === "http") {
      const http = await runHttpServer({ port: options.port, onerror: reportTransportError })
      closeTransport = http.close
      process.stderr.write(`${http.address}\n`)
      return
    }

    if (options.watch) {
      const watch = runWatchServer(entrypoint, (message) => {
        reportTransportError(new Error(message))
        void shutdown()
      })
      closeTransport = watch.close
      process.stdin.once("end", onSignal)
      return
    }

    const stdio = runStdioServer(reportTransportError)
    closeTransport = stdio.close
    process.stdin.once("end", onSignal)
  } catch (error) {
    reportError(error)
    process.exitCode = error instanceof McpCliUsageError ? error.exitCode : 1
    await shutdown()
  }

  function reportTransportError(error: Error): void {
    reportError(error)
    process.exitCode = 1
  }
}

function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
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
  void main()
}
