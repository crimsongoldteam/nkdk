import { existsSync, lstatSync, readdirSync, readFileSync } from "fs"
import { join, relative } from "path"
import { describe, expect, it } from "vitest"
import { createBuilderCatalog } from "./rulesBuilderMigration/builderCatalog"
import { inventoryRulesSource } from "./rulesBuilderMigration/inventory"

const METADATA_DIR = join(process.cwd(), "metadata")
const COMMON_OBJECTS_DIR = join(METADATA_DIR, "commonObjects")
const ORCHESTRATION_DIR = join(METADATA_DIR, "orchestration")
const ORCHESTRATION_APPLIED_OBJECT_DIR = join(METADATA_DIR, "orchestration", "appliedObject")
const ORCHESTRATION_FORM_ELEMENT_DIR = join(METADATA_DIR, "orchestration", "formElement")
const PROJECT_DIR = join(METADATA_DIR, "project")
const WORKSPACE_ROOT = join(process.cwd(), "..", "..")
const PACKAGES_FOR_ALIAS_SCAN = ["packages/core", "packages/cli", "packages/mcp"] as const
const CONFIG_FILES_FOR_ALIAS_SCAN = [
  "packages/core/tsconfig.json",
  "packages/cli/tsconfig.json",
  "packages/mcp/tsconfig.json",
  "packages/core/vitest.config.ts",
  "packages/cli/vitest.config.ts",
  "packages/mcp/vitest.config.ts",
] as const

const FORBIDDEN_COMMON_OBJECT_IMPORTS = ["../forms/elements/"] as const
const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = ["../../appliedObjects/configuration/"] as const
const FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS = ["../formElement/factory", "./formElement/factory"] as const
const FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS = ["./factory"] as const
const FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS = ["../forms/elements/baseElement/types"] as const
const FORBIDDEN_PROJECT_CONCRETE_METADATA_IMPORTS = ["../appliedObjects/", "../commonObjects/", "../forms/"] as const
const REGISTRATION_ENTRYPOINT_ALLOWLIST = new Set([
  "index.ts",
  "metadata/register.ts",
  "metadata/register.test.ts",
  "tests/setupTests.ts",
  "metadata/project/schemaRegistry.ts",
  "metadata/project/specs.ts",
  "metadata/project/specs.test.ts",
  "metadata/validation/validateForm.ts",
  "metadata/validation/dataPath/formTraversal.ts",
  "metadata/forms/clientApplicationForm/convertFromXML.ts",
  "metadata/validation/schemaRegistry.test.ts",
  "metadata/validation/validateForm.test.ts",
  "metadata/validation/dataPath/formTraversal.test.ts",
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
const BROAD_METADATA_REGISTRATION_IMPORTS = ["../appliedObjects", "../commonObjects", "../forms"] as const
const SKIPPED_SCAN_DIRS = new Set(["node_modules", ".git", ".worktrees", "dist", "coverage"])
const DEFERRED_GENERIC_COLLECTION_FILES = new Set([
  "metadata/appliedObjects/metadataDataProcessor/rules.ts",
  "metadata/commonObjects/characteristicsDescription/registerCollectionRule.ts",
  "metadata/commonObjects/dataCompositionSystem/filterItem/types.ts",
  "metadata/commonObjects/dataCompositionSystem/orderItemFields/types.ts",
  "metadata/orchestration/metadataCollection/ruleFactory.ts",
])
const DEFERRED_LEGACY_YAML_XML_FILES = new Set([
  "metadata/appliedObjects/configuration/migrations/collectState.ts",
  "metadata/appliedObjects/configuration/rootIO.ts",
  "metadata/appliedObjects/configuration/shortRoundTripXML.ts",
  "metadata/appliedObjects/configuration/syncToXML.ts",
  "metadata/appliedObjects/metadataCatalog/fromYAML.ts",
  "metadata/appliedObjects/metadataEnumeration/fromYAML.ts",
  "metadata/context/types.ts",
  "metadata/forms/clientApplicationForm/fromYAML.ts",
  "metadata/forms/clientApplicationForm/toXML.ts",
  "metadata/forms/commonObjects/dynamicList/types.ts",
  "metadata/forms/elements/orchestration/fromYAML.ts",
  "metadata/forms/elements/orchestration/toXML.ts",
  "metadata/operations/projectSnapshot.ts",
  "metadata/orchestration/appliedObject/syncToXML.ts",
  "metadata/orchestration/metadataCollection/fromYAML.ts",
  "metadata/orchestration/metadataCollection/ruleFactory.ts",
  "metadata/orchestration/metadataCollection/toXML.ts",
  "metadata/orchestration/metadataItem/fromYAML.ts",
  "metadata/orchestration/metadataItem/registerExportToXML.ts",
  "metadata/orchestration/metadataItem/registerImportFromYAML.ts",
  "metadata/orchestration/metadataItem/toXML.ts",
  "metadata/orchestration/property/fromYAML.ts",
  "metadata/orchestration/property/toXML.ts",
  "metadata/project/projectSpecHelpers.ts",
  "metadata/validation/dataPath/ownerCache.ts",
])

describe("metadata import boundaries", () => {
  it("workspace TypeScript and test configs do not use legacy ~ alias", () => {
    const importOffenders = PACKAGES_FOR_ALIAS_SCAN.flatMap((packagePath) =>
      listTypeScriptFiles(join(WORKSPACE_ROOT, packagePath), { includeTests: true })
        .map((filePath) => ({
          filePath: relative(WORKSPACE_ROOT, filePath),
          specifiers: extractModuleSpecifiers(readFileSync(filePath, "utf-8")).filter(
            (specifier) => specifier === "~" || specifier.startsWith("~/")
          ),
        }))
        .filter(({ specifiers }) => specifiers.length > 0)
    )

    const configOffenders = CONFIG_FILES_FOR_ALIAS_SCAN.map((filePath) => {
      const source = readFileSync(join(WORKSPACE_ROOT, filePath), "utf-8")
      return {
        filePath,
        hasAlias: /["']~(?:\/\*)?["']/.test(source),
      }
    }).filter(({ hasAlias }) => hasAlias)

    expect({ importOffenders, configOffenders }).toEqual({
      importOffenders: [],
      configOffenders: [],
    })
  })

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

  it("metadata/project не импортирует конкретные реализации metadata", () => {
    const offenders = findImportOffenders(PROJECT_DIR, FORBIDDEN_PROJECT_CONCRETE_METADATA_IMPORTS).filter(
      ({ filePath }) => !filePath.endsWith(".test.ts")
    )

    expect(offenders).toEqual([])
  })

  it("XML import discovery не знает конкретные объекты и папки", () => {
    const files = ["importFromXml/discovery.ts", "importFromXml/routes.ts"]

    for (const file of files) {
      const source = readFileSync(join(METADATA_DIR, file), "utf-8")
      for (const forbidden of ["MetadataCatalog", "ClientApplicationForm", "Catalogs", "Forms", "Templates"]) {
        expect(source).not.toContain(forbidden)
      }
    }
  })

  it("metadataTargetString не знает concrete metadata itemType/root", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "property", "metadataTargetString.ts"), "utf-8")

    expect(source).not.toContain("rootByOwnerItemType")
    expect(source).not.toContain("itemTypePrefixRootFallback")
    expect(source).not.toContain("DocumentNumerator")
    expect(source).not.toContain("ClientApplicationForm")
    expect(source).not.toContain("MetadataAttribute")
    expect(source).not.toContain("MetadataExternalDataSource")
  })

  it("ProjectReferenceIndex делегирует concrete metadata knowledge регистрациям", () => {
    const source = readFileSync(join(METADATA_DIR, "validation", "projectReferenceIndex.ts"), "utf-8")

    for (const forbidden of [
      "objectRootDir",
      "nestedObjectFilePath",
      "DocumentNumerator",
      "ExternalDataSource",
      "Template.xml",
      "Template.txt",
      "Template.bin",
      "Формы",
      "Шаблоны",
      "Поля",
      "Команды",
      "ПризнакиУчета",
      "MetadataConfiguration",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })

  it("validation/dataPath core не содержит concrete owner kinds", () => {
    const files = [
      "metadata/validation/dataPath/types.ts",
      "metadata/validation/dataPath/ownerCache.ts",
      "metadata/validation/dataPath/typeDescription.ts",
      "metadata/validation/dataPath/objectFields.ts",
      "metadata/validation/dataPath/resolver.ts",
    ]

    for (const filePath of files) {
      const source = readFileSync(join(process.cwd(), filePath), "utf-8")
      for (const forbidden of [
        "Справочник",
        "Документ",
        "РегистрСведений",
        "ПланСчетов",
        "CatalogRef",
        "DocumentRef",
        "RegisterRecords",
      ]) {
        expect(source).not.toContain(forbidden)
      }
    }
  })

  it("validateForm делегирует concrete form behavior зарегистрированному validator", () => {
    const source = readFileSync(join(METADATA_DIR, "validation", "validateForm.ts"), "utf-8")

    expect(source).not.toContain("importClientApplicationFormFromYAML")
    expect(source).not.toContain("ДинамическийСписок")
    expect(source).not.toContain("InputField")
    expect(source).toContain("getRegisteredFormValidator")
  })

  it("worker validation не строит metadata-модель", () => {
    const files = ["project/preparedYamlProjectWorker.ts", "validation/projectValidationPasses.ts"]

    for (const file of files) {
      const source = readFileSync(join(METADATA_DIR, file), "utf-8")
      expect(source).not.toContain("importPropertiesModel")
      expect(source).not.toContain("importClientApplicationFormFromYAML")
      expect(source).not.toContain("getRegisteredFormValidationPasses")
    }
  })

  it("XML import worker не возвращается к metadata-модели", () => {
    const source = ["importFromXml/prepareYaml.ts", "importFromXml/worker.ts"]
      .map((file) => readFileSync(join(METADATA_DIR, file), "utf-8"))
      .join("\n")

    expect(source).not.toMatch(/prepare(?:AppliedObject|Configuration|ClientApplicationForm)ModelFromXML/)
    expect(source).not.toContain("exportMetadataItemToYAML")
    expect(source).not.toContain("exportClientApplicationFormToYAML")
    expect(source).not.toMatch(/PreparedImportModel|preparedModels/)
    expect(source).not.toContain('type === "DataPath"')
  })

  it("dataPath owner registrations живут в register.ts конкретных объектов", () => {
    const appliedObjectsIndex = readFileSync(join(METADATA_DIR, "appliedObjects", "index.ts"), "utf-8")

    expect(appliedObjectsIndex).not.toContain("dataPathOwnerKinds")
    expect(existsSync(join(METADATA_DIR, "appliedObjects", "dataPathOwnerKinds", "register.ts"))).toBe(false)
  })

  it("standardMembers core не содержит concrete owner kinds", () => {
    const files = [
      "metadata/validation/dataPath/standardMembers.ts",
      "metadata/validation/dataPath/objectFields.ts",
      "metadata/validation/dataPath/resolver.ts",
    ]

    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf-8")
      expect(source).not.toMatch(/Справочник|Документ|ПланСчетов|Регистр/)
    }
  })

  it("standardMembers declarations live with applied objects", () => {
    expect(existsSync(join(METADATA_DIR, "appliedObjects", "metadataCatalog", "standardMembers.ts"))).toBe(true)
    expect(existsSync(join(METADATA_DIR, "appliedObjects", "metadataTask", "standardMembers.ts"))).toBe(true)
  })

  it("I8nText registry entry живёт рядом с владельцем", () => {
    const globalRegistry = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")
    const localRegistry = readFileSync(join(METADATA_DIR, "commonObjects", "i8nText", "registry.types.ts"), "utf-8")

    expect(globalRegistry).not.toMatch(/^\s+I8nText: \{/m)
    expect(globalRegistry).not.toMatch(/^\s+I8nText: "I8nText",/m)
    expect(localRegistry).toContain("interface PropertyTypeRegistry")
    expect(localRegistry).toContain("I8nText: {")
  })

  it("orchestration property registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface PropertyTypeRegistry")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type PropertyRuleType = string")
  })

  it("orchestration metadata item registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "orchestration", "metadataItem", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface MetadataItemTypeRegistry")
    expect(source).not.toContain("//#region Applied objects")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type MetadataItemType = string")
  })

  it("central metadata registries expose only neutral string keys", () => {
    const propertyRegistry = readFileSync(join(METADATA_DIR, "orchestration", "property", "registry.ts"), "utf-8")
    const metadataItemRegistry = readFileSync(
      join(METADATA_DIR, "orchestration", "metadataItem", "registry.ts"),
      "utf-8"
    )

    expect(propertyRegistry.trim()).toContain("export type PropertyRuleType = string")
    expect(metadataItemRegistry.trim()).toContain("export type MetadataItemType = string")
    expect(propertyRegistry).not.toContain("interface PropertyTypeRegistry")
    expect(metadataItemRegistry).not.toContain("interface MetadataItemTypeRegistry")
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

  it("production rules.ts не объявляют property-rule type вручную", () => {
    const catalog = createBuilderCatalog()
    const offenders = listRulesFiles(METADATA_DIR)
      .flatMap((filePath) =>
        inventoryRulesSource(relative(process.cwd(), filePath), readFileSync(filePath, "utf-8"), catalog)
      )
      .filter(({ filePath, propertyPath }) => !ALLOWED_DIRECT_RULE_TYPE_OFFENDERS.has(`${filePath}:${propertyPath}`))

    expect(offenders).toEqual([])
  })

  it("старые boundary-правила поддерживают prefix imports, а broad-регистрации остаются exact", () => {
    expect(findForbiddenImports('import { Button } from "../forms/elements/button"', ["../forms/elements/"])).toEqual([
      "../forms/elements/",
    ])

    expect(findForbiddenModuleSpecifiers('import { Button } from "../forms/elements/button"', ["../forms"])).toEqual([])
  })

  it("MetadataLanguage runtime registration lives in register.ts, not types.ts", () => {
    const typesSource = readFileSync(join(METADATA_DIR, "appliedObjects", "metadataLanguage", "types.ts"), "utf-8")
    const registerSource = readFileSync(
      join(METADATA_DIR, "appliedObjects", "metadataLanguage", "register.ts"),
      "utf-8"
    )

    expect(typesSource).not.toContain("registerMetadataItemRule")
    expect(typesSource).toContain("import type { MetadataLanguageRules }")
    expect(registerSource).toContain("registerMetadataItemRule")
    expect(registerSource).toContain('propertyType: "MetadataLanguage"')
  })

  it("регистрации коллекций не обходят YAML и XML через модельные callbacks", () => {
    const offenders = listTypeScriptFiles(METADATA_DIR)
      .map((filePath) => ({
        filePath: relative(process.cwd(), filePath),
        source: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ filePath, source }) => {
        if (DEFERRED_GENERIC_COLLECTION_FILES.has(filePath)) return false
        if (!source.includes("registerMetadataItemCollectionRule")) return false
        return /fromYAML:\s*(?:import|createImport)/.test(source) || source.includes("exportMetadataCollectionToXML")
      })
      .map(({ filePath }) => filePath)

    expect(offenders).toEqual([])
  })

  it("составные production-типы не вызывают общую YAML/XML-оркестрацию", () => {
    const forbiddenSymbols = [
      "importPropertiesFromYAML",
      "exportPropertiesToXML",
      "importPropertyFromYAML",
      "exportPropertyToXML",
      "importMetadataItemFromYAML",
      "exportMetadataItemToXML",
      "exportMetadataCollectionToXML",
    ]
    const offenders = listTypeScriptFiles(METADATA_DIR)
      .filter((filePath) => !filePath.endsWith(".test.ts"))
      .map((filePath) => ({
        filePath: relative(process.cwd(), filePath),
        source: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ filePath }) => !DEFERRED_LEGACY_YAML_XML_FILES.has(filePath))
      .filter(({ source }) => forbiddenSymbols.some((symbol) => source.includes(symbol)))
      .map(({ filePath }) => filePath)

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

const ALLOWED_DIRECT_RULE_TYPE_OFFENDERS = new Set<string>()

function listRulesFiles(dir: string): string[] {
  return listTypeScriptFiles(dir).filter((filePath) => filePath.endsWith("/rules.ts"))
}

function listTypeScriptFiles(dir: string, options: { includeTests?: boolean } = {}): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_SCAN_DIRS.has(entry)) continue

    const fullPath = join(dir, entry)
    let stat
    try {
      stat = lstatSync(fullPath)
    } catch (caught) {
      if (caught instanceof Error && "code" in caught && caught.code === "ENOENT") continue
      throw caught
    }
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
