import { TSchema, Type } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import type { MetadataTargetConstraint } from "../metadataTargets/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint

export const exportDataPathToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return buildMetadataTargetSchema(rule.metadataTarget ?? dataPathTargetFallback(rule))
}

export const exportMetadataItemLinkToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return buildMetadataTargetSchema(rule.metadataTarget ?? metadataObjectTargetFallback)
}

export const exportMetadataItemLinksToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return Type.Array(buildMetadataTargetSchema(rule.metadataTarget ?? metadataObjectTargetFallback))
}

export const exportMetadataFieldToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return buildMetadataTargetSchema(rule.metadataTarget ?? metadataFieldTargetFallback)
}

export const exportMetadataFieldsToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  return Type.Array(buildMetadataTargetSchema(rule.metadataTarget ?? metadataFieldTargetFallback))
}

function dataPathTargetFallback(rule: PropertyRule): MetadataTargetConstraint {
  return {
    kind: "dataPath",
    context: "form",
    ...(rule.type === "DataPath" && rule.allowedKinds ? { allowedKinds: rule.allowedKinds } : {}),
    ...(rule.type === "DataPath" && rule.allowComposite !== undefined ? { allowComposite: rule.allowComposite } : {}),
    ...(rule.type === "DataPath" && rule.allowOpaqueMultipleValue === true ? { allowOpaqueMultipleValue: true } : {}),
  }
}

registerTypeRule("DataPath", "exportToJSONSchema", exportDataPathToJSONSchema)
registerTypeRule("MetadataItemLink", "exportToJSONSchema", exportMetadataItemLinkToJSONSchema)
registerTypeRule("MetadataItemLinks", "exportToJSONSchema", exportMetadataItemLinksToJSONSchema)
registerTypeRule("MetadataField", "exportToJSONSchema", exportMetadataFieldToJSONSchema)
registerTypeRule("MetadataFields", "exportToJSONSchema", exportMetadataFieldsToJSONSchema)
