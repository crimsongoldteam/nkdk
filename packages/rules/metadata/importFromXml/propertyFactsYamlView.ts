import { markYAMLScalarTag } from "@nkdk/runtime"
import type { YAMLScalarTag } from "@nkdk/runtime"
import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"

export type DirectImportPropertyFact = Parameters<DirectImportFactsSink["acceptProperty"]>[0]

interface FactNode {
  hasValue?: true
  value?: unknown
  scalarTag?: YAMLScalarTag
  readonly children: Map<string | number, FactNode>
}

/**
 * Ленивое представление адресных фактов для существующих читающих алгоритмов.
 * Оно не строит и не хранит полный YAML: контейнер создаётся только при чтении
 * конкретного пути, а листья ссылаются на компактные значения фактов.
 */
export function createPropertyFactsYamlView(
  facts: readonly DirectImportPropertyFact[],
): Readonly<Record<string, unknown>> {
  const root: FactNode = { children: new Map() }
  const explicitContainerPaths = new Set(
    facts
      .filter(({ propertyKey }) => propertyKey.startsWith("$container:"))
      .map(({ yamlPath }) => pathKey(yamlPath)),
  )
  for (const fact of facts) {
    const explicitUndefined = fact.value === undefined
      && fact.scalarTag === undefined
      && fact.presentInXML === true
      && explicitContainerPaths.has(pathKey(fact.yamlPath.slice(0, -1)))
    if (
      fact.yamlPath.length === 0
      || (fact.value === undefined && fact.scalarTag === undefined && !explicitUndefined)
    ) continue
    let node = root
    for (const segment of fact.yamlPath) {
      let child = node.children.get(segment)
      if (child === undefined) {
        child = { children: new Map() }
        node.children.set(segment, child)
      }
      node = child
    }
    node.hasValue = true
    node.value = fact.value
    node.scalarTag = fact.scalarTag
  }
  return view(root, {}) as Readonly<Record<string, unknown>>
}

export function propertyFactsWithReconstructionValues(
  facts: readonly DirectImportPropertyFact[],
): readonly DirectImportPropertyFact[] {
  return facts.map(fact => Object.hasOwn(fact, "reconstructionValue")
    ? { ...fact, value: fact.reconstructionValue }
    : fact)
}

function pathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}

function view(node: FactNode, inherited?: unknown): unknown {
  const effectiveValue = node.hasValue === true ? node.value : inherited
  if (node.children.size === 0) return effectiveValue
  const base = isContainer(effectiveValue) ? effectiveValue : undefined
  const array = Array.isArray(base) || [...node.children.keys()].every(key => typeof key === "number")
  const target: Record<string, unknown> | unknown[] = array ? [] : {}
  if (Array.isArray(target)) {
    const indexes = [...node.children.keys()].filter((key): key is number => typeof key === "number")
    target.length = Math.max(Array.isArray(base) ? base.length : 0, ...indexes.map(index => index + 1), 0)
  }
  const proxy = new Proxy(target, {
    get(_target, property) {
      if (typeof property === "symbol") return Reflect.get(target, property)
      if (array && property === "length") return Reflect.get(target, property)
      const segment = array && /^\d+$/u.test(property) ? Number(property) : property
      const child = node.children.get(segment)
      if (child !== undefined) {
        const inheritedChild = isContainer(base) ? Reflect.get(base, property) : undefined
        return view(child, inheritedChild)
      }
      return isContainer(base) && Reflect.has(base, property)
        ? Reflect.get(base, property)
        : Reflect.get(target, property)
    },
    has(_target, property) {
      if (typeof property === "symbol") return Reflect.has(target, property)
      const segment = array && /^\d+$/u.test(property) ? Number(property) : property
      return node.children.has(segment)
        || (isContainer(base) && Reflect.has(base, property))
        || Reflect.has(target, property)
    },
    ownKeys() {
      const keys = new Set<string | symbol>(Reflect.ownKeys(target))
      if (isContainer(base)) {
        for (const key of Reflect.ownKeys(base)) keys.add(key)
      }
      for (const key of node.children.keys()) keys.add(String(key))
      if (array) keys.add("length")
      return [...keys]
    },
    getOwnPropertyDescriptor(_target, property) {
      if (array && property === "length") return Reflect.getOwnPropertyDescriptor(target, property)
      if (typeof property === "symbol") return Reflect.getOwnPropertyDescriptor(target, property)
      const segment = array && /^\d+$/u.test(property) ? Number(property) : property
      if (!node.children.has(segment) && !(isContainer(base) && Reflect.has(base, property))) return undefined
      return { configurable: true, enumerable: true, writable: false, value: undefined }
    },
  })
  for (const [key, child] of node.children) {
    if (child.scalarTag !== undefined) markYAMLScalarTag(proxy, key, child.scalarTag)
  }
  return proxy
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object"
}
