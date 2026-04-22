import { isMap, isPair, isScalar, YAMLMap } from "yaml"

/**
 * Находит вложенный YAMLMap для заданного ключа.
 */
export function findSubmap(yamlMap: YAMLMap | undefined, key: string | undefined): YAMLMap | undefined {
  if (!yamlMap || !key) return undefined
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isMap(pair.value)) return undefined
  return pair.value
}

/**
 * Находит позицию ключа (не значения) для заданного ключа в YAMLMap.
 */
export function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

/**
 * Находит позицию значения (не ключа) для заданного ключа в YAMLMap.
 */
export function computeValuePosition(yamlMap: YAMLMap, key: string): { offset: number } | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair)) return undefined
  const value = pair.value
  if (!value || typeof value !== "object") return undefined
  const range = (value as { range?: number[] }).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return { offset: range[0] }
}
