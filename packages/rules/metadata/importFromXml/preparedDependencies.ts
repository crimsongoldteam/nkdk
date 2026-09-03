import { copyYAMLRuntimeMetadata, yamlPathToPointer } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import {
  prepareDependentImportFacts,
  isDependentImportProperty,
  shouldRemoveImportedDependentProperty,
  type DependentImportFacts,
  type DependentItemParams,
  type ImportedDependentPropertyCandidate,
  type MetadataItemRule,
  type PreparedImportDependencies,
  type DirectImportFactsSink,
  type CompiledPropertyRuleExecution,
} from "@nkdk/runtime/rule-kit"

export interface ImportDependencyFacts {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly properties: ReadonlyMap<string, DependentImportFacts>
  readonly items: ReadonlyMap<string, DependentImportFacts>
  readonly siblingProperties: ReadonlyMap<string, { readonly value: unknown }>
}

const siblingKeys = new WeakMap<MetadataItemRule, ReadonlySet<string>>()

export function collectImportDependencyFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly yaml: unknown
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly propertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly execution?: CompiledPropertyRuleExecution
}): ImportDependencyFacts {
  const properties = new Map<string, DependentImportFacts>()
  const items = new Map<string, DependentImportFacts>()
  const inspectedItems = new Set<string>()
  const itemFacts = (itemType: string, itemYamlPath: readonly (string | number)[], itemName?: string) => {
    const address = itemAddress(itemYamlPath, itemType)
    if (inspectedItems.has(address)) return items.get(address)
    inspectedItems.add(address)
    const item = recordAtPath(params.yaml, itemYamlPath)
    if (item === undefined) return undefined
    const request = {
      itemType, itemName, itemYamlPath, item, rootYaml: params.yaml, rootRule: params.rule, owner: params.owner,
    }
    const facts = params.execution === undefined
      ? prepareDependentImportFacts(request)
      : params.execution.prepareDependentImportFacts(request)
    if (facts !== undefined) items.set(address, facts)
    return facts
  }
  for (const candidate of params.candidates) {
    const facts = itemFacts(candidate.itemType, candidate.itemYamlPath, candidate.itemName)
    if (facts !== undefined) properties.set(propertyAddress(candidate), facts)
  }
  const siblingProperties = new Map<string, { readonly value: unknown }>()
  const dependentRules = new Map<MetadataItemRule, boolean>()
  for (const fact of params.propertyFacts ?? []) {
    if (fact.itemRule === undefined) continue
    let dependent = dependentRules.get(fact.itemRule)
    if (dependent === undefined) {
      dependent = Object.keys(fact.itemRule.properties).some(key => params.execution === undefined
        ? isDependentImportProperty(fact.itemType, key)
        : params.execution.isDependentImportProperty(fact.itemType, key))
      dependentRules.set(fact.itemRule, dependent)
    }
    if (dependent) {
      const path = fact.yamlPath.slice(0, -1)
      const name = path.at(-1)
      const facts = itemFacts(fact.itemType, path, typeof name === "string" ? name : undefined)
      if (facts !== undefined) items.set(itemAddress((fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1), fact.itemType), facts)
    }
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
  return { rule: params.rule, owner: params.owner, properties, items, siblingProperties }
}

export function prepareImportDependencies(
  facts: ImportDependencyFacts,
  lookups: Pick<DependentItemParams, "definedTypeLookup" | "metadataTargetLookup"> = {},
  execution?: CompiledPropertyRuleExecution,
): PreparedImportDependencies {
  return {
    itemFacts: (path, itemType) => facts.items.get(itemAddress(path, itemType)),
    propertyValue: (path, key) => facts.siblingProperties.get(siblingAddress(path, key)) ?? { value: undefined },
    shouldOmit(candidate, values) {
      const dependency = facts.properties.get(propertyAddress(candidate))
      if (dependency === undefined) return false
      const item = { ...dependency.item, ...values }
      copyYAMLRuntimeMetadata(values, item)
      const request = {
        ...lookups,
        itemType: candidate.itemType,
        itemName: candidate.itemName,
        itemYamlPath: candidate.itemYamlPath,
        item,
        rootYaml: dependency.root,
        rootRule: facts.rule,
        owner: facts.owner,
        candidate,
      }
      return execution === undefined
        ? shouldRemoveImportedDependentProperty(request)
        : execution.shouldRemoveImportedDependentProperty(request)
    },
  }
}

function siblingAddress(path: readonly (string | number)[], key: string): string {
  return `${yamlPathToPointer(path)}:${key}`
}

function itemAddress(path: readonly (string | number)[], itemType: string): string {
  const address = yamlPathToPointer([itemType, ...path])
  if (address === undefined) throw new Error("Не удалось адресовать факты зависимостей item")
  return address
}

function propertyAddress(candidate: ImportedDependentPropertyCandidate): string {
  return candidate.logicalAddress ?? `${yamlPathToPointer(candidate.itemYamlPath)}:${candidate.propertyKey}`
}
