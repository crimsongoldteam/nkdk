import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")

const FORBIDDEN_COMMON_OBJECT_IMPORTS = [
  "~/metadata/forms/elements/",
  "../forms/elements/",
] as const

describe("metadata import boundaries", () => {
  it("commonObjects не импортирует конкретные элементы формы", () => {
    const offenders = listTypeScriptFiles(COMMON_OBJECTS_DIR)
      .map((filePath) => ({
        filePath: relative(process.cwd(), filePath),
        forbiddenImports: findForbiddenImports(readFileSync(filePath, "utf-8")),
      }))
      .filter(({ forbiddenImports }) => forbiddenImports.length > 0)

    expect(offenders).toEqual([])
  })
})

function findForbiddenImports(content: string): string[] {
  return FORBIDDEN_COMMON_OBJECT_IMPORTS.filter((importPath) => content.includes(importPath))
}

function listTypeScriptFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      result.push(...listTypeScriptFiles(fullPath))
      continue
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      result.push(fullPath)
    }
  }
  return result
}
