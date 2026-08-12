import { yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type {
  PropertyStateMode,
  ResolvedPropertyStateItemCapability,
} from "../ruleRuntime/definition"
import type { ProjectStateStructuredDocumentEntry } from "../projectState/contracts/fileUpdate"
import { readPropertyStateSections } from "../ruleRuntime/property/propertyStateSections"
import {
  CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
  type ConfigurationExtensionPropertyStateFactMode,
  type ConfigurationExtensionPropertyStateFactPayload,
} from "../ruleRuntime/property/propertyStateFacts"

export function collectConfigurationExtensionPropertyStateDocuments(params: {
  readonly yaml: Readonly<Record<string, unknown>>
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly logicalAddress: string
  readonly workingProjectPath: string
}): readonly ProjectStateStructuredDocumentEntry[] {
  const sections = readPropertyStateSections(params.yaml, params.capability)
  const result: ProjectStateStructuredDocumentEntry[] = []

  for (const [propertyKey, property] of Object.entries(params.capability.properties)) {
    const rule = params.rule.properties[propertyKey]
    if (rule === undefined || typeof rule.yaml !== "string") continue
    const yamlName = rule.yaml
    if (!Object.prototype.hasOwnProperty.call(params.yaml, yamlName)) continue
    const sectionMode = sections.get(propertyKey)
    const value = params.yaml[yamlName]
    const tag = yamlScalarTagAt(params.yaml, yamlName)
    const mode = sectionMode ?? scalarMode(property.modes, property.representation, tag, value)
    const yamlPath = sectionMode === undefined
      ? [yamlName]
      : sectionPath(params.yaml, property.externalName!, sectionMode)
    result.push(document(params, propertyKey, mode, normalizedValue(mode, value), yamlPath))
  }

  return result
}

function scalarMode(
  modes: readonly PropertyStateMode[],
  representation: string | undefined,
  tag: ReturnType<typeof yamlScalarTagAt>,
  value: unknown,
): ConfigurationExtensionPropertyStateFactMode {
  if (tag === "xml") return "xml"
  if (tag === "проверять") return "notify"
  if (tag === "изменять") return "extend"
  if (representation === "multi" && Array.isArray(value)) return "multi"
  return modes.length === 1 && modes[0] === "extend" ? "extend" : "control"
}

function normalizedValue(mode: ConfigurationExtensionPropertyStateFactMode, value: unknown): unknown {
  if (mode !== "multi" || !Array.isArray(value)) return value
  return value.map((part, index) => ({
    mode: yamlScalarTagAt(value, index) === "проверять"
      ? "notify"
      : yamlScalarTagAt(value, index) === "изменять"
        ? "extend"
        : "control",
    value: part,
  }))
}

function sectionPath(
  yaml: Readonly<Record<string, unknown>>,
  externalName: string,
  mode: "notify" | "extend",
): readonly (string | number)[] {
  const section = mode === "notify" ? "Проверять" : "Изменять"
  const index = (yaml[section] as readonly unknown[]).indexOf(externalName)
  return [section, index]
}

function document(
  params: {
    readonly capability: ResolvedPropertyStateItemCapability
    readonly logicalAddress: string
    readonly workingProjectPath: string
  },
  propertyKey: string,
  mode: ConfigurationExtensionPropertyStateFactMode,
  value: unknown,
  yamlPath: readonly (string | number)[],
): ProjectStateStructuredDocumentEntry {
  const payload: ConfigurationExtensionPropertyStateFactPayload = {
    version: 1,
    itemType: params.capability.itemType,
    propertyKey,
    mode,
    value,
  }
  return {
    documentKind: CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
    representation: "working",
    logicalAddress: params.logicalAddress,
    workingProjectPath: params.workingProjectPath,
    componentKind: "property",
    name: propertyKey,
    yamlPath,
    payload: JSON.stringify(payload),
  }
}
