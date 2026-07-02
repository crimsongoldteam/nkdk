import { ConfigurationContextWithExportToXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { XDTOTypeName, XDTOTypeNameXML } from "./types"

const XML_SCHEMA_NAMESPACE = "http://www.w3.org/2001/XMLSchema"
const V8_DATA_CORE_NAMESPACE = "http://v8.1c.ru/8.1/data/core"

const prefixForNamespace = (namespace: string): string => {
  if (namespace === XML_SCHEMA_NAMESPACE) return "xs"
  if (namespace === V8_DATA_CORE_NAMESPACE) return "v8"
  return "d6p1"
}

const isBuiltInPrefix = (prefix: string): boolean => prefix === "xs" || prefix === "v8"

const isXDTOTypeName = (value: XDTOTypeName | XDTOTypeNameXML | undefined): value is XDTOTypeName => {
  return value !== undefined && "namespace" in value && "name" in value
}

const matchingReferencePrefix = (
  value: XDTOTypeName,
  referenceValue: XDTOTypeName | XDTOTypeNameXML | undefined
): string | undefined => {
  if (
    !isXDTOTypeName(referenceValue) ||
    referenceValue.namespace !== value.namespace ||
    referenceValue.name !== value.name ||
    typeof referenceValue.xmlPrefix !== "string"
  ) {
    return undefined
  }

  return referenceValue.xmlPrefix
}

export const exportXDTOTypeNameToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined,
  referenceValue?: XDTOTypeName | XDTOTypeNameXML
): string | XDTOTypeNameXML | undefined => {
  if (value === undefined) return undefined

  const prefix = matchingReferencePrefix(value, referenceValue) ?? prefixForNamespace(value.namespace)
  const text = `${prefix}:${value.name}`

  if (isBuiltInPrefix(prefix)) return text

  return {
    "#text": text,
    [`_xmlns:${prefix}`]: value.namespace,
  }
}

registerTypeRule("XDTOTypeName", "exportToXML", exportXDTOTypeNameToXML)
