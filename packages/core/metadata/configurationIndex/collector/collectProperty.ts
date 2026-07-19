import type { ConfigurationContextFromXML } from "../../context/types"
import { getConfigurationIndexCollectionContext } from "./context"

export function collectConfigurationIndexIdentityFromXML(params: {
  context: ConfigurationContextFromXML
  sourceXmlKey: string | undefined
  xmlValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || typeof params.xmlValue !== "string") return

  if (params.sourceXmlKey === "_uuid") {
    collection.collector.setUuid(collection.logicalAddress, params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_id") {
    collection.collector.setXmlId(collection.logicalAddress, params.xmlValue)
    return
  }
  if (params.sourceXmlKey === "_name" && !isNameReconstructible(collection.logicalAddress, params.xmlValue)) {
    collection.collector.setXmlName(collection.logicalAddress, params.xmlValue)
  }
}

export function collectConfigurationIndexPropertyFromXML(params: {
  context: ConfigurationContextFromXML
  propertyKey: string
  xmlValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined) return

  const address = `${collection.logicalAddress}.${params.propertyKey}`
  if (params.xmlValue === undefined || params.xmlValue === "") {
    collection.collector.setExplicitEmpty(address)
    if (params.xmlValue === "") collection.collector.setXmlText(address, "")
  }

  if (!isRecord(params.xmlValue)) return
  const xsiNil = params.xmlValue["_xsi:nil"]
  if (xsiNil === true || xsiNil === "true") collection.collector.setXsiNil(address)

  const xsiType = params.xmlValue["_xsi:type"]
  if (typeof xsiType === "string") collection.collector.setXsiType(address, xsiType)

  const xmlText = params.xmlValue["#text"]
  if (typeof xmlText === "string" || typeof xmlText === "number" || typeof xmlText === "boolean") {
    collection.collector.setXmlText(address, String(xmlText))
  }
}

export function collectConfigurationIndexImportedValue(params: {
  context: ConfigurationContextFromXML
  propertyKey: string
  importedValue: unknown
}): void {
  const collection = getConfigurationIndexCollectionContext(params.context)
  if (collection === undefined || !isRecord(params.importedValue)) return

  const xmlPrefix = params.importedValue.xmlPrefix
  if (typeof xmlPrefix === "string") {
    collection.collector.setXmlPrefix(`${collection.logicalAddress}.${params.propertyKey}`, xmlPrefix)
  }
}

function isNameReconstructible(logicalAddress: string, xmlName: string): boolean {
  const lastSegment = logicalAddress.slice(logicalAddress.lastIndexOf(".") + 1)
  return !/^.+\[\d+\]$/.test(lastSegment) || lastSegment === xmlName
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
