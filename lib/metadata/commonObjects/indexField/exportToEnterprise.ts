import { Context } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToEnterprise = (
  _configurationSettings: Context,
  data: IndexField | undefined
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToEnterprise = (
  configurationSettings: Context,
  data: IndexFields | undefined
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToEnterprise(configurationSettings, item)!)
}
