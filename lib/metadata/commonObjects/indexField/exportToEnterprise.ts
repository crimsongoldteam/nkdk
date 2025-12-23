import { ConfigurationSettings } from "../../configurationSettings/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: IndexField | undefined
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: IndexFields | undefined
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToEnterprise(configurationSettings, item)!)
}
