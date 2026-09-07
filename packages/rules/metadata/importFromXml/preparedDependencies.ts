import { copyYAMLRuntimeMetadata, yamlPathToPointer, yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import { ImportPropertyValues } from "./propertyValues"
import { compactImportPropertyValue, createSelectedPropertyValue, importPropertyValueKind } from "./selectedPropertyValue"
import { selectImportCompactPropertyPaths, selectImportPropertyPaths } from "./selectedPropertyFacts"
import {
  prepareDependentImportFacts,
  dependentImportDependencies,
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
  readonly siblingProperties: ImportPropertyValues<{ readonly value: unknown }>
  readonly proofProperties: ImportPropertyValues<{ readonly value: unknown }>
  readonly finalProperties: ImportPropertyValues<{
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
  readonly finalPropertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
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
    if (selectedItems !== undefined) {
      const facts = selectedItems.get(address)
      if (facts !== undefined) items.set(address, facts)
      return facts
    }
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
  const selectedItems = params.propertyFacts === undefined ? undefined : collectSelectedDependentItems(params, propertyFactsBySource)
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
  const siblingProperties = new ImportPropertyValues<{ readonly value: unknown }>()
  const siblingValues = new ImportPropertyValues<{
    selected: ReturnType<typeof createSelectedPropertyValue>
    key: string
    paths: (readonly (string | number)[])[]
  }>()
  const proofPropertyFacts = params.proofPropertyFacts ?? params.propertyFacts ?? []
  const proofProperties = collectProofProperties(proofPropertyFacts)
  const finalProperties = collectFinalRootProperties({
    rule: params.rule,
    yaml: params.finalRootYaml,
    finalPropertyFacts: params.finalPropertyFacts,
    propertyFacts: proofPropertyFacts,
  })
  const dependentRules = new Map<MetadataItemRule, boolean>()
  for (const fact of params.propertyFacts ?? []) {
    if (fact.itemRule === undefined) continue
    const itemType = fact.itemType
    let dependent = dependentRules.get(fact.itemRule)
    if (dependent === undefined) {
      dependent = Object.keys(fact.itemRule.properties).some(key => params.execution === undefined
        ? isDependentImportProperty(itemType, key)
        : params.execution.isDependentImportProperty(itemType, key))
      dependentRules.set(fact.itemRule, dependent)
    }
    if (dependent) {
      const path = fact.yamlPath.slice(0, -1)
      const name = path.at(-1)
      const facts = itemFacts(itemType, path, typeof name === "string" ? name : undefined)
      if (facts !== undefined) items.set(itemAddress((fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1), itemType), facts)
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
    let entry = siblingValues.get(itemPath, key)
    if (entry === undefined) {
      entry = { selected: createSelectedPropertyValue(), key, paths: [itemPath] }
      siblingValues.set(itemPath, key, entry)
    }
    if (fact.sourceYamlPath !== undefined) {
      const sourceRootIndex = typeof propertyRule?.yaml === "string"
        ? fact.sourceYamlPath.lastIndexOf(propertyRule.yaml)
        : -1
      const sourceItemPath = sourceRootIndex < 0
        ? fact.sourceYamlPath.slice(0, -1)
        : fact.sourceYamlPath.slice(0, sourceRootIndex)
      if (!entry.paths.some(path => samePath(path, sourceItemPath))) entry.paths.push(sourceItemPath)
    }
    entry.selected.accept(relativePath, factValue, fact.scalarTag)
  }
  for (const entry of siblingValues.values()) {
    const value = entry.selected.finish()
    const decision = { value: typeof value === "string" || Array.isArray(value) ? value : undefined }
    for (const path of entry.paths) siblingProperties.set(path, entry.key, decision)
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

function collectSelectedDependentItems(
  params: Parameters<typeof collectImportDependencyFacts>[0],
  factsBySource: ReadonlyMap<string, Parameters<DirectImportFactsSink["acceptProperty"]>[0]>,
): ReadonlyMap<string, DependentImportFacts> {
  const requests = new Map<string, {
    item: ReadonlyMap<string, string>
    root: ReadonlyMap<string, string>
  }>()
  const paths = new Map<string, readonly (string | number)[]>()
  const add = (itemType: string, itemPath: readonly (string | number)[], itemName?: string,
    actualPath: readonly (string | number)[] = itemPath) => {
    const address = itemAddress(itemPath, itemType)
    if (requests.has(address)) return
    const context = { itemType, itemName, itemYamlPath: itemPath, rootRule: params.rule, owner: params.owner }
    const dependencies = params.execution === undefined
      ? dependentImportDependencies(context) : params.execution.dependentImportDependencies(context)
    if (dependencies === undefined) return
    const select = (prefix: readonly (string | number)[], keys: readonly string[]) => new Map(keys.map(key => {
      const path = [...prefix, key]
      const pointer = yamlPathToPointer(path)! // Имя свойства делает путь непустым.
      paths.set(pointer, path)
      return [key, pointer]
    }))
    requests.set(address, { item: select(actualPath, dependencies.item), root: select([], dependencies.root) })
  }
  for (const candidate of params.candidates) {
    const fact = factsBySource.get(propertyFactSourceAddress(candidate.itemType, candidate.propertyKey, candidate.yamlPath))
    const finalName = fact?.yamlPath.at(-2)
    add(candidate.itemType, candidate.itemYamlPath, typeof finalName === "string" ? finalName : candidate.itemName,
      fact?.yamlPath.slice(0, -1) ?? candidate.itemYamlPath)
  }
  const inspected = new Set<string>()
  for (const fact of params.propertyFacts ?? []) {
    if (fact.itemRule === undefined) continue
    const itemType = fact.itemType
    const path = fact.yamlPath.slice(0, -1)
    const address = itemAddress(path, itemType)
    if (inspected.has(address)) continue
    inspected.add(address)
    const name = path.at(-1)
    add(itemType, path, typeof name === "string" ? name : undefined)
  }
  const values = selectImportPropertyPaths(params.propertyFacts ?? [], paths)
  const project = (selected: ReadonlyMap<string, string>) => Object.fromEntries(
    [...selected].flatMap(([key, address]) => values.has(address) ? [[key, values.get(address)!.value]] : []),
  )
  return new Map([...requests].map(([address, request]) => [address, {
    item: project(request.item), root: project(request.root),
  }]))
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
  readonly finalPropertyFacts?: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
}): ImportDependencyFacts["finalProperties"] {
  const result = new ImportPropertyValues<{
    readonly present: boolean
    readonly value: unknown
    readonly scalarTag?: YAMLScalarTag
  }>()
  if (params.yaml === undefined && params.finalPropertyFacts === undefined) return result
  const paths = new Map<string, readonly (string | number)[]>()
  const request = (path: readonly (string | number)[]) => paths.set(yamlPathToPointer(path)!, path)
  for (const property of Object.values(params.rule.properties)) {
    if (typeof property.yaml === "string" && !property.externalFile && property.filePath === undefined) request([property.yaml])
  }
  for (const fact of params.propertyFacts) {
    const property = fact.itemRule?.properties[fact.propertyKey]
    if (typeof property?.yaml !== "string" || property.preserveEmptyXML !== true
      || fact.presentInXML === true || fact.reconstructionValue !== undefined || fact.yamlPath.length <= 1) continue
    request(fact.yamlPath.slice(0, -1))
    request([...fact.yamlPath.slice(0, -1), property.yaml])
  }
  const selected = params.finalPropertyFacts === undefined
    ? undefined : selectImportCompactPropertyPaths(params.finalPropertyFacts, paths)
  const read = (path: readonly (string | number)[]) => {
    if (selected !== undefined) return selected.get(yamlPathToPointer(path)!)
    const parent = recordAtPath(params.yaml, path.slice(0, -1))
    const key = path.at(-1)!
    return parent === undefined || !Object.hasOwn(parent, key) ? undefined
      : { value: parent[key], kind: importPropertyValueKind(parent[key]), scalarTag: yamlScalarTagAt(parent, key) }
  }
  for (const fact of params.propertyFacts) {
    if (fact.itemRule === undefined) continue
    const propertyRule = fact.itemRule.properties[fact.propertyKey]
    if (
      typeof propertyRule?.yaml !== "string"
      || propertyRule.preserveEmptyXML !== true
      || fact.presentInXML === true
      || fact.reconstructionValue !== undefined
    ) continue
    const finalItemPath = fact.yamlPath.slice(0, -1)
    if (finalItemPath.length === 0) continue
    if (read(finalItemPath)?.kind !== "object") continue
    const present = read([...finalItemPath, propertyRule.yaml]) !== undefined
    if (present) continue
    const decision = { present: false, value: undefined }
    result.set(finalItemPath, fact.propertyKey, decision)
    const sourceItemPath = (fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1)
    if (!samePath(sourceItemPath, finalItemPath)) {
      result.set(sourceItemPath, fact.propertyKey, decision)
    }
  }
  const factByProperty = new Map(params.propertyFacts
    .filter((fact) => fact.yamlPath.length === 1)
    .map((fact) => [fact.propertyKey, fact]))
  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string") continue
    if (propertyRule.externalFile || propertyRule.filePath !== undefined) continue
    const final = read([propertyRule.yaml])
    const present = final !== undefined
    if (!present) {
      const fact = factByProperty.get(propertyKey)
      if (fact === undefined || fact.presentInXML === false) {
        result.set([], propertyKey, { present: false, value: undefined })
      }
      continue
    }
    const finalValue = final.value
    if (
      (finalValue === null || finalValue === undefined)
      && factByProperty.get(propertyKey)?.reconstructionValue !== undefined
    ) continue
    const scalarTag = final.scalarTag
    const sourceFact = factByProperty.get(propertyKey)
    if (
      sourceFact !== undefined
      && sourceFact.reconstructionValue === undefined
      && scalarTag === undefined
      && (finalValue === null || typeof finalValue !== "object")
      && Object.is(finalValue, sourceFact.value)
    ) continue
    const value = compactImportPropertyValue(finalValue)
    if (value === undefined && scalarTag === undefined) continue
    result.set([], propertyKey, {
      present: true,
      value,
      ...(scalarTag === undefined ? {} : { scalarTag }),
    })
  }
  return result
}

function collectProofProperties(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ImportPropertyValues<{ readonly value: unknown }> {
  return collectCompactPropertyValues(facts.filter((fact) => {
    const key = fact.propertyKey.startsWith("$container:") ? fact.propertyKey.slice("$container:".length) : fact.propertyKey
    const rule = fact.itemRule?.properties[key]
    return rule?.xmlOnly === true || rule?.fromXML === false || fact.reconstructionValue !== undefined
  }))
}

function collectCompactPropertyValues(
  facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): ImportPropertyValues<{ readonly value: unknown }> {
  const result = new ImportPropertyValues<{ readonly value: unknown }>()
  interface SelectedProofProperty {
    readonly path: readonly (string | number)[]
    readonly value: ReturnType<typeof createSelectedPropertyValue>
    readonly key: string
    readonly aliases: (readonly (string | number)[])[]
    readable: boolean
  }
  interface SelectionPath {
    children?: Map<string | number, SelectionPath>
    property?: SelectedProofProperty
  }
  const selected: SelectedProofProperty[] = []
  const roots = new Map<string, SelectionPath>()
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
      let node = roots.get(key)
      if (node === undefined) { node = {}; roots.set(key, node) }
      for (const segment of path) {
        const children: Map<string | number, SelectionPath> = node.children ??= new Map()
        let child: SelectionPath | undefined = children.get(segment)
        if (child === undefined) { child = {}; children.set(segment, child) }
        node = child
        entry = node.property
        if (entry !== undefined) break
      }
      if (entry === undefined) {
        entry = { path, key, value: createSelectedPropertyValue(), aliases: [], readable: false }
        node.property = entry
        selected.push(entry)
      }
      path = entry.path
      if (!container) entry.readable = true
      const sourcePath = fact.sourceYamlPath ?? fact.yamlPath
      for (const alias of [path.slice(0, -1), sourcePath.slice(0, path.length - 1)]) {
        if (!entry.aliases.some(existing => samePath(existing, alias))) entry.aliases.push(alias)
      }
      const value = Object.hasOwn(fact, "reconstructionValue") ? fact.reconstructionValue : fact.value
      if (value === undefined && fact.scalarTag === undefined
        && !(fact.presentInXML === true && explicitContainers.has(yamlPathToPointer(fact.yamlPath.slice(0, -1))))) continue
      entry.value.accept(fact.yamlPath.slice(path.length), value, fact.scalarTag)
    }
  }
  for (const entry of selected) {
    const value = entry.value.finish()
    if (!entry.readable || value === undefined) continue
    const decision = { value }
    for (const alias of entry.aliases) result.set(alias, entry.key, decision)
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
      const result = facts.finalProperties.get(path, key)
        ?? facts.siblingProperties.get(path, key)
        ?? facts.proofProperties.get(path, key)
        ?? missingPropertyValue
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

const missingPropertyValue = Object.freeze({ value: undefined })

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
