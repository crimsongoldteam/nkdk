import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"

const SINCE = new Map<string, string>([
  ["MetadataCatalog", "Версия8_3_11"],
  ["MetadataDocument", "Версия8_3_11"],
  ["MetadataBusinessProcess", "Версия8_3_11"],
  ["MetadataTask", "Версия8_3_11"],
  ["MetadataInformationRegister", "Версия8_3_11"],
  ["MetadataChartOfCharacteristicTypes", "Версия8_3_12"],
  ["MetadataChartOfAccounts", "Версия8_3_12"],
  ["MetadataConstant", "Версия8_3_13"],
  ["MetadataExchangePlan", "Версия8_3_13"],
  ["MetadataChartOfCalculationTypes", "Версия8_3_13"],
])

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
    const since = SINCE.get(fact.entry.name)
    if (since === undefined) continue
    const hasBase = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf", logicalAddress: fact.entry.logicalAddress,
    }).some(({ documentKind }) => documentKind === "configurationExtensionStructure")
    if (hasBase || compare(mode(modes.get(fact.componentPath)), since) >= 0) continue
    diagnostics.push({
      filePath: join(params.projectDir, ...fact.projectPath.split("/")), line: 1, col: 1,
      severity: "error", source: "structure",
      message: `Собственный объект вида «${fact.entry.name}» недоступен в истории данных до ${since}`,
    })
  }
  for (const fact of params.facts) {
    if (!fact.componentPath.startsWith("cfe/") || fact.entry.documentKind !== "configurationExtensionStructure") continue
    const payload = structurePayload(fact.entry.payload)
    if (
      fact.entry.name !== "MetadataTabularSection" ||
      payload.lineNumberLength === undefined || payload.lineNumberLength === 5 ||
      compare(mode(modes.get(fact.componentPath)), "Версия8_3_27") >= 0
    ) continue
    const hasBase = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf", logicalAddress: fact.entry.logicalAddress,
    }).some(({ documentKind }) => documentKind === "configurationExtensionStructure")
    if (hasBase) continue
    diagnostics.push({
      filePath: join(params.projectDir, ...fact.projectPath.split("/")), line: 1, col: 1,
      severity: "error", source: "structure", path: "/ДлинаНомераСтроки",
      message: "В режиме совместимости 8.3.26 и ниже длина номера строки должна быть равна 5",
    })
  }
  return diagnostics
}

function structurePayload(payload: string | undefined): { compatibilityMode?: string; lineNumberLength?: number } {
  if (payload === undefined) return {}
  const value = JSON.parse(payload) as { compatibilityMode?: unknown; lineNumberLength?: unknown }
  return {
    ...(typeof value.compatibilityMode === "string" ? { compatibilityMode: value.compatibilityMode } : {}),
    ...(typeof value.lineNumberLength === "number" ? { lineNumberLength: value.lineNumberLength } : {}),
  }
}

function mode(value: string | undefined): string {
  return value === undefined || value === "НеИспользовать" || value === "DontUse" ? "Версия8_3_27" : value
}

function compare(left: string, right: string): number {
  const version = (value: string) => value.match(/\d+/gu)?.map(Number) ?? []
  const first = version(left)
  const second = version(right)
  for (let index = 0; index < Math.max(first.length, second.length); index += 1) {
    const difference = (first[index] ?? 0) - (second[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}
