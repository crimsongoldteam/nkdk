import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFieldEnterprise, IndexFields, IndexFieldsEnterprise } from "./types"

export const importIndexFieldFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFieldEnterprise | undefined
): IndexField | undefined => {
  if (!data) return undefined

  return data
}

export const importIndexFieldsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFieldsEnterprise | undefined
): IndexFields | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importIndexFieldFromEnterprise(context, undefined, item)!)
    .filter((item): item is IndexField => item !== undefined)
}


registerTypeRule("IndexField", "importFromEnterprise", importFromEnterprise)