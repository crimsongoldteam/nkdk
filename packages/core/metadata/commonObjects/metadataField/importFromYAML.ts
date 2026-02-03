import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldStringFromYAML as importMetadataFieldFromYAMLPath } from "../metadataPath/importFromYAML"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const importMetadataFieldsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldsEnterprise | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromYAML(context, _rule, item)!)
}

export const importMetadataFieldFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFieldEnterprise | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return importMetadataFieldFromYAMLPath(context, _rule, data)
}
