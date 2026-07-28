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
import type {
  OwnedProcess,
  SessionFileSystem,
  SessionPortRuntime,
  SessionProcessRuntime,
} from "./runtime"
import type { PlatformSessionManagerDependencies } from "./manager"

const fileSystem: SessionFileSystem = {
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  async writeFile(path, content, options) {
    await fs.promises.writeFile(path, content, options)
  },
  async readFile(path) {
    return fs.promises.readFile(path, "utf8")
  },
  async rm(path) {
    await fs.promises.rm(path, { recursive: true, force: true })
  },
  rename: fs.promises.rename,
  chmod: fs.promises.chmod,
  realpath: fs.promises.realpath,
}

const processRuntime: SessionProcessRuntime = {
  spawn(command, args) {
    return wrapOwnedProcess(
      spawnChild(command, [...args], {
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      })
    )
  },
  async run(command, args, options) {
    return new Promise((resolve, reject) => {
      const child = spawnChild(command, [...args], {
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      })
      let stdout = ""
      let stderr = ""
      let timedOut = false
      const timer =
        options === undefined
          ? undefined
          : setTimeout(() => {
              timedOut = true
              child.kill("SIGKILL")
            }, options.timeoutMs)
      timer?.unref()
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8")
      })
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8")
      })
      child.once("error", (error) => {
        if (timer !== undefined) clearTimeout(timer)
        reject(error)
      })
      child.once("exit", (code) => {
        if (timer !== undefined) clearTimeout(timer)
        resolve({ stdout, stderr, exitCode: code ?? 1, timedOut })
      })
    })
  },
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
        processRuntime,
        generateHostKey,
        sshTransport,
        openCommandSession: openPlatformCommandSession,
        clock: {
          now: Date.now,
          sleep: (timeoutMs) => new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        },
        startupTimeoutMs: 60_000,
        retryDelayMs: 100,
        closeTimeoutMs: 5_000,
      }),
    createStandaloneSession: (params) =>
      createStandaloneServerSession(params, {
        fileSystem,
        processRuntime,
        commandTimeoutMs: 30 * 60 * 1000,
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

function wrapOwnedProcess(child: ChildProcessByStdio<null, Readable, Readable>): OwnedProcess {
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
      child.kill(signal)
    },
    async kill(signal = "SIGKILL") {
      child.kill(signal)
    },
  }
}
