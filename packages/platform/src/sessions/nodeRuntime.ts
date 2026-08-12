import { spawn as spawnChild, type ChildProcessByStdio } from "node:child_process"
import { createHash, generateKeyPair } from "node:crypto"
import fs from "node:fs"
import net from "node:net"
import type { Readable } from "node:stream"
import ssh2 from "ssh2"
import { findPlatform } from "../platform/findPlatform"
import { createDesignerAgentSession } from "./designerAgent"
import { openPlatformCommandSession } from "./sshProtocol"
import { createSsh2Transport } from "./ssh2Transport"
import { createStandaloneServerSession } from "./standaloneServer"
import { createPlatformOperationLog } from "./operationLog"
import { nodeProcessLogReader } from "./processLog"
import type {
  OwnedProcess,
  ProcessRunOptions,
  ProcessRunResult,
  SessionFileSystem,
  SessionPortRuntime,
  SessionProcessRuntime,
} from "./runtime"
import type { PlatformSessionManagerDependencies } from "./contracts"

const fileSystem: SessionFileSystem = {
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  async writeFile(path, content, options) {
    await fs.promises.writeFile(path, content, options)
  },
  async appendFile(path, content) {
    await fs.promises.appendFile(path, content)
  },
  async readFile(path) {
    return fs.promises.readFile(path, "utf8")
  },
  copyFile: fs.promises.copyFile,
  async rm(path) {
    await fs.promises.rm(path, { recursive: true, force: true })
  },
  rename: fs.promises.rename,
  chmod: fs.promises.chmod,
  realpath: fs.promises.realpath,
}

export const nodeProcessRuntime: SessionProcessRuntime = {
  spawn(command, args, options) {
    return wrapOwnedProcess(
      spawnChild(command, [...args], {
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        cwd: options?.cwd,
      })
    )
  },
  run: runNodeProcess,
}

type PipedChildProcess = Pick<
  ChildProcessByStdio<null, Readable, Readable>,
  "stdout" | "stderr" | "exitCode" | "kill" | "once" | "off"
>

type SpawnPipedProcess = (
  command: string,
  args: readonly string[]
) => PipedChildProcess

export async function runNodeProcess(
  command: string,
  args: readonly string[],
  options: ProcessRunOptions = {},
  spawnProcess: SpawnPipedProcess = spawnPipedProcess
): Promise<ProcessRunResult> {
  if (options.signal?.aborted === true) {
    return {
      stdout: "",
      stderr: "",
      exitCode: 1,
      cancelled: true,
    }
  }

  const child = spawnProcess(command, args)
  return new Promise((resolve, reject) => {
    let stdout = ""
    let stderr = ""
    let timedOut = false
    let cancelled = false
    let terminationFailed = false
    let timeoutTimer: ReturnType<typeof setTimeout> | undefined
    let forceKillTimer: ReturnType<typeof setTimeout> | undefined

    const cleanup = () => {
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer)
      if (forceKillTimer !== undefined) clearTimeout(forceKillTimer)
      options.signal?.removeEventListener("abort", abort)
      child.off("error", fail)
      child.off("exit", finish)
    }
    const finish = (code: number | null) => {
      cleanup()
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
        ...(timedOut ? { timedOut: true } : {}),
        ...(cancelled ? { cancelled: true } : {}),
        ...(terminationFailed ? { terminationFailed: true } : {}),
      })
    }
    const fail = (error: Error) => {
      cleanup()
      reject(error)
    }
    const forceKill = () => {
      if (child.exitCode !== null) return
      try {
        if (!child.kill("SIGKILL") && child.exitCode === null) {
          terminationFailed = true
        }
      } catch {
        terminationFailed = true
      }
    }
    const abort = () => {
      if (cancelled || child.exitCode !== null) return
      cancelled = true
      try {
        if (!child.kill("SIGTERM") && child.exitCode === null) {
          forceKill()
          return
        }
      } catch {
        forceKill()
        return
      }
      forceKillTimer = setTimeout(forceKill, options.terminationGraceMs ?? 0)
      forceKillTimer.unref()
    }

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8")
    })
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    child.once("error", fail)
    child.once("exit", finish)
    options.signal?.addEventListener("abort", abort, { once: true })
    if (options.timeoutMs !== undefined) {
      timeoutTimer = setTimeout(() => {
        timedOut = true
        child.kill("SIGKILL")
      }, options.timeoutMs)
      timeoutTimer.unref()
    }
    if (options.signal?.aborted === true) abort()
  })
}

function spawnPipedProcess(
  command: string,
  args: readonly string[]
): PipedChildProcess {
  return spawnChild(command, [...args], {
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  })
}

const portRuntime: SessionPortRuntime = {
  async reservePort(host) {
    return new Promise<number>((resolve, reject) => {
      const server = net.createServer()
      server.unref()
      server.once("error", reject)
      server.listen(0, host, () => {
        const address = server.address()
        if (address === null || typeof address === "string") {
          server.close()
          reject(new Error("Не удалось определить локальный порт"))
          return
        }
        server.close((error) => {
          if (error !== undefined) reject(error)
          else resolve(address.port)
        })
      })
    })
  },
}

export function createNodePlatformSessionManagerDependencies(): PlatformSessionManagerDependencies {
  const sshTransport = createSsh2Transport()
  return {
    canonicalizeProjectDir: fs.promises.realpath,
    findPlatform,
    createDesignerSession: (params) =>
      createDesignerAgentSession(params, {
        portRuntime,
        fileSystem,
        processRuntime: nodeProcessRuntime,
        processLogReader: nodeProcessLogReader,
        generateHostKey,
        sshTransport,
        openCommandSession: openPlatformCommandSession,
        clock: {
          now: Date.now,
          sleep: (timeoutMs) => new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        },
        startupTimeoutMs: 60_000,
        commandTimeoutMs: 30 * 60 * 1000,
        retryDelayMs: 100,
        closeTimeoutMs: 5_000,
      }),
    createStandaloneSession: (params) =>
      createStandaloneServerSession(params, {
        fileSystem,
        processRuntime: nodeProcessRuntime,
        commandTimeoutMs: 30 * 60 * 1000,
        closeTimeoutMs: 5_000,
        platform: process.platform,
      }),
    setTimer(callback, timeoutMs) {
      const timer = setTimeout(callback, timeoutMs)
      timer.unref()
      return timer
    },
    clearTimer(timer) {
      clearTimeout(timer as ReturnType<typeof setTimeout>)
    },
    createOperationLog: (params) => createPlatformOperationLog(params, {
      fileSystem,
      platform: process.platform,
      now: () => new Date(),
    }),
  }
}

async function generateHostKey(path: string): Promise<string> {
  const privateKey = await new Promise<string>((resolve, reject) => {
    generateKeyPair(
      "rsa",
      {
        modulusLength: 2048,
        privateKeyEncoding: { type: "pkcs1", format: "pem" },
        publicKeyEncoding: { type: "spki", format: "pem" },
      },
      (error, _publicKey, generatedPrivateKey) => {
        if (error !== null) reject(error)
        else resolve(generatedPrivateKey)
      }
    )
  })
  const parsed = ssh2.utils.parseKey(privateKey)
  if (parsed instanceof Error) throw parsed
  await fs.promises.writeFile(path, privateKey, { mode: 0o600 })
  return createHash("sha256").update(parsed.getPublicSSH()).digest("hex")
}

export function wrapOwnedProcess(
  child: ChildProcessByStdio<null, Readable, Readable>
): OwnedProcess {
  let output = ""
  const outputListeners = new Set<() => void>()
  const appendOutput = (chunk: Buffer) => {
    output += chunk.toString("utf8")
    for (const listener of outputListeners) listener()
  }
  child.stdout.on("data", appendOutput)
  child.stderr.on("data", appendOutput)
  return {
    owned: true,
    isAlive: () => child.exitCode === null,
    async wait(timeoutMs) {
      if (child.exitCode !== null) return true
      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          cleanup()
          resolve(false)
        }, timeoutMs)
        timer.unref()
        const exited = () => {
          cleanup()
          resolve(true)
        }
        const cleanup = () => {
          clearTimeout(timer)
          child.off("exit", exited)
        }
        child.once("exit", exited)
      })
    },
    async waitForOutput(value, timeoutMs) {
      if (output.includes(value)) return
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup()
          reject(new Error("Истекло время ожидания вывода процесса"))
        }, timeoutMs)
        timer.unref()
        const inspect = () => {
          if (!output.includes(value)) return
          cleanup()
          resolve()
        }
        const exited = () => {
          cleanup()
          reject(new Error("Процесс завершился до появления ожидаемого вывода"))
        }
        const cleanup = () => {
          clearTimeout(timer)
          outputListeners.delete(inspect)
          child.off("exit", exited)
        }
        outputListeners.add(inspect)
        child.once("exit", exited)
      })
    },
    async signal(signal) {
      sendSignal(child, signal)
    },
    async kill(signal = "SIGKILL") {
      sendSignal(child, signal)
    },
  }
}

function sendSignal(
  child: Pick<ChildProcessByStdio<null, Readable, Readable>, "exitCode" | "kill">,
  signal: NodeJS.Signals
): void {
  if (!child.kill(signal) && child.exitCode === null) {
    throw new Error(`Не удалось отправить ${signal} дочернему процессу`)
  }
}
