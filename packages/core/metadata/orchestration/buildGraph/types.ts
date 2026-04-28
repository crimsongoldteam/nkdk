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

export interface FileGraphData {
  filePath: string
  nodes: NodeData[]
  edges: EdgeData[]
}

export interface ImportContext {
  version: string
  defaultLanguage: string
}
