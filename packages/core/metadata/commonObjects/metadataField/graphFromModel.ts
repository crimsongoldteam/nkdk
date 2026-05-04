import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  ExtractGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"
import { computeSeqItemPosition } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { MetadataField, MetadataFields } from "./types"

const EDGE_KIND = "FIELD"
const EDGE_YAML = "Поле"

const extractMetadataFieldGraph: ExtractGraphFromModelFunction = (
  model,
  position,
): GraphOps | undefined => {
  const field = model as MetadataField
  if (!field) return undefined
  const ref = extractReferenceFromPath(field, position)
  if (!ref) return undefined
  return { references: [ref] }
}

const buildMetadataFieldsGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  lineCounter,
  propRule,
}): GraphOps | undefined => {
  const fields = model as MetadataFields | undefined
  if (!Array.isArray(fields) || fields.length === 0) return undefined

  let yamlSeq: YAMLSeq | undefined
  if (yamlMap && propRule.yaml) {
    const pair = yamlMap.items.find(
      (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
    )
    if (pair && isPair(pair) && isSeq(pair.value)) {
      yamlSeq = pair.value as YAMLSeq
    }
  }

  const references = fields
    .map((field, index) => {
      const position =
        yamlSeq && lineCounter ? computeSeqItemPosition(yamlSeq, index, lineCounter) : undefined
      return extractReferenceFromPath(field, position)
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)

  if (references.length === 0) return undefined

  return { references, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("MetadataField", "extractGraph", extractMetadataFieldGraph)
registerTypeRule("MetadataField", "graphEdgeFromParent", { kind: EDGE_KIND, yaml: EDGE_YAML })
registerTypeRule("MetadataFields", "buildGraphFromModel", buildMetadataFieldsGraph)
