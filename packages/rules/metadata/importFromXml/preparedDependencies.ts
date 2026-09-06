import { copyYAMLRuntimeMetadata, yamlPathToPointer, yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import { createSelectedPropertyValue } from "./selectedPropertyValue"
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
}

const siblingKeys = new WeakMap<MetadataItemRule, ReadonlySet<string>>()

export function collectImportDependencyFacts(params: {
  readonly rule: MetadataItemRule
  readonly owner: DependentItemParams["owner"]
  readonly yaml: unknown
  readonly candidates: readonly ImportedDependentPropertyCandidate[]
  readonly propertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly proofPropertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly finalRootYaml?: Readonly<Record<string, unknown>>
  readonly execution?: CompiledPropertyRuleExecution
}): ImportDependencyFacts {
  const properties = new Map<string, DependentImportFacts>()
  const propertyItemNames = new Map<string, string>()
  const items = new Map<string, DependentImportFacts>()
  const inspectedItems = new Set<string>()
  const propertyFactsBySource = new Map<string, NonNullable<typeof params.propertyFacts>[number]>()
  if (params.candidates.length > 0) {
    const requestedPaths = new Set(params.candidates.map(candidate => yamlPathToPointer(candidate.yamlPath)))
    const requestedAddresses = new Set(params.candidates.map(candidate => propertyFactSourceAddress(
      candidate.itemType, candidate.propertyKey, candidate.yamlPath,
    )))
    for (const fact of params.propertyFacts ?? []) {
      const path = fact.sourceYamlPath ?? fact.yamlPath
      if (!requestedPaths.has(yamlPathToPointer(path))) continue
      const key = propertyFactSourceAddress(fact.itemType, fact.propertyKey, path)
      if (requestedAddresses.has(key) && !propertyFactsBySource.has(key)) propertyFactsBySource.set(key, fact)
    }
  }
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
    const propertyFact = propertyFactsBySource.get(propertyFactSourceAddress(
      candidate.itemType,
      candidate.propertyKey,
      candidate.yamlPath,
    ))
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
  const siblingValues = new Map<string, ReturnType<typeof createSelectedPropertyValue>>()
  const siblingAliases = new Map<string, string>()
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
    const key = fact.propertyKey.startsWith("$container:")
      ? fact.propertyKey.slice("$container:".length)
      : fact.propertyKey
    if (!keys.has(key)) continue
    const propertyRule = fact.itemRule.properties[key]
    const propertyRootIndex = typeof propertyRule?.yaml === "string"
      ? fact.yamlPath.lastIndexOf(propertyRule.yaml)
      : -1
    const propertyPath = propertyRootIndex < 0
      ? fact.yamlPath
      : fact.yamlPath.slice(0, propertyRootIndex + 1)
    const itemPath = propertyRootIndex < 0
      ? (fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1)
      : propertyPath.slice(0, -1)
    const relativePath = fact.yamlPath.slice(propertyPath.length)
    const factValue = fact.value
    if (factValue === undefined && fact.scalarTag === undefined
      && (fact.presentInXML !== true || relativePath.length === 0)) continue
    const address = siblingAddress(itemPath, key)
    if (fact.sourceYamlPath !== undefined) {
      const sourceRootIndex = typeof propertyRule?.yaml === "string"
        ? fact.sourceYamlPath.lastIndexOf(propertyRule.yaml)
        : -1
      const sourceItemPath = sourceRootIndex < 0
        ? fact.sourceYamlPath.slice(0, -1)
        : fact.sourceYamlPath.slice(0, sourceRootIndex)
      const sourceAddress = siblingAddress(sourceItemPath, key)
      if (sourceAddress !== address) siblingAliases.set(sourceAddress, address)
    }
    let selected = siblingValues.get(address)
    if (selected === undefined) {
      selected = createSelectedPropertyValue()
      siblingValues.set(address, selected)
    }
    selected.accept(relativePath, factValue, fact.scalarTag)
  }
  for (const [address, selected] of siblingValues) {
    const value = selected.finish()
    siblingProperties.set(address, { value: typeof value === "string" || Array.isArray(value) ? value : undefined })
  }
  for (const [alias, address] of siblingAliases) {
    siblingProperties.set(alias, siblingProperties.get(address)!)
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
  }
}

function propertyFactSourceAddress(
  itemType: string,
  propertyKey: string,
  path: readonly (string | number)[],
): string {
  return `${itemType}\u0000${propertyKey}\u0000${yamlPathToPointer(path)}`
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
    if (
      present
      || propertyRule.preserveEmptyXML !== true
      || fact.presentInXML === true
      || fact.reconstructionValue !== undefined
    ) continue
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
      const fact = factByProperty.get(propertyKey)
      if (fact === undefined || fact.presentInXML === false) {
        result.set(siblingAddress([], propertyKey), { present: false, value: undefined })
      }
      continue
    }
    const finalValue = params.yaml[propertyRule.yaml]
    if (
      (finalValue === null || finalValue === undefined)
      && factByProperty.get(propertyKey)?.reconstructionValue !== undefined
    ) continue
    const scalarTag = yamlScalarTagAt(params.yaml, propertyRule.yaml)
    const sourceFact = factByProperty.get(propertyKey)
    if (
      sourceFact !== undefined
      && sourceFact.reconstructionValue === undefined
      && scalarTag === undefined
      && (finalValue === null || typeof finalValue !== "object")
      && Object.is(finalValue, sourceFact.value)
    ) continue
    const value = cloneCompactFinalValue(finalValue)
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

function collectProofProperties(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ReadonlyMap<string, { readonly value: unknown }> {
  return collectCompactPropertyValues(facts.filter((fact) => {
    const key = fact.propertyKey.startsWith("$container:") ? fact.propertyKey.slice("$container:".length) : fact.propertyKey
    const rule = fact.itemRule?.properties[key]
    return rule?.xmlOnly === true || rule?.fromXML === false || fact.reconstructionValue !== undefined
  }))
}

function collectCompactPropertyValues(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ReadonlyMap<string, { readonly value: unknown }> {
  const result = new Map<string, { readonly value: unknown }>()
  interface SelectedProofProperty {
    readonly path: readonly (string | number)[]
    readonly value: ReturnType<typeof createSelectedPropertyValue>
    readonly aliases: Set<string>
    readable: boolean
  }
  const selected = new Map<string, SelectedProofProperty>()
  const explicitContainers = new Set<ReturnType<typeof yamlPathToPointer>>()
  // Сначала пустые контейнеры: их поздняя запись не должна затереть листья.
  // Строятся только выбранные значения, не дерево всех YAML-адресов.
  for (const containers of [true, false]) {
    for (const fact of facts) {
      const container = fact.propertyKey.startsWith("$container:")
      if (container !== containers) continue
      const key = container ? fact.propertyKey.slice("$container:".length) : fact.propertyKey
      const propertyRule = fact.itemRule?.properties[key]
      if (propertyRule === undefined) continue
      if (container) explicitContainers.add(yamlPathToPointer(fact.yamlPath))
      const rootIndex = typeof propertyRule.yaml === "string" ? fact.yamlPath.lastIndexOf(propertyRule.yaml) : -1
      let path = rootIndex < 0 ? fact.yamlPath : fact.yamlPath.slice(0, rootIndex + 1)
      let entry: SelectedProofProperty | undefined
      for (let length = 1; length <= path.length; length++) {
        entry = selected.get(siblingAddress(path.slice(0, length), key))
        if (entry !== undefined) break
      }
      if (entry === undefined) {
        entry = { path, value: createSelectedPropertyValue(), aliases: new Set(), readable: false }
        selected.set(siblingAddress(path, key), entry)
      }
      path = entry.path
      if (!container) entry.readable = true
      const sourcePath = fact.sourceYamlPath ?? fact.yamlPath
      entry.aliases.add(siblingAddress(path.slice(0, -1), key))
      entry.aliases.add(siblingAddress(sourcePath.slice(0, path.length - 1), key))
      const value = Object.hasOwn(fact, "reconstructionValue") ? fact.reconstructionValue : fact.value
      if (value === undefined && fact.scalarTag === undefined
        && !(fact.presentInXML === true && explicitContainers.has(yamlPathToPointer(fact.yamlPath.slice(0, -1))))) continue
      entry.value.accept(fact.yamlPath.slice(path.length), value, fact.scalarTag)
    }
  }
  for (const entry of selected.values()) {
    const value = entry.value.finish()
    if (!entry.readable || value === undefined) continue
    const decision = { value }
    for (const alias of entry.aliases) result.set(alias, decision)
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
      const result = facts.finalProperties.get(address)
        ?? facts.siblingProperties.get(address)
        ?? facts.proofProperties.get(address)
        ?? { value: undefined }
      return result
    },
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
