import {
  type MetadataTargetConstraint,
  type MetadataTargetOccurrence,
  type MetadataTargetOccurrencesFunction,
} from "@nkdk/runtime/rule-kit"
import { yamlMappingKeyTagAt } from "@nkdk/runtime"
import { isMDObjectRefUuid } from "../../../commonObjects/metadataRef/brokenMDObjectRef"

const invalidOrdinaryEventTarget = {
  kind: "object",
  roots: [],
} as const satisfies MetadataTargetConstraint

export const collectEventMetadataTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  if (!isRecord(params.value)) return []

  return Object.keys(params.value).flatMap((key): MetadataTargetOccurrence[] => {
    if (!isMDObjectRefUuid(key)) return []
    const tagged = params.representation === "model"
      || yamlMappingKeyTagAt(params.value, key) === "xml/reference"
    return [{
      location: { kind: "key", path: params.yamlPath, key },
      constraint: invalidOrdinaryEventTarget,
      representation: tagged
        ? { kind: "brokenXMLReference", payload: key, grammar: "uuid" }
        : { kind: "canonical", canonical: key },
      setValue: () => undefined,
    }]
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
