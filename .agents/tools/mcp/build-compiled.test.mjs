import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { buildCompiledMcp } from "./build-compiled.mjs"

test("запускает pnpm через cmd на Windows, не подставляя путь проекта в командную строку", () => {
  const calls = []
  buildCompiledMcp({
    platform: "win32",
    root: 'C:\\Рабочие проекты\\NKDK & test',
    exists: (path) => path.includes("dist"),
    spawn: (...args) => { calls.push(args); return { status: 0 } },
  })
  assert.equal(calls.length, 1)
  assert.match(calls[0][0], /cmd\.exe$/iu)
  assert.deepEqual(calls[0][1], ["/d", "/s", "/c", "pnpm --filter @nkdk/mcp build"])
  assert.equal(calls[0][2].cwd, 'C:\\Рабочие проекты\\NKDK & test')
  assert.notEqual(calls[0][2].shell, true)
})

test("не оставляет перезаписанный package README после compiled build", () => {
  const root = mkdtempSync(join(tmpdir(), "nkdk-compiled-build-"))
  const packageDir = join(root, "packages", "mcp")
  mkdirSync(packageDir, { recursive: true })
  const readme = join(packageDir, "README.md")
  writeFileSync(readme, "package documentation\n")

  buildCompiledMcp({
    root,
    exists: () => true,
    spawn: () => {
      writeFileSync(readme, "root documentation\n")
      return { status: 0, stdout: "", stderr: "" }
    },
  })

  assert.equal(readFileSync(readme, "utf8"), "package documentation\n")
})
