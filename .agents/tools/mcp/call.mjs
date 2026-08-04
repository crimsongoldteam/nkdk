#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url))
const requireFromHere = createRequire(import.meta.url)
const mcpPackageRoot = `${repoRoot}/packages/mcp`
const { Client } = requireFromMcpPackage("@modelcontextprotocol/sdk/client/index.js")
const { StdioClientTransport } = requireFromMcpPackage("@modelcontextprotocol/sdk/client/stdio.js")
const tsxLoader = requireFromHere.resolve("tsx", { paths: [mcpPackageRoot] })

function requireFromMcpPackage(specifier) {
  return requireFromHere(requireFromHere.resolve(specifier, { paths: [mcpPackageRoot] }))
}

class CallScriptUsageError extends Error {}

export function parseArgs(argv) {
  const [toolName, ...rest] = argv
  if (!toolName || toolName.startsWith("-")) throw new CallScriptUsageError("tool name is required")
  const options = { toolName, debug: false, serverMode: "source" }
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === "--debug") {
      options.debug = true
      continue
    }
    if (arg === "--compiled") {
      options.serverMode = "compiled"
      continue
    }
    const value = rest[index + 1]
    if (value === undefined || value.startsWith("--")) throw new CallScriptUsageError(`${arg} requires a value`)
    if (arg === "--input") options.input = value
    else if (arg === "--output") options.output = value
    else if (arg === "--request-log") options.requestLog = value
    else if (arg === "--response-log") options.responseLog = value
    else if (arg === "--server-stdout-log") options.serverStdoutLog = value
    else if (arg === "--server-stderr-log") options.serverStderrLog = value
    else throw new CallScriptUsageError(`unknown option: ${arg}`)
    index += 1
  }
  if (!options.input) throw new CallScriptUsageError("--input is required")
  return options
}

function usage(message) {
  if (message) process.stderr.write(`Ошибка: ${message}\n`)
  process.stderr.write(
    [
      "Использование:",
      "  node .agents/tools/mcp/call.mjs <tool> --input args.json [--output response.json]",
      "",
      "Дополнительно:",
      "  --request-log path       сохранить MCP request envelope",
      "  --response-log path      сохранить полный ответ",
      "  --server-stdout-log path создать stdout-log файл диагностики",
      "  --server-stderr-log path записать stderr MCP-сервера",
      "  --compiled              запустить собранный MCP вместо исходного TypeScript",
      "  --debug                  печатать краткую диагностику",
      "",
    ].join("\n")
  )
  process.exit(2)
}

async function ensureParent(path) {
  if (!path) return
  await mkdir(dirname(resolve(path)), { recursive: true })
}

async function writeText(path, text) {
  if (!path) return
  await ensureParent(path)
  await writeFile(path, text, "utf8")
}

async function writeJson(path, value) {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`)
}

export async function reportServerStderr({
  stderr,
  failed,
  debug,
  logPath,
  writeStderr = (text) => process.stderr.write(text),
}) {
  await writeText(logPath, stderr)
  if (failed && !debug && stderr.length > 0) {
    writeStderr(stderr.endsWith("\n") ? stderr : `${stderr}\n`)
  }
}

export const MCP_CALL_TIMEOUT_MS = 2_147_483_647

export function callToolWithoutPracticalLimit(client, request) {
  return client.callTool(request, undefined, { timeout: MCP_CALL_TIMEOUT_MS })
}

function structuredPayload(result) {
  if (result.structuredContent && typeof result.structuredContent === "object") return result.structuredContent
  const textContent = result.content?.find((part) => part.type === "text")?.text
  if (typeof textContent !== "string") return undefined
  try {
    return JSON.parse(textContent)
  } catch {
    return undefined
  }
}

export function operationFailed(payload) {
  if (!payload || typeof payload !== "object") return false
  if (payload.ok === false) return true
  if (!Array.isArray(payload.failed) || payload.failed.length === 0) return false
  return payload.failed.some(
    (failure) => !failure
      || typeof failure !== "object"
      || failure.code !== "project_validation"
  )
}

function failureMessage(toolName, result, payload) {
  if (result.isError) return `${toolName} returned MCP error`
  if (payload?.ok === false) return `${toolName} returned ok=false: ${payload.error?.code ?? "unknown_error"}`
  if (Array.isArray(payload?.failed) && payload.failed.length > 0) {
    return `${toolName} returned ${payload.failed.length} operation failure(s)`
  }
  return `${toolName} failed`
}

function childEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter((entry) => entry[1] !== undefined))
}

export function resolveServerLaunch(serverMode = "source") {
  if (serverMode === "compiled") {
    return { command: process.execPath, args: [`${mcpPackageRoot}/dist/bin/nkdk-mcp`] }
  }
  if (serverMode === "source") {
    return {
      command: process.execPath,
      args: ["--import", tsxLoader, `${mcpPackageRoot}/src/server.ts`],
    }
  }
  throw new Error(`unknown MCP server mode: ${serverMode}`)
}

export async function createMcpToolSession({
  serverMode = "source",
  debug = false,
  env = childEnvironment(),
  createTransport = (options) => new StdioClientTransport(options),
  createClient = () => new Client({ name: "nkdk-round-trip", version: "1.0.0" }),
} = {}) {
  const launch = resolveServerLaunch(serverMode)
  if (debug) process.stderr.write(`[mcp] ${launch.command} ${launch.args.join(" ")}\n`)
  const transport = createTransport({
    ...launch,
    cwd: repoRoot,
    env,
    stderr: "pipe",
  })
  const client = createClient()
  let stderr = ""
  let closed = false

  await client.connect(transport)
  if (transport.stderr) {
    transport.stderr.setEncoding("utf8")
    transport.stderr.on("data", (chunk) => {
      stderr += chunk
      if (debug) process.stderr.write(chunk)
    })
  }

  return {
    async call(toolName, args) {
      if (debug) process.stderr.write(`[mcp] tool ${toolName}\n`)
      const result = await callToolWithoutPracticalLimit(client, { name: toolName, arguments: args })
      return { result, payload: structuredPayload(result) }
    },
    takeStderr() {
      const current = stderr
      stderr = ""
      return current
    },
    async close() {
      if (closed) return
      closed = true
      await client.close()
    },
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const input = JSON.parse(await readFile(options.input, "utf8"))
  const request = { name: options.toolName, arguments: input }
  await writeJson(options.requestLog, request)
  await writeText(options.serverStdoutLog, "MCP stdio stdout carries protocol frames and is owned by the SDK.\n")

  const session = await createMcpToolSession({ serverMode: options.serverMode, debug: options.debug })

  let failed = true
  try {
    const { result, payload } = await session.call(options.toolName, input)
    await writeJson(options.responseLog, result)
    await writeJson(options.output, payload ?? result)
    if (result.isError || operationFailed(payload)) {
      throw new Error(failureMessage(options.toolName, result, payload))
    }
    failed = false
    if (options.debug) process.stderr.write(`[mcp] ok ${options.toolName}\n`)
  } finally {
    try {
      await session.close()
    } finally {
      await reportServerStderr({
        stderr: session.takeStderr(),
        failed,
        debug: options.debug,
        logPath: options.serverStderrLog,
      })
    }
  }
}

const isCliEntrypoint =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isCliEntrypoint) {
  main().catch((error) => {
    if (error instanceof CallScriptUsageError) usage(error.message)
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
