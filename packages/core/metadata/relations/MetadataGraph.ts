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

  clear(): void {
    this._graph.clear()
    this._fileIndex.clear()
  }
}
