import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule, ToMetadata } from ".."
import { getTypeRule } from "../formElement/factory"
import { getOrderedKeysFromXML, getValueOrDefault, shouldProcessProperty } from "./helpers"

export function importPropertiesFromXML<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  xml: any
  rule: Rule
  tags?: string[]
}): Omit<ToMetadata<Rule["itemType"]>, "itemType"> | undefined {
  const { context, xml, rule, tags } = params

  const forReference = context.fromXML.forReference

  if (!xml) return undefined

  const result = {} as Omit<ToMetadata<Rule["itemType"]>, "itemType">

  const orderedKeys = getOrderedKeysFromXML({ rule, xml, tags })

  for (const key of orderedKeys) {
    const currentRule = rule.properties[key]
    if (!forReference && currentRule.forReferenceOnly === true) continue

    const xmlValue = getXMLValue(key, xml, currentRule)
    const shouldImportForReference = forReference && currentRule.fromXML === false && xmlValue !== undefined

    if (!shouldProcessProperty({ rule: currentRule, operation: "importFromXML" }) && !shouldImportForReference) continue

    const value =
      shouldImportForReference || currentRule.fromXML !== false
        ? importPropertyFromXML({
            context,
            rule: currentRule,
            value: xmlValue,
            name: key,
          })
        : undefined

    if (forReference) {
      ;(result as any)[key] = value
      continue
    }

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
  context: ConfigurationContextFromXML
  rule: PropertyRule
  value: any
  name?: string
}): any => {
  const { context, rule, value, name } = params

  const typeimportFn = rule.type ? getTypeRule(rule.type, "importFromXML") : undefined

  if (!typeimportFn) {
    return getValueOrDefault({ context, rule, value, name, operation: "importFromXML" })
  }

  const result = typeimportFn(context, rule, value)

  return getValueOrDefault({ context, rule, value: result, name, operation: "importFromXML" })
}
