import { Context } from "../../context/types"
import { importMetadataFieldStringFromEnterprise as importMetadataFieldFromEnterprisePath } from "../metadataPath/importFromEnterprise"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const importMetadataFieldsFromEnterprise = (
  context: Context,
  data: MetadataFieldsEnterprise | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromEnterprise(context, item)!)
}

export const importMetadataFieldFromEnterprise = (
  context: Context,
  data: MetadataFieldEnterprise | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return importMetadataFieldFromEnterprisePath(context, data)
}
