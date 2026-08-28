import type { ConfigurationIndexCollector } from "@nkdk/runtime"
import {
  shouldRemoveImportedDependentProperty,
  shouldTagImportedDependentProperty,
  shouldDeferImportedDependentProperty,
  type DependentItemParams,
} from "../ruleRuntime/property/dependentItemRegistry"
import type { ImportedDependentPropertyCandidate } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

export function collectImportedDependentXmlValues(
  candidates: readonly ImportedDependentPropertyCandidate[],
  collector: ConfigurationIndexCollector,
): void {
  for (const candidate of candidates) {
    const value = designTimeRefUuid(candidate.xmlValue)
    if (value !== undefined && candidate.logicalAddress !== undefined) {
      collector.setXmlValue(candidate.logicalAddress, value)
    }
  }
}

export function normalizeImportedDependentItems(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly collector?: ConfigurationIndexCollector
  readonly owner: DependentItemParams["owner"]
  readonly definedTypeLookup?: DependentItemParams["definedTypeLookup"]
  readonly metadataTargetLookup?: DependentItemParams["metadataTargetLookup"]
  readonly metadataTargetCanonicalizer?: (value: string) => string | undefined
  readonly preserveRawXML?: boolean
}): number {
  let removed = 0
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const yamlKey = candidate.yamlPath.at(-1)
    if (typeof yamlKey !== "string") continue
    if (!Object.prototype.hasOwnProperty.call(item, yamlKey)) continue
    const currentValue = item[yamlKey]
    if (typeof currentValue === "string") {
      const canonical = params.metadataTargetCanonicalizer?.(currentValue)
      if (canonical !== undefined) item[yamlKey] = canonical
    }
    const dependentParams = dependentParamsForCandidate(params, candidate, item)
    const shouldRemove = shouldRemoveImportedDependentProperty(dependentParams)
    if (shouldRemove) {
      delete item[yamlKey]
      removed += 1
      continue
    }
    shouldTagImportedDependentProperty(dependentParams)
  }
  return removed
}

function designTimeRefUuid(value: unknown): string | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const text = record["#text"]
  return record["_xsi:type"] === "xr:DesignTimeRef"
    && typeof text === "string"
    && /^[0-9a-f-]{36}\.[0-9a-f-]{36}$/iu.test(text)
    ? text
    : undefined
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
