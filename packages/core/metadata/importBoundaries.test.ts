import { existsSync, readFileSync, readdirSync } from "fs"
import { dirname, join, relative, resolve } from "path"
import { beforeAll, describe, expect, it } from "vitest"
import { readSourceTreeOnce, type SourceTreeFile } from "../tests/sourceTreeSnapshot"

const METADATA_DIR = join(process.cwd(), "metadata")
const ORCHESTRATION_DIR = join(METADATA_DIR, "ruleRuntime")
const ORCHESTRATION_APPLIED_OBJECT_DIR = join(METADATA_DIR, "ruleRuntime", "appliedObject")
const ORCHESTRATION_FORM_ELEMENT_DIR = join(METADATA_DIR, "ruleRuntime", "formElement")
const PROJECT_DIR = join(METADATA_DIR, "project")
const PROJECT_STATE_DIR = join(METADATA_DIR, "projectState")
const PROJECT_STATE_BINARY_DIR = join(PROJECT_STATE_DIR, "binary")
const SHARED_METADATA_BINARY_DIR = join(METADATA_DIR, "binary")
const WORKSPACE_ROOT = join(process.cwd(), "..", "..")
const PACKAGES_FOR_ALIAS_SCAN = ["packages/core", "packages/mcp"] as const
const CONFIG_FILES_FOR_ALIAS_SCAN = [
  "packages/core/tsconfig.json",
  "packages/mcp/tsconfig.json",
  "packages/core/vitest.config.ts",
  "packages/mcp/vitest.config.ts",
] as const

const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = ["../../appliedObjects/configuration/"] as const
const FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS = ["../formElement/factory", "./formElement/factory"] as const
const FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS = ["./factory"] as const
const FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS = ["../forms/elements/baseElement/types"] as const
const FORBIDDEN_PROJECT_CONCRETE_METADATA_IMPORTS = [
  "../appliedObjects/",
  "../commonObjects/",
  "../forms/",
  "../systemEnumerations/",
] as const
const REGISTRATION_ENTRYPOINT_ALLOWLIST = new Set([
  "index.ts",
  "metadata/composition/coreMetadata.ts",
  "metadata/composition/coreMetadata.test.ts",
  "tests/setupTests.ts",
  "metadata/projectDefinition/schemaRegistry.ts",
  "metadata/projectDefinition/specs.ts",
  "metadata/projectDefinition/specs.test.ts",
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
const LEGACY_FULL_VALIDATION_INDEX_ALLOWLIST = new Set(["packages/core/metadata/importBoundaries.test.ts"])
const FORBIDDEN_LEGACY_FULL_VALIDATION_MODULE_SUFFIXES = [
  "/sharedProjectReferenceIndex",
  "/sharedValidationBinaryOwners",
  "/sharedValidationSnapshot",
  "/persistedSharedValidationSnapshot",
  "/validationSnapshotProvider",
  "/dataPath/sharedOwnerCache",
] as const
const FORBIDDEN_VALIDATION_WORKER_FIELDS = [
  "validationSnapshot",
  "sharedValidation",
  "sharedReferenceIndex",
  "sharedProjectValidationGraph",
] as const
let sourceFiles: readonly SourceTreeFile[]
let sourceByAbsolutePath: ReadonlyMap<string, string>
let legacyAliasOffenders: {
  readonly importOffenders: readonly { readonly filePath: string; readonly specifiers: readonly string[] }[]
  readonly configOffenders: readonly { readonly filePath: string; readonly hasAlias: boolean }[]
}
let broadRegistrationOffenders: readonly {
  readonly filePath: string
  readonly forbiddenImports: readonly string[]
}[]
let compositeProductionOffenders: readonly string[]
let sqliteImportOffenders: readonly string[]
let binaryBoundaryOffenders: readonly string[]
let legacyFullValidationIndexOffenders: readonly {
  readonly filePath: string
  readonly forbiddenModulePath: boolean
  readonly forbiddenImports: readonly string[]
  readonly forbiddenWorkerFields: readonly string[]
}[]

describe("metadata import boundaries", () => {
  beforeAll(() => {
    sourceFiles = [
      ...readSourceTreeOnce(join(WORKSPACE_ROOT, "packages", "core")),
      ...readSourceTreeOnce(join(WORKSPACE_ROOT, "packages", "mcp")),
    ]
    sourceByAbsolutePath = new Map(sourceFiles.map((file) => [file.absolutePath, file.source]))
    const importOffenders = PACKAGES_FOR_ALIAS_SCAN.flatMap((packagePath) =>
      listTypeScriptFiles(join(WORKSPACE_ROOT, packagePath), { includeTests: true })
        .map((filePath) => ({
          filePath: relative(WORKSPACE_ROOT, filePath),
          specifiers: extractModuleSpecifiers(readSource(filePath)).filter(
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
    legacyAliasOffenders = { importOffenders, configOffenders }

    broadRegistrationOffenders = findBroadRegistrationOffenders()
    compositeProductionOffenders = findCompositeProductionOffenders()
    sqliteImportOffenders = findSqliteImportOffenders()
    binaryBoundaryOffenders = findBinaryBoundaryOffenders()
    legacyFullValidationIndexOffenders = findLegacyFullValidationIndexOffenders()
  })

  it("workspace TypeScript and test configs do not use legacy ~ alias", () => {
    expect(legacyAliasOffenders).toEqual({
      importOffenders: [],
      configOffenders: [],
    })
  })

  it("изолирует служебные проекты Vitest в заданном порядке", () => {
    const source = readFileSync(join(import.meta.dirname, "../vitest.config.ts"), "utf8")

    expect(source).toMatch(/name:\s*"isolation-mutation"[\s\S]*?groupOrder:\s*0/u)
    expect(source).toMatch(/name:\s*"isolation-observation"[\s\S]*?groupOrder:\s*1/u)
  })

  it("composition roots own runtime assembly", () => {
    expect(existsSync(join(METADATA_DIR, "register.ts"))).toBe(false)
    expect(existsSync(join(METADATA_DIR, "projectState", "createDefaultService.ts"))).toBe(false)
    expect(existsSync(join(METADATA_DIR, "workerPool", "registerOperations.ts"))).toBe(false)
  })

  it("ruleRuntime/appliedObject не импортирует configuration migrations", () => {
    expect(
      findImportOffenders(ORCHESTRATION_APPLIED_OBJECT_DIR, FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS)
    ).toEqual([])
  })

  it("production-код не импортирует type-rule registry через formElement/factory", () => {
    const offenders = [
      ...findImportOffenders(METADATA_DIR, FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS),
      ...findImportOffenders(ORCHESTRATION_FORM_ELEMENT_DIR, FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS),
    ].filter(({ filePath }) => filePath !== "metadata/ruleRuntime/formElement/factory.ts")

    expect(offenders).toEqual([])
  })

  it("ruleRuntime не импортирует модель baseElement из forms", () => {
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

  it("project coordination does not own shared project definitions", () => {
    for (const file of [
      "path.ts",
      "resources.ts",
      "specs.ts",
      "projectSpecRegistry.ts",
      "schemaRegistry.ts",
    ]) {
      expect(existsSync(join(METADATA_DIR, "project", file))).toBe(false)
      expect(existsSync(join(METADATA_DIR, "projectDefinition", file))).toBe(true)
    }
  })

  it("XML import discovery не знает конкретные объекты и папки", () => {
    const files = ["importFromXml/discovery.ts", "resourceTopology/core/xmlImportProjection.ts"]

    for (const file of files) {
      const source = readFileSync(join(METADATA_DIR, file), "utf-8")
      for (const forbidden of ["MetadataCatalog", "ClientApplicationForm", "Catalogs", "Forms", "Templates"]) {
        expect(source).not.toContain(forbidden)
      }
    }
  })

  it("metadataTargetString не знает concrete metadata itemType/root", () => {
    const source = readFileSync(join(METADATA_DIR, "ruleRuntime", "property", "metadataTargetString.ts"), "utf-8")

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

  it("source worker pools resolve their TypeScript loader through one runtime helper", () => {
    const sourceWorkerPools = [
      "workerPool/handle.ts",
      "importFromXml/workerPool.ts",
      "project/preparedYamlProjectWorkerPool.ts",
      "fullSyncToXml/workerPool.ts",
    ]

    for (const relativePath of sourceWorkerPools) {
      const source = readFileSync(join(METADATA_DIR, relativePath), "utf-8")
      expect(source).toContain("sourceWorkerExecArgv")
      expect(source).not.toContain('["--import", "tsx"]')
    }
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

  it("standardMembers registry is independent from DataPath", () => {
    const declarations = readFileSync(join(METADATA_DIR, "standardMembers", "declarations.ts"), "utf-8")
    expect(declarations).not.toContain("validation/dataPath")

    const appliedFiles = readdirSync(join(METADATA_DIR, "appliedObjects"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(METADATA_DIR, "appliedObjects", entry.name, "standardMembers.ts"))
      .filter(existsSync)

    for (const file of appliedFiles) {
      expect(readFileSync(file, "utf-8")).toContain('from "../../standardMembers/declarations"')
    }
  })

  it("I8nText registry entry живёт рядом с владельцем", () => {
    const globalRegistry = readFileSync(join(METADATA_DIR, "ruleRuntime", "property", "registry.ts"), "utf-8")
    const localRegistry = readFileSync(join(METADATA_DIR, "commonObjects", "i8nText", "registry.types.ts"), "utf-8")

    expect(globalRegistry).not.toMatch(/^\s+I8nText: \{/m)
    expect(globalRegistry).not.toMatch(/^\s+I8nText: "I8nText",/m)
    expect(localRegistry).toContain("interface PropertyMetadataTypeMap")
    expect(localRegistry).toContain("interface PropertyEnterpriseTypeMap")
    expect(localRegistry).toContain("interface PropertyYAMLTypeMap")
    expect(localRegistry).toContain("I8nText: I8nText")
  })

  it("ruleRuntime property registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "ruleRuntime", "property", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface PropertyTypeRegistry")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type PropertyRuleType = string")
  })

  it("ruleRuntime metadata item registry is no longer a concrete metadata type list", () => {
    const source = readFileSync(join(METADATA_DIR, "ruleRuntime", "metadataItem", "registry.ts"), "utf-8")

    expect(source).not.toContain("interface MetadataItemTypeRegistry")
    expect(source).not.toContain("//#region Applied objects")
    expect(source).not.toMatch(/from "~\/metadata\/(appliedObjects|commonObjects|forms)\//)
    expect(source).toContain("export type MetadataItemType = string")
  })

  it("central metadata registries expose only neutral string keys", () => {
    const propertyRegistry = readFileSync(join(METADATA_DIR, "ruleRuntime", "property", "registry.ts"), "utf-8")
    const metadataItemRegistry = readFileSync(
      join(METADATA_DIR, "ruleRuntime", "metadataItem", "registry.ts"),
      "utf-8"
    )

    expect(propertyRegistry.trim()).toContain("export type PropertyRuleType = string")
    expect(metadataItemRegistry.trim()).toContain("export type MetadataItemType = string")
    expect(propertyRegistry).not.toContain("interface PropertyTypeRegistry")
    expect(metadataItemRegistry).not.toContain("interface MetadataItemTypeRegistry")
  })

  it("новые широкие metadata-регистрации идут через composition/coreMetadata", () => {
    expect(broadRegistrationOffenders).toEqual([])
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
        source: readSource(filePath),
      }))
      .filter(({ source }) => {
        if (!source.includes("registerMetadataItemCollectionRule")) return false
        return /fromYAML:\s*(?:import|createImport)/.test(source) || source.includes("exportMetadataCollectionToXML")
      })
      .map(({ filePath }) => filePath)

    expect(offenders).toEqual([])
  })

  it("составные production-типы не вызывают общую YAML/XML-оркестрацию", () => {
    expect(compositeProductionOffenders).toEqual([])
  })

  it("состояние проекта не импортирует node:sqlite", () => {
    expect(sqliteImportOffenders).toEqual([])
  })

  it("только двоичные адаптеры знают structurae и физический формат", () => {
    expect(binaryBoundaryOffenders).toEqual([])
  })

  it("production-код не содержит старое полное представление validation-индекса", () => {
    expect(legacyFullValidationIndexOffenders).toEqual([])
  })

  it("синхронизация и операции не хранят metadata-модель", () => {
    const files = [
      ...listTypeScriptFiles(join(METADATA_DIR, "fullSyncToXml")),
      ...listTypeScriptFiles(join(METADATA_DIR, "operations")),
      join(METADATA_DIR, "ruleRuntime", "appliedObject", "syncToXML.ts"),
    ].filter((filePath) => !filePath.endsWith(".test.ts"))
    const source = files.map(readSource).join("\n")

    expect(source).not.toContain("ownerModelStub")
    expect(source).not.toContain("modelStub")
    expect(source).not.toMatch(/\bmodel\s*:/)
  })
})

function findBroadRegistrationOffenders() {
  return listCoreTypeScriptFiles()
    .filter((filePath) => !REGISTRATION_ENTRYPOINT_ALLOWLIST.has(filePath))
    .map((filePath) => ({
      filePath,
      forbiddenImports: findForbiddenModuleSpecifiers(
        readSource(join(process.cwd(), filePath)),
        BROAD_METADATA_REGISTRATION_IMPORTS
      ),
    }))
    .filter(({ forbiddenImports }) => forbiddenImports.length > 0)
}

function findCompositeProductionOffenders(): string[] {
  const forbiddenSymbols = [
    "importPropertiesFromYAML",
    "exportPropertiesToXML",
    "importPropertyFromYAML",
    "exportPropertyToXML",
    "importMetadataItemFromYAML",
    "exportMetadataItemToXML",
    "importMetadataItemCollectionFromYAMLAsArray",
    "importMetadataItemCollectionFromYAMLAsRecord",
    "exportMetadataCollectionToXML",
    "importPropertiesFromXML",
    "exportPropertiesToYAML",
    "importMetadataItemFromXML",
    "exportMetadataItemToYAML",
    "importMetadataItemCollectionFromXML",
    "exportMetadataCollectionToYAMLAsArray",
    "exportMetadataCollectionToYAMLAsRecord",
  ]
  return listTypeScriptFiles(METADATA_DIR)
    .filter((filePath) => !filePath.endsWith(".test.ts"))
    .map((filePath) => ({
      filePath: relative(process.cwd(), filePath),
      source: readSource(filePath),
    }))
    .filter(({ source }) => forbiddenSymbols.some((symbol) => new RegExp(`\\b${symbol}\\b`).test(source)))
    .map(({ filePath }) => filePath)
}

function findSqliteImportOffenders(): string[] {
  return listTypeScriptFiles(PROJECT_STATE_DIR)
    .filter((filePath) => extractModuleSpecifiers(readSource(filePath)).includes("node:sqlite"))
    .map((filePath) => relative(process.cwd(), filePath))
}

function findBinaryBoundaryOffenders(): string[] {
  const binaryPrefixes = [PROJECT_STATE_BINARY_DIR, SHARED_METADATA_BINARY_DIR]
    .map((directory) => `${resolve(directory)}/`)
  const sharedHashIndex = resolve(SHARED_METADATA_BINARY_DIR, "hashIndex")
  const physicalModules = /(?:^|\/)binary\/(?:layouts|hashIndex|stringPool)$/u
  return listTypeScriptFiles(METADATA_DIR)
    .filter((filePath) => !binaryPrefixes.some((prefix) => resolve(filePath).startsWith(prefix)))
    .filter((filePath) => !/(?:^|\/)(?:binaryResult|projectQueries)\.ts$/u.test(filePath))
    .filter((filePath) => extractModuleSpecifiers(readSource(filePath)).some(
      (specifier) => specifier === "structurae"
        || (
          physicalModules.test(specifier)
          && resolve(dirname(filePath), specifier) !== sharedHashIndex
        ),
    ))
    .map((filePath) => relative(process.cwd(), filePath))
}

function findLegacyFullValidationIndexOffenders() {
  return sourceFiles
    .map((file) => ({
      filePath: relative(WORKSPACE_ROOT, file.absolutePath),
      source: file.source,
    }))
    .filter(({ filePath }) => !LEGACY_FULL_VALIDATION_INDEX_ALLOWLIST.has(filePath))
    .map(({ filePath, source }) => ({
      filePath,
      forbiddenModulePath: FORBIDDEN_LEGACY_FULL_VALIDATION_MODULE_SUFFIXES.some((suffix) =>
        filePath.endsWith(`${suffix.slice(1)}.ts`)
      ),
      forbiddenImports: extractModuleSpecifiers(source).filter((specifier) =>
        FORBIDDEN_LEGACY_FULL_VALIDATION_MODULE_SUFFIXES.some((suffix) => specifier.endsWith(suffix))
      ),
      forbiddenWorkerFields: filePath.endsWith(".test.ts")
        ? []
        : FORBIDDEN_VALIDATION_WORKER_FIELDS.filter((field) => new RegExp(`\\b${field}\\b`).test(source)),
    }))
    .filter(({ forbiddenModulePath, forbiddenImports, forbiddenWorkerFields }) =>
      forbiddenModulePath || forbiddenImports.length > 0 || forbiddenWorkerFields.length > 0
    )
}

function findImportOffenders(dir: string, forbiddenImports: readonly string[]) {
  return listTypeScriptFiles(dir)
    .map((filePath) => ({
      filePath: relative(process.cwd(), filePath),
      forbiddenImports: findForbiddenImports(readSource(filePath), forbiddenImports),
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
  const absoluteDir = resolve(dir)
  const prefix = `${absoluteDir}/`
  return sourceFiles
    .filter(
      (file) =>
        (file.absolutePath === absoluteDir || file.absolutePath.startsWith(prefix)) &&
        (options.includeTests || !file.absolutePath.endsWith(".test.ts"))
    )
    .map((file) => file.absolutePath)
}

function readSource(filePath: string): string {
  const absolutePath = resolve(filePath)
  return sourceByAbsolutePath.get(absolutePath) ?? readFileSync(absolutePath, "utf-8")
}
