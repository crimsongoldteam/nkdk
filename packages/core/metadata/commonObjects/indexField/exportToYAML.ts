import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexField | undefined
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFields | undefined
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToYAML(context, undefined, _rule, item)!)
}
