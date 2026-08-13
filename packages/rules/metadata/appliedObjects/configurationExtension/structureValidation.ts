import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"
import { createConfigurationExtensionStructureRegistry } from "./structureCapabilities"
import { CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT } from "../../ruleRuntime/property/configurationExtensionStructureFacts"
import { compareCompatibilityModes, normalizeCompatibilityMode } from "./propertyStateCapabilities"

const registry = createConfigurationExtensionStructureRegistry()

export function validateConfigurationExtensionStructure(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const compatibilityModes = new Map<string, string>()
  const extensionFacts = new Map<string, ProjectStateStructuredDocumentEntry>()
  for (const fact of params.facts) {
    if (fact.entry.documentKind !== CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT) continue
    if (fact.componentPath.startsWith("cfe/")) extensionFacts.set(`${fact.componentPath}:${fact.entry.logicalAddress}`, fact.entry)
    const compatibilityMode = structureCompatibilityMode(fact.entry.payload)
    if (compatibilityMode !== undefined) compatibilityModes.set(fact.componentPath, compatibilityMode)
  }
  for (const [key, root] of extensionFacts) {
    if (root.logicalAddress !== "Configuration") continue
    if (!key.includes(":")) continue
    const hasBaseConfiguration = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf", logicalAddress: "Configuration",
    }).some(({ documentKind }) => documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
    if (hasBaseConfiguration) continue
    diagnostics.push(structureDiagnostic(
      params, root.workingProjectPath,
      "Для валидации расширения требуется индекс расширяемой конфигурации cf",
    ))
  }
  for (const fact of params.facts) {
    if (
      !fact.componentPath.startsWith("cfe/") ||
      fact.entry.documentKind !== CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT
    ) continue
    const base = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: fact.entry.logicalAddress,
    }).some(({ documentKind }) => documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
    if (base) continue
    const payload = structurePayload(fact.entry.payload)
    if (fact.entry.name === "MetadataExchangePlan" && payload.distributedInfoBase === true) {
      diagnostics.push({
        ...structureDiagnostic(params, fact.projectPath,
          "План обмена, добавленный расширением, нельзя использовать в распределённой информационной базе"),
        path: "/РаспределеннаяИнформационнаяБаза",
      })
      continue
    }
    if (
      payload.usesRestrictedTypes === true && compareCompatibilityModes(
        normalizeCompatibilityMode(compatibilityModes.get(fact.componentPath)), "Версия8_3_20",
      ) < 0
    ) {
      diagnostics.push({
        ...structureDiagnostic(params, fact.projectPath,
          "Наборы типов и определяемые типы недоступны до Версия8_3_20"),
        path: "/Тип",
      })
      continue
    }
    if (movedBorrowedObject(params, fact.componentPath, fact.entry, extensionFacts)) {
      diagnostics.push(structureDiagnostic(
        params, fact.projectPath,
        `Нельзя перемещать заимствованный объект «${fact.entry.logicalAddress}» в собственный объект расширения`,
      ))
      continue
    }
    const parent = baseParent(params, fact.entry.logicalAddress)
    const collection = childCollection(fact.entry.name, parent?.name)
    const capability = registry.resolve(fact.entry.name)
    const since = capability.sinceMode ?? childAvailabilitySince(fact.entry.name, parent?.name)
    const unavailableByVersion = since !== undefined && compareCompatibilityModes(
      normalizeCompatibilityMode(compatibilityModes.get(fact.componentPath)), since,
    ) < 0
    const forbidden = unavailableByVersion || !capability.ownObject || (
      parent !== undefined && collection !== undefined &&
      !registry.allowsOwnBorrowedChild(parent.name, collection)
    )
    if (!forbidden) continue
    diagnostics.push(structureDiagnostic(params, fact.projectPath, unavailableByVersion
      ? `Собственный объект вида «${fact.entry.name}» недоступен до ${since}`
      : parent === undefined
        ? `Собственный объект вида «${fact.entry.name}» запрещён в расширении`
        : `Нельзя добавить собственный объект вида «${fact.entry.name}» в заимствованный «${parent.name}»`))
  }
  return diagnostics
}

function childAvailabilitySince(itemType: string, parentItemType: string | undefined): string | undefined {
  return itemType === "MetadataIntegrationServiceChannel" && parentItemType === "MetadataIntegrationService"
    ? "Версия8_3_9"
    : undefined
}

function movedBorrowedObject(
  params: ProjectStateStructuredDocumentValidationParams,
  componentPath: string,
  entry: ProjectStateStructuredDocumentEntry,
  extensionFacts: ReadonlyMap<string, ProjectStateStructuredDocumentEntry>,
): boolean {
  if (entry.name !== "MetadataSubsystem") return false
  const parts = entry.logicalAddress.split(".")
  if (parts.length < 4) return false
  const originalAddress = parts.slice(-2).join(".")
  const existsAtOriginalAddress = params.queryPort.readStructuredDocumentEntries({
    componentPath: "cf", logicalAddress: originalAddress,
  }).some(({ documentKind, name }) =>
    documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT && name === entry.name)
  if (!existsAtOriginalAddress) return false
  const parentAddress = parts.slice(0, -2).join(".")
  const extensionParent = extensionFacts.get(`${componentPath}:${parentAddress}`)
  if (extensionParent === undefined) return false
  return !params.queryPort.readStructuredDocumentEntries({
    componentPath: "cf", logicalAddress: parentAddress,
  }).some(({ documentKind }) => documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
}

function structureCompatibilityMode(payload: string | undefined): string | undefined {
  return structurePayload(payload).compatibilityMode
}

function structurePayload(payload: string | undefined): {
  compatibilityMode?: string
  distributedInfoBase?: boolean
  usesRestrictedTypes?: boolean
} {
  if (payload === undefined) return {}
  const value = JSON.parse(payload) as Record<string, unknown>
  return {
    ...(typeof value.compatibilityMode === "string" ? { compatibilityMode: value.compatibilityMode } : {}),
    ...(typeof value.distributedInfoBase === "boolean" ? { distributedInfoBase: value.distributedInfoBase } : {}),
    ...(typeof value.usesRestrictedTypes === "boolean" ? { usesRestrictedTypes: value.usesRestrictedTypes } : {}),
  }
}

function structureDiagnostic(
  params: ProjectStateStructuredDocumentValidationParams,
  projectPath: string,
  message: string,
): Diagnostic {
  return {
    filePath: join(params.projectDir, ...projectPath.split("/")),
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message,
  }
}

function baseParent(
  params: ProjectStateStructuredDocumentValidationParams,
  logicalAddress: string,
): ProjectStateStructuredDocumentEntry | undefined {
  let current = logicalAddress
  while (current.includes(".")) {
    current = current.split(".").slice(0, -2).join(".")
    const parent = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: current,
    }).find(({ documentKind }) => documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
    if (parent !== undefined) return parent
  }
  return undefined
}

function childCollection(itemType: string, parentItemType: string | undefined): string | undefined {
  if (itemType === "MetadataWebServiceOperation") return "operations"
  if (itemType === "MetadataWebServiceParameter") return "parameters"
  if (itemType === "MetadataHTTPServiceURLTemplate") return "urlTemplates"
  if (itemType === "MetadataHTTPServiceMethod") return "methods"
  if (itemType === "MetadataIntegrationServiceChannel") return "channels"
  if (itemType === "MetadataDocumentJournalColumn") return "columns"
  if (itemType === "MetadataTabularSection") return "tabularSections"
  if (itemType === "MetadataRegisterDimension") return "dimensions"
  if (itemType === "MetadataRegisterResource") return "resources"
  if (itemType === "MetadataCalculationRegisterRecalculation") return "recalculations"
  if (itemType.includes("AccountingFlag")) return itemType.includes("ExtDimension")
    ? "extDimensionAccountingFlags"
    : "accountingFlags"
  if (itemType === "MetadataAttribute" || itemType === "MetadataRegisterAttribute") {
    return parentItemType === "MetadataTabularSection" ? "tabularSectionAttributes" : "attributes"
  }
  return undefined
}
