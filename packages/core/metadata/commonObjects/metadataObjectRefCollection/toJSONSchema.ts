import { TSchema, Type } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import type { MetadataTargetConstraint } from "../metadataTargets/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint

export const exportMetadataObjectRefCollectionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return Type.Array(buildMetadataTargetSchema(rule.metadataTarget ?? metadataObjectTargetFallback))
}

registerTypeRule("MetadataObjectRefCollection", "exportToJSONSchema", exportMetadataObjectRefCollectionToJSONSchema)
