import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise as exportMetadataFieldToEnterprisePath } from "../metadataPath/exportToEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFields | undefined
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(context, undefined, item)!)
}

export const exportMetadataFieldToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataField | undefined
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToEnterprisePath(context, data)
}
