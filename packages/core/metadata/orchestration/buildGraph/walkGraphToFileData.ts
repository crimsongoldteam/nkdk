import type { SourcePosition } from "~/metadata/orchestration/property/position"
import { GraphBuilder } from "./internal/GraphBuilder"
import { flattenItem } from "./flattenItem"
import { EdgeData, FileGraphData, NodeData } from "./types"

/** Sentinel-метка для узлов без itemType — даёт видеть пробелы сразу. */
const UNKNOWN_LABEL = "Unknown"
/** Сегмент для stub-узлов (без filePath). */
const STUB_SEGMENT = ""

const isEdgePrimitive = (value: unknown): value is string | number | boolean | null =>
  value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean"

type Segment = {
  nodes: NodeData[]
  edges: EdgeData[]
  declaredNodeIds: string[]
  contributedNodeIds: string[]
}

function addPositionFromProps(
  props: Record<string, string | number | boolean | null>,
  positionFrom: SourcePosition | undefined,
): void {
  if (positionFrom === undefined) return
  props.positionFromOffset = positionFrom.offset
  props.positionFromLine = positionFrom.line
  props.positionFromColumn = positionFrom.column
}

/**
 * Обходит GraphBuilder и группирует узлы и рёбра по filePath.
 *
 * Узлы:
 *  - label = item.itemType (если задан), иначе "Unknown".
 *  - props: name + flattenItem(item) (под p_).
 *  - узлы без filePaths (стабы) уезжают в сегмент с filePath ''.
 *  - узлы с filePaths объявляются в declaredNodeIds соответствующего сегмента.
 *  - contributedFilePaths добавляют узел в contributedNodeIds без дублирования nodes.
 *
 * Рёбра:
 *  - попадают в сегмент filePath первого filePath узла-источника
 *    (для стаба-источника — в сегмент '').
 *  - props: yaml + (опционально) другие атрибуты ребра в виде примитивов.
 */
export function walkGraphToFileData(graph: GraphBuilder): FileGraphData[] {
  const segmentByFilePath = new Map<string, Segment>()
  const ensureSegment = (filePath: string) => {
    let seg = segmentByFilePath.get(filePath)
    if (!seg) {
      seg = { nodes: [], edges: [], declaredNodeIds: [], contributedNodeIds: [] }
      segmentByFilePath.set(filePath, seg)
    }
    return seg
  }

  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    const filePaths = attrs.filePaths.length > 0 ? attrs.filePaths : [STUB_SEGMENT]

    for (const filePath of filePaths) {
      const props: NodeData["props"] = {}
      if (attrs.name !== undefined) props.name = attrs.name
      Object.assign(props, flattenItem(attrs.item, { skipKeys: attrs.flattenSkipKeys }))

      const item = attrs.item as Record<string, unknown> | undefined
      const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
      const label = itemType ?? UNKNOWN_LABEL

      const segment = ensureSegment(filePath)
      segment.nodes.push({ id: nodeId, label, props })
      if (filePath !== STUB_SEGMENT) segment.declaredNodeIds.push(nodeId)
    }

    for (const filePath of attrs.contributedFilePaths) {
      ensureSegment(filePath).contributedNodeIds.push(nodeId)
    }
  }

  // Рёбра: каждое попадает в сегмент первого filePath узла-источника.
  for (const nodeId of graph.nodes()) {
    const attrs = graph.getNodeAttributes(nodeId)
    const sourceSegment = attrs.filePaths.length > 0 ? attrs.filePaths[0]! : STUB_SEGMENT

    for (const { target, attributes } of graph.outEdgeEntries(nodeId)) {
      const yamlValue = attributes.yaml
      const edgeProps: Record<string, string | number | boolean | null> = {
        yaml: typeof yamlValue === "string" ? yamlValue : "",
      }
      addPositionFromProps(edgeProps, attributes.positionFrom)
      for (const [key, value] of Object.entries(attributes)) {
        if (
          key === "kind" ||
          key === "yaml" ||
          key === "positionFrom" ||
          key === "positionFromOffset" ||
          key === "positionFromLine" ||
          key === "positionFromColumn" ||
          key === "filePath"
        ) continue
        if (isEdgePrimitive(value)) edgeProps[key] = value
      }
      const edgeSegment =
        typeof attributes.filePath === "string" ? attributes.filePath : sourceSegment

      ensureSegment(edgeSegment).edges.push({
        src: nodeId,
        tgt: target,
        kind: attributes.kind,
        props: edgeProps,
      })
    }
  }

  return Array.from(segmentByFilePath.entries()).map(([filePath, seg]) => ({
    filePath,
    nodes: seg.nodes,
    edges: seg.edges,
    declaredNodeIds: seg.declaredNodeIds,
    contributedNodeIds: seg.contributedNodeIds,
  }))
}
