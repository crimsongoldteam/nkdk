import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "../../orchestration/property/types"
import { getTypeRule } from "../types/factory"
import { getValueOrDefault } from "./helpers"

export const importPropertiesFromXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  xml: any
  rule: MetadataItemRule
  tags?: string[]
}): Omit<T, "itemType"> | undefined => {
  const { context, xml, rule, tags } = params

  if (!xml) return undefined

  const result: T = {} as T

  for (const [key, currentRule] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    if (tags && (!currentRule.tag || !tags.includes(currentRule.tag))) continue

    const value =
      currentRule.fromXML !== false
        ? importPropertyFromXML({
            context,
            rule: currentRule,
            value: getXMLValue(key, xml, currentRule),
            name: key,
          })
        : undefined

    const cleanValue = value === currentRule.defaultValueXML ? undefined : value

    const valueOrDefault = getValueOrDefault({
      context,
      rule: currentRule,
      value: cleanValue,
      name: key,
      operation: "importFromXML",
    })

    if (valueOrDefault === undefined) continue
    ;(result as any)[key] = valueOrDefault
  }

  return result
}

const getXMLValue = (key: string, xml: any, rule: PropertyRule): any => {
  const xmlKey = rule.xml ?? capitalize(key)

  if (rule.xmlParents === undefined) return xml[xmlKey]

  let currentXml = xml
  for (const xmlParent of rule.xmlParents) {
    if (currentXml[xmlParent] === undefined) return undefined
    currentXml = currentXml[xmlParent]
  }

  return currentXml[xmlKey]
}

export const importPropertyFromXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
}): any => {
  const { context, rule, value, name } = params

  const typeImportFn = rule.type ? getTypeRule(rule.type, "importFromXML") : undefined

  if (!typeImportFn) {
    return getValueOrDefault({ context, rule, value, name, operation: "importFromXML" })
  }

  const result = typeImportFn(context, rule, value)

  return getValueOrDefault({ context, rule, value: result, name, operation: "importFromXML" })
}
