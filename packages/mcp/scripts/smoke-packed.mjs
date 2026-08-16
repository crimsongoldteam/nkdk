import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { spawn, spawnSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const tmpRoot = await mkdtemp(join(tmpdir(), "nkdk-mcp-pack-"))
const modernClientOptions = { versionNegotiation: { mode: { pin: "2026-07-28" } } }

try {
  await import("./build.mjs")

  const pack = spawnNpm(["pack", "--ignore-scripts", "--json", "--pack-destination", tmpRoot], {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
  if (pack.status !== 0) throw new Error(`npm pack failed with status ${pack.status}`)

  const packed = JSON.parse(pack.stdout)
  const tarball = join(tmpRoot, packed[0].filename)

  const install = spawnNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: tmpRoot,
    encoding: "utf8",
    stdio: "inherit",
    timeout: 180_000,
  })
  if (install.status !== 0) throw new Error(`npm install failed with status ${install.status}`)

  const lmdbSmoke = spawnSync(process.execPath, [
    join(tmpRoot, "node_modules/@nkdk/mcp/dist/bin/configurationIndexSmoke.js"),
  ], {
    cwd: tmpRoot,
    encoding: "utf8",
    stdio: "inherit",
    timeout: 30_000,
  })
  if (lmdbSmoke.status !== 0) throw new Error(`packed LMDB smoke failed with status ${lmdbSmoke.status}`)

  const installedManifest = JSON.parse(await readFile(join(tmpRoot, "node_modules/@nkdk/mcp/package.json"), "utf8"))
  if (installedManifest.dependencies?.["@modelcontextprotocol/client"] !== undefined) {
    throw new Error("packed MCP server depends on the development-only client package")
  }

  const command = process.execPath
  const commandArgs = [join(tmpRoot, "node_modules/@nkdk/mcp/dist/bin/nkdk-mcp")]
  const transport = new StdioClientTransport({ command, args: commandArgs })
  const client = new Client({ name: "nkdk-packed-stdio-smoke", version: "1.0.0" }, modernClientOptions)

  await client.connect(transport)
  try {
    const tools = await client.listTools()
    const toolNames = tools.tools.map((tool) => tool.name)
    if (!toolNames.includes("nkdk.get_schema")) {
      throw new Error(`nkdk.get_schema not registered. Tools: ${toolNames.join(", ")}`)
    }
    for (const name of [
      "nkdk.import_from_infobase",
      "nkdk.list_infobase_extensions",
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
    ]) {
      if (!toolNames.includes(name)) {
        throw new Error(`${name} not registered. Tools: ${toolNames.join(", ")}`)
      }
    }

    const result = await client.callTool({
      name: "nkdk.get_schema",
      arguments: {
        projectDir: tmpRoot,
        metadataRef: "InputField",
        keys: true,
      },
    })
    if (result.isError) throw new Error("nkdk.get_schema returned MCP error")

    const guide = await client.readResource({ uri: "nkdk://guides/config-edit-yaml" })
    if (guide.contents[0]?.uri !== "nkdk://guides/config-edit-yaml") {
      throw new Error("packed stdio resource returned an unexpected result")
    }

    const prompt = await client.getPrompt({ name: "nkdk_config_edit_yaml" })
    if (prompt.messages[0]?.role !== "user") {
      throw new Error("packed stdio prompt returned an unexpected result")
    }

    const projectDir = join(tmpRoot, "project")
    const configurationDir = join(projectDir, "cf")
    await cp(
      join(packageRoot, "../rules/metadata/validation/__fixtures__/project-with-form"),
      configurationDir,
      { recursive: true },
    )
    await mkdir(join(configurationDir, "Язык"), { recursive: true })
    await writeFile(join(configurationDir, "Конфигурация.yaml"), "ОсновнойЯзык: Язык.Русский\n")
    await writeFile(join(configurationDir, "Язык", "Русский.yaml"), "КодЯзыка: ru\n")
    const validation = await client.callTool({
      name: "nkdk.validate_project",
      arguments: { projectDir },
    })
    if (validation.isError) {
      throw new Error(`nkdk.validate_project returned MCP error: ${JSON.stringify(validation.structuredContent)}`)
    }

    const confirmation = await client.callTool({
      name: "nkdk.import_from_infobase",
      arguments: {
        projectDir: tmpRoot,
      },
    })
    if (
      !confirmation.isError ||
      confirmation.structuredContent?.code !== "confirmation_required"
    ) {
      throw new Error("nkdk.import_from_infobase started without allowWrite=true")
    }

    const syncConfirmation = await client.callTool({
      name: "nkdk.sync_to_infobase",
      arguments: {
        projectDir: tmpRoot,
        componentPath: "cf",
      },
    })
    if (
      !syncConfirmation.isError ||
      syncConfirmation.structuredContent?.code !== "confirmation_required"
    ) {
      throw new Error("nkdk.sync_to_infobase started without allowWrite=true")
    }

    const closeOne = await client.callTool({
      name: "nkdk.close_platform_connection",
      arguments: { projectDir: tmpRoot },
    })
    if (
      closeOne.isError ||
      closeOne.structuredContent?.closed !== false ||
      closeOne.structuredContent?.stoppedOwnedProcess !== false
    ) {
      throw new Error("nkdk.close_platform_connection returned an unexpected empty result")
    }

    const closeAll = await client.callTool({
      name: "nkdk.close_all_platform_connections",
      arguments: {},
    })
    if (
      closeAll.isError ||
      closeAll.structuredContent?.closedCount !== 0 ||
      closeAll.structuredContent?.stoppedOwnedProcesses !== 0
    ) {
      throw new Error("nkdk.close_all_platform_connections returned an unexpected empty result")
    }
  } finally {
    await client.close()
  }

  const port = await findFreeLoopbackPort()
  const httpProcess = spawn(command, [...commandArgs, "--http", "--port", String(port)], {
    cwd: tmpRoot,
    stdio: ["ignore", "pipe", "pipe"],
  })
  try {
    const endpoint = await waitForHttpAddress(httpProcess, port)
    const httpClient = new Client({ name: "nkdk-packed-http-smoke", version: "1.0.0" }, modernClientOptions)
    await httpClient.connect(new StreamableHTTPClientTransport(new URL(endpoint)))
    try {
      const tools = await httpClient.listTools()
      if (!tools.tools.some((tool) => tool.name === "nkdk.get_schema")) {
        throw new Error("packed HTTP server did not register nkdk.get_schema")
      }
      const schema = await httpClient.callTool({
        name: "nkdk.get_schema",
        arguments: { projectDir: tmpRoot, metadataRef: "InputField", keys: true },
      })
      if (schema.isError) throw new Error("packed HTTP nkdk.get_schema returned MCP error")

      const confirmation = await httpClient.callTool({
        name: "nkdk.import_from_infobase",
        arguments: { projectDir: tmpRoot },
      })
      if (!confirmation.isError || confirmation.structuredContent?.code !== "confirmation_required") {
        throw new Error("packed HTTP write tool started without allowWrite=true")
      }
    } finally {
      await httpClient.close()
    }
  } finally {
    await stopChild(httpProcess)
  }
} finally {
  await rm(tmpRoot, { recursive: true, force: true })
}

function spawnNpm(args, options) {
  if (process.platform !== "win32") return spawnSync("npm", args, options)
  const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")
  return spawnSync(process.execPath, [npmCli, ...args], options)
}

function findFreeLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (address === null || typeof address === "string") {
        server.close()
        reject(new Error("failed to allocate a loopback port"))
        return
      }
      server.close((error) => error === undefined ? resolve(address.port) : reject(error))
    })
  })
}

function waitForHttpAddress(child, port) {
  return new Promise((resolve, reject) => {
    const expected = `http://127.0.0.1:${port}/mcp`
    let stderr = ""
    const timeout = setTimeout(() => finish(new Error(`packed HTTP startup timeout: ${stderr}`)), 10_000)
    const onData = (chunk) => {
      stderr += String(chunk)
      if (stderr.split(/\r?\n/u).includes(expected)) finish(undefined, expected)
    }
    const onExit = (code, signal) => finish(new Error(`packed HTTP exited before startup (${code ?? signal}): ${stderr}`))
    const finish = (error, address) => {
      clearTimeout(timeout)
      child.stderr.off("data", onData)
      child.off("exit", onExit)
      if (error !== undefined) reject(error)
      else resolve(address)
    }
    child.stderr.on("data", onData)
    child.once("exit", onExit)
  })
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise((resolve) => child.once("exit", resolve))
  child.kill("SIGTERM")
  const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 10_000))
  if (await Promise.race([exited, timeout]) === "timeout") {
    child.kill("SIGKILL")
    await exited
  }
}
