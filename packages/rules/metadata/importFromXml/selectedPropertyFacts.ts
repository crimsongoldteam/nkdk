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

interface SelectionValue<T> {
  accept: ReturnType<typeof createSelectedPropertyValue>["accept"]
  finish(): T
}

interface SelectionNode<T> {
  readonly children: Map<string | number, SelectionNode<T>>
  readonly targets: Array<{
    readonly value: SelectionValue<T>
    present: boolean
    scalarTag?: YAMLScalarTag
    selected?: T & { readonly scalarTag?: YAMLScalarTag }
  }>
}

export function selectImportPropertyPaths(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
): ReadonlyMap<string, { readonly value: unknown; readonly scalarTag?: YAMLScalarTag }> {
  return selectPropertyPaths(facts, paths, () => {
    const value = createSelectedPropertyValue()
    return { accept: value.accept, finish: () => ({ value: value.finish() }) }
  })
}

/** Наличие и скаляр/пустой объект; содержимое составных значений не копируется. */
export function selectImportCompactPropertyPaths(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
): ReadonlyMap<string, { readonly value: unknown; readonly kind: ReturnType<typeof importPropertyValueKind>; readonly scalarTag?: YAMLScalarTag }> {
  const containers = new Set(facts.filter(fact => fact.propertyKey.startsWith("$container:"))
    .map(fact => yamlPathToPointer(fact.yamlPath)))
  return selectPropertyPaths(facts, paths, () => {
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
      finish() { return { value, kind } },
    }
  }, fact => fact.presentInXML === true && containers.has(yamlPathToPointer(fact.yamlPath.slice(0, -1))))
}

function selectPropertyPaths<T extends { readonly value: unknown }>(
  facts: readonly PropertyFact[],
  paths: ReadonlyMap<string, readonly (string | number)[]>,
  createValue: () => SelectionValue<T>,
  acceptUndefined: (fact: PropertyFact) => boolean = fact => fact.presentInXML === true,
): ReadonlyMap<string, T & { readonly scalarTag?: YAMLScalarTag }> {
  const root: SelectionNode<T> = { children: new Map(), targets: [] }
  const targets = new Map<string, SelectionNode<T>["targets"][number]>()
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
    let target = node.targets[0]
    if (target === undefined) {
      target = { value: createValue(), present: false }
      node.targets.push(target)
    }
    targets.set(key, target)
  }
  const accept = (node: SelectionNode<T>, path: readonly (string | number)[], value: unknown, scalarTag?: YAMLScalarTag) => {
    for (const target of node.targets) {
      target.value.accept(path, value, scalarTag)
      target.present = true
      if (path.length === 0) target.scalarTag = scalarTag
    }
  }
  const distribute = (node: SelectionNode<T>, value: unknown, scalarTag?: YAMLScalarTag): void => {
    accept(node, [], value, scalarTag)
    if (value === null || typeof value !== "object") return
    for (const [key, child] of node.children) {
      if (Object.hasOwn(value, key)) distribute(child, Reflect.get(value, key), yamlScalarTagAt(value, key))
    }
  }
  for (const batch of selectedFactsInDepthOrder(facts, root)) {
    for (const fact of batch) {
      let node: SelectionNode<T> | undefined = root
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
  const result = new Map<string, T & { readonly scalarTag?: YAMLScalarTag }>()
  for (const [key, target] of targets) {
    if (!target.present) continue
    const selected = target.selected ??= { ...target.value.finish(),
      ...(target.scalarTag === undefined ? {} : { scalarTag: target.scalarTag }) }
    result.set(key, selected)
  }
  return result
}

function* selectedFactsInDepthOrder<T>(
  facts: readonly PropertyFact[],
  root: SelectionNode<T>,
): Iterable<readonly PropertyFact[]> {
  const depths = new Map<number, PropertyFact[]>()
  for (const fact of facts) {
    let node: SelectionNode<T> | undefined = root
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
