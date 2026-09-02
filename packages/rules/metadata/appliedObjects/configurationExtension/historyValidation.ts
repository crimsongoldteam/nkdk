import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"
import { compareCompatibilityModes, normalizeCompatibilityMode } from "./propertyStateCapabilities"
import { createConfigurationExtensionHistoryRegistry } from "./historyCapabilities"

const history = createConfigurationExtensionHistoryRegistry()

export function validateConfigurationExtensionHistory(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const modes = new Map<string, string>()
  for (const fact of params.facts) {
    if (fact.entry.documentKind !== "configurationExtensionStructure") continue
    const payload = structurePayload(fact.entry.payload)
    if (payload.compatibilityMode !== undefined) modes.set(fact.componentPath, payload.compatibilityMode)
  }
  for (const fact of params.facts) {
    if (!fact.componentPath.startsWith("cfe/") || fact.entry.documentKind !== "configurationExtensionStructure") continue
    if (structurePayload(fact.entry.payload).dataHistory !== "Использовать") continue
    const capability = history.resolve(fact.entry.name)
    if (capability === undefined || capability.availability === "notApplicable") continue
    const hasBase = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf", logicalAddress: fact.entry.logicalAddress,
    }).some(({ documentKind }) => documentKind === "configurationExtensionStructure")
    if (!hasBase) diagnostics.push({
      filePath: fact.projectPath, line: 1, col: 1,
      severity: "error", source: "structure", path: "/ИсторияДанных",
      message: capability.availability === "versioned" && compareCompatibilityModes(
        normalizeCompatibilityMode(modes.get(fact.componentPath)), capability.sinceMode,
      ) < 0
        ? `Собственный объект вида «${fact.entry.name}» недоступен в истории данных до ${capability.sinceMode}`
        : `В истории данных нельзя использовать объект или поле «${fact.entry.logicalAddress}», добавленное расширением`,
    })
  }
  for (const fact of params.facts) {
    if (!fact.componentPath.startsWith("cfe/") || fact.entry.documentKind !== "configurationExtensionStructure") continue
    const payload = structurePayload(fact.entry.payload)
    if (
      fact.entry.name !== "MetadataTabularSection" ||
      payload.lineNumberLength === undefined || payload.lineNumberLength === 5 ||
      compareCompatibilityModes(normalizeCompatibilityMode(modes.get(fact.componentPath)), "Версия8_3_27") >= 0
    ) continue
    const hasBase = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf", logicalAddress: fact.entry.logicalAddress,
    }).some(({ documentKind }) => documentKind === "configurationExtensionStructure")
    if (hasBase) continue
    diagnostics.push({
      filePath: fact.projectPath, line: 1, col: 1,
      severity: "error", source: "structure", path: "/ДлинаНомераСтроки",
      message: "В режиме совместимости 8.3.26 и ниже длина номера строки должна быть равна 5",
    })
  }
  return diagnostics
}

function structurePayload(payload: string | undefined): { compatibilityMode?: string; lineNumberLength?: number; dataHistory?: string } {
  if (payload === undefined) return {}
  const value = JSON.parse(payload) as { compatibilityMode?: unknown; lineNumberLength?: unknown; dataHistory?: unknown }
  return {
    ...(typeof value.compatibilityMode === "string" ? { compatibilityMode: value.compatibilityMode } : {}),
    ...(typeof value.lineNumberLength === "number" ? { lineNumberLength: value.lineNumberLength } : {}),
    ...(typeof value.dataHistory === "string" ? { dataHistory: value.dataHistory } : {}),
  }
}
