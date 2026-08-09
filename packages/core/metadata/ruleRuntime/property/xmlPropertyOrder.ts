import type { MetadataItemRule } from "./types"

const compiledXMLPropertyOrderCache = new WeakMap<MetadataItemRule, readonly string[]>()

export function getCompiledXMLPropertyOrder(rule: MetadataItemRule): readonly string[] {
  const cached = compiledXMLPropertyOrderCache.get(rule)
  if (cached !== undefined) return cached

  const declarationOrder = Object.keys(rule.properties)
  const declaredKeys = new Set(declarationOrder)
  const explicitOrder = rule.xmlOrder ?? []
  const seen = new Set<string>()

  for (const key of explicitOrder) {
    if (!declaredKeys.has(key)) {
      throw new Error(`${rule.itemType}: неизвестный ключ xmlOrder ${key}`)
    }
    if (seen.has(key)) {
      throw new Error(`${rule.itemType}: ключ xmlOrder ${key} повторяется`)
    }
    seen.add(key)
  }

  const compiled = Object.freeze([...explicitOrder, ...declarationOrder.filter((key) => !seen.has(key))])
  compiledXMLPropertyOrderCache.set(rule, compiled)
  return compiled
}
