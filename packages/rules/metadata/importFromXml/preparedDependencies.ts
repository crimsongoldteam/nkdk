import { copyYAMLRuntimeMetadata, yamlPathToPointer, yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
import { recordAtPath } from "./dependentItems"
import { ImportPropertyValues } from "./propertyValues"
import { ImportCandidateValues } from "./candidateValues"
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
  readonly properties: ImportCandidateValues<{ readonly facts: DependentImportFacts; readonly itemName?: string }>
  readonly items: ImportPropertyValues<DependentImportFacts>
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
  const properties = new ImportCandidateValues<{ readonly facts: DependentImportFacts; readonly itemName?: string }>()
  const items = new ImportPropertyValues<DependentImportFacts>()
  const inspectedItems = new ImportPropertyValues<object>()
  const propertyFactsBySource = new Map<string, ImportPropertyValues<NonNullable<typeof params.propertyFacts>[number]>>()
  if (params.candidates.length > 0) {
    const requestedPaths = new ImportPropertyValues<Set<string>>()
    for (const candidate of params.candidates) {
      let types = requestedPaths.get(candidate.yamlPath, candidate.propertyKey)
      if (types === undefined) {
        types = new Set()
        requestedPaths.set(candidate.yamlPath, candidate.propertyKey, types)
      }
      types.add(candidate.itemType)
    }
    for (const fact of params.propertyFacts ?? []) {
      const path = fact.sourceYamlPath ?? fact.yamlPath
      const types = requestedPaths.get(path, fact.propertyKey)
      if (types === undefined) continue
      const itemType = fact.itemType
      if (!types.has(itemType)) continue
      let values = propertyFactsBySource.get(itemType)
      if (values === undefined) {
        values = new ImportPropertyValues()
        propertyFactsBySource.set(itemType, values)
      }
      if (values.get(path, fact.propertyKey) === undefined) values.set(path, fact.propertyKey, fact)
    }
  }
  const itemFacts = (itemType: string, itemYamlPath: readonly (string | number)[], itemName?: string) => {
    if (inspectedItems.get(itemYamlPath, itemType) !== undefined) return items.get(itemYamlPath, itemType)
    inspectedItems.set(itemYamlPath, itemType, inspectedMarker)
    if (selectedItems !== undefined) {
      const facts = selectedItems.get(itemYamlPath, itemType)
      if (facts !== undefined) items.set(itemYamlPath, itemType, facts)
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
    if (facts !== undefined) items.set(itemYamlPath, itemType, facts)
    return facts
  }
  const selectedItems = params.propertyFacts === undefined ? undefined : collectSelectedDependentItems(params, propertyFactsBySource)
  for (const candidate of params.candidates) {
    const propertyFact = propertyFactsBySource.get(candidate.itemType)?.get(candidate.yamlPath, candidate.propertyKey)
    const finalName = propertyFact?.yamlPath.at(-2)
    const itemName = typeof finalName === "string" ? finalName : candidate.itemName
    const facts = itemFacts(
      candidate.itemType,
      candidate.itemYamlPath,
      itemName,
    )
    if (facts !== undefined) {
      properties.set(candidate, { facts, ...(itemName === undefined ? {} : { itemName }) })
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
      if (facts !== undefined) items.set((fact.sourceYamlPath ?? fact.yamlPath).slice(0, -1), itemType, facts)
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
    items,
    siblingProperties,
    proofProperties,
    finalProperties,
  }
}

function collectSelectedDependentItems(
  params: Parameters<typeof collectImportDependencyFacts>[0],
  factsBySource: ReadonlyMap<string, ImportPropertyValues<Parameters<DirectImportFactsSink["acceptProperty"]>[0]>>,
): ImportPropertyValues<DependentImportFacts> {
  const requests = new ImportPropertyValues<{
    readonly path: readonly (string | number)[]
    readonly itemType: string
    item: ReadonlyMap<string, string>
    root: ReadonlyMap<string, string>
  }>()
  const paths = new Map<string, readonly (string | number)[]>()
  const pathKeys = new ImportPropertyValues<{ readonly key: string }>()
  const add = (itemType: string, itemPath: readonly (string | number)[], itemName?: string,
    actualPath: readonly (string | number)[] = itemPath) => {
    if (requests.get(itemPath, itemType) !== undefined) return
    const context = { itemType, itemName, itemYamlPath: itemPath, rootRule: params.rule, owner: params.owner }
    const dependencies = params.execution === undefined
      ? dependentImportDependencies(context) : params.execution.dependentImportDependencies(context)
    if (dependencies === undefined) return
    const select = (prefix: readonly (string | number)[], keys: readonly string[]) => new Map(keys.map(key => {
      let selected = pathKeys.get(prefix, key)
      if (selected === undefined) {
        selected = { key: String(paths.size) }
        pathKeys.set(prefix, key, selected)
        paths.set(selected.key, [...prefix, key])
      }
      return [key, selected.key]
    }))
    requests.set(itemPath, itemType, {
      path: itemPath, itemType, item: select(actualPath, dependencies.item), root: select([], dependencies.root),
    })
  }
  for (const candidate of params.candidates) {
    const fact = factsBySource.get(candidate.itemType)?.get(candidate.yamlPath, candidate.propertyKey)
    const finalName = fact?.yamlPath.at(-2)
    add(candidate.itemType, candidate.itemYamlPath, typeof finalName === "string" ? finalName : candidate.itemName,
      fact?.yamlPath.slice(0, -1) ?? candidate.itemYamlPath)
  }
  const inspected = new ImportPropertyValues<object>()
  for (const fact of params.propertyFacts ?? []) {
    if (fact.itemRule === undefined) continue
    const itemType = fact.itemType
    const path = fact.yamlPath.slice(0, -1)
    if (inspected.get(path, itemType) !== undefined) continue
    inspected.set(path, itemType, inspectedMarker)
    const name = path.at(-1)
    add(itemType, path, typeof name === "string" ? name : undefined)
  }
  const values = selectImportPropertyPaths(params.propertyFacts ?? [], paths)
  const project = (selected: ReadonlyMap<string, string>) => Object.fromEntries(
    [...selected].flatMap(([key, address]) => values.has(address) ? [[key, values.get(address)!.value]] : []),
  )
  const result = new ImportPropertyValues<DependentImportFacts>()
  for (const request of requests.values()) {
    result.set(request.path, request.itemType, { item: project(request.item), root: project(request.root) })
  }
  return result
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
    itemFacts: (path, itemType) => facts.items.get(path, itemType),
    propertyValue: (path, key) => {
      const result = facts.finalProperties.get(path, key)
        ?? facts.siblingProperties.get(path, key)
        ?? facts.proofProperties.get(path, key)
        ?? missingPropertyValue
      return result
    },
    shouldOmit(candidate, values) {
      const prepared = facts.properties.get(candidate)
      if (prepared === undefined) return false
      const dependency = prepared.facts
      const itemName = prepared.itemName ?? candidate.itemName
      const item = { ...dependency.item, ...values }
      copyYAMLRuntimeMetadata(values, item)
      const request = {
        ...lookups,
        ...(itemName === undefined ? {} : { itemName }),
        itemType: candidate.itemType,
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
const inspectedMarker = Object.freeze({})

function samePath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
