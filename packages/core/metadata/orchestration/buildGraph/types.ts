/**
 * Типы публичного API buildGraph. Структурно совместимы с одноимёнными
 * типами @nakidka/graph — CLI присваивает FileGraphData из core напрямую
 * в updateGraph(@nakidka/graph) без преобразований.
 */

export type GraphPrimitive = string | number | boolean | null

export interface NodeData {
  /** Полный YAML-путь узла. Уникальный идентификатор в графе. */
  id: string
  /** Семантическая метка в Cypher (PascalCase: MetadataCatalog, Form, ...). */
  label: string
  /** Свойства узла. Только примитивы и их массивы — ограничение FalkorDB. */
  props: Record<string, GraphPrimitive | GraphPrimitive[]>
}

export interface EdgeData {
  src: string
  tgt: string
  /** SCREAMING_SNAKE_CASE метка отношения (VALUE, OBJECT, REF_TYPE, ...). */
  kind: string
  props?: Record<string, GraphPrimitive>
}

export interface FileStats {
  mtimeMs: number
  size: number
  updatedAt: number
}

export interface PairedGraphSourceText {
  filePath: string
  text: string
  fileStats?: FileStats
}

export interface ProjectGraphSource {
  filePath: string
  text: string
  fileStats?: FileStats
  pairedText?: PairedGraphSourceText
}

export type ProjectGraphInput = Map<string, string> | readonly ProjectGraphSource[]

export interface FileGraphData {
  filePath: string
  fileStats?: FileStats
  nodes: NodeData[]
  edges: EdgeData[]
  declaredNodeIds?: string[]
  contributedNodeIds?: string[]
}

export interface ImportContext {
  version: string
  defaultLanguage: string
}
