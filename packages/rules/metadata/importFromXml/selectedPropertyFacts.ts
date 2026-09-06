import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"
import { yamlPathToPointer, yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
import { compactImportPropertyValue, createSelectedPropertyValue, importPropertyValueKind } from "./selectedPropertyValue"

type PropertyFact = Parameters<DirectImportFactsSink["acceptProperty"]>[0]

/** Материализует только явно запрошенные свойства, не YAML-представление документа. */
export function selectImportPropertyValues(
  facts: readonly PropertyFact[],
  keys: Iterable<string>,
): ReadonlyMap<string, unknown> {
  return new Map([...selectImportPropertyPaths(facts, new Map([...keys].map(key => [key, [key]])))]
    .map(([key, selected]) => [key, selected.value]))
}

interface SelectionNode {
  readonly children: Map<string | number, SelectionNode>
  readonly targets: Array<{
    readonly key: string
    readonly value: ReturnType<typeof createSelectedPropertyValue>
    present: boolean
    scalarTag?: YAMLScalarTag
  }>
}

export function selectImportPropertyPaths(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
): ReadonlyMap<string, { readonly value: unknown; readonly scalarTag?: YAMLScalarTag }> {
  return selectPropertyPaths(facts, paths, createSelectedPropertyValue)
}

/** Наличие и скаляр/пустой объект; содержимое составных значений не копируется. */
export function selectImportCompactPropertyPaths(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
): ReadonlyMap<string, { readonly value: unknown; readonly kind: ReturnType<typeof importPropertyValueKind>; readonly scalarTag?: YAMLScalarTag }> {
  const containers = new Set(facts.filter(fact => fact.propertyKey.startsWith("$container:"))
    .map(fact => yamlPathToPointer(fact.yamlPath)))
  const kinds = new Map<string, ReturnType<typeof importPropertyValueKind>>()
  const selected = selectPropertyPaths(facts, paths, key => {
    let value: unknown
    let kind: ReturnType<typeof importPropertyValueKind> = "scalar"
    let arrayBase = false
    let numericChildren = true
    return {
      accept(path, next) {
        value = path.length === 0 ? compactImportPropertyValue(next) : undefined
        if (path.length === 0) {
          kind = importPropertyValueKind(next)
          arrayBase = kind === "array"
          numericChildren = true
        } else {
          numericChildren &&= typeof path[0] === "number"
          kind = arrayBase || numericChildren ? "array" : "object"
        }
      },
      finish() { kinds.set(key, kind); return value },
    }
  }, fact => fact.presentInXML === true && containers.has(yamlPathToPointer(fact.yamlPath.slice(0, -1))))
  return new Map([...selected].map(([key, value]) => [key, { ...value, kind: kinds.get(key)! }]))
}

function selectPropertyPaths(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
  createValue: (key: string) => ReturnType<typeof createSelectedPropertyValue>,
  acceptUndefined: (fact: PropertyFact) => boolean = fact => fact.presentInXML === true,
): ReadonlyMap<string, { readonly value: unknown; readonly scalarTag?: YAMLScalarTag }> {
  const root: SelectionNode = { children: new Map(), targets: [] }
  const targets: SelectionNode["targets"] = []
  for (const [key, path] of paths) {
    let node = root
    for (const segment of path) {
      let child = node.children.get(segment)
      if (child === undefined) {
        child = { children: new Map(), targets: [] }
        node.children.set(segment, child)
      }
      node = child
    }
    const target = { key, value: createValue(key), present: false }
    node.targets.push(target)
    targets.push(target)
  }
  const accept = (node: SelectionNode, path: readonly (string | number)[], value: unknown, scalarTag?: YAMLScalarTag) => {
    for (const target of node.targets) {
      target.value.accept(path, value, scalarTag)
      target.present = true
      if (path.length === 0) target.scalarTag = scalarTag
    }
  }
  const distribute = (node: SelectionNode, value: unknown, scalarTag?: YAMLScalarTag): void => {
    accept(node, [], value, scalarTag)
    if (value === null || typeof value !== "object") return
    for (const [key, child] of node.children) {
      if (Object.hasOwn(value, key)) distribute(child, Reflect.get(value, key), yamlScalarTagAt(value, key))
    }
  }
  for (const batch of selectedFactsInDepthOrder(facts, root)) {
    for (const fact of batch) {
      let node: SelectionNode | undefined = root
      let read = false
      let value: unknown
      for (let index = 0; index < fact.yamlPath.length && node !== undefined; index++) {
        if (node.targets.length > 0) {
          if (!read) { value = fact.value; read = true }
          if (value !== undefined || fact.scalarTag !== undefined || acceptUndefined(fact)) {
            accept(node, fact.yamlPath.slice(index), value, fact.scalarTag)
          }
        }
        node = node.children.get(fact.yamlPath[index]!)
      }
      if (node !== undefined) {
        if (!read) value = fact.value
        if (value !== undefined || fact.scalarTag !== undefined || acceptUndefined(fact)) distribute(node, value, fact.scalarTag)
      }
    }
  }
  return new Map(targets.filter(target => target.present).map(target => [target.key, {
    value: target.value.finish(),
    ...(target.scalarTag === undefined ? {} : { scalarTag: target.scalarTag }),
  }]))
}

function* selectedFactsInDepthOrder(
  facts: readonly PropertyFact[],
  root: SelectionNode,
): Iterable<readonly PropertyFact[]> {
  const depths = new Map<number, PropertyFact[]>()
  for (const fact of facts) {
    let node: SelectionNode | undefined = root
    let selected = node.targets.length > 0
    for (const segment of fact.yamlPath) {
      node = node?.children.get(segment)
      if (node === undefined) break
      if (node.targets.length > 0) { selected = true; break }
    }
    if (!selected && node === undefined) continue
    const depth = fact.yamlPath.length * 2 + (fact.propertyKey.startsWith("$container:") ? 0 : 1)
    let bucket = depths.get(depth)
    if (bucket === undefined) { bucket = []; depths.set(depth, bucket) }
    bucket.push(fact)
  }
  // Сортируются только уровни выбранных путей, не все факты документа.
  for (const depth of [...depths.keys()].sort((left, right) => left - right)) yield depths.get(depth)!
}
