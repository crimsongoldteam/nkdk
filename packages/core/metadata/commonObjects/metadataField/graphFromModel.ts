import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { applyGraphOps } from "~/metadata/relations/applyGraphOps"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  ExtractGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"
import { findSeqItemOffset } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { MetadataField, MetadataFields } from "./types"

const EDGE_KIND = "Поле"

const extractMetadataFieldGraph: ExtractGraphFromModelFunction = (
  model,
  position
): GraphOps | undefined => {
  const field = model as MetadataField
  if (!field) return undefined
  const ref = extractReferenceFromPath(field, position)
  if (!ref) return undefined
  return { references: [ref] }
}

const buildMetadataFieldsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
  filePath,
  yamlMap,
  propRule,
  graph,
}) => {
  const fields = model as MetadataFields | undefined
  if (!Array.isArray(fields) || fields.length === 0) return

  let yamlSeq: YAMLSeq | undefined
  if (yamlMap && propRule.yaml) {
    const pair = yamlMap.items.find(
      (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml
    )
    if (pair && isPair(pair) && isSeq(pair.value)) {
      yamlSeq = pair.value as YAMLSeq
    }
  }

  const references = fields
    .map((field, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      return extractReferenceFromPath(field, position)
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)

  if (references.length > 0) {
    applyGraphOps({ references }, { graph, parentNodeId, filePath, edgeName: EDGE_KIND })
  }
}

registerTypeRule("MetadataField", "extractGraph", extractMetadataFieldGraph)
registerTypeRule("MetadataField", "graphEdgeFromParent", { name: EDGE_KIND })
registerTypeRule("MetadataFields", "buildGraphFromModel", buildMetadataFieldsGraph)
