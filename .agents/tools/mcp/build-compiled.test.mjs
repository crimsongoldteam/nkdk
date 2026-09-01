import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { buildCompiledMcp } from "./build-compiled.mjs"

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
