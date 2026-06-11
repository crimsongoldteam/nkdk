import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")
const ORCHESTRATION_DIR = join(METADATA_DIR, "orchestration")
const ORCHESTRATION_APPLIED_OBJECT_DIR = join(METADATA_DIR, "orchestration", "appliedObject")
const ORCHESTRATION_FORM_ELEMENT_DIR = join(METADATA_DIR, "orchestration", "formElement")

const FORBIDDEN_COMMON_OBJECT_IMPORTS = [
  "~/metadata/forms/elements/",
  "../forms/elements/",
] as const
const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = [
  "~/metadata/appliedObjects/configuration/",
  "../../appliedObjects/configuration/",
] as const
const FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS = [
  "~/metadata/orchestration/formElement/factory",
  "../formElement/factory",
  "./formElement/factory",
] as const
const FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS = [
  "./factory",
] as const
const FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS = [
  "~/metadata/forms/elements/baseElement/types",
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

  it("production-код не импортирует type-rule registry через formElement/factory", () => {
    const offenders = [
      ...findImportOffenders(METADATA_DIR, FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS),
      ...findImportOffenders(ORCHESTRATION_FORM_ELEMENT_DIR, FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS),
    ].filter(({ filePath }) => filePath !== "metadata/orchestration/formElement/factory.ts")

    expect(offenders).toEqual([])
  })

  it("orchestration не импортирует модель baseElement из forms", () => {
    const offenders = findImportOffenders(ORCHESTRATION_DIR, FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS).filter(
      ({ filePath }) => !filePath.includes(".test.ts")
    )

    expect(offenders).toEqual([])
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
  const importedPaths = [
    ...content.matchAll(/\bimport\s+(?:type\s+)?[^"'()]+?\s+from\s+["']([^"']+)["']/g),
    ...content.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
  ].map((match) => match[1])

  return forbiddenImports.filter((importPath) => importedPaths.includes(importPath))
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
