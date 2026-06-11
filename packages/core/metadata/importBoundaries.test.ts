import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")
const ORCHESTRATION_APPLIED_OBJECT_DIR = join(METADATA_DIR, "orchestration", "appliedObject")

const FORBIDDEN_COMMON_OBJECT_IMPORTS = [
  "~/metadata/forms/elements/",
  "../forms/elements/",
] as const
const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = [
  "~/metadata/appliedObjects/configuration/",
  "../../appliedObjects/configuration/",
] as const

describe("metadata import boundaries", () => {
  it("commonObjects не импортирует конкретные элементы формы", () => {
    expect(findImportOffenders(COMMON_OBJECTS_DIR, FORBIDDEN_COMMON_OBJECT_IMPORTS)).toEqual([])
  })

  it("orchestration/appliedObject не импортирует configuration migrations", () => {
    expect(
      findImportOffenders(ORCHESTRATION_APPLIED_OBJECT_DIR, FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS)
    ).toEqual([])
  })
})

function findImportOffenders(dir: string, forbiddenImports: readonly string[]) {
  return listTypeScriptFiles(dir)
    .map((filePath) => ({
      filePath: relative(process.cwd(), filePath),
      forbiddenImports: findForbiddenImports(readFileSync(filePath, "utf-8"), forbiddenImports),
    }))
    .filter(({ forbiddenImports }) => forbiddenImports.length > 0)
}

function findForbiddenImports(content: string, forbiddenImports: readonly string[]): string[] {
  return forbiddenImports.filter((importPath) => content.includes(importPath))
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
