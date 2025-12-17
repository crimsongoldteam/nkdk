import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataItemLinkToEnterprise = (
  data: MetadataField | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportMetadataFieldsToEnterprise = (
  data: MetadataFields | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToEnterprise(item, _configurationSettings)!)
}
