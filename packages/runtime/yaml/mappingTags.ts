import { defineMappingTag } from "js-yaml"

export type YAMLMappingTag = "xml/order"

const mappingTags = new WeakMap<object, YAMLMappingTag>()
const mappingKeyOrders = new WeakMap<object, readonly string[]>()

export function markYAMLMappingTag(value: object, tag: YAMLMappingTag): void {
  mappingTags.set(value, tag)
}

export function yamlMappingTagOf(value: unknown): YAMLMappingTag | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? mappingTags.get(value)
    : undefined
}

export function copyYAMLMappingTag(source: object, target: object): void {
  const tag = yamlMappingTagOf(source)
  if (tag !== undefined) markYAMLMappingTag(target, tag)
}

export function markYAMLMappingKeyOrder(value: object, keys: readonly string[]): void {
  mappingKeyOrders.set(value, [...keys])
}

export function hasYAMLMappingKeyOrder(value: object): boolean {
  return mappingKeyOrders.has(value)
}

export function yamlMappingKeys(value: Record<string, unknown>): string[] {
  const marked = mappingKeyOrders.get(value)
  if (marked === undefined) return Object.keys(value)
  const current = Object.keys(value)
  const currentSet = new Set(current)
  return [
    ...marked.filter((key) => currentSet.delete(key)),
    ...current.filter((key) => currentSet.has(key)),
  ]
}

export function yamlMappingEntries(value: Record<string, unknown>): [string, unknown][] {
  return yamlMappingKeys(value).map((key) => [key, value[key]])
}

export function copyYAMLMappingKeyOrder(source: object, target: object): void {
  const order = mappingKeyOrders.get(source)
  if (order !== undefined) markYAMLMappingKeyOrder(target, order)
}

export function createYAMLOrderedMapping<T>(entries: readonly (readonly [string, T])[]): Record<string, T> {
  const keys = entries.map(([key]) => key)
  const target: Record<string, T> = {}
  for (const [key, value] of entries) {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    })
  }
  const ordered = new Proxy(target, {
    ownKeys(current) {
      const remaining = new Set(Reflect.ownKeys(current))
      const result: (string | symbol)[] = []
      for (const key of keys) {
        if (remaining.delete(key)) result.push(key)
      }
      result.push(...remaining)
      return result
    },
  })
  markYAMLMappingKeyOrder(ordered, keys)
  return ordered
}

const xmlOrderMappingTag = defineMappingTag<Map<unknown, unknown>, Record<string, unknown>>(
  "!xml/order",
  {
    create: () => new Map(),
    addPair(carrier, key, value) {
      if (carrier.has(key)) return "duplicated mapping key"
      carrier.set(key, value)
      return ""
    },
    has: (carrier, key) => carrier.has(key),
    keys: (result) => yamlMappingKeys(result),
    get: (result, key) => result[String(key)],
    finalize(carrier) {
      const result = createYAMLOrderedMapping([...carrier].map(([key, value]) => [String(key), value]))
      markYAMLMappingTag(result, "xml/order")
      return result
    },
    identify: (value) => yamlMappingTagOf(value) === "xml/order",
    represent: (value) => new Map(yamlMappingEntries(value as Record<string, unknown>)),
  },
)

export const NKDK_YAML_MAPPING_TAGS = [xmlOrderMappingTag] as const
