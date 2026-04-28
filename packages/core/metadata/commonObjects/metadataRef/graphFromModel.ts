import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  ExtractGraphFromModelFunction,
  GraphOps,
} from "~/metadata/orchestration/property/fn"
import { findSeqItemOffset } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { MetadataItemLink, MetadataItemLinks } from "./types"

const EDGE_KIND = "OBJECT"
const EDGE_YAML = "Объект"

const extractMetadataItemLinkGraph: ExtractGraphFromModelFunction = (
  model,
  position,
): GraphOps | undefined => {
  const link = model as MetadataItemLink
  if (!link) return undefined
  const ref = extractReferenceFromPath(link, position)
  if (!ref) return undefined
  return { references: [ref] }
}

const buildMetadataItemLinksGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  propRule,
}): GraphOps | undefined => {
  const links = model as MetadataItemLinks | undefined
  if (!Array.isArray(links) || links.length === 0) return undefined

  let yamlSeq: YAMLSeq | undefined
  if (yamlMap && propRule.yaml) {
    const pair = yamlMap.items.find(
      (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
    )
    if (pair && isPair(pair) && isSeq(pair.value)) {
      yamlSeq = pair.value as YAMLSeq
    }
  }

  const references = links
    .map((link, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      return extractReferenceFromPath(link, position)
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== undefined)

  if (references.length === 0) return undefined

  return { references, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("MetadataItemLink", "extractGraph", extractMetadataItemLinkGraph)
registerTypeRule("MetadataItemLink", "graphEdgeFromParent", { kind: EDGE_KIND, yaml: EDGE_YAML })
registerTypeRule("MetadataItemLinks", "buildGraphFromModel", buildMetadataItemLinksGraph)
