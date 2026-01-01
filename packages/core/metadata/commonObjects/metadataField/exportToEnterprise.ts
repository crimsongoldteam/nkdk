import { Context } from "../../context/types"
import { exportMetadataFieldStringToEnterprise as exportMetadataFieldToEnterprisePath } from "../metadataPath/exportToEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldsToEnterprise = (
  context: Context,
  data: MetadataFields | undefined
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(context, item)!)
}

export const exportMetadataFieldToEnterprise = (
  context: Context,
  data: MetadataField | undefined
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToEnterprisePath(context, data)
}
