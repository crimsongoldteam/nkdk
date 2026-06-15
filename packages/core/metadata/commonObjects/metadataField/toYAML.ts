import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { ExportToYAMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { ConfigurationContext } from "../../context/types"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { exportMetadataFieldStringToYAML as exportMetadataFieldToYAMLPath } from "../metadataPath/toYAML"
import { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const exportMetadataFieldsToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFields | undefined,
  owner?: MetadataTargetOwner
): MetadataFieldsYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToYAML(context, rule, item, owner)!)
}

export const exportMetadataFieldToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataField | undefined,
  owner?: MetadataTargetOwner
): MetadataFieldYAML | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToYAMLPath(context, rule, data, owner)
}

const exportMetadataFieldToYAMLProperty: ExportToYAMLFunctionNew = (params) =>
  exportMetadataFieldToYAML(params.context, params.rule, params.value, params.owner)

const exportMetadataFieldsToYAMLProperty: ExportToYAMLFunctionNew = (params) =>
  exportMetadataFieldsToYAML(params.context, params.rule, params.value, params.owner)

registerTypeRule("MetadataField", "exportToYAML", exportMetadataFieldToYAMLProperty)
registerTypeRule("MetadataFields", "exportToYAML", exportMetadataFieldsToYAMLProperty)
