import path from "node:path"
import { fileURLToPath } from "node:url"
import { beforeAll, describe, expect, it } from "vitest"
import { readSourceTreeOnce, type SourceTreeFile } from "../tests/sourceTreeSnapshot"

const metadataRoot = path.dirname(fileURLToPath(import.meta.url))
let metadataFiles: readonly SourceTreeFile[]

describe("metadata runtime dependencies", () => {
  beforeAll(() => {
    metadataFiles = readSourceTreeOnce(metadataRoot)
  })

  it("does not import test helpers from runtime modules", () => {
    const offenders = metadataFiles
      .filter(isRuntimeFile)
      .flatMap((file) => {
        return /from\s+["']~\/tests\//.test(file.source) ? [file.relativePath] : []
      })

    expect(offenders).toEqual([])
  })
})

const isRuntimeFile = (file: SourceTreeFile): boolean => {
  const parts = file.relativePath.split(path.sep)
  if (file.relativePath.endsWith(".test.ts")) return false
  if (parts.includes("__fixtures__") || parts.includes("__tests__")) return false
  return true
}
