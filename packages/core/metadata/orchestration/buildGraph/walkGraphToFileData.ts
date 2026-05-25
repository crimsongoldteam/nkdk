import type { SourcePosition } from "~/metadata/orchestration/property/position"
import { GraphBuilder } from "./internal/GraphBuilder"
import { flattenItem } from "./flattenItem"
import { consolidateGraphLabel } from "./labelConsolidation"
import { EdgeData, FileGraphData, NodeData } from "./types"

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

function applyItemFlattenTransforms(item: unknown, transforms: readonly ((item: unknown) => unknown)[]): unknown {
  return transforms.reduce((current, transform) => transform(current), item)
}

/**
 * Обходит GraphBuilder и группирует узлы и рёбра по filePath.
 *
 * Узлы:
 *  - label = схлопнутый item.itemType, иначе "Unknown" или "GraphStub".
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
      const flattenedItem = applyItemFlattenTransforms(attrs.item, attrs.itemFlattenTransforms)
      Object.assign(props, flattenItem(flattenedItem, { skipKeys: attrs.flattenSkipKeys }))

      const item = attrs.item as Record<string, unknown> | undefined
      const itemType = item && typeof item.itemType === "string" ? (item.itemType as string) : undefined
      const { label, kind } = consolidateGraphLabel(itemType, filePath !== STUB_SEGMENT)
      if (kind !== undefined) props.kind = kind

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
