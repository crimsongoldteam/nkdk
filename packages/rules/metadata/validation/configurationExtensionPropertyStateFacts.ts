import { isPropertyStateYAMLTag, yamlScalarTagAt } from "@nkdk/runtime"
import { dirname, join } from "node:path/posix"
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
  readonly borrowed?: boolean
  readonly projectFileExists?: (projectPath: string) => boolean
  readonly yamlPathPrefix?: readonly (string | number)[]
}): readonly ProjectStateStructuredDocumentEntry[] {
  const sections = readPropertyStateSections(params.yaml, params.capability)
  const result: ProjectStateStructuredDocumentEntry[] = []

  if (params.borrowed === false && hasPropertyStateMarkup(params.yaml, sections)) {
    throw new Error("Режимы PropertyState допустимы только для заимствованного объекта")
  }

  for (const [propertyKey, property] of Object.entries(params.capability.properties)) {
    if (property.modes.length === 0) continue
    const rule = params.rule.properties[propertyKey]
    if (rule === undefined) continue
    if (property.representation === "section" && typeof rule.nkdkPath === "string") {
      const externalProjectPath = join(dirname(params.workingProjectPath), rule.nkdkPath)
      const sectionMode = sections.get(propertyKey)
      if (sectionMode !== undefined || params.projectFileExists?.(externalProjectPath) === true) {
        const mode = sectionMode ?? "control"
        const yamlPath = sectionMode === undefined ? [] : sectionPath(params.yaml, property.externalName!, sectionMode)
        result.push(document(params, propertyKey, mode, { externalProjectPath }, yamlPath, sectionMode !== undefined))
      }
      continue
    }
    if (typeof rule.yaml !== "string") continue
    const yamlName = rule.yaml
    if (!Object.prototype.hasOwnProperty.call(params.yaml, yamlName)) continue
    const sectionMode = sections.get(propertyKey)
    const value = params.yaml[yamlName]
    const tag = yamlScalarTagAt(params.yaml, yamlName)
    assertAllowedScalarTag(params.capability.itemType, propertyKey, property.modes, tag)
    const mode = sectionMode ?? scalarMode(property.modes, property.representation, tag, value)
    const yamlPath = sectionMode === undefined
      ? [yamlName]
      : sectionPath(params.yaml, property.externalName!, sectionMode)
    result.push(document(
      params,
      propertyKey,
      mode,
      normalizedValue(mode, value),
      yamlPath,
      isPropertyStateYAMLTag(tag) || hasPropertyStateTaggedParts(value),
    ))
  }

  return result
}

function assertAllowedScalarTag(
  itemType: string,
  propertyKey: string,
  modes: readonly PropertyStateMode[],
  tag: ReturnType<typeof yamlScalarTagAt>,
): void {
  const mode = tag === "проверять" ? "notify" : tag === "изменять" ? "extend" : undefined
  if (mode !== undefined && !modes.includes(mode)) {
    throw new Error(`Режим !${tag} недопустим для ${itemType}.${propertyKey}`)
  }
}

function hasPropertyStateMarkup(
  yaml: Readonly<Record<string, unknown>>,
  sections: ReadonlyMap<string, "notify" | "extend">,
): boolean {
  if (sections.size > 0) return true
  return Object.keys(yaml).some((yamlName) => {
    const tag = yamlScalarTagAt(yaml, yamlName)
    return isPropertyStateYAMLTag(tag)
  })
}

function scalarMode(
  modes: readonly PropertyStateMode[],
  representation: string | undefined,
  tag: ReturnType<typeof yamlScalarTagAt>,
  value: unknown,
): ConfigurationExtensionPropertyStateFactMode {
  if (tag === "проверять") return "notify"
  if (tag === "изменять") return "extend"
  if (representation === "multi" && Array.isArray(value)) return "multi"
  return modes.length === 1 && modes[0] === "extend" ? "extend" : "control"
}

function normalizedValue(mode: ConfigurationExtensionPropertyStateFactMode, value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((part, index) => {
      const normalized = normalizedNestedValue(part)
      const partMode = mode === "multi" ? nestedMode(value, index) : taggedMode(value, index)
      return partMode === undefined ? normalized : { mode: partMode, value: normalized }
    })
  }
  return normalizedNestedValue(value)
}

function hasPropertyStateTaggedParts(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value)
  for (const [key, part] of entries) {
    if (isPropertyStateYAMLTag(yamlScalarTagAt(value, key))) return true
    if (hasPropertyStateTaggedParts(part)) return true
  }
  return false
}

function normalizedNestedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((part, index) => {
      const normalized = normalizedNestedValue(part)
      const mode = taggedMode(value, index)
      return mode === undefined ? normalized : { mode, value: normalized }
    })
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value).map(([key, part]) => {
    const normalized = normalizedNestedValue(part)
    const mode = taggedMode(value, key)
    return [key, mode === undefined ? normalized : { mode, value: normalized }]
  }))
}

function nestedMode(parent: object, key: string | number): "control" | "notify" | "extend" {
  return taggedMode(parent, key) ?? "control"
}

function taggedMode(parent: object, key: string | number): "notify" | "extend" | undefined {
  const tag = yamlScalarTagAt(parent, key)
  return tag === "проверять" ? "notify" : tag === "изменять" ? "extend" : undefined
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
    readonly yamlPathPrefix?: readonly (string | number)[]
  },
  propertyKey: string,
  mode: ConfigurationExtensionPropertyStateFactMode,
  value: unknown,
  yamlPath: readonly (string | number)[],
  explicitMode: boolean,
): ProjectStateStructuredDocumentEntry {
  const payload: ConfigurationExtensionPropertyStateFactPayload = {
    version: 1,
    itemType: params.capability.itemType,
    propertyKey,
    mode,
    value,
    ...(explicitMode ? { explicitMode: true } : {}),
  }
  return {
    documentKind: CONFIGURATION_EXTENSION_PROPERTY_STATE_DOCUMENT,
    representation: "working",
    logicalAddress: params.logicalAddress,
    workingProjectPath: params.workingProjectPath,
    componentKind: "property",
    name: propertyKey,
    yamlPath: [...(params.yamlPathPrefix ?? []), ...yamlPath],
    payload: JSON.stringify(payload),
  }
}
