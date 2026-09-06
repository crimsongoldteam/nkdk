import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"
import { yamlScalarTagAt, type YAMLScalarTag } from "@nkdk/runtime"
import { createSelectedPropertyValue } from "./selectedPropertyValue"

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
    const target = { key, value: createSelectedPropertyValue(), present: false }
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
          if (value !== undefined || fact.scalarTag !== undefined || fact.presentInXML === true) {
            accept(node, fact.yamlPath.slice(index), value, fact.scalarTag)
          }
        }
        node = node.children.get(fact.yamlPath[index]!)
      }
      if (node !== undefined) {
        if (!read) value = fact.value
        if (value !== undefined || fact.scalarTag !== undefined || fact.presentInXML === true) distribute(node, value, fact.scalarTag)
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
