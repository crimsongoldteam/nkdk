import type { SourcePosition } from "~/metadata/orchestration/property/position"

/** Атрибуты узла графа. */
export interface NodeAttributes {
  name: string | undefined
  item: unknown
  filePaths: string[]
  contributedFilePaths: string[]
  flattenSkipKeys: Set<string>
}

/** Атрибуты ребра графа (kind всегда присутствует; дополнительные поля опциональны). */
export interface EdgeAttributes {
  kind: string
  positionFrom?: SourcePosition
  [key: string]: unknown
}

interface EdgeRecord {
  src: string
  tgt: string
  attrs: EdgeAttributes
}

/**
 * Лёгкий внутренний граф без внешних зависимостей.
 * Мульти-граф: несколько рёбер между одной парой узлов различаются по kind.
 */
export class GraphBuilder {
  private readonly nodesMap = new Map<string, NodeAttributes>()
  private readonly nodesByPrefix = new Map<string, string[]>()
  // Рёбра — плоский массив; порядок вставки сохраняется
  private readonly edgeList: EdgeRecord[] = []
  private readonly edgeByKey = new Map<string, EdgeRecord>()
  private readonly outEdgesBySource = new Map<string, EdgeRecord[]>()
  private readonly inEdgesByTarget = new Map<string, EdgeRecord[]>()

  // ── узлы ────────────────────────────────────────────────────

  hasNode(id: string): boolean {
    return this.nodesMap.has(id)
  }

  /**
   * Создаёт узел, если его ещё нет.
   * Повторный вызов не перезаписывает уже установленные поля.
   */
  ensureNode(id: string, attrs?: Partial<Pick<NodeAttributes, "name" | "item">>): void {
    if (this.nodesMap.has(id)) return
    this.nodesMap.set(id, {
      name: attrs?.name,
      item: attrs?.item,
      filePaths: [],
      contributedFilePaths: [],
      flattenSkipKeys: new Set(),
    })
    this.indexNodePrefixes(id)
  }

  private indexNodePrefixes(id: string): void {
    for (let i = 0; i < id.length; i += 1) {
      if (id[i] !== ".") continue
      this.addNodePrefix(id.slice(0, i + 1), id)
    }
    this.addNodePrefix(id, id)
  }

  private addNodePrefix(prefix: string, id: string): void {
    const nodes = this.nodesByPrefix.get(prefix)
    if (nodes) {
      nodes.push(id)
    } else {
      this.nodesByPrefix.set(prefix, [id])
    }
  }

  getNodeAttributes(id: string): NodeAttributes {
    const node = this.nodesMap.get(id)
    if (!node) throw new Error(`Unknown node: "${id}"`)
    return node
  }

  // ── filePaths ────────────────────────────────────────────────

  /** Добавляет filePath на узел; идемпотентен. */
  addFilePath(id: string, filePath: string): void {
    const node = this.getNodeAttributes(id)
    if (!node.filePaths.includes(filePath)) {
      node.filePaths.push(filePath)
    }
  }

  /** Добавляет contributed filePath на узел; идемпотентен. */
  addContributedFilePath(id: string, filePath: string): void {
    const node = this.getNodeAttributes(id)
    if (!node.contributedFilePaths.includes(filePath)) {
      node.contributedFilePaths.push(filePath)
    }
  }

  /** Удаляет filePath с узла; если пути не было — no-op. */
  removeFilePath(id: string, filePath: string): void {
    const node = this.getNodeAttributes(id)
    const idx = node.filePaths.indexOf(filePath)
    if (idx !== -1) node.filePaths.splice(idx, 1)
  }

  // ── item ─────────────────────────────────────────────────────

  /**
   * Заменяет item на узле.
   * Если item имеет строковое поле name — синхронизирует attrs.name.
   */
  setItem(id: string, item: unknown): void {
    const node = this.getNodeAttributes(id)
    node.item = item
    if (item !== null && typeof item === "object" && "name" in item && typeof (item as Record<string, unknown>).name === "string") {
      node.name = (item as Record<string, unknown>).name as string
    }
  }

  /** Помечает поля item, которые не должны попадать в flattenItem props. */
  addFlattenSkipKeys(id: string, keys: Iterable<string>): void {
    const node = this.getNodeAttributes(id)
    for (const key of keys) {
      node.flattenSkipKeys.add(key)
    }
  }

  // ── рёбра ────────────────────────────────────────────────────

  /**
   * Добавляет ребро (src → tgt, kind).
   * Мульти-граф: уникальность определяется тройкой (src, tgt, kind).
   * При повторном вызове обновляет дополнительные атрибуты (merge).
   */
  ensureEdge(
    src: string,
    tgt: string,
    kind: string,
    attrs?: Omit<EdgeAttributes, "kind">,
  ): void {
    const key = JSON.stringify([src, tgt, kind])
    const existing = this.edgeByKey.get(key)
    if (existing) {
      // Обновляем атрибуты — kind не перезаписывается
      if (attrs) Object.assign(existing.attrs, attrs)
      return
    }
    const edge: EdgeRecord = { src, tgt, attrs: { kind, ...(attrs ?? {}) } }
    this.edgeList.push(edge)
    this.edgeByKey.set(key, edge)

    const outEdges = this.outEdgesBySource.get(src)
    if (outEdges) {
      outEdges.push(edge)
    } else {
      this.outEdgesBySource.set(src, [edge])
    }

    const inEdges = this.inEdgesByTarget.get(tgt)
    if (inEdges) {
      inEdges.push(edge)
    } else {
      this.inEdgesByTarget.set(tgt, [edge])
    }
  }

  /** Возвращает итератор исходящих рёбер узла src. */
  *outEdgeEntries(src: string): Iterable<{ target: string; attributes: EdgeAttributes }> {
    for (const edge of this.outEdgesBySource.get(src) ?? []) {
      yield { target: edge.tgt, attributes: edge.attrs }
    }
  }

  /** Возвращает входящие и исходящие рёбра для переданных узлов без дублей. */
  *edgeEntriesTouching(nodeIds: Iterable<string>): Iterable<{ source: string; target: string; attributes: EdgeAttributes }> {
    const yielded = new Set<EdgeRecord>()
    for (const nodeId of nodeIds) {
      for (const edge of this.outEdgesBySource.get(nodeId) ?? []) {
        if (yielded.has(edge)) continue
        yielded.add(edge)
        yield { source: edge.src, target: edge.tgt, attributes: edge.attrs }
      }
      for (const edge of this.inEdgesByTarget.get(nodeId) ?? []) {
        if (yielded.has(edge)) continue
        yielded.add(edge)
        yield { source: edge.src, target: edge.tgt, attributes: edge.attrs }
      }
    }
  }

  // ── обход ────────────────────────────────────────────────────

  /** Возвращает итератор всех id узлов. */
  *nodes(): Iterable<string> {
    yield* this.nodesMap.keys()
  }

  /** Возвращает итератор id узлов с заданным префиксом. */
  *nodesWithPrefix(prefix: string): Iterable<string> {
    yield* this.nodesByPrefix.get(prefix) ?? []
  }
}
