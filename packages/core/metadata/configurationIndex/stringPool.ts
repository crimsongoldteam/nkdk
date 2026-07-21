export interface ConfigurationIndexStringPool {
  strings: string[]
  id(value: string): number
}

export function createStringPool(values: Iterable<string>): ConfigurationIndexStringPool {
  const ids = new Map<string, number>()
  const strings: string[] = []
  for (const value of values) {
    if (value.includes("\0")) throw new Error("Строка STRINGS содержит U+0000")
    if (ids.has(value)) continue
    strings.push(value)
    ids.set(value, strings.length)
  }
  return {
    strings,
    id(value) {
      const id = ids.get(value)
      if (id === undefined) throw new Error(`Строка отсутствует в STRINGS: ${value}`)
      return id
    },
  }
}
