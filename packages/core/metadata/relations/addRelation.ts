import { MetadataItem } from "../orchestration/property/types"
import { getOrCreateChildNodeId, getOrCreateTopLevelNodeId, graph } from "./graph"

type RelationType = {
  defaultRelation?: true
  yaml: string
  kind: string
}

const RelationTypes: Record<string, RelationType> = {
  parent: {
    yaml: "Родитель",
    kind: "PARENT",
  },
  attribute: {
    defaultRelation: true,
    yaml: "Реквизит",
    kind: "ATTRIBUTE",
  },
} as const

export const addRelation = (params: {
  from: MetadataItem & { name: string }
  to: MetadataItem & { name: string }
  relationType: keyof typeof RelationTypes
}) => {
  const { from, to, relationType } = params
  const relConfig = RelationTypes[relationType]
  const fromId = getOrCreateTopLevelNodeId(from)
  const toId = relConfig.defaultRelation ? getOrCreateChildNodeId(from, to) : getOrCreateTopLevelNodeId(to)
  const edgeKey = `${fromId}:${relConfig.kind}:${toId}`
  graph.ensureEdge(edgeKey, fromId, toId, { yaml: relConfig.yaml, kind: relConfig.kind })
}
