export interface ConfigurationIndexStringPool {
  strings: string[]
  id(value: string): number
}

export function createStringPool(values: Iterable<string>): ConfigurationIndexStringPool {
  const unique = new Map<string, string>()
  for (const value of values) {
    if (value.includes("\0")) throw new Error("Строка STRINGS содержит U+0000")
    const key = utf8Key(value)
    if (!unique.has(key)) unique.set(key, value)
  }
  const strings = [...unique.values()].sort((left, right) =>
    Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
  )
  const ids = new Map(strings.map((value, index) => [utf8Key(value), index + 1]))
  return {
    strings,
    id(value) {
      const id = ids.get(utf8Key(value))
      if (id === undefined) throw new Error(`Строка отсутствует в STRINGS: ${value}`)
      return id
    },
  }
}

function utf8Key(value: string): string {
  return Buffer.from(value, "utf8").toString("hex")
}
