import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { spawnSync } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const tmpRoot = await mkdtemp(join(tmpdir(), "nkdk-mcp-pack-"))

try {
  const build = spawnSync("pnpm", ["run", "build"], {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: "inherit",
  })
  if (build.status !== 0) throw new Error(`pnpm run build failed with status ${build.status}`)

  const pack = spawnSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", tmpRoot], {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
  if (pack.status !== 0) throw new Error(`npm pack failed with status ${pack.status}`)

  const packed = JSON.parse(pack.stdout)
  const tarball = join(tmpRoot, packed[0].filename)

  const install = spawnSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: tmpRoot,
    encoding: "utf8",
    stdio: "inherit",
    timeout: 180_000,
  })
  if (install.status !== 0) throw new Error(`npm install failed with status ${install.status}`)

  const command = join(tmpRoot, "node_modules/.bin/nkdk-mcp")
  const transport = new StdioClientTransport({ command, args: [] })
  const client = new Client({ name: "nkdk-packed-smoke", version: "1.0.0" })

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

    const confirmation = await client.callTool({
      name: "nkdk.import_from_infobase",
      arguments: {
        projectDir: tmpRoot,
        connectionString: 'File="/bases/demo";',
      },
    })
    if (
      !confirmation.isError ||
      confirmation.structuredContent?.code !== "confirmation_required"
    ) {
      throw new Error("nkdk.import_from_infobase started without allowWrite=true")
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
} finally {
  await rm(tmpRoot, { recursive: true, force: true })
}
