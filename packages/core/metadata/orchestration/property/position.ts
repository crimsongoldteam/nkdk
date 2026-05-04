import { isMap, isPair, isScalar, LineCounter, YAMLMap, YAMLSeq } from "yaml"

export interface SourcePosition {
  offset: number
  line: number
  column: number
  length?: number
}

function positionFromOffset(
  offset: number | undefined,
  lineCounter: LineCounter,
  length?: number,
): SourcePosition | undefined {
  if (offset === undefined) return undefined
  const pos = lineCounter.linePos(offset)
  return {
    offset,
    line: pos.line,
    column: pos.col,
    ...(length !== undefined ? { length } : {}),
  }
}

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
 * Находит позицию элемента в YAMLSeq по индексу (0-based).
 * Используется для per-element позиций в YAML-массивах.
 */
export function findSeqItemOffset(yamlSeq: YAMLSeq, index: number): number | undefined {
  const item = yamlSeq.items[index]
  if (item === undefined || item === null) return undefined
  const range = (item as { range?: number[] }).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return range[0]
}

export function computeSeqItemPosition(
  yamlSeq: YAMLSeq,
  index: number,
  lineCounter: LineCounter,
): SourcePosition | undefined {
  return positionFromOffset(findSeqItemOffset(yamlSeq, index), lineCounter)
}

/**
 * Находит позицию значения (не ключа) для заданного ключа в YAMLMap.
 */
export function computeValuePosition(
  yamlMap: YAMLMap,
  key: string,
  lineCounter: LineCounter,
): SourcePosition | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair)) return undefined
  const value = pair.value
  if (!value || typeof value !== "object") return undefined
  const range = (value as { range?: number[] }).range
  if (!Array.isArray(range) || range.length === 0) return undefined
  return positionFromOffset(range[0], lineCounter)
}
