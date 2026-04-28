import { isPair, isScalar, isSeq, YAMLSeq } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import {
  BuildGraphFromModelFunction,
  GraphOps,
  GraphOpsReference,
} from "~/metadata/orchestration/property/fn"
import { computeValuePosition, findSeqItemOffset, findSubmap } from "~/metadata/orchestration/property/position"
import { extractReferenceFromPath } from "~/metadata/orchestration/property/extractReferenceFromPath"
import { convertPath } from "~/metadata/commonObjects/metadataPath/helper"
import { MetadataValuesRulesToYAML } from "~/metadata/commonObjects/metadataPath/types"
import {
  MetadataFixedArrayValue,
  MetadataFormChoiceListValue,
  MetadataObjectRefValue,
  MetadataRefValue,
  MetadataTypedValue,
  MetadataValue,
} from "./types"

const REF_EDGE_KIND = "VALUE"
const REF_EDGE_YAML = "Значение"
const OBJECT_REF_EDGE_KIND = "OBJECT"
const OBJECT_REF_EDGE_YAML = "Объект"

function convertRefValueToNodeId(refValue: string): string | undefined {
  if (!refValue) return undefined
  let processedPath = refValue
  if (refValue.startsWith("Enum.")) {
    processedPath = refValue.split(".").filter((p) => p !== "EnumValue").join(".")
  }
  const nodeId = convertPath(MetadataValuesRulesToYAML, processedPath)
  const dotInInput = processedPath.indexOf(".")
  const dotInOutput = nodeId.indexOf(".")
  if (dotInInput === -1 || dotInOutput === -1) return undefined
  if (processedPath.substring(0, dotInInput) === nodeId.substring(0, dotInOutput)) return undefined
  return nodeId
}

export function extractSingleValueRef(
  value: MetadataTypedValue,
  position?: { offset: number },
): { ref: GraphOpsReference; kind: string; yaml: string } | undefined {
  if (value.type === "ref") {
    const nodeId = convertRefValueToNodeId((value as MetadataRefValue).value)
    if (!nodeId) return undefined
    const parts = nodeId.split(".")
    const name = parts[parts.length - 1]
    return {
      ref: { id: nodeId, name, positionFrom: position },
      kind: REF_EDGE_KIND,
      yaml: REF_EDGE_YAML,
    }
  }
  if (value.type === "objectRef") {
    const ref = extractReferenceFromPath((value as MetadataObjectRefValue).value, position)
    if (!ref) return undefined
    return { ref, kind: OBJECT_REF_EDGE_KIND, yaml: OBJECT_REF_EDGE_YAML }
  }
  return undefined
}

export const buildMetadataValueGraph: BuildGraphFromModelFunction = ({
  model,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  const value = model as MetadataValue | undefined
  if (!value) return undefined

  if (value.type === "fixedArray") {
    const items = (value as MetadataFixedArrayValue).value
    if (items.length === 0) return undefined

    let yamlSeq: YAMLSeq | undefined
    if (yamlMap && propRule.yaml) {
      const pair = yamlMap.items.find(
        (i) => isPair(i) && isScalar(i.key) && i.key.value === propRule.yaml,
      )
      if (pair && isPair(pair) && isSeq(pair.value)) {
        yamlSeq = pair.value as YAMLSeq
      }
    }

    const refsByKind = new Map<string, { yaml: string; refs: GraphOpsReference[] }>()
    items.forEach((item, index) => {
      const offset = yamlSeq ? findSeqItemOffset(yamlSeq, index) : undefined
      const position = offset !== undefined ? { offset } : undefined
      const extracted = extractSingleValueRef(item, position)
      if (!extracted) return
      const { ref, kind, yaml } = extracted
      let bucket = refsByKind.get(kind)
      if (!bucket) {
        bucket = { yaml, refs: [] }
        refsByKind.set(kind, bucket)
      }
      bucket.refs.push(ref)
    })

    if (refsByKind.size === 0) return undefined
    const sections: GraphOps[] = []
    for (const [kind, { yaml, refs }] of refsByKind) {
      sections.push({ references: refs, edgeKind: kind, edgeYaml: yaml })
    }
    return sections
  }

  if (value.type === "formChoiceListDesTimeValue") {
    const inner = (value as MetadataFormChoiceListValue).value
    if (!inner) return undefined
    let innerPosition: { offset: number } | undefined
    if (yamlMap && propRule.yaml) {
      const innerMap = findSubmap(yamlMap, propRule.yaml)
      if (innerMap) {
        innerPosition = computeValuePosition(innerMap, "Значение")
      } else {
        innerPosition = computeValuePosition(yamlMap, propRule.yaml)
      }
    }
    const extracted = extractSingleValueRef(inner, innerPosition)
    if (!extracted) return undefined
    return [{ references: [extracted.ref], edgeKind: extracted.kind, edgeYaml: extracted.yaml }]
  }

  const position =
    yamlMap && propRule.yaml ? computeValuePosition(yamlMap, propRule.yaml) : undefined
  const extracted = extractSingleValueRef(value, position ?? undefined)
  if (!extracted) return undefined
  return [{ references: [extracted.ref], edgeKind: extracted.kind, edgeYaml: extracted.yaml }]
}

registerTypeRule("MetadataValue", "buildGraphFromModel", buildMetadataValueGraph)
