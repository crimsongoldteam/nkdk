import { TSchema, Type } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import type { MetadataTargetConstraint } from "../metadataTargets/types"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint

export const exportMetadataObjectRefCollectionToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return Type.Array(buildMetadataTargetSchema(rule.metadataTarget ?? metadataObjectTargetFallback))
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataObjectRefCollection", "exportToJSONSchema", exportMetadataObjectRefCollectionToJSONSchema)
