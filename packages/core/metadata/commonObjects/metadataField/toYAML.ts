import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToYAML as exportMetadataFieldToYAMLPath } from "../metadataPath/toYAML"
import { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const exportMetadataFieldsToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFields | undefined
): MetadataFieldsYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToYAML(context, rule, item)!)
}

export const exportMetadataFieldToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataField | undefined
): MetadataFieldYAML | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToYAMLPath(context, rule, data)
}

registerTypeRule("MetadataField", "exportToYAML", exportMetadataFieldToYAML)
registerTypeRule("MetadataFields", "exportToYAML", exportMetadataFieldsToYAML)
