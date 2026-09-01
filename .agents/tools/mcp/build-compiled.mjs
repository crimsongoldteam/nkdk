import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

export function buildCompiledMcp({
  spawn = spawnSync,
  root = repoRoot,
  exists = existsSync,
} = {}) {
  const generatedPackageFiles = ["packages/mcp/README.md", "packages/mcp/LICENSE"]
    .map((relativePath) => join(root, relativePath))
    .filter((path) => existsSync(path))
    .map((path) => ({ path, contents: readFileSync(path) }))
  try {
    const result = spawn("pnpm", ["--filter", "@nkdk/mcp", "build"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 128,
    })
    if (result.status !== 0) {
      const details = [result.stderr, result.stdout].filter(Boolean).join("\n").trim()
      throw new Error(
        `Сборка MCP завершилась с кодом ${result.status ?? "unknown"}${details.length === 0 ? "" : `\n${details}`}`
      )
    }
    for (const relativePath of ["packages/mcp/dist/bin/nkdk-mcp", "packages/mcp/dist/bin/worker.js"]) {
      if (!exists(join(root, relativePath))) throw new Error(`Сборка MCP не создала ${relativePath}`)
    }
  } finally {
    for (const file of generatedPackageFiles) writeFileSync(file.path, file.contents)
  }
}

export const compiledMcpRepoRoot = repoRoot
