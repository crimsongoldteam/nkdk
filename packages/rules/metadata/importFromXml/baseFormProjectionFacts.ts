import { hasYAMLRuntimeMetadataAt, type YAMLScalarTag } from "@nkdk/runtime"
import type { BaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjectionSource"
import type { DirectImportPropertyFact } from "./propertyFacts"
import { createSelectedPropertyValue } from "./selectedPropertyValue"

interface FactNode {
  children?: Map<string | number, FactNode>
  hasValue?: true
  value?: unknown
  scalarTag?: YAMLScalarTag
}

export function baseFormProjectionSourceFromFacts(
  facts: readonly DirectImportPropertyFact[],
  prefix: readonly (string | number)[] = [],
): BaseFormProjectionSource {
  const root: FactNode = {}
  const containers: FactNode = {}
  const included = (path: readonly (string | number)[]) => path.length >= prefix.length
    && prefix.every((segment, index) => segment === path[index])
  for (const fact of facts) {
    if (included(fact.yamlPath) && fact.propertyKey.startsWith("$container:")) {
      ensurePath(containers, fact.yamlPath, prefix.length).hasValue = true
    }
  }
  for (const fact of facts) {
    if (!included(fact.yamlPath)) continue
    const value = fact.value
    if (value === undefined && fact.scalarTag === undefined) {
      let parent: FactNode | undefined = containers
      for (let index = prefix.length; index < fact.yamlPath.length - 1; index++) {
        parent = parent?.children?.get(fact.yamlPath[index]!)
      }
      if (fact.presentInXML !== true || parent?.hasValue !== true) continue
    }
    const node = ensurePath(root, fact.yamlPath, prefix.length)
    node.hasValue = true
    node.value = value
    node.scalarTag = fact.scalarTag
  }
  return source(root)
}

function ensurePath(root: FactNode, path: readonly (string | number)[], start: number): FactNode {
  let node = root
  for (let index = start; index < path.length; index++) {
    const key = path[index]!
    const children = node.children ??= new Map()
    let child = children.get(key)
    if (child === undefined) {
      child = {}
      children.set(key, child)
    }
    node = child
  }
  return node
}

function source(node: FactNode, inherited?: unknown): BaseFormProjectionSource {
  const effective = node.hasValue ? node.value : inherited
  const base = isContainer(effective) ? effective : undefined
  const array = Array.isArray(base) || (node.children !== undefined
    && [...node.children.keys()].every(key => typeof key === "number"))
  const segment = (key: string) => array && /^\d+$/u.test(key) ? Number(key) : key
  const inheritedChild = (key: string): unknown => base === undefined ? undefined : Reflect.get(base, key)
  return {
    keys: () => [...new Set([...(base === undefined ? [] : Object.keys(base)),
      ...[...(node.children?.keys() ?? [])].map(String)])],
    has: key => node.children?.has(segment(key)) === true || (base !== undefined && Object.hasOwn(base, key)),
    read(key) {
      const child = node.children?.get(segment(key))
      return child === undefined ? inheritedChild(key) : materialize(child, inheritedChild(key))
    },
    child(key) {
      const child = node.children?.get(segment(key))
      const inherited = inheritedChild(key)
      if (child === undefined && inherited === undefined) return undefined
      const value = child?.hasValue ? child.value : inherited
      if (child?.children === undefined && !isContainer(value)) {
        throw new Error(`Поле проекции основы ${key} должно быть объектом`)
      }
      return source(child ?? {}, inherited)
    },
    hasRuntimeMetadata: (key, annotations) => node.children?.get(segment(key))?.scalarTag !== undefined
      || (base !== undefined && hasYAMLRuntimeMetadataAt(base, key, annotations)),
    ...(base === undefined ? {} : { metadataSource: base }),
  }
}

/** Материализуется только выбранное свойство, не корень формы или её дерево элементов. */
function materialize(root: FactNode, inherited: unknown): unknown {
  if (root.children === undefined) return root.hasValue ? root.value : inherited
  const selected = createSelectedPropertyValue()
  const path: (string | number)[] = []
  const append = (node: FactNode, inherited: unknown): void => {
    const value = node.hasValue ? node.value : inherited
    const base = isContainer(value) ? value : undefined
    const container = node.children === undefined ? value
      : base ?? ([...node.children.keys()].every(key => typeof key === "number") ? [] : {})
    selected.accept(path, container, node.scalarTag)
    for (const [key, child] of node.children ?? []) {
      path.push(key)
      append(child, base === undefined ? undefined : Reflect.get(base, key))
      path.pop()
    }
  }
  append(root, inherited)
  return selected.finish()
}

function isContainer(value: unknown): value is object {
  return value !== null && typeof value === "object"
}
