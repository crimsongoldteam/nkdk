#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url))
const requireFromHere = createRequire(import.meta.url)
const mcpPackageRoot = `${repoRoot}/packages/mcp`
const { Client } = requireFromMcpPackage("@modelcontextprotocol/sdk/client/index.js")
const { StdioClientTransport } = requireFromMcpPackage("@modelcontextprotocol/sdk/client/stdio.js")
const tsxLoader = requireFromHere.resolve("tsx", { paths: [mcpPackageRoot] })

function requireFromMcpPackage(specifier) {
  return requireFromHere(requireFromHere.resolve(specifier, { paths: [mcpPackageRoot] }))
}

function parseArgs(argv) {
  const [toolName, ...rest] = argv
  if (!toolName || toolName.startsWith("-")) usage("tool name is required")
  const options = { toolName, debug: false }
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === "--debug") {
      options.debug = true
      continue
    }
    const value = rest[index + 1]
    if (value === undefined || value.startsWith("--")) usage(`${arg} requires a value`)
    if (arg === "--input") options.input = value
    else if (arg === "--output") options.output = value
    else if (arg === "--request-log") options.requestLog = value
    else if (arg === "--response-log") options.responseLog = value
    else if (arg === "--server-stdout-log") options.serverStdoutLog = value
    else if (arg === "--server-stderr-log") options.serverStderrLog = value
    else usage(`unknown option: ${arg}`)
    index += 1
  }
  if (!options.input) usage("--input is required")
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

function operationFailed(payload) {
  if (!payload || typeof payload !== "object") return false
  return payload.ok === false || (Array.isArray(payload.failed) && payload.failed.length > 0)
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

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const input = JSON.parse(await readFile(options.input, "utf8"))
  const request = { name: options.toolName, arguments: input }
  await writeJson(options.requestLog, request)
  await writeText(options.serverStdoutLog, "MCP stdio stdout carries protocol frames and is owned by the SDK.\n")

  const command = process.execPath
  const args = ["--import", tsxLoader, `${mcpPackageRoot}/src/server.ts`]
  if (options.debug) {
    process.stderr.write("[mcp] " + command + " " + args.join(" ") + "\n")
    process.stderr.write("[mcp] tool " + options.toolName + "\n")
  }

  const transport = new StdioClientTransport({
    command,
    args,
    cwd: repoRoot,
    env: childEnvironment(),
    stderr: "pipe",
  })
  const client = new Client({ name: "nkdk-round-trip", version: "1.0.0" })
  let stderr = ""
  await client.connect(transport)
  if (transport.stderr) {
    transport.stderr.setEncoding("utf8")
    transport.stderr.on("data", (chunk) => {
      stderr += chunk
      if (options.debug) process.stderr.write(chunk)
    })
  }

  try {
    const result = await client.callTool(request)
    const payload = structuredPayload(result)
    await writeJson(options.responseLog, result)
    await writeJson(options.output, payload ?? result)
    await writeText(options.serverStderrLog, stderr)
    if (result.isError || operationFailed(payload)) {
      throw new Error(failureMessage(options.toolName, result, payload))
    }
    if (options.debug) process.stderr.write(`[mcp] ok ${options.toolName}\n`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
