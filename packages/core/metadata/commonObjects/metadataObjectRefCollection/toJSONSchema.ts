import { TSchema, Type } from "@sinclair/typebox"
import { buildMetadataTargetSchema } from "~/metadata/commonObjects/metadataTargets"
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint

export const exportMetadataObjectRefCollectionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return Type.Array(buildMetadataTargetSchema(rule.metadataTarget ?? metadataObjectTargetFallback))
}

registerTypeRule("MetadataObjectRefCollection", "exportToJSONSchema", exportMetadataObjectRefCollectionToJSONSchema)
