import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

export const exportMetadataFieldToEnterprise = (
  data: MetadataField | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportMetadataFieldsToEnterprise = (
  data: MetadataFields | undefined,
  configurationSettings: ConfigurationSettings
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(item, configurationSettings)!)
}
