import { copyYAMLRuntimeMetadata, yamlPathToPointer, yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
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
  readonly propertyItemNames: ReadonlyMap<string, string>
  readonly items: ReadonlyMap<string, DependentImportFacts>
  readonly siblingProperties: ReadonlyMap<string, { readonly value: unknown }>
  readonly proofProperties: ReadonlyMap<string, { readonly value: unknown }>
  readonly finalProperties: ReadonlyMap<string, {
    readonly present: boolean
    readonly value: unknown
    readonly scalarTag?: YAMLScalarTag
  }>
  readonly reconstructionProperties: ReadonlyMap<string, { readonly value: unknown }>
}

const siblingKeys = new WeakMap<MetadataItemRule, ReadonlySet<string>>()

export function collectImportDependencyFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly yaml: unknown
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly propertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly proofPropertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly reconstructionPropertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly finalRootYaml?: Readonly<Record<string, unknown>>
  readonly execution?: CompiledPropertyRuleExecution
}): ImportDependencyFacts {
  const properties = new Map<string, DependentImportFacts>()
  const propertyItemNames = new Map<string, string>()
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
    const propertyFact = params.propertyFacts?.find((fact) =>
      fact.itemType === candidate.itemType
      && fact.propertyKey === candidate.propertyKey
      && samePath(fact.sourceYamlPath ?? fact.yamlPath, candidate.yamlPath))
    const finalName = propertyFact?.yamlPath.at(-2)
    const itemName = typeof finalName === "string" ? finalName : candidate.itemName
    const facts = itemFacts(
      candidate.itemType,
      candidate.itemYamlPath,
      itemName,
    )
    if (facts !== undefined) {
      const address = propertyAddress(candidate)
      properties.set(address, facts)
      if (itemName !== undefined) propertyItemNames.set(address, itemName)
    }
  }
  const siblingProperties = new Map<string, { readonly value: unknown }>()
  const reconstructionProperties = collectReconstructionProperties(
    params.reconstructionPropertyFacts ?? params.propertyFacts ?? [],
  )
  const proofPropertyFacts = params.proofPropertyFacts ?? params.propertyFacts ?? []
  const proofProperties = collectProofProperties(proofPropertyFacts)
  const finalProperties = collectFinalRootProperties({
    rule: params.rule,
    yaml: params.finalRootYaml,
    propertyFacts: proofPropertyFacts,
  })
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
  return {
    rule: params.rule,
    owner: params.owner,
    properties,
    propertyItemNames,
    items,
    siblingProperties,
    proofProperties,
    finalProperties,
    reconstructionProperties,
  }
}

function collectFinalRootProperties(params: {
  readonly rule: MetadataItemRule
  readonly yaml?: Readonly<Record<string, unknown>>
  readonly propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
}): ImportDependencyFacts["finalProperties"] {
  const result = new Map<string, {
    readonly present: boolean
    readonly value: unknown
    readonly scalarTag?: YAMLScalarTag
  }>()
  if (params.yaml === undefined) return result
  for (const fact of params.propertyFacts) {
    if (fact.itemRule === undefined) continue
    const propertyRule = fact.itemRule.properties[fact.propertyKey]
    if (typeof propertyRule?.yaml !== "string") continue
    const finalItemPath = fact.yamlPath.slice(0, -1)
    if (finalItemPath.length === 0) continue
    const finalItem = recordAtPath(params.yaml, finalItemPath)
    if (finalItem === undefined) continue
    const present = Object.prototype.hasOwnProperty.call(finalItem, propertyRule.yaml)
    if (present || propertyRule.preserveEmptyXML !== true) continue
    const decision = { present: false, value: undefined }
    result.set(siblingAddress(finalItemPath, fact.propertyKey), decision)
    const sourceItemPath = (fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1)
    if (!samePath(sourceItemPath, finalItemPath)) {
      result.set(siblingAddress(sourceItemPath, fact.propertyKey), decision)
    }
  }
  const factByProperty = new Map(params.propertyFacts
    .filter((fact) => fact.yamlPath.length === 1)
    .map((fact) => [fact.propertyKey, fact]))
  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    if (propertyRule.externalFile || propertyRule.filePath !== undefined) continue
    const present = Object.prototype.hasOwnProperty.call(params.yaml, propertyRule.yaml)
    if (!present) {
      if (factByProperty.get(propertyKey)?.value !== undefined) {
        result.set(siblingAddress([], propertyKey), { present: false, value: undefined })
      }
      continue
    }
    const finalValue = params.yaml[propertyRule.yaml]
    if (
      (finalValue === null || finalValue === undefined)
      && factByProperty.get(propertyKey)?.reconstructionValue !== undefined
    ) continue
    const value = cloneCompactFinalValue(finalValue)
    const scalarTag = yamlScalarTagAt(params.yaml, propertyRule.yaml)
    if (value === undefined && scalarTag === undefined) continue
    result.set(siblingAddress([], propertyKey), {
      present: true,
      value,
      ...(scalarTag === undefined ? {} : { scalarTag }),
    })
  }
  return result
}

function cloneCompactFinalValue(value: unknown): unknown {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || typeof value === "bigint"
  ) return value
  if (value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
    return {}
  }
  return undefined
}

function collectReconstructionProperties(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ReadonlyMap<string, { readonly value: unknown }> {
  return collectCompactPropertyValues(facts.filter(
    fact => fact.itemRule?.properties[fact.propertyKey]?.forReferenceOnly === true,
  ))
}

function collectProofProperties(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ReadonlyMap<string, { readonly value: unknown }> {
  return collectCompactPropertyValues(facts)
}

function collectCompactPropertyValues(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ReadonlyMap<string, { readonly value: unknown }> {
  const result = new Map<string, { readonly value: unknown }>()
  for (const fact of facts) {
    const value = cloneCompactReconstructionValue(fact.reconstructionValue ?? fact.value)
    if (value === undefined) continue
    const sourcePath = (fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1)
    result.set(siblingAddress(sourcePath, fact.propertyKey), { value })
    const finalPath = fact.yamlPath.slice(0, -1)
    if (yamlPathToPointer(finalPath) !== yamlPathToPointer(sourcePath)) {
      result.set(siblingAddress(finalPath, fact.propertyKey), { value })
    }
  }
  return result
}

export function prepareImportDependencies(
  facts: ImportDependencyFacts,
  lookups: Pick<DependentItemParams, "definedTypeLookup" | "metadataTargetLookup"> = {},
  execution?: CompiledPropertyRuleExecution,
): PreparedImportDependencies {
  return {
    itemFacts: (path, itemType) => facts.items.get(itemAddress(path, itemType)),
    propertyValue: (path, key) => {
      const address = siblingAddress(path, key)
      return facts.finalProperties.get(address)
        ?? facts.siblingProperties.get(address)
        ?? facts.proofProperties.get(address)
        ?? { value: undefined }
    },
    reconstructionValue: (path, key) => facts.reconstructionProperties.get(siblingAddress(path, key)),
    shouldOmit(candidate, values) {
      const address = propertyAddress(candidate)
      const dependency = facts.properties.get(address)
      if (dependency === undefined) return false
      const item = { ...dependency.item, ...values }
      copyYAMLRuntimeMetadata(values, item)
      const request = {
        ...lookups,
        ...(facts.propertyItemNames.get(address) === undefined
          ? {}
          : { itemName: facts.propertyItemNames.get(address) }),
        itemType: candidate.itemType,
        ...(facts.propertyItemNames.has(address) ? {} : candidate.itemName === undefined ? {} : { itemName: candidate.itemName }),
        itemYamlPath: candidate.itemYamlPath,
        item,
        rootYaml: dependency.root,
        rootRule: facts.rule,
        owner: facts.owner,
        candidate,
      }
      const omit = execution === undefined
        ? shouldRemoveImportedDependentProperty(request)
        : execution.shouldRemoveImportedDependentProperty(request)
      return omit
    },
  }
}

function cloneCompactReconstructionValue(value: unknown): unknown {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || typeof value === "bigint"
  ) return value
  if (Array.isArray(value)) {
    const result = value.map(cloneCompactReconstructionValue)
    return result.some(item => item === undefined) ? undefined : result
  }
  if (value !== null && typeof value === "object" && Object.keys(value).length === 0) return {}
  return undefined
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

function samePath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
