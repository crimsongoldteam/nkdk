import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToEnterprise = (
  _context: ConfigurationContext,
  data: IndexField | undefined
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToEnterprise = (
  context: ConfigurationContext,
  data: IndexFields | undefined
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToEnterprise(context, item)!)
}
