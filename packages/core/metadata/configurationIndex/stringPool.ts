export interface ConfigurationIndexStringPool {
  strings: string[]
  id(value: string): number
}

export function createStringPool(values: Iterable<string>): ConfigurationIndexStringPool {
  const unique = new Set<string>()
  for (const value of values) {
    if (value.includes("\0")) throw new Error("Строка STRINGS содержит U+0000")
    unique.add(value)
  }
  const strings = [...unique].sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")))
  const ids = new Map(strings.map((value, index) => [value, index + 1]))
  return {
    strings,
    id(value) {
      const id = ids.get(value)
      if (id === undefined) throw new Error(`Строка отсутствует в STRINGS: ${value}`)
      return id
    },
  }
}
