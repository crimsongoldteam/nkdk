import { Context } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const importIndexFieldFromEnterprise = (
  _context: Context,
  data: IndexFieldEnterprise | undefined
): IndexField | undefined => {
  if (!data) return undefined

  return data
}

export const importIndexFieldsFromEnterprise = (
  context: Context,
  data: IndexFieldsEnterprise | undefined
): IndexFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importIndexFieldFromEnterprise(context, item)!).filter((item): item is IndexField => item !== undefined)
}

