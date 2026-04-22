import { MultiDirectedGraph } from "graphology"
import { isOwning } from "./edgeKinds"

export interface MetadataNodeAttrs {
  name: string
  item?: unknown
  positionFrom?: { offset: number; length?: number }
  /** Пути к файлам, из которых был создан этот узел. Пустой — заглушка (stub). */
  filePaths?: string[]
}

export interface MetadataEdgeAttrs {
  yaml: string
  /** Семантическое имя вида ребра, зарегистрированного в edgeKinds. */
  kind: string
  positionFrom?: { offset: number; length?: number }
}

export class MetadataGraph {
  private _graph: MultiDirectedGraph<MetadataNodeAttrs, MetadataEdgeAttrs>
  private _fileIndex: Map<string, Set<string>>

  constructor() {
    this._graph = new MultiDirectedGraph<MetadataNodeAttrs, MetadataEdgeAttrs>()
    this._fileIndex = new Map()
  }

  hasNode(id: string): boolean {
    return this._graph.hasNode(id)
  }

  ensureNode(id: string, attrs: MetadataNodeAttrs): void {
    if (!this._graph.hasNode(id)) {
      this._graph.addNode(id, { name: attrs.name, item: attrs.item, positionFrom: attrs.positionFrom })
    }
    for (const fp of attrs.filePaths ?? []) {
      this._registerFilePath(id, fp)
    }
  }

  /** Добавляет путь к файлу на узел и обновляет обратный индекс. Идемпотентен. */
  addFilePath(nodeId: string, filePath: string): void {
    this._registerFilePath(nodeId, filePath)
  }

  /** Удаляет путь к файлу с узла и обновляет обратный индекс. Идемпотентен. */
  removeFilePath(nodeId: string, filePath: string): void {
    const current = this._graph.getNodeAttribute(nodeId, "filePaths") ?? []
    const updated = current.filter((p) => p !== filePath)
    if (updated.length !== current.length) {
      this._graph.setNodeAttribute(nodeId, "filePaths", updated.length > 0 ? updated : undefined)
    }
    const set = this._fileIndex.get(filePath)
    if (set) {
      set.delete(nodeId)
      if (set.size === 0) this._fileIndex.delete(filePath)
    }
  }

  private _registerFilePath(nodeId: string, filePath: string): void {
    const current = this._graph.getNodeAttribute(nodeId, "filePaths") ?? []
    if (!current.includes(filePath)) {
      this._graph.setNodeAttribute(nodeId, "filePaths", [...current, filePath])
    }
    let set = this._fileIndex.get(filePath)
    if (!set) {
      set = new Set()
      this._fileIndex.set(filePath, set)
    }
    set.add(nodeId)
  }

  setNodeAttribute<K extends keyof MetadataNodeAttrs>(id: string, key: K, value: MetadataNodeAttrs[K]): void {
    this._graph.setNodeAttribute(id, key, value)
  }

  getNodeAttributes(id: string): MetadataNodeAttrs {
    return this._graph.getNodeAttributes(id)
  }

  getNodeAttribute<K extends keyof MetadataNodeAttrs>(id: string, key: K): MetadataNodeAttrs[K] {
    return this._graph.getNodeAttribute(id, key) as MetadataNodeAttrs[K]
  }

  hasEdge(key: string): boolean {
    return this._graph.hasEdge(key)
  }

  ensureEdge(key: string, source: string, target: string, attrs: MetadataEdgeAttrs): void {
    if (!this._graph.hasEdge(key)) {
      this._graph.addEdgeWithKey(key, source, target, attrs)
    }
  }

  nodes(): string[] {
    return this._graph.nodes()
  }

  outNeighbors(nodeId: string): string[] {
    return this._graph.outNeighbors(nodeId)
  }

  outEdges(nodeId: string): string[] {
    return this._graph.outEdges(nodeId)
  }

  outEdgeEntries(nodeId: string): ReturnType<MultiDirectedGraph<MetadataNodeAttrs, MetadataEdgeAttrs>["outEdgeEntries"]> {
    return this._graph.outEdgeEntries(nodeId)
  }

  getEdgeAttribute<K extends keyof MetadataEdgeAttrs>(edgeId: string, key: K): MetadataEdgeAttrs[K] {
    return this._graph.getEdgeAttribute(edgeId, key) as MetadataEdgeAttrs[K]
  }

  target(edgeId: string): string {
    return this._graph.target(edgeId)
  }

  getNodesByFile(filePath: string): Set<string> {
    return this._fileIndex.get(filePath) ?? new Set()
  }

  /**
   * Создаёт узел, если он не существует, или «повышает» существующую заглушку:
   * заполняет только пустые поля (filePaths, positionFrom, item).
   * Бросает ошибку при конфликте itemType у item.
   */
  promoteNode(id: string, attrs: MetadataNodeAttrs): void {
    if (!this._graph.hasNode(id)) {
      this._graph.addNode(id, { name: attrs.name, item: attrs.item, positionFrom: attrs.positionFrom })
      for (const fp of attrs.filePaths ?? []) {
        this._registerFilePath(id, fp)
      }
      return
    }

    // Существующий узел: заполняем только пустые поля
    const existing = this._graph.getNodeAttributes(id)

    // Добавляем filePaths только если у узла ещё нет путей (stub promotion)
    if ((attrs.filePaths?.length ?? 0) > 0 && !(existing.filePaths?.length)) {
      for (const fp of attrs.filePaths!) {
        this._registerFilePath(id, fp)
      }
    }

    if (attrs.positionFrom !== undefined && existing.positionFrom === undefined) {
      this._graph.setNodeAttribute(id, "positionFrom", attrs.positionFrom)
    }

    if (attrs.item !== undefined) {
      if (existing.item === undefined) {
        this._graph.setNodeAttribute(id, "item", attrs.item)
      } else {
        const existingItemType = (existing.item as Record<string, unknown>).itemType
        const newItemType = (attrs.item as Record<string, unknown>).itemType
        if (
          existingItemType !== undefined &&
          newItemType !== undefined &&
          existingItemType !== newItemType
        ) {
          throw new Error(
            `promoteNode: конфликт itemType на узле "${id}": существующий="${String(existingItemType)}", новый="${String(newItemType)}"`
          )
        }
      }
    }
  }

  /**
   * Добавляет путь к файлу на узел.
   * @deprecated Используйте addFilePath. updateNodeFilePath оставлен для обратной совместимости.
   */
  updateNodeFilePath(id: string, filePath: string): void {
    this._registerFilePath(id, filePath)
  }

  /**
   * Инвалидирует все узлы, принадлежащие файлу.
   * Co-invalidation: если узел принадлежит нескольким файлам, он инвалидируется целиком
   * (удаляется из всех путей индекса) при инвалидации любого из них.
   *
   * - Узлы без входящих reference-рёбер удаляются полностью.
   * - Узлы с входящими reference-рёбрами становятся заглушками:
   *   удаляются item, filePaths и все исходящие рёбра.
   * - Orphan stubs (item === undefined, нет входящих рёбер) среди бывших
   *   таргетов удалённых рёбер также удаляются.
   */
  invalidateFile(filePath: string): void {
    const nodeIds = new Set(this.getNodesByFile(filePath))
    const droppedTargets = new Set<string>()

    for (const nodeId of nodeIds) {
      // Co-invalidation: удаляем из всех остальных путей индекса
      const allPaths = this._graph.getNodeAttribute(nodeId, "filePaths") ?? []
      for (const path of allPaths) {
        if (path !== filePath) {
          this._fileIndex.get(path)?.delete(nodeId)
        }
      }

      const hasIncomingRefs = this._graph
        .inEdges(nodeId)
        .some((edgeId) => !isOwning(this._graph.getEdgeAttribute(edgeId, "kind")))

      if (hasIncomingRefs) {
        for (const edgeId of [...this._graph.outEdges(nodeId)]) {
          droppedTargets.add(this._graph.target(edgeId))
          this._graph.dropEdge(edgeId)
        }
        this._graph.removeNodeAttribute(nodeId, "item")
        this._graph.removeNodeAttribute(nodeId, "filePaths")
      } else {
        for (const edgeId of this._graph.outEdges(nodeId)) {
          droppedTargets.add(this._graph.target(edgeId))
        }
        this._graph.dropNode(nodeId)
      }
    }
    this._fileIndex.delete(filePath)

    for (const targetId of droppedTargets) {
      if (!this._graph.hasNode(targetId)) continue
      if (
        this._graph.getNodeAttribute(targetId, "item") === undefined &&
        this._graph.inEdges(targetId).length === 0
      ) {
        this._graph.dropNode(targetId)
      }
    }
  }

  /** Возвращает узлы-заглушки: цели reference-рёбер без атрибута item. */
  getBrokenReferences(): Map<string, MetadataNodeAttrs> {
    const result = new Map<string, MetadataNodeAttrs>()
    for (const { attributes, target, targetAttributes } of this._graph.edgeEntries()) {
      if (!isOwning(attributes.kind) && (targetAttributes as MetadataNodeAttrs).item === undefined) {
        result.set(target, targetAttributes as MetadataNodeAttrs)
      }
    }
    return result
  }

  clear(): void {
    this._graph.clear()
    this._fileIndex.clear()
  }
}
