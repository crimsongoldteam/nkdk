import { capitalize } from "~/helpers/capitalize"
import { getChildContextToXML } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertiesToXML } from "../property/toXML"
import { ItemXML, MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

export const exportMetadataItemToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  referenceData?: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
}): ItemXML | undefined => {
  const { context, data, rule, referenceData, tag } = params

  if (data === undefined || data === null) {
    return undefined
  }

  const itemName = typeof (data as any).name === "string" ? ((data as any).name as string) : undefined
  const effectiveContext: ConfigurationContextWithExportToXML = itemName
    ? getChildContextToXML({ context, itemType: rule.itemType, path: `${rule.itemType}.${itemName}`, name: itemName })
    : context

  const result = exportPropertiesToXML({
    context: effectiveContext,
    metadata: data,
    referenceMetadata: referenceData,
    rule,
    tag,
  })

  if (Object.keys(result).length === 0) return undefined

  let finalResult: ItemXML = mergeWithReferenceRawXML(result, referenceData, rule)

  if (rule.xsiType) {
    finalResult = { "_xsi:type": rule.xsiType, ...finalResult }
  }

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
      xmlRootKey,
      fallback: (xmlRootProp as any).rootAttributes as Record<string, string>,
    })
    const isFileRoot = (xmlRootProp as any).isFileRoot === true
    if (isFileRoot) {
      return { [container]: { ...rootAttributes, ...(finalResult as Record<string, unknown>) } }
    }
    return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }
  }

  return finalResult
}

const getXmlRootAttributes = (params: {
  data: unknown
  referenceData: unknown
  xmlRootKey: string
  fallback: Record<string, string>
}): Record<string, string> => {
  const fromReference = getStoredXmlRootAttributes(params.referenceData, params.xmlRootKey)
  if (fromReference) return fromReference
  const fromData = getStoredXmlRootAttributes(params.data, params.xmlRootKey)
  return fromData ?? params.fallback
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

  const merged: ItemXML = {}
  for (const [key, value] of Object.entries(referenceRaw)) {
    merged[key] = key in result ? result[key] : value
  }
  for (const [key, value] of Object.entries(result)) {
    if (isDefaultValueMissingFromReference({ xmlKey: key, value, referenceRaw, rule })) continue
    if (!(key in merged)) merged[key] = value
  }
  return merged
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
  xmlKey: string
  value: unknown
  referenceRaw: Record<string, unknown>
  rule: MetadataItemRule
}): boolean => {
  if (params.xmlKey in params.referenceRaw) return false
  const propertyRule = Object.entries(params.rule.properties).find(([key, rule]) => (rule.xml ?? capitalize(key)) === params.xmlKey)?.[1]
  if (!propertyRule) return false
  return "defaultValueXML" in propertyRule && params.value === propertyRule.defaultValueXML
}
