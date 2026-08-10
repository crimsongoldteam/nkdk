import { TSchema, Type } from "typebox"
import { buildMetadataTargetSchema } from "../metadataTargets"
import type { MetadataTargetConstraint } from "../metadataTargets/types"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"

const metadataObjectTargetFallback = { kind: "object" } as const satisfies MetadataTargetConstraint
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint

export const exportDataPathToJSONSchema: ExportToJSONSchemaFn = ({ rule }): TSchema => {
  const schema = buildMetadataTargetSchema(rule.metadataTarget ?? dataPathTargetFallback(rule))
  return rule.yaml === "ПутьКДанным" ? Type.Union([Type.Literal(""), schema]) : schema
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

export const metadataPropertyRule000 = definePropertyTypeRule("DataPath", "exportToJSONSchema", exportDataPathToJSONSchema)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLink", "exportToJSONSchema", exportMetadataItemLinkToJSONSchema)
export const metadataPropertyRule002 = definePropertyTypeRule("MetadataItemLinks", "exportToJSONSchema", exportMetadataItemLinksToJSONSchema)
export const metadataPropertyRule003 = definePropertyTypeRule("MetadataField", "exportToJSONSchema", exportMetadataFieldToJSONSchema)
export const metadataPropertyRule004 = definePropertyTypeRule("MetadataFields", "exportToJSONSchema", exportMetadataFieldsToJSONSchema)
