import { MultiDirectedGraph } from "graphology"
import type { MetadataItem } from "../orchestration/property/types"

export const graph = new MultiDirectedGraph<
  { name: string; item?: unknown; positionFrom?: { offset: number }; filePath?: string },
  { yaml: string; name: string }
>()

const objectToNodeId = new Map<MetadataItem, string>()

export const itemTypePrefix: Record<string, string> = {
  MetadataCatalog: "Справочник",
  MetadataDocument: "Документ",
}

export function getOrCreateTopLevelNodeId(item: MetadataItem & { name: string }): string {
  if (objectToNodeId.has(item)) return objectToNodeId.get(item)!
  const prefix = itemTypePrefix[item.itemType] ?? item.itemType
  const id = `${prefix}.${item.name}`
  objectToNodeId.set(item, id)
  if (!graph.hasNode(id)) graph.addNode(id, { name: item.name })
  return id
}

export function getOrCreateRawNodeId(id: string, attrs: { name: string; item?: unknown; positionFrom?: { offset: number }; filePath?: string }): string {
  if (!graph.hasNode(id)) graph.addNode(id, attrs)
  return id
}

export function getOrCreateChildNodeId(parent: MetadataItem, child: MetadataItem & { name: string }): string {
  if (objectToNodeId.has(child)) return objectToNodeId.get(child)!
  const parentId = objectToNodeId.get(parent)!
  const id = `${parentId}.${child.name}`
  objectToNodeId.set(child, id)
  if (!graph.hasNode(id)) graph.addNode(id, { name: child.name })
  return id
}
