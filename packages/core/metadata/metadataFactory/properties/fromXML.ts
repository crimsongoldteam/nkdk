import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../types/factory"
import { getValueOrDefault } from "./helpers"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const importPropertiesFromXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  xml: any
  rule: MetadataItemRule<T>
  tags?: MetadataItemRule<T>["tags"]
}): Partial<T> | undefined => {
  const { context, xml, rule } = params

  if (!xml) return undefined

  const result: Partial<T> = {}
  for (const [key, currentRule] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
    if (currentRule.fromXML === false) continue
    const xmlKey = currentRule.xml ?? capitalize(key)

    const xmlValue = (xml as any)[xmlKey]

    const value = importPropertyFromXML({ context, rule: currentRule, value: xmlValue })

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
    return getValueOrDefault(context, rule, value)
  }

  const result = typeImportFn(context, rule, value)

  return getValueOrDefault(context, rule, result)
}
