import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule, ToMetadata } from ".."
import { getTypeRule } from "../formElement/factory"
import { importContentFromXML } from "~/xml/import/importer"
import { getOrderedKeysFromXML, getValueOrDefault, shouldProcessProperty } from "./helpers"

export function importPropertiesFromXML<Rule extends MetadataItemRule>(
  params: {
    context: ConfigurationContextFromXML
    rule: Rule
    tags?: string[]
  } & ({ xml: any } | { xmlString: string })
): Omit<ToMetadata<Rule["itemType"]>, "itemType"> | undefined {
  const { context, rule, tags } = params
  const xml = "xmlString" in params ? importContentFromXML(params.xmlString) : params.xml

  const forReference = context.fromXML.forReference

  if (!xml) return undefined

  const result = {} as Omit<ToMetadata<Rule["itemType"]>, "itemType">

  const orderedKeys = getOrderedKeysFromXML({ rule, xml, tags })

  for (const key of orderedKeys) {
    const currentRule = rule.properties[key]
    if (!forReference && currentRule.forReferenceOnly === true) continue

    let xmlValue = getXMLValue(key, xml, currentRule)
    if (xmlValue === undefined && currentRule.type === "MetadataDcsMetadataValue" && isXMLKeyPresent(key, xml, currentRule)) {
      xmlValue = null
    }
    const shouldImportForReference =
      forReference &&
      currentRule.fromXML === false &&
      (xmlValue !== undefined || isXMLKeyPresent(key, xml, currentRule))

    if (!shouldProcessProperty({ rule: currentRule, operation: "importFromXML" }) && !shouldImportForReference) continue

    let value =
      shouldImportForReference || currentRule.fromXML !== false
        ? importPropertyFromXML({
            context,
            rule: currentRule,
            value: xmlValue,
            name: key,
          })
        : undefined

    if (
      value === undefined &&
      "defaultValueXMLEmpty" in currentRule &&
      isXMLKeyPresent(key, xml, currentRule)
    ) {
      value = (currentRule as any).defaultValueXMLEmpty
    }

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

const isXMLKeyPresent = (key: string, xml: any, rule: PropertyRule): boolean => {
  const xmlKey = rule.xml ?? capitalize(key)
  if (rule.xmlParents === undefined) return xml !== undefined && xml !== null && xmlKey in xml
  let currentXml = xml
  for (const xmlParent of rule.xmlParents) {
    if (currentXml === undefined || currentXml === null || !(xmlParent in currentXml)) return false
    currentXml = currentXml[xmlParent]
  }
  return currentXml !== undefined && currentXml !== null && xmlKey in currentXml
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
