import { MultiDirectedGraph } from "graphology"

export interface MetadataNodeAttrs {
  name: string
  item?: unknown
  positionFrom?: { offset: number; length?: number }
  filePath?: string
}

export interface MetadataEdgeAttrs {
  yaml: string
  name: string
  kind: "composition" | "reference"
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
      this._graph.addNode(id, attrs)
    }
    if (attrs.filePath) {
      let set = this._fileIndex.get(attrs.filePath)
      if (!set) {
        set = new Set()
        this._fileIndex.set(attrs.filePath, set)
      }
      set.add(id)
    }
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

  /** Обновляет filePath узла и синхронно обновляет обратный индекс. */
  updateNodeFilePath(id: string, filePath: string): void {
    const currentFilePath = this._graph.getNodeAttribute(id, "filePath")
    if (currentFilePath === filePath) return
    if (currentFilePath) {
      this._fileIndex.get(currentFilePath)?.delete(id)
    }
    this._graph.setNodeAttribute(id, "filePath", filePath)
    let set = this._fileIndex.get(filePath)
    if (!set) {
      set = new Set()
      this._fileIndex.set(filePath, set)
    }
    set.add(id)
  }

  /**
   * Инвалидирует все узлы, принадлежащие файлу.
   * - Узлы без входящих reference-рёбер удаляются полностью.
   * - Узлы с входящими reference-рёбрами становятся заглушками:
   *   удаляются item, filePath и все исходящие рёбра.
   */
  invalidateFile(filePath: string): void {
    const nodeIds = new Set(this.getNodesByFile(filePath))
    for (const nodeId of nodeIds) {
      const hasIncomingRefs = this._graph
        .inEdges(nodeId)
        .some((edgeId) => this._graph.getEdgeAttribute(edgeId, "kind") === "reference")

      if (hasIncomingRefs) {
        for (const edgeId of [...this._graph.outEdges(nodeId)]) {
          this._graph.dropEdge(edgeId)
        }
        this._graph.removeNodeAttribute(nodeId, "item")
        this._graph.removeNodeAttribute(nodeId, "filePath")
      } else {
        this._graph.dropNode(nodeId)
      }
    }
    this._fileIndex.delete(filePath)
  }

  /** Возвращает узлы-заглушки: цели reference-рёбер без атрибута item. */
  getBrokenReferences(): Map<string, MetadataNodeAttrs> {
    const result = new Map<string, MetadataNodeAttrs>()
    for (const { attributes, target, targetAttributes } of this._graph.edgeEntries()) {
      if (attributes.kind === "reference" && (targetAttributes as MetadataNodeAttrs).item === undefined) {
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
