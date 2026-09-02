import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

export function buildCompiledMcp({
  spawn = spawnSync,
  root = repoRoot,
  exists = existsSync,
  platform = process.platform,
} = {}) {
  const generatedPackageFiles = ["packages/mcp/README.md", "packages/mcp/LICENSE"]
    .map((relativePath) => join(root, relativePath))
    .filter((path) => existsSync(path))
    .map((path) => ({ path, contents: readFileSync(path) }))
  try {
    // На Windows pnpm обычно является .cmd, а не исполняемым файлом.
    // Команда фиксированная: пользовательские пути передаются только через cwd.
    const command = platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "pnpm"
    const args = platform === "win32" ? ["/d", "/s", "/c", "pnpm --filter @nkdk/mcp build"]
      : ["--filter", "@nkdk/mcp", "build"]
    const result = spawn(command, args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 128,
    })
    if (result.error || result.status !== 0) {
      const details = [result.error?.message, result.stderr, result.stdout].filter(Boolean).join("\n").trim()
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
