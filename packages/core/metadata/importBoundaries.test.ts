import { lstatSync, readdirSync, readFileSync } from "fs"
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
const REGISTRATION_ENTRYPOINT_ALLOWLIST = new Set([
  "index.ts",
  "metadata/register.ts",
  "metadata/register.test.ts",
  "tests/setupTests.ts",
  "metadata/validation/schemaRegistry.ts",
  "metadata/validation/projectSpecs.ts",
  "metadata/validation/validateForm.ts",
  "metadata/validation/dataPath/formTraversal.ts",
  "metadata/forms/clientApplicationForm/convertFromXML.ts",
  "metadata/validation/schemaRegistry.test.ts",
  "metadata/validation/validateForm.test.ts",
  "metadata/validation/dataPath/formTraversal.test.ts",
  "metadata/commonObjects/metadataField/graphFromModel.unit.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/fromYAML.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/toYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/fromYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/toYAML.test.ts",
  "metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/toYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/fromYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/toYAML.test.ts",
])
const BROAD_METADATA_REGISTRATION_IMPORTS = [
  "~/metadata/appliedObjects",
  "~/metadata/commonObjects",
  "~/metadata/forms",
] as const
const SKIPPED_SCAN_DIRS = new Set(["node_modules", ".git", ".worktrees", "dist", "coverage"])

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

  it("I8nText registry entry живёт рядом с владельцем", () => {
    const globalRegistry = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")
    const localRegistry = readFileSync(join(METADATA_DIR, "commonObjects", "i8nText", "registry.types.ts"), "utf-8")

    expect(globalRegistry).not.toMatch(/^\s+I8nText: \{/m)
    expect(globalRegistry).not.toMatch(/^\s+I8nText: "I8nText",/m)
    expect(localRegistry).toContain("interface PropertyTypeRegistry")
    expect(localRegistry).toContain("I8nText: {")
  })

  it("новые широкие metadata-регистрации идут через metadata/register", () => {
    const offenders = listCoreTypeScriptFiles()
      .filter((filePath) => !REGISTRATION_ENTRYPOINT_ALLOWLIST.has(filePath))
      .map((filePath) => ({
        filePath,
        forbiddenImports: findForbiddenModuleSpecifiers(
          readFileSync(join(process.cwd(), filePath), "utf-8"),
          BROAD_METADATA_REGISTRATION_IMPORTS
        ),
      }))
      .filter(({ forbiddenImports }) => forbiddenImports.length > 0)

    expect(offenders).toEqual([])
  })

  it("старые boundary-правила поддерживают prefix imports, а broad-регистрации остаются exact", () => {
    expect(
      findForbiddenImports('import { Button } from "~/metadata/forms/elements/button"', [
        "~/metadata/forms/elements/",
      ])
    ).toEqual(["~/metadata/forms/elements/"])

    expect(
      findForbiddenModuleSpecifiers('import { Button } from "~/metadata/forms/elements/button"', ["~/metadata/forms"])
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
  const importedPaths = extractImportSpecifiers(content)

  return forbiddenImports.filter((importPath) =>
    importedPaths.some((importedPath) => matchesForbiddenSpecifier(importedPath, importPath))
  )
}

function findForbiddenModuleSpecifiers(content: string, forbiddenImports: readonly string[]): string[] {
  const moduleSpecifiers = extractModuleSpecifiers(content)

  return forbiddenImports.filter((importPath) => moduleSpecifiers.includes(importPath))
}

function matchesForbiddenSpecifier(specifier: string, forbidden: string): boolean {
  return specifier === forbidden || specifier.startsWith(forbidden)
}

function extractImportSpecifiers(content: string): string[] {
  return [
    ...content.matchAll(/\bimport\s+(?:type\s+)?[^"'()]+?\s+from\s+["']([^"']+)["']/g),
    ...content.matchAll(/\bimport\s+["']([^"']+)["']/g),
    ...content.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
  ].map((match) => match[1])
}

function extractModuleSpecifiers(content: string): string[] {
  return [
    ...extractImportSpecifiers(content),
    ...content.matchAll(/\bexport\s+(?:type\s+)?[^"']+?\s+from\s+["']([^"']+)["']/g),
  ].map((match) => (typeof match === "string" ? match : match[1]))
}

function listCoreTypeScriptFiles(): string[] {
  return listTypeScriptFiles(process.cwd(), { includeTests: true }).map((filePath) => relative(process.cwd(), filePath))
}

function listTypeScriptFiles(dir: string, options: { includeTests?: boolean } = {}): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_SCAN_DIRS.has(entry)) continue

    const fullPath = join(dir, entry)
    const stat = lstatSync(fullPath)
    if (stat.isSymbolicLink()) continue
    if (stat.isDirectory()) {
      result.push(...listTypeScriptFiles(fullPath, options))
      continue
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts") && (options.includeTests || !entry.endsWith(".test.ts"))) {
      result.push(fullPath)
    }
  }
  return result
}
