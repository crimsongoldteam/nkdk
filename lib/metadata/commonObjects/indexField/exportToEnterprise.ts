import { ConfigurationSettings } from "../../configurationSettings/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToEnterprise = (
  data: IndexField | undefined,
  _configurationSettings: ConfigurationSettings
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToEnterprise = (
  data: IndexFields | undefined,
  configurationSettings: ConfigurationSettings
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToEnterprise(item, configurationSettings)!)
}
