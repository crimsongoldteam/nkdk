import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

describe("metadata runtime dependencies", () => {
  it("does not import test helpers from runtime modules", () => {
    const metadataRoot = path.dirname(fileURLToPath(import.meta.url))
    const offenders = collectTypeScriptFiles(metadataRoot)
      .filter(isRuntimeFile)
      .flatMap((file) => {
        const text = fs.readFileSync(file, "utf8")
        return /from\s+["']~\/tests\//.test(text) ? [path.relative(metadataRoot, file)] : []
      })

    expect(offenders).toEqual([])
  })
})

const collectTypeScriptFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectTypeScriptFiles(fullPath)
    return entry.name.endsWith(".ts") ? [fullPath] : []
  })
}

const isRuntimeFile = (file: string): boolean => {
  const parts = file.split(path.sep)
  if (file.endsWith(".test.ts")) return false
  if (parts.includes("__fixtures__") || parts.includes("__tests__")) return false
  return true
}
