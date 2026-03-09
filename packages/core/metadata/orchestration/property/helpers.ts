import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToMetadata } from ".."
import { TypeRulesOperations } from "./fn"
import { MetadataItemRule, PropertyRule } from "./types"

export const getOrderedKeysToXML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  referenceMetadata: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
}): string[] => {
  const { rule, referenceMetadata, tag } = params
  const propertyKeys = Object.keys(rule.properties).filter((key) => {
    const ruleProp = rule.properties[key]
    return tag === undefined || (ruleProp.tag !== undefined && tag.includes(ruleProp.tag))
  })

  if (referenceMetadata === undefined) {
    return [...propertyKeys].sort()
  }

  const keysFromReference = Object.keys(referenceMetadata as object).filter((key) => propertyKeys.includes(key))
  const referenceSet = new Set(keysFromReference)
  const remainingKeys = propertyKeys.filter((key) => !referenceSet.has(key)).sort()

  return [...keysFromReference, ...remainingKeys]
}

export const getOrderedKeysFromXML = <Rule extends MetadataItemRule>(params: {
  rule: Rule
  xml: Record<string, unknown> | undefined
  tags?: string[]
}): string[] => {
  const { rule, xml, tags } = params
  const propertyEntries = Object.entries(rule.properties).filter(([_key, ruleProp]) => {
    return tags === undefined || (ruleProp.tag !== undefined && tags.includes(ruleProp.tag))
  })

  const xmlToPropertyKey = mapXMLToPropertyKey(propertyEntries)

  if (xml === undefined) {
    return Object.values(xmlToPropertyKey)
  }

  const xmlKeys = Object.keys(xml)

  const keysFromXML = xmlKeys
    .map((xmlKey) => xmlToPropertyKey[xmlKey])
    .filter((key): key is string => key !== undefined)

  const keysFromXMLSet = new Set(keysFromXML)
  const remainingKeys = Object.values(xmlToPropertyKey).filter((key) => !keysFromXMLSet.has(key))

  return [...keysFromXML, ...remainingKeys]
}

const mapXMLToPropertyKey = (propertyEntries: [string, PropertyRule][]) => {
  return propertyEntries
    .map(([key, ruleProp]) => {
      const xmlKey = ruleProp.xml ?? capitalize(key)
      return [xmlKey, key] as const
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Record<string, string>>((acc, [xmlKey, key]) => {
      acc[xmlKey] = key
      return acc
    }, {})
}

export const getValueOrDefault = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  operation: TypeRulesOperations
}): any => {
  const { context, rule, value, name, operation } = params

  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue({ context, name, operation })
  }

  return rule.defaultValue
}
