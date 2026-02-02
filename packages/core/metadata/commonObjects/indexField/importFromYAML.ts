import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const importIndexFieldFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: IndexFieldEnterprise | undefined
): IndexField | undefined => {
  if (!data) return undefined

  return data
}

export const importIndexFieldsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: IndexFieldsEnterprise | undefined
): IndexFields | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importIndexFieldFromYAML(context, _rule, item)!)
    .filter((item): item is IndexField => item !== undefined)
}
