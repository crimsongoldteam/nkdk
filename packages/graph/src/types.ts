/**
 * Примитивные значения, поддерживаемые FalkorDB в `props` узлов и рёбер.
 * Массивы — только массивы примитивов; вложенные объекты не поддерживаются.
 */
export type GraphPrimitive = string | number | boolean | null

export interface NodeData {
  /** Полный YAML-путь узла. Уникальный идентификатор в графе. */
  id: string
  /** Семантическая метка в Cypher (`MetadataCatalog`, `Form`, ...). PascalCase. */
  label: string
  /** Свойства узла. Только примитивы и их массивы — ограничение FalkorDB. */
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

export interface EdgeData {
  /** id узла-источника. */
  src: string
  /** id узла-цели. */
  tgt: string
  /** Тип отношения, SCREAMING_SNAKE_CASE (`VALUE`, `OBJECT`, `REF_TYPE`, ...). */
  kind: string
  /** Координаты ребра (`index` для упорядоченных коллекций, `yaml` для диагностики). */
  props?: Record<string, GraphPrimitive>
}

export interface FileStats {
  mtimeMs: number
  size: number
  updatedAt: number
}

export interface GraphFileRecord extends FileStats {
  path: string
}

export interface FileGraphData {
  /** Относительный путь файла-источника в YAML-проекте. */
  filePath: string
  /** Состояние файла на диске для watcher-сравнения. */
  fileStats?: FileStats
  nodes: NodeData[]
  edges: EdgeData[]
  /** Узлы, жизненным циклом которых владеет filePath. */
  declaredNodeIds?: string[]
  /** Узлы, на которые filePath влияет, но которыми не владеет. */
  contributedNodeIds?: string[]
}

export interface ConnectionOptions {
  /** URL FalkorDB. По умолчанию — env `NKDK_GRAPH_URL` или `redis://localhost:6379`. */
  url?: string
  /** Имя графа. По умолчанию — env `NKDK_GRAPH_NAME` или `nakidka`. */
  graphName?: string
}
