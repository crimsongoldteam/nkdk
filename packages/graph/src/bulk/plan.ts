import type { EdgeData, FileGraphData, GraphPrimitive, NodeData } from "../types"
import { normalizeBulkProperties, type BulkProperties } from "./encoder"

export interface BulkNodeRecord {
  id: number
  logicalId: string
  props: BulkProperties
}

export interface BulkEdgeRecord {
  src: number
  tgt: number
  props: BulkProperties
}

export interface BulkNodeGroup {
  label: string
  nodes: BulkNodeRecord[]
}

export interface BulkEdgeGroup {
  kind: string
  edges: BulkEdgeRecord[]
}

export interface BulkPlan {
  nodeCount: number
  edgeCount: number
  labels: string[]
  nodeIdByLogicalId: Map<string, number>
  nodeGroups: BulkNodeGroup[]
  edgeGroups: BulkEdgeGroup[]
}

const groupPush = <T>(map: Map<string, T[]>, key: string, value: T): void => {
  const group = map.get(key)
  if (group === undefined) map.set(key, [value])
  else group.push(value)
}

const fileProps = (file: FileGraphData): Record<string, GraphPrimitive> => {
  const stats = file.fileStats ?? { mtimeMs: 0, size: 0, updatedAt: Date.now() }
  return {
    path: file.filePath,
    mtimeMs: stats.mtimeMs,
    size: stats.size,
    updatedAt: stats.updatedAt,
  }
}

const edgeProps = (file: FileGraphData, edge: EdgeData): Record<string, GraphPrimitive> => ({
  ...(edge.props ?? {}),
  filePath: file.filePath,
})

export const createBulkPlan = (files: readonly FileGraphData[]): BulkPlan => {
  const nodeIdByLogicalId = new Map<string, number>()
  const nodeGroups = new Map<string, BulkNodeRecord[]>()
  const edgeGroups = new Map<string, BulkEdgeRecord[]>()
  const labels: string[] = []
  let nextNodeId = 0

  const addNode = (label: string, logicalId: string, props: Record<string, GraphPrimitive | GraphPrimitive[]>): number => {
    const existing = nodeIdByLogicalId.get(logicalId)
    if (existing !== undefined) return existing
    const id = nextNodeId++
    nodeIdByLogicalId.set(logicalId, id)
    if (!nodeGroups.has(label)) labels.push(label)
    groupPush(nodeGroups, label, { id, logicalId, props: normalizeBulkProperties({ id: logicalId, ...props }) })
    return id
  }

  for (const file of files) {
    addNode("File", file.filePath, fileProps(file))
    for (const node of file.nodes) {
      addNode(node.label, node.id, node.props)
    }
  }

  for (const file of files) {
    const fileNodeId = nodeIdByLogicalId.get(file.filePath)
    if (fileNodeId === undefined) throw new Error(`Missing File node in bulk plan: ${file.filePath}`)

    for (const edge of file.edges) {
      const src = nodeIdByLogicalId.get(edge.src)
      const tgt = nodeIdByLogicalId.get(edge.tgt)
      if (src === undefined || tgt === undefined) continue
      groupPush(edgeGroups, edge.kind, { src, tgt, props: normalizeBulkProperties(edgeProps(file, edge)) })
    }

    for (const nodeId of file.declaredNodeIds ?? file.nodes.map((node: NodeData) => node.id)) {
      const tgt = nodeIdByLogicalId.get(nodeId)
      if (tgt === undefined) continue
      groupPush(edgeGroups, "DECLARES", { src: fileNodeId, tgt, props: {} })
    }

    for (const nodeId of file.contributedNodeIds ?? []) {
      const tgt = nodeIdByLogicalId.get(nodeId)
      if (tgt === undefined) continue
      groupPush(edgeGroups, "CONTRIBUTES", { src: fileNodeId, tgt, props: {} })
    }
  }

  const nodeGroupList = labels.map((label) => ({ label, nodes: nodeGroups.get(label) ?? [] }))
  const edgeGroupList = [...edgeGroups.entries()].map(([kind, edges]) => ({ kind, edges }))

  return {
    nodeCount: nodeGroupList.reduce((sum, group) => sum + group.nodes.length, 0),
    edgeCount: edgeGroupList.reduce((sum, group) => sum + group.edges.length, 0),
    labels,
    nodeIdByLogicalId,
    nodeGroups: nodeGroupList,
    edgeGroups: edgeGroupList,
  }
}
