import type { MetadataGraph } from "./MetadataGraph"

/** Один сегмент пути вида `Реквизит` или `ТабличнаяЧасть[0]`. */
export interface PathSegment {
  name: string
  hasIndex: boolean
}

export type WalkErrorKind = "not_found" | "invalid_index" | "stub_node"

export interface WalkError {
  kind: WalkErrorKind
  /** Имя сегмента, на котором произошла ошибка. */
  segment: string
  /** Идентификаторы узлов, в которых искали сегмент. */
  atNodes: string[]
}

export interface WalkResult {
  /**
   * Множество возможных целевых узлов после прохождения всего пути.
   * Для ссылочных реквизитов — узлы целевых типов (для автодополнения).
   * Для примитивов и табличных частей — сами узлы.
   */
  nodes: string[]
  errors: WalkError[]
}

const INDEX_PATTERN = /^(.+)\[\d+\]$/

/** Разбирает строку пути в массив сегментов. */
export function parsePathSegments(path: string): PathSegment[] {
  if (!path.trim()) return []
  return path.split(".").map((segment) => {
    const m = INDEX_PATTERN.exec(segment)
    if (m) return { name: m[1], hasIndex: true }
    return { name: segment, hasIndex: false }
  })
}

/**
 * Обходит граф по цепочке composition-рёбер, резолвируя каждый сегмент пути.
 *
 * На каждом шаге:
 * 1. Ищет composition-детей с совпадающим именем.
 * 2. Проверяет, что `[N]` применяется только к ТабличнаяЧасть.
 * 3. Для ссылочных реквизитов следует по reference-рёбрам, получая целевые типы.
 * 4. Узлы-заглушки (без item) прерывают ветку с ошибкой stub_node.
 *
 * Семантика union: на составных типах walker ветвится и собирает объединение.
 */
export function walkPath(
  graph: MetadataGraph,
  startNodes: string[],
  segments: PathSegment[],
): WalkResult {
  if (segments.length === 0) {
    return { nodes: [...new Set(startNodes)], errors: [] }
  }

  let currentNodes = [...startNodes]
  const errors: WalkError[] = []

  for (const segment of segments) {
    const nextNodes: string[] = []
    const notFoundAt: string[] = []
    const invalidIndexAt: string[] = []
    const stubAt: string[] = []

    for (const currentNode of currentNodes) {
      if (!graph.hasNode(currentNode)) continue

      // Узел-заглушка: item отсутствует — нельзя идти дальше
      if (graph.getNodeAttribute(currentNode, "item") === undefined) {
        stubAt.push(currentNode)
        continue
      }

      // Ищем composition-детей с совпадающим именем
      const matching: Array<{ nodeId: string; edgeYaml: string }> = []
      for (const { target, attributes } of graph.outEdgeEntries(currentNode)) {
        if (
          attributes.kind === "composition" &&
          graph.getNodeAttribute(target, "name") === segment.name
        ) {
          matching.push({ nodeId: target, edgeYaml: attributes.yaml })
        }
      }

      if (matching.length === 0) {
        notFoundAt.push(currentNode)
        continue
      }

      for (const { nodeId, edgeYaml } of matching) {
        // [N] допустима только для ТабличнаяЧасть
        if (segment.hasIndex && edgeYaml !== "ТабличнаяЧасть") {
          invalidIndexAt.push(nodeId)
          continue
        }
        nextNodes.push(nodeId)
      }
    }

    if (stubAt.length > 0) {
      errors.push({ kind: "stub_node", segment: segment.name, atNodes: stubAt })
    }
    if (notFoundAt.length > 0) {
      errors.push({ kind: "not_found", segment: segment.name, atNodes: notFoundAt })
    }
    if (invalidIndexAt.length > 0) {
      errors.push({ kind: "invalid_index", segment: segment.name, atNodes: invalidIndexAt })
    }

    if (nextNodes.length === 0) {
      return { nodes: [], errors }
    }

    // Разыменование: следуем по reference-рёбрам к целевым типам
    const resolvedNodes: string[] = []
    for (const nodeId of nextNodes) {
      const refTargets: string[] = []
      for (const { target, attributes } of graph.outEdgeEntries(nodeId)) {
        if (attributes.kind === "reference") {
          refTargets.push(target)
        }
      }
      if (refTargets.length > 0) {
        resolvedNodes.push(...refTargets)
      } else {
        // Примитивный тип или табличная часть — оставляем узел как есть
        resolvedNodes.push(nodeId)
      }
    }

    // Дедупликация (union-семантика на составных типах)
    currentNodes = [...new Set(resolvedNodes)]
  }

  return { nodes: currentNodes, errors }
}

/** Удобная обёртка: принимает строку пути вместо массива сегментов. */
export function walk(graph: MetadataGraph, startNodes: string[], path: string): WalkResult {
  return walkPath(graph, startNodes, parsePathSegments(path))
}
