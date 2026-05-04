import type { SourcePosition } from "~/metadata/orchestration/property/position"

/** Атрибуты узла графа. */
export interface NodeAttributes {
  name: string | undefined
  item: unknown
  filePaths: string[]
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
  // Рёбра — плоский массив; порядок вставки сохраняется
  private readonly edgeList: EdgeRecord[] = []
  private readonly edgeByKey = new Map<string, EdgeRecord>()
  private readonly outEdgesBySource = new Map<string, EdgeRecord[]>()

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
      flattenSkipKeys: new Set(),
    })
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
    const edge = { src, tgt, attrs: { kind, ...(attrs ?? {}) } }
    this.edgeList.push(edge)
    this.edgeByKey.set(key, edge)

    const outEdges = this.outEdgesBySource.get(src)
    if (outEdges) {
      outEdges.push(edge)
    } else {
      this.outEdgesBySource.set(src, [edge])
    }
  }

  /** Возвращает итератор исходящих рёбер узла src. */
  *outEdgeEntries(src: string): Iterable<{ target: string; attributes: EdgeAttributes }> {
    for (const edge of this.outEdgesBySource.get(src) ?? []) {
      yield { target: edge.tgt, attributes: edge.attrs }
    }
  }

  // ── обход ────────────────────────────────────────────────────

  /** Возвращает итератор всех id узлов. */
  *nodes(): Iterable<string> {
    yield* this.nodesMap.keys()
  }
}
