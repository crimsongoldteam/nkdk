import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const exportIndexFieldToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexField | undefined
): IndexFieldEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}

export const exportIndexFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFields | undefined
): IndexFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportIndexFieldToEnterprise(context, undefined, item)!)
}


registerTypeRule("IndexField", "exportToEnterprise", exportToEnterprise)