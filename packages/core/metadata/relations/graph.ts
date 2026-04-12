import type { MetadataItem } from "../orchestration/property/types"
import { MetadataGraph } from "./MetadataGraph"

/** Глобальный синглтон для backward compatibility (addRelation, existPath, autocompletePath). */
export const defaultGraph = new MetadataGraph()

/** @deprecated Используй defaultGraph или context.graph. Оставлен для backward compatibility. */
export const graph = defaultGraph

/** @deprecated Хардкод. Используй rule.itemTypePrefix. Оставлен для backward compatibility. */
export const itemTypePrefix: Record<string, string> = {
  MetadataCatalog: "Справочник",
  MetadataDocument: "Документ",
}

const objectToNodeId = new Map<MetadataItem, string>()

export function getOrCreateTopLevelNodeId(item: MetadataItem & { name: string }): string {
  if (objectToNodeId.has(item)) return objectToNodeId.get(item)!
  const prefix = itemTypePrefix[item.itemType] ?? item.itemType
  const id = `${prefix}.${item.name}`
  objectToNodeId.set(item, id)
  defaultGraph.ensureNode(id, { name: item.name })
  return id
}

export function getOrCreateRawNodeId(
  id: string,
  attrs: { name: string; item?: unknown; positionFrom?: { offset: number }; filePath?: string }
): string {
  defaultGraph.ensureNode(id, attrs)
  return id
}

export function getOrCreateChildNodeId(parent: MetadataItem, child: MetadataItem & { name: string }): string {
  if (objectToNodeId.has(child)) return objectToNodeId.get(child)!
  const parentId = objectToNodeId.get(parent)!
  const id = `${parentId}.${child.name}`
  objectToNodeId.set(child, id)
  defaultGraph.ensureNode(id, { name: child.name })
  return id
}
