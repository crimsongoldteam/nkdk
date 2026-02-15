import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise as exportMetadataFieldToEnterprisePath } from "../metadataPath/exportToEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataFields | undefined
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(context, undefined, item)!)
}

export const exportMetadataFieldToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataField | undefined
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToEnterprisePath(context, undefined, data)
}

registerTypeRule("MetadataField", "exportToEnterprise", exportMetadataFieldToEnterprise)
