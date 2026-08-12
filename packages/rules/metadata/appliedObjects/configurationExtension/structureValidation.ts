import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"
import { createConfigurationExtensionStructureRegistry } from "./structureCapabilities"
import { CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT } from "../../ruleRuntime/property/configurationExtensionStructureFacts"

const registry = createConfigurationExtensionStructureRegistry()

export function validateConfigurationExtensionStructure(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
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
    const parent = baseParent(params, fact.entry.logicalAddress)
    const collection = childCollection(fact.entry.name, parent?.name)
    const forbidden = !registry.resolve(fact.entry.name).ownObject || (
      parent !== undefined && collection !== undefined &&
      !registry.allowsOwnBorrowedChild(parent.name, collection)
    )
    if (!forbidden) continue
    diagnostics.push({
      filePath: join(params.projectDir, ...fact.projectPath.split("/")),
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      message: parent === undefined
        ? `Собственный объект вида «${fact.entry.name}» запрещён в расширении`
        : `Нельзя добавить собственный объект вида «${fact.entry.name}» в заимствованный «${parent.name}»`,
    })
  }
  return diagnostics
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
