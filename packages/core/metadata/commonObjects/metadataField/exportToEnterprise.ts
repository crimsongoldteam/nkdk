import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToEnterprise as exportMetadataFieldToEnterprisePath } from "../metadataPath/exportToEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldsToEnterprise = (
  context: ConfigurationContext,
  data: MetadataFields | undefined
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(context, item)!)
}

export const exportMetadataFieldToEnterprise = (
  context: ConfigurationContext,
  data: MetadataField | undefined
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToEnterprisePath(context, data)
}
