import { copyYAMLRuntimeMetadata, yamlPathToPointer } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import {
  prepareDependentImportFacts,
  shouldRemoveImportedDependentProperty,
  type DependentImportFacts,
  type DependentItemParams,
  type ImportedDependentPropertyCandidate,
  type MetadataItemRule,
  type PreparedImportDependencies,
  type DirectImportFactsSink,
} from "@nkdk/runtime/rule-kit"

export interface ImportDependencyFacts {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly properties: ReadonlyMap<string, DependentImportFacts>
  readonly siblingProperties: ReadonlyMap<string, { readonly value: unknown }>
}

const siblingKeys = new WeakMap<MetadataItemRule, ReadonlySet<string>>()

export function collectImportDependencyFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly yaml: unknown
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly propertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
}): ImportDependencyFacts {
  const properties = new Map<string, DependentImportFacts>()
  for (const candidate of params.candidates) {
    const item = recordAtPath(params.yaml, candidate.itemYamlPath)
    if (item === undefined) continue
    const facts = prepareDependentImportFacts({
      itemType: candidate.itemType,
      itemName: candidate.itemName,
      itemYamlPath: candidate.itemYamlPath,
      item,
      rootYaml: params.yaml,
      rootRule: params.rule,
      owner: params.owner,
    })
    if (facts !== undefined) properties.set(propertyAddress(candidate), facts)
  }
  const siblingProperties = new Map<string, { readonly value: unknown }>()
  for (const fact of params.propertyFacts ?? []) {
    if (fact.itemRule === undefined) continue
    let keys = siblingKeys.get(fact.itemRule)
    if (keys === undefined) {
      keys = new Set(Object.values(fact.itemRule.properties).flatMap(({ metadataTarget }) =>
        metadataTarget?.kind === "member" && metadataTarget.owner === "type" && metadataTarget.typeProperty !== undefined
          ? [metadataTarget.typeProperty] : [],
      ))
      siblingKeys.set(fact.itemRule, keys)
    }
    if (!keys.has(fact.propertyKey)) continue
    const value = typeof fact.value === "string" ? fact.value : Array.isArray(fact.value) ? [...fact.value] : undefined
    siblingProperties.set(siblingAddress((fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1), fact.propertyKey), { value })
  }
  return { rule: params.rule, owner: params.owner, properties, siblingProperties }
}

export function prepareImportDependencies(
  facts: ImportDependencyFacts,
  lookups: Pick<DependentItemParams, "definedTypeLookup" | "metadataTargetLookup"> = {},
): PreparedImportDependencies {
  return {
    propertyValue: (path, key) => facts.siblingProperties.get(siblingAddress(path, key)) ?? { value: undefined },
    shouldOmit(candidate, values) {
      const dependency = facts.properties.get(propertyAddress(candidate))
      if (dependency === undefined) return false
      const item = { ...dependency.item, ...values }
      copyYAMLRuntimeMetadata(values, item)
      return shouldRemoveImportedDependentProperty({
        ...lookups,
        itemType: candidate.itemType,
        itemName: candidate.itemName,
        itemYamlPath: candidate.itemYamlPath,
        item,
        rootYaml: dependency.root,
        rootRule: facts.rule,
        owner: facts.owner,
        candidate,
      })
    },
  }
}

function siblingAddress(path: readonly (string | number)[], key: string): string {
  return `${yamlPathToPointer(path)}:${key}`
}

function propertyAddress(candidate: ImportedDependentPropertyCandidate): string {
  return candidate.logicalAddress ?? `${yamlPathToPointer(candidate.itemYamlPath)}:${candidate.propertyKey}`
}
