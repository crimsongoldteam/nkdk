import { capitalize } from "~/helpers/capitalize"
import { getChildContextToXML } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertiesToXML } from "../property/toXML"
import { ItemXML, MetadataItemRule, PropertyRule } from "../property/types"
import { ToMetadata } from "./registry"

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

export const exportMetadataItemToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  referenceData?: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
  ownerMetadataItem?: unknown
}): ItemXML | undefined => {
  const { context, data, rule, referenceData, tag, ownerMetadataItem } = params

  if (data === undefined || data === null) {
    return undefined
  }

  const itemName = typeof (data as any).name === "string" ? ((data as any).name as string) : undefined
  const effectiveContext: ConfigurationContextWithExportToXML = itemName
    ? getChildContextToXML({ context, itemType: rule.itemType, path: `${rule.itemType}.${itemName}`, name: itemName })
    : context
  const referenceRaw = getReferenceRawXML(referenceData)

  const result = exportPropertiesToXML({
    context: effectiveContext,
    metadata: data,
    referenceMetadata: referenceData,
    rule,
    tag,
  })

  const generatedResult: ItemXML = rule.xsiType ? { "_xsi:type": rule.xsiType, ...result } : result
  const finalResult: ItemXML = mergeWithReferenceRawXML(generatedResult, referenceData, rule)

  // Если правило содержит XMLRoot-property, оборачиваем результат:
  // - по умолчанию: { MetaDataObject: { ...rootAttributes, [container]: result } };
  // - при isFileRoot: { [container]: { ...rootAttributes, ...result } } (внешний файл).
  const xmlRootEntry = Object.entries(rule.properties).find(([, p]) => p.type === "XMLRoot")
  if (xmlRootEntry) {
    const [xmlRootKey, xmlRootProp] = xmlRootEntry
    const container = (xmlRootProp as any).container as string
    const rootAttributes = getXmlRootAttributes({
      data,
      referenceData,
      ownerMetadataItem,
      xmlRootKey,
      fallback: (xmlRootProp as any).rootAttributes,
    })
    const isFileRoot = (xmlRootProp as any).isFileRoot === true
    if (isFileRoot) {
      return { [container]: { ...rootAttributes, ...(finalResult as Record<string, unknown>) } }
    }
    return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }
  }

  if (Object.keys(result).length === 0 && !referenceRaw) return undefined

  return finalResult
}

const getXmlRootAttributes = (params: {
  data: unknown
  referenceData: unknown
  ownerMetadataItem: unknown
  xmlRootKey: string
  fallback:
    | Record<string, string>
    | ((params: { data: unknown; referenceData: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
}): Record<string, string> => {
  const fromReference = getStoredXmlRootAttributes(params.referenceData, params.xmlRootKey)
  if (fromReference) return fromReference
  const fromData = getStoredXmlRootAttributes(params.data, params.xmlRootKey)
  if (fromData) return fromData
  if (typeof params.fallback === "function") {
    return params.fallback({
      data: params.data,
      referenceData: params.referenceData,
      ownerMetadataItem: params.ownerMetadataItem,
    })
  }
  return params.fallback
}

const getStoredXmlRootAttributes = (data: unknown, xmlRootKey: string): Record<string, string> | undefined => {
  if (data === null || data === undefined || typeof data !== "object") return undefined
  const value = (data as Record<string, unknown>)[xmlRootKey]
  if (value === null || value === undefined || typeof value !== "object") return undefined
  const attributes = value as Record<string, unknown>
  return Object.values(attributes).every((attribute) => typeof attribute === "string")
    ? (attributes as Record<string, string>)
    : undefined
}

const mergeWithReferenceRawXML = (result: ItemXML, referenceData: unknown, rule: MetadataItemRule): ItemXML => {
  const referenceRaw = getReferenceRawXML(referenceData)
  if (!referenceRaw) return result

  return mergeXMLObject({ generated: result, reference: referenceRaw, rule, path: [] })
}

const mergeXMLObject = (params: {
  generated: Record<string, unknown>
  reference: Record<string, unknown>
  rule: MetadataItemRule
  path: string[]
}): ItemXML => {
  const { generated, reference, rule, path } = params
  const merged: ItemXML = {}
  for (const [key, value] of Object.entries(reference)) {
    if (key in generated) {
      const generatedValue = generated[key]
      if (generatedValue === undefined) continue
      merged[key] = mergeXMLValue({ key, generated: generatedValue, reference: value, rule, path })
    } else {
      merged[key] = value
    }
  }
  for (const [key, value] of Object.entries(generated)) {
    if (value === undefined) continue
    if (key in merged) continue
    const propertyRule = findPropertyRuleForXMLPath({ rule, path, xmlKey: key })
    if (isDefaultValueMissingFromReference({ value, propertyRule })) continue

    if (propertyRule === undefined && isPlainXMLObject(value)) {
      const nested = mergeXMLObject({ generated: value, reference: {}, rule, path: [...path, key] })
      if (Object.keys(nested).length === 0) continue
      merged[key] = nested
      continue
    }

    merged[key] = value
  }
  return merged
}

const mergeXMLValue = (params: {
  key: string
  generated: unknown
  reference: unknown
  rule: MetadataItemRule
  path: string[]
}): unknown => {
  const { key, generated, reference, rule, path } = params
  if (isPlainXMLObject(generated) && isPlainXMLObject(reference)) {
    return mergeXMLObject({ generated, reference, rule, path: [...path, key] })
  }
  return generated
}

const getReferenceRawXML = (referenceData: unknown): Record<string, unknown> | undefined => {
  if (referenceData === null || referenceData === undefined || typeof referenceData !== "object") return undefined
  const value = (referenceData as Record<string, unknown>)[XML_REFERENCE_RAW]
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) return undefined
  return sanitizeReferenceRawXML(value) as Record<string, unknown>
}

const sanitizeReferenceRawXML = (value: unknown): unknown => {
  if (value === undefined) return ""
  if (Array.isArray(value)) return value.map(sanitizeReferenceRawXML)
  if (value === null || typeof value !== "object") return value

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "#text" && typeof entry === "string" && entry.trim() === "") continue
    result[key] = sanitizeReferenceRawXML(entry)
  }
  return result
}

const isDefaultValueMissingFromReference = (params: {
  value: unknown
  propertyRule: PropertyRule | undefined
}): boolean => {
  if (!params.propertyRule) return false
  return "defaultValueXML" in params.propertyRule && params.value === params.propertyRule.defaultValueXML
}

const findPropertyRuleForXMLPath = (params: {
  rule: MetadataItemRule
  path: string[]
  xmlKey: string
}): PropertyRule | undefined => {
  const { rule, path, xmlKey } = params
  return Object.entries(rule.properties).find(([key, propertyRule]) => {
    const propertyPath = propertyRule.xmlParents ?? []
    if (propertyPath.length !== path.length || propertyPath.some((part, index) => part !== path[index])) {
      return false
    }
    const canonicalXmlKey = propertyRule.xml ?? capitalize(key)
    return canonicalXmlKey === xmlKey || ((propertyRule as { xmlAliases?: string[] }).xmlAliases ?? []).includes(xmlKey)
  })?.[1]
}

const isPlainXMLObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
