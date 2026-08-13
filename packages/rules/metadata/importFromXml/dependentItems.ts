import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import {
  shouldRemoveImportedDependentProperty,
  shouldTagImportedDependentProperty,
  shouldDeferImportedDependentProperty,
  type DependentItemParams,
} from "../ruleRuntime/property/dependentItemRegistry"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { markYAMLScalarTag, xmlScalarTagValue } from "@nkdk/runtime"
import { matchExplicitXMLTransportFromXML } from "../ruleRuntime/property/explicitXMLPropertyRegistry"

export function normalizeImportedDependentItems(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly collector?: ConfigurationIndexCollector
  readonly owner: DependentItemParams["owner"]
  readonly definedTypeLookup?: DependentItemParams["definedTypeLookup"]
  readonly metadataTargetLookup?: DependentItemParams["metadataTargetLookup"]
  readonly preserveRawXML?: boolean
}): number {
  let removed = 0
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const yamlKey = candidate.yamlPath.at(-1)
    if (typeof yamlKey !== "string") continue
    const transport = matchExplicitXMLTransportFromXML({
      itemType: candidate.itemType,
      propertyKey: candidate.propertyKey,
      presentInXML: candidate.presentInXML,
      xmlValue: candidate.xmlValue,
    })
    if (transport !== undefined) {
      item[yamlKey] = xmlScalarTagValue(transport)
      markYAMLScalarTag(item, yamlKey, "xml")
      if (
        transport === "Nil" &&
        !shouldRemoveImportedDependentProperty(dependentParamsForCandidate(params, candidate, item))
      ) {
        delete item[yamlKey]
      }
      continue
    }
    if (!Object.prototype.hasOwnProperty.call(item, yamlKey)) continue
    const dependentParams = dependentParamsForCandidate(params, candidate, item)
    if (isEmptyDesignTimeRef(candidate)) {
      item[yamlKey] = xmlScalarTagValue("DesignTimeRef")
      markYAMLScalarTag(item, yamlKey, "xml")
      continue
    }
    const shouldRemove = shouldRemoveImportedDependentProperty(dependentParams)
    if (shouldRemove) {
      const value = item[yamlKey]
      if (hasExplicitXMLText(candidate.xmlValue) && (typeof value === "string" || typeof value === "number")) {
        item[yamlKey] = xmlScalarTagValue(String(value))
        markYAMLScalarTag(item, yamlKey, "xml")
        continue
      }
      delete item[yamlKey]
      removed += 1
      continue
    }
    const shouldTagXML = shouldTagImportedDependentProperty(dependentParams)
    const value = item[yamlKey]
    if (shouldTagXML && (typeof value === "string" || typeof value === "number")) {
      item[yamlKey] = xmlScalarTagValue(String(value))
      markYAMLScalarTag(item, yamlKey, "xml")
    }
  }
  return removed
}

export function partitionImportedDependentItems(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly owner: DependentItemParams["owner"]
}): {
  readonly immediate: readonly ImportedDependentPropertyCandidate[]
  readonly deferred: readonly ImportedDependentPropertyCandidate[]
} {
  const immediate: ImportedDependentPropertyCandidate[] = []
  const deferred: ImportedDependentPropertyCandidate[] = []
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const target = shouldDeferImportedDependentProperty(
      dependentParamsForCandidate(params, candidate, item)
    ) ? deferred : immediate
    target.push(candidate)
  }
  return { immediate, deferred }
}

function dependentParamsForCandidate(
  params: {
    readonly yaml: unknown
    readonly rule: MetadataItemRule
    readonly owner: DependentItemParams["owner"]
    readonly definedTypeLookup?: DependentItemParams["definedTypeLookup"]
    readonly metadataTargetLookup?: DependentItemParams["metadataTargetLookup"]
  },
  candidate: ImportedDependentPropertyCandidate,
  item: Record<string, unknown>,
) {
  return {
    itemType: candidate.itemType,
    ...(candidate.itemName === undefined ? {} : { itemName: candidate.itemName }),
    item,
    itemYamlPath: candidate.itemYamlPath,
    rootYaml: params.yaml,
    rootRule: params.rule,
    owner: params.owner,
    ...(params.definedTypeLookup === undefined ? {} : { definedTypeLookup: params.definedTypeLookup }),
    ...(params.metadataTargetLookup === undefined ? {} : { metadataTargetLookup: params.metadataTargetLookup }),
    candidate,
  }
}

function isEmptyDesignTimeRef(candidate: ImportedDependentPropertyCandidate): boolean {
  if (!candidate.presentInXML || candidate.xmlValue === null || typeof candidate.xmlValue !== "object") return false
  const value = candidate.xmlValue as Record<string, unknown>
  return Object.keys(value).length === 1 && value["_xsi:type"] === "xr:DesignTimeRef"
}

function hasExplicitXMLText(value: unknown): boolean {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true
  return value !== null && typeof value === "object" && !Array.isArray(value) && "#text" in value
}

function recordAtPath(root: unknown, path: readonly (string | number)[]): Record<string, unknown> | undefined {
  let value = root
  for (const segment of path) {
    if (value === null || typeof value !== "object") return undefined
    value = (value as Record<string | number, unknown>)[segment]
  }
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
