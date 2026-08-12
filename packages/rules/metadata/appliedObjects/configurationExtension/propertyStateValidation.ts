import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { ProjectStateStructuredDocumentValidationParams } from "../../projectState/contracts/dependencyValidation"
import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../../ruleRuntime/property/propertyStateFacts"

export function validateConfigurationExtensionPropertyStates(
  params: ProjectStateStructuredDocumentValidationParams,
): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
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
      diagnostics.push(diagnostic(params.projectDir, fact.projectPath, fact.entry, "error",
        `Свойство «${extension.propertyKey}» отсутствует в основной конфигурации`))
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
