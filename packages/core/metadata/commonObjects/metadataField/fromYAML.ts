import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldStringFromYAML as importMetadataFieldFromYAMLPath } from "../metadataPath/fromYAML"
import { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const importMetadataFieldsFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFieldsYAML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromYAML(context, rule, item)!)
}

export const importMetadataFieldFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFieldYAML | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return importMetadataFieldFromYAMLPath(context, rule, data)
}

registerTypeRule("MetadataField", "importFromYAML", importMetadataFieldFromYAML)
registerTypeRule("MetadataFields", "importFromYAML", importMetadataFieldsFromYAML)
