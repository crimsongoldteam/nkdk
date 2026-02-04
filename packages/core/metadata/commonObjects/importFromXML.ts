import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../metadataFactory/elementRulesFactory"
import { getTypeRule } from "../metadataFactory/typeRulesFactory"

export const importPropertyFromXML = (context: ConfigurationContext, propertyRule: PropertyRule, data: any): any => {
  const typeRule = getTypeRule(propertyRule.type)

  if (typeRule === undefined) return data

  if (typeRule.importFromXML === undefined) return data

  const result = typeRule.importFromXML(context, propertyRule, data)

  return result
}
