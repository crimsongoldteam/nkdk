import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToYAML } from "../metadataPath/exportToYAML"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFields | undefined
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToYAML(context, undefined, _rule, item)!)
}

export const exportMetadataFieldToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataField | undefined
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToYAML(context, undefined, _rule, data)
}
