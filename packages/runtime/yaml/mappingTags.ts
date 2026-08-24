const mappingKeyOrders = new WeakMap<object, readonly string[]>()

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
