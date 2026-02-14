import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../typeRulesFactory"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const importPropertiesFromXML = <T extends MetadataItem>(
  context: ConfigurationContext,
  xml: any,
  rules: MetadataItemRule<T>
): Partial<T> | undefined => {
  const result: Partial<T> = {}
  for (const [key, rule] of Object.entries(rules.properties) as [string, PropertyRule<T>][]) {
    if (rule.fromXML === false) continue
    const xmlKey = rule.xml ?? capitalize(key)

    const xmlValue = (xml as any)[xmlKey]

    const value = importPropertyFromXML({ context, rule, value: xmlValue })

    if (value === undefined) continue
    ;(result as any)[key] = value
  }

  return result
}
export const importPropertyFromXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any
}): any => {
  const { context, rule, value } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromXML") : undefined

  if (!typeImportFn) {
    return value
  }

  const result = typeImportFn(context, rule, value)

  return result
}
