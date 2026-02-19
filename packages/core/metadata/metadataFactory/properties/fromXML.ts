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
}): Omit<T, "itemType"> | undefined => {
  const { context, xml, rule, tags } = params

  if (!xml) return undefined

  const result: T = {
    // itemType: xml.itemType,
  } as T

  for (const [key, currentRule] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
    if (currentRule.fromXML === false) continue
    if (tags && (!currentRule.tag || !tags.includes(currentRule.tag))) continue

    const xmlValue = getXMLValue(key, xml, currentRule)

    const value = importPropertyFromXML({ context, rule: currentRule, value: xmlValue, name: key })

    if (value === undefined) continue
    ;(result as any)[key] = value
  }

  return result
}

const getXMLValue = (key: string, xml: any, rule: PropertyRule<any>): any => {
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
  rule: PropertyRule<any>
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
