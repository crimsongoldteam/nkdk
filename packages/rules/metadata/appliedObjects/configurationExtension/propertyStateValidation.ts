import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../../ruleRuntime/property/propertyStateFacts"
import { CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT } from "../../ruleRuntime/property/configurationExtensionStructureFacts"
import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"
import { validatePredefinedCollectionState } from "./collectionStateValidation"

const propertyStates = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)

export function validateConfigurationExtensionPropertyStates(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const compatibilityModes = extensionCompatibilityModes(params)
  for (const fact of params.facts) {
    if (
      !fact.componentPath.startsWith("cfe/") ||
      fact.entry.documentKind !== CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT
    ) continue
    const extension = parsePayload(fact.entry)
    const base = params.queryPort.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: fact.entry.logicalAddress,
    }).find((entry) =>
      entry.documentKind === CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT &&
      entry.name === fact.entry.name)
    const basePayload = base === undefined ? undefined : parsePayload(base)
    if (basePayload === undefined) {
      const baseObjectExists = params.queryPort.readStructuredDocumentEntries({
        componentPath: "cf",
        logicalAddress: fact.entry.logicalAddress,
      }).some((entry) => entry.documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
      if (!baseObjectExists && extension.explicitMode !== true) continue
      diagnostics.push(diagnostic(params.projectDir, fact.projectPath, fact.entry, "error",
        `Свойство «${extension.propertyKey}» отсутствует в основной конфигурации`))
      continue
    }
    if (
      extension.itemType === "MetadataFunctionalOption" &&
      extension.propertyKey === "content" &&
      !functionalOptionHasBooleanLocation(params, fact.entry.logicalAddress)
    ) {
      diagnostics.push(diagnostic(params.projectDir, fact.projectPath, fact.entry, "error",
        "Состав функциональной опции доступен только при булевом типе объекта из Размещения"))
      continue
    }
    const external = externalProjectPath(extension.value)
    if (external !== undefined) {
      diagnostics.push(...validateExternalFile({
        params,
        fact,
        mode: extension.mode,
        extensionProjectPath: external,
        baseProjectPath: externalProjectPath(basePayload.value),
      }))
      continue
    }
    const compatibilityMode = compatibilityModes.get(fact.componentPath)
    const capability = propertyStates.resolve({
      itemType: extension.itemType,
      propertyKey: extension.propertyKey,
      compatibilityMode,
    })
    const knownItem = propertyStates.item(extension.itemType, compatibilityMode)
    if (
      extension.mode !== "xml" && knownItem !== undefined &&
      (capability === undefined || !capability.modes.includes(extension.mode))
    ) {
      diagnostics.push(diagnostic(params.projectDir, fact.projectPath, fact.entry, "error",
        `Режим свойства «${extension.propertyKey}» недоступен при ${compatibilityMode ?? "Версия8_3_27"}`))
      continue
    }
    if (extension.propertyKey === "predefined") {
      diagnostics.push(...validatePredefinedCollectionState({
        projectDir: params.projectDir,
        projectPath: fact.projectPath,
        entry: fact.entry,
        extension: extension.value,
        base: basePayload.value,
      }))
      continue
    }
    if (extension.mode === "extend" || extension.mode === "xml") continue
    if (extension.mode === "multi") {
      diagnostics.push(...validateMulti({
        projectDir: params.projectDir,
        projectPath: fact.projectPath,
        entry: fact.entry,
        propertyKey: extension.propertyKey,
        extension: extension.value,
        base: basePayload.value,
      }))
      continue
    }
    if (sameValue(extension.value, basePayload.value)) continue
    const severity = extension.mode === "notify" ? "warning" : "error"
    diagnostics.push(diagnostic(params.projectDir, fact.projectPath, fact.entry, severity,
      severity === "warning"
        ? `Проверяемое свойство «${extension.propertyKey}» отличается от основной конфигурации`
        : `Контролируемое свойство «${extension.propertyKey}» отличается от основной конфигурации`))
  }
  return diagnostics
}

function functionalOptionHasBooleanLocation(
  params: ProjectStateStructuredDocumentValidationParams,
  logicalAddress: string,
): boolean {
  const option = params.queryPort.readStructuredDocumentEntries({
    componentPath: "cf",
    logicalAddress,
  }).find((entry) => entry.documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
  const optionPayload = parseStructurePayload(option?.payload)
  if (typeof optionPayload.location !== "string") return false
  const location = params.queryPort.readStructuredDocumentEntries({
    componentPath: "cf",
    logicalAddress: optionPayload.location,
  }).find((entry) => entry.documentKind === CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT)
  return parseStructurePayload(location?.payload).valueType === "Булево"
}

function parseStructurePayload(payload: string | undefined): { location?: unknown; valueType?: unknown } {
  return payload === undefined ? {} : JSON.parse(payload) as { location?: unknown; valueType?: unknown }
}

function validateExternalFile(params: {
  readonly params: ProjectStateStructuredDocumentValidationParams
  readonly fact: ProjectStateStructuredDocumentValidationParams["facts"][number]
  readonly mode: ConfigurationExtensionPropertyStateFactPayload["mode"]
  readonly extensionProjectPath: string
  readonly baseProjectPath: string | undefined
}): readonly Diagnostic[] {
  const extensionHash = params.params.queryPort.readFileHash?.({
    componentPath: params.fact.componentPath,
    projectPath: params.extensionProjectPath,
  })
  if (extensionHash === undefined) {
    return [diagnostic(params.params.projectDir, params.fact.projectPath, params.fact.entry, "error",
      `Отсутствует внешний файл «${params.extensionProjectPath}»`)]
  }
  if (params.mode === "extend" || params.mode === "xml") return []
  if (params.baseProjectPath === undefined) {
    return [diagnostic(params.params.projectDir, params.fact.projectPath, params.fact.entry, "error",
      "Соответствующий внешний файл отсутствует в основной конфигурации")]
  }
  const baseHash = params.params.queryPort.readFileHash?.({ componentPath: "cf", projectPath: params.baseProjectPath })
  if (baseHash === undefined) {
    return [diagnostic(params.params.projectDir, params.fact.projectPath, params.fact.entry, "error",
      `Не найден хэш внешнего файла основной конфигурации «${params.baseProjectPath}»`)]
  }
  if (baseHash === extensionHash) return []
  const severity = params.mode === "notify" ? "warning" : "error"
  return [diagnostic(params.params.projectDir, params.fact.projectPath, params.fact.entry, severity,
    severity === "warning"
      ? "Проверяемый внешний файл отличается от основной конфигурации"
      : "Контролируемый внешний файл отличается от основной конфигурации")]
}

function externalProjectPath(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const projectPath = (value as { externalProjectPath?: unknown }).externalProjectPath
  return typeof projectPath === "string" ? projectPath : undefined
}

function extensionCompatibilityModes(
  params: ProjectStateStructuredDocumentValidationParams,
): ReadonlyMap<string, string> {
  const modes = new Map<string, string>()
  for (const fact of params.facts) {
    if (
      !fact.componentPath.startsWith("cfe/") ||
      fact.entry.documentKind !== CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT ||
      fact.entry.name !== "MetadataConfigurationExtension"
    ) continue
    const parsed = JSON.parse(fact.entry.payload ?? "null") as { compatibilityMode?: unknown } | null
    if (typeof parsed?.compatibilityMode === "string") modes.set(fact.componentPath, parsed.compatibilityMode)
  }
  return modes
}

function validateMulti(params: {
  readonly projectDir: string
  readonly projectPath: string
  readonly entry: ProjectStateStructuredDocumentEntry
  readonly propertyKey: string
  readonly extension: unknown
  readonly base: unknown
}): readonly Diagnostic[] {
  if (!Array.isArray(params.extension)) {
    return [diagnostic(params.projectDir, params.projectPath, params.entry, "error",
      `Некорректный MultiState свойства «${params.propertyKey}»`)]
  }
  const baseParts = Array.isArray(params.base) ? params.base : [{ mode: "control", value: params.base }]
  const diagnostics: Diagnostic[] = []
  for (const part of params.extension) {
    if (typeof part !== "object" || part === null) continue
    const { mode, value } = part as { mode?: unknown; value?: unknown }
    if (mode === "extend") continue
    const found = baseParts.some((basePart) =>
      typeof basePart === "object" && basePart !== null &&
      sameValue((basePart as { value?: unknown }).value, value))
    if (found) continue
    const severity = mode === "notify" ? "warning" : "error"
    diagnostics.push(diagnostic(params.projectDir, params.projectPath, params.entry, severity,
      severity === "warning"
        ? `Проверяемая часть свойства «${params.propertyKey}» отличается от основной конфигурации`
        : `Контролируемая часть свойства «${params.propertyKey}» отличается от основной конфигурации`))
  }
  return diagnostics
}

function parsePayload(entry: ProjectStateStructuredDocumentEntry): ConfigurationExtensionPropertyStateFactPayload {
  const parsed = JSON.parse(entry.payload ?? "null") as Partial<ConfigurationExtensionPropertyStateFactPayload> | null
  if (parsed?.version !== 1 || typeof parsed.itemType !== "string" || typeof parsed.propertyKey !== "string") {
    throw new Error(`Некорректный факт PropertyState: ${entry.logicalAddress}.${entry.name}`)
  }
  return parsed as ConfigurationExtensionPropertyStateFactPayload
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function diagnostic(
  projectDir: string,
  projectPath: string,
  entry: ProjectStateStructuredDocumentEntry,
  severity: "error" | "warning",
  message: string,
): Diagnostic {
  return {
    filePath: join(projectDir, ...projectPath.split("/")),
    line: 1,
    col: 1,
    severity,
    source: "cross-file",
    message,
    path: `/${entry.yamlPath.map(escapePointer).join("/")}`,
  }
}

function escapePointer(value: string | number): string {
  return String(value).replace(/~/g, "~0").replace(/\//g, "~1")
}
